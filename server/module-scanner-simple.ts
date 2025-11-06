/**
 * Simple SMART-Modules Scanner
 * Just discovers actual smart_* modules for the frontend
 */

import * as fs from 'fs';
import * as path from 'path';

// Import systemStatus for tracking
let systemStatus: any = null;
try {
  // Dynamic import to avoid circular dependency
  systemStatus = require('./index').systemStatus;
} catch (e) {
  // In case of import issues, just continue without status tracking
}

interface ModuleInfo {
  id: string;
  moduleId: string;
  name: string;
  displayName?: string;
  description?: string;
  modulePath: string;
  status: 'discovered' | 'validated';
  lastScanned: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export class SimpleModuleScanner {
  
  /**
   * Scan smart_business_module directory for actual SMART modules
   */
  static async scanModules(): Promise<ModuleInfo[]> {
    const modulesPath = path.resolve('./smart_business_module');
    const modules: ModuleInfo[] = [];
    
    try {
      if (!fs.existsSync(modulesPath)) {
        console.log(`📂 Modules directory does not exist: ${modulesPath}`);
        return [];
      }

      console.log(`🔍 Scanning for SMART modules in: ${modulesPath}`);

      const entries = fs.readdirSync(modulesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Look for smart_* directories (actual modules, not frameworks)
        if (entry.isDirectory() && entry.name.startsWith('smart_')) {
          const moduleDir = path.join(modulesPath, entry.name);
          const module = await this.scanModule(moduleDir, entry.name);
          
          if (module) {
            modules.push(module);
          }
        }
      }

      console.log(`📦 Found ${modules.length} SMART modules`);
      
      // Update system status tracking
      if (systemStatus) {
        systemStatus.lastModuleScan = new Date();
        systemStatus.moduleScannerOnline = true;
      }
      
      return modules;
      
    } catch (error) {
      console.error('Module scanning failed:', error);
      return [];
    }
  }

  /**
   * Scan a single smart_* module directory
   */
  private static async scanModule(moduleDir: string, dirName: string): Promise<ModuleInfo | null> {
    try {
      const now = new Date().toISOString();
      
      // Generate simple ID for now (we'll hook up SMART-ID system later)
      const simpleId = Date.now().toString();
      const moduleId = `MOD-${Math.floor(Math.random() * 90000) + 10000}`;

      const moduleInfo: ModuleInfo = {
        id: simpleId,
        moduleId: moduleId,
        name: dirName,
        displayName: this.formatDisplayName(dirName),
        description: await this.getDescription(moduleDir),
        modulePath: moduleDir,

        status: 'discovered',
        lastScanned: now,
        metadata: {
          filesCount: this.countModuleFiles(moduleDir),
          hasReadme: this.hasReadme(moduleDir),
          scannedAt: now
        },
        createdAt: now
      };

      return moduleInfo;
      
    } catch (error) {
      console.error(`Failed to scan module ${dirName}:`, error);
      return null;
    }
  }

  /**
   * Format display name from directory name
   */
  private static formatDisplayName(dirName: string): string {
    // Special word mappings
    const specialWords: Record<string, string> = {
      'id': 'ID',
      'ai': 'AI',
      'api': 'API',
      'ui': 'UI',
      'db': 'DB'
    };

    return dirName
      .replace('smart_', 'SMART-')
      .replace(/_/g, '-')
      .split('-')
      .map(word => {
        const lowerWord = word.toLowerCase();
        if (specialWords[lowerWord]) {
          return specialWords[lowerWord];
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('-');
  }

  /**
   * Determine module type based on name
   */

  /**
   * Get description from README file
   */
  private static async getDescription(moduleDir: string): Promise<string> {
    try {
      const readmePath = path.join(moduleDir, 'README.md');
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf8');
        
        // Extract first paragraph after the title
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line && !line.startsWith('#') && line.length > 20) {
            return line;
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return `SMART-Business module for ${path.basename(moduleDir).replace('smart_', '').replace(/_/g, ' ')}`;
  }

  /**
   * Check if module has README
   */
  private static hasReadme(moduleDir: string): boolean {
    return fs.existsSync(path.join(moduleDir, 'README.md'));
  }

  /**
   * Count module files
   */
  private static countModuleFiles(moduleDir: string): number {
    try {
      const files = fs.readdirSync(moduleDir);
      return files.filter(file => {
        const ext = path.extname(file);
        return ['.py', '.js', '.ts', '.json', '.yml', '.yaml'].includes(ext);
      }).length;
    } catch (error) {
      return 0;
    }
  }
}

export default SimpleModuleScanner;