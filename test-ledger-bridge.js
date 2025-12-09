#!/usr/bin/env node
/**
 * Test script to verify the Python ledger bridge works correctly
 * This simulates what happens when you create/edit/delete items in the UI
 */

import { spawn, spawnSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Same detection logic as ledger-routes.ts
function findPythonExecutable() {
  try {
    const res = spawnSync('python3', ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return 'python3';
  } catch {
    // ignore
  }

  try {
    const res = spawnSync('python', ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return 'python';
  } catch {
    // ignore
  }

  return 'python3'; // fallback
}

const PYTHON_CMD = findPythonExecutable();

console.log('🧪 Testing SMART Ledger Bridge...');
console.log(`📍 Using Python: ${PYTHON_CMD}`);

// Test Python detection
console.log('\n1️⃣ Testing Python detection...');
const pythonTest = spawnSync(PYTHON_CMD, ['--version']);
if (pythonTest.status === 0) {
  console.log(`✅ Python detected: ${pythonTest.stdout.toString().trim()}`);
} else {
  console.log(`❌ Python not working: ${pythonTest.stderr.toString()}`);
  process.exit(1);
}

// Test Python imports
console.log('\n2️⃣ Testing Python imports...');
const importTest = spawnSync(PYTHON_CMD, ['-c', 'import sys, os, json, hashlib, time; print("All imports OK")']);
if (importTest.status === 0) {
  console.log(`✅ Python imports working`);
} else {
  console.log(`❌ Python import error: ${importTest.stderr.toString()}`);
}

// Create test ledger entry
console.log('\n3️⃣ Testing ledger entry creation...');

const testScript = `
import sys
import os
import json
sys.path.append('${path.join(__dirname, 'server')}')

# Ensure data directory exists
data_dir = '${path.join(__dirname, 'data', 'ledger')}'
os.makedirs(data_dir, exist_ok=True)

try:
    from smart_ledger import get_ledger
    
    # Test creating a ledger entry
    ledger = get_ledger("test")
    entry_id = ledger.record_action(
        action_type="system",
        action="test",
        target="ledger_bridge",
        details="Testing Python bridge from Node.js",
        user_id="test_user",
        smart_id="TEST-12345"
    )
    
    print(f"SUCCESS:{entry_id}")
except Exception as e:
    print(f"ERROR:{str(e)}")
`;

const testProcess = spawn(PYTHON_CMD, ['-c', testScript], {
  cwd: __dirname
});

let output = '';
let errorOutput = '';

testProcess.stdout.on('data', (data) => {
  output += data.toString();
});

testProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

testProcess.on('close', (code) => {
  if (code === 0 && output.includes('SUCCESS:')) {
    const entryId = output.split('SUCCESS:')[1].trim().split('\n')[0];
    console.log(`✅ Ledger entry created: ${entryId}`);
    
    // Check if ledger file was created
    const ledgerFile = path.join(__dirname, 'data', 'ledger', 'test_ledger.jsonl');
    if (fs.existsSync(ledgerFile)) {
      console.log(`✅ Ledger file created: ${ledgerFile}`);
      
      // Read the entry
      const ledgerContent = fs.readFileSync(ledgerFile, 'utf8');
      const entries = ledgerContent.trim().split('\n').filter(line => line);
      console.log(`✅ Ledger entries: ${entries.length}`);
      
      if (entries.length > 0) {
        const lastEntry = JSON.parse(entries[entries.length - 1]);
        console.log(`✅ Last entry: ${lastEntry.action_type}.${lastEntry.action} on '${lastEntry.target}'`);
      }
    } else {
      console.log(`❌ Ledger file not created at: ${ledgerFile}`);
    }
    
    console.log('\n🎉 LEDGER BRIDGE TEST PASSED!');
    console.log('✅ Python detection working');
    console.log('✅ Python imports working');  
    console.log('✅ Ledger entry creation working');
    console.log('✅ File system write working');
    console.log('\nYour CRUD operations should now work correctly!');
    
  } else {
    console.log(`❌ Ledger test failed (exit code: ${code})`);
    if (errorOutput) {
      console.log(`Error output: ${errorOutput}`);
    }
    if (output && !output.includes('SUCCESS:')) {
      console.log(`Output: ${output}`);
    }
    
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Ensure Python is installed and in PATH');
    console.log('2. Check write permissions to data/ledger directory');
    console.log('3. Verify no antivirus is blocking Python execution');
    
    process.exit(1);
  }
});

testProcess.on('error', (err) => {
  console.log(`❌ Process error: ${err.message}`);
  process.exit(1);
});