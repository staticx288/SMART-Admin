/**
 * Sandbox Testing Routes
 * Test SmartContract Engine modules without deploying anything
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs/promises';
import { requireAuth } from './auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect Python command (Windows uses 'python', Linux uses 'python3')
function findPythonExecutable(): string {
  // Windows: Use specific Python 3.14 path if it exists
  const windowsPython = 'C:/Users/blroy/AppData/Local/Programs/Python/Python314-32/python.exe';
  try {
    const res = spawnSync(windowsPython, ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return windowsPython;
  } catch {}

  // Try python3 first (Linux/Mac)
  try {
    const res = spawnSync('python3', ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return 'python3';
  } catch {}

  // Try python (Windows fallback)
  try {
    const res = spawnSync('python', ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return 'python';
  } catch {}

  return 'python3'; // fallback
}

const PYTHON_CMD = findPythonExecutable();

const router = Router();

// Apply auth middleware to all sandbox routes
router.use(requireAuth);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Sandbox routes working!' });
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * Parse SOP document using Production or Business converter
 */
router.post('/parse-sop', upload.single('file'), async (req, res) => {
  const logFile = path.resolve('./logs/sandbox-debug.log');
  const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    fs.appendFile(logFile, `${timestamp}: ${msg}\n`, () => {});
    console.log(msg);
  };
  
  log('🧪 Sandbox: parse-sop route hit');
  
  try {
    const file = req.file;
    const domain = req.body.domain;
    const converterType = req.body.converter_type; // 'production' or 'business'

    log(`📁 File: ${file?.originalname}, ${file?.size} bytes`);
    log(`🏷️ Domain: ${domain}`);
    log(`🔧 Converter: ${converterType}`);

    if (!file || !domain || !converterType) {
      log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine which converter to use (V2 version with section selection)
    const converterPath = converterType === 'production'
      ? path.resolve('./smart_business_module/smart_contractengine_production/production_converter_v2.py')
      : path.resolve('./smart_business_module/smart_contractengine_business/business_converter.py');

    // Create temp file
    const tempDir = path.resolve('./uploads/temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `temp_${Date.now()}_${file.originalname}`);
    await fs.writeFile(tempFile, file.buffer);

    // Call Python converter
    const result = await callPythonConverter(converterPath, 'parse', {
      file_path: tempFile,
      filename: file.originalname,
      domain: domain
    });

    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});

    res.json(result);

  } catch (error) {
    const logFile = path.resolve('./logs/sandbox-debug.log');
    const errorMsg = `❌ Parse SOP error: ${error instanceof Error ? error.message : String(error)}\nStack: ${error instanceof Error ? error.stack : 'No stack'}`;
    await fs.appendFile(logFile, `${new Date().toISOString()}: ${errorMsg}\n`).catch(() => {});
    console.error('Parse SOP error:', error);
    res.status(500).json({ 
      error: 'Failed to parse SOP',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Generate contracts from parsed sections
 */
router.post('/generate-contracts', async (req, res) => {
  try {
    const { sections, domain, user_names, converter_type } = req.body;

    if (!sections || !domain || !user_names || !converter_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine which converter to use
    const converterPath = converter_type === 'production'
      ? path.resolve('./smart_business_module/smart_contractengine_production/production_converter.py')
      : path.resolve('./smart_business_module/smart_contractengine_business/business_converter.py');

    // Call Python converter
    const result = await callPythonConverter(converterPath, 'generate', {
      sections: sections,
      domain: domain,
      user_names: user_names
    });

    res.json(result);

  } catch (error) {
    console.error('Generate contracts error:', error);
    res.status(500).json({ 
      error: 'Failed to generate contracts',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Helper function to call Python converter module
 */
async function callPythonConverter(
  converterPath: string, 
  action: 'parse' | 'generate',
  data: any
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a temporary Python script file instead of using -c
      const tempDir = path.resolve('./uploads/temp');
      await fs.mkdir(tempDir, { recursive: true });
      const scriptPath = path.join(tempDir, `wrapper_${Date.now()}.py`);
      
      const wrapperScript = `
import sys
import json
from pathlib import Path
import io

# Suppress print statements from converter modules
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

# Add module directory to path
module_dir = Path(r'${path.dirname(converterPath).replace(/\\/g, '/')}')
sys.path.insert(0, str(module_dir))

# Import the converter
converter_file = '${path.basename(converterPath)}'
if converter_file.endswith('production_converter_v2.py'):
    from production_converter_v2 import ProductionConverterV2
    converter = ProductionConverterV2()
elif converter_file.endswith('production_converter.py'):
    from production_converter import ProductionConverter
    converter = ProductionConverter()
else:
    from business_converter import BusinessConverter
    converter = BusinessConverter()

# Restore stdout for final output
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

# Get input data
input_json = r'''${JSON.stringify(data).replace(/'/g, "\\'")}'''
data = json.loads(input_json)

# Perform action
if '${action}' == 'parse':
    with open(data['file_path'], 'rb') as f:
        file_content = f.read()
    result = converter.parse_sop(
        file_content=file_content,
        filename=data['filename'],
        domain=data['domain']
    )
elif '${action}' == 'generate':
    result = converter.generate_contracts(
        sections=data['sections'],
        domain=data['domain'],
        user_names=data['user_names']
    )
    result = {'contracts': result}

# Output result as JSON only
print(json.dumps(result))
`;

      // Write script to file
      await fs.writeFile(scriptPath, wrapperScript);
      
      // Log the script for debugging
      const logFile = path.resolve('./logs/sandbox-debug.log');
      await fs.appendFile(logFile, `${new Date().toISOString()}: 📝 Wrapper script:\n${wrapperScript}\n\n`).catch(() => {});

      // Spawn Python process with script file
      const python = spawn(PYTHON_CMD, [scriptPath]);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('🐍 Python stderr:', data.toString());
      });

      python.on('close', async (code) => {
        // Clean up temp script
        await fs.unlink(scriptPath).catch(() => {});
        
        const logFile = path.resolve('./logs/sandbox-debug.log');
        await fs.appendFile(logFile, `${new Date().toISOString()}: 🐍 Python closed: code=${code}\n`).catch(() => {});
        await fs.appendFile(logFile, `${new Date().toISOString()}: 🐍 stdout: ${stdout}\n`).catch(() => {});
        await fs.appendFile(logFile, `${new Date().toISOString()}: 🐍 stderr: ${stderr}\n`).catch(() => {});
        
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr || 'No error message'}`));
          return;
        }

        try {
          // Log the raw output for debugging
          console.log('Python raw output:', stdout);
          console.log('Python stderr (if any):', stderr);
          
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          console.error('Failed to parse Python output:', stdout);
          console.error('Parse error:', error);
          reject(new Error(`Failed to parse Python output. Raw output: ${stdout.substring(0, 500)}`));
        }
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate contracts from selected sections (V2 workflow)
 */
router.post('/generate-contracts', async (req, res) => {
  try {
    const { sections, domain } = req.body;
    
    console.log(`🎨 Generate contracts: ${sections?.length || 0} sections, domain: ${domain}`);
    
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: 'No sections provided' });
    }
    
    const contracts = [];
    
    // For now, return mock contracts - we'll implement Python call next
    for (const section of sections) {
      contracts.push({
        id: section.contract_id,
        type: section.contract_type,
        filename: `${section.contract_id}.yaml`,
        yaml_content: `# Generated contract for section ${section.number}`,
        domain: domain
      });
    }
    
    res.json({
      success: true,
      contracts: contracts,
      total: contracts.length
    });
    
  } catch (error) {
    console.error('Generate contracts error:', error);
    res.status(500).json({ 
      error: 'Failed to generate contracts',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

