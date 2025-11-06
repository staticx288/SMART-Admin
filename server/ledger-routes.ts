/**
 * SMART-Ledger API Routes
 * Provides Express.js endpoints for dashboard tabs to report actions to the Python Custodian
 * 
 * Design Philosophy:
 * - Tabs DO their work and REPORT to Custodian via these endpoints
 * - Each tab is like a module that tells the ledger what it did
 * - Custodian ONLY records what it's told via these APIs
 */

import { Request, Response } from 'express';
import type { Express } from 'express';
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LedgerEntry {
  action_type: 'module' | 'node' | 'equipment' | 'domain' | 'user' | 'system';
  action: string;
  target: string;
  details: string;
  user_id: string;
  smart_id?: string;
  metadata?: Record<string, any>;
}

interface LedgerResponse {
  success: boolean;
  entry_id?: string;
  error?: string;
}

/**
 * Execute Python ledger operations
 * This bridges the Express.js API to the Python SMART-Ledger system
 */
class LedgerBridge {
  private pythonPath: string;
  private ledgerScript: string;

  constructor() {
    this.pythonPath = 'python3';
    this.ledgerScript = path.join(__dirname, 'smart_ledger.py');
  }

  /**
   * Record an action in the ledger by calling Python script
   */
  async recordAction(entry: LedgerEntry): Promise<LedgerResponse> {
    return new Promise((resolve) => {
      try {
        // Create Python script to record the action
        const scriptContent = `
import sys
import os
sys.path.append('${__dirname}')
from smart_ledger import get_ledger

try:
    ledger = get_ledger()
    entry_id = ledger.record_action(
        action_type="${entry.action_type}",
        action="${entry.action}",
        target="${entry.target}",
        details="${entry.details}",
        user_id="${entry.user_id}",
        smart_id="${entry.smart_id || ''}",
        metadata=${JSON.stringify(entry.metadata || {})}
    )
    print(f"SUCCESS:{entry_id}")
except Exception as e:
    print(f"ERROR:{str(e)}")
`;

        const python = spawn(this.pythonPath, ['-c', scriptContent], {
          cwd: path.join(__dirname, '..')  // Use project root, not server dir
        });

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', (code) => {
          if (code === 0 && output.includes('SUCCESS:')) {
            const entryId = output.split('SUCCESS:')[1].trim().split('\n')[0];
            resolve({ success: true, entry_id: entryId });
          } else {
            const errorMsg = errorOutput || output.split('ERROR:')[1] || 'Unknown error';
            resolve({ success: false, error: errorMsg.trim() });
          }
        });

        python.on('error', (err) => {
          resolve({ success: false, error: `Python execution error: ${err.message}` });
        });

      } catch (error) {
        resolve({ success: false, error: `Bridge error: ${error}` });
      }
    });
  }

  /**
   * Get ledger entries by calling Python script
   */
  async getEntries(tabName: string = 'main', limit: number = 50, offset: number = 0, filters: Record<string, string> = {}): Promise<any> {
    return new Promise((resolve) => {
      try {
        const filterArgs = Object.entries(filters)
          .map(([key, value]) => `${key}="${value}"`)
          .join(', ');
        
        const scriptContent = `
import sys
import os
import json
sys.path.append('${__dirname}')
from smart_ledger import get_ledger

try:
    ledger = get_ledger("${tabName}")
    entries = ledger.get_entries(limit=${limit}, offset=${offset}${filterArgs ? ', ' + filterArgs : ''})
    stats = ledger.get_stats()
    result = {
        "success": True,
        "entries": entries,
        "stats": stats,
        "tab": "${tabName}"
    }
    print("SUCCESS:" + json.dumps(result))
except Exception as e:
    print(f"ERROR:{str(e)}")
`;

        const python = spawn(this.pythonPath, ['-c', scriptContent], {
          cwd: path.join(__dirname, '..')  // Use project root, not server dir
        });

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', (code) => {
          if (code === 0 && output.includes('SUCCESS:')) {
            try {
              const jsonStr = output.split('SUCCESS:')[1].trim();
              const result = JSON.parse(jsonStr);
              resolve(result);
            } catch (parseError) {
              resolve({ success: false, error: 'Failed to parse ledger response' });
            }
          } else {
            const errorMsg = errorOutput || output.split('ERROR:')[1] || 'Unknown error';
            resolve({ success: false, error: errorMsg.trim() });
          }
        });

        python.on('error', (err) => {
          resolve({ success: false, error: `Python execution error: ${err.message}` });
        });

      } catch (error) {
        resolve({ success: false, error: `Bridge error: ${error}` });
      }
    });
  }

  /**
   * Validate the hash chain integrity
   */
  async validateChain(): Promise<any> {
    return new Promise((resolve) => {
      try {
        const scriptContent = `
import sys
import os
import json
sys.path.append('${__dirname}')
from smart_ledger import get_ledger

try:
    ledger = get_ledger()
    validation = ledger.validate_chain()
    print("SUCCESS:" + json.dumps(validation))
except Exception as e:
    print(f"ERROR:{str(e)}")
`;

        const python = spawn(this.pythonPath, ['-c', scriptContent], {
          cwd: path.join(__dirname, '..')  // Use project root, not server dir
        });

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', (code) => {
          if (code === 0 && output.includes('SUCCESS:')) {
            try {
              const jsonStr = output.split('SUCCESS:')[1].trim();
              const result = JSON.parse(jsonStr);
              resolve({ success: true, validation: result });
            } catch (parseError) {
              resolve({ success: false, error: 'Failed to parse validation response' });
            }
          } else {
            const errorMsg = errorOutput || output.split('ERROR:')[1] || 'Unknown error';
            resolve({ success: false, error: errorMsg.trim() });
          }
        });

        python.on('error', (err) => {
          resolve({ success: false, error: `Python execution error: ${err.message}` });
        });

      } catch (error) {
        resolve({ success: false, error: `Bridge error: ${error}` });
      }
    });
  }
}

// Global bridge instance
const ledgerBridge = new LedgerBridge();

export function setupLedgerRoutes(app: Express) {
  
  /**
   * Record Action Endpoint
   * POST /api/ledger/record
   * 
   * This is how dashboard tabs report their actions to their dedicated ledgers
   */
  app.post('/api/ledger/record', async (req: Request, res: Response) => {
    try {
      const { tab, action_type, action, target, details, smart_id, metadata, user_id } = req.body;
      
      // Validate required fields - user_id is now REQUIRED from the calling module
      if (!tab || !action_type || !action || !target || !details || !user_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: tab, action_type, action, target, details, user_id'
        });
      }
      
      // Valid action types
      const validActionTypes = ['module', 'node', 'equipment', 'domain', 'user', 'system'];
      if (!validActionTypes.includes(action_type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid action_type. Must be one of: ${validActionTypes.join(', ')}`
        });
      }

      // Use tab-specific recording functions
      const scriptContent = `
import sys
import os
sys.path.append('${__dirname}')
from smart_ledger import record_${action_type}_action

try:
    entry_id = record_${action_type}_action(
        "${action}",
        "${target}",
        "${details}",
        "${user_id}",
        "${smart_id || ''}"
    )
    print(f"SUCCESS:{entry_id}")
except Exception as e:
    print(f"ERROR:{str(e)}")
`;

      const python = spawn('python3', ['-c', scriptContent], {
        cwd: path.join(__dirname, '..')  // Use project root, not server dir
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && output.includes('SUCCESS:')) {
          const entryId = output.split('SUCCESS:')[1].trim().split('\n')[0];
          res.json({
            success: true,
            entry_id: entryId,
            message: `Recorded ${action_type}.${action} on '${target}'`
          });
        } else {
          const errorMsg = errorOutput || output.split('ERROR:')[1] || 'Unknown error';
          res.status(500).json({
            success: false,
            error: errorMsg.trim()
          });
        }
      });

      python.on('error', (err) => {
        res.status(500).json({ 
          success: false, 
          error: `Python execution error: ${err.message}` 
        });
      });
      
    } catch (error) {
      console.error('Ledger record error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during ledger recording'
      });
    }
  });
  
  /**
   * Get Ledger Entries (supports per-tab ledgers)
   * GET /api/ledger/entries?tab=modules
   */
  app.get('/api/ledger/entries', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const tabName = (req.query.tab as string) || 'main';
      
      const filters: Record<string, string> = {};
      if (req.query.action_type) filters.action_type = req.query.action_type as string;
      if (req.query.user_id) filters.user_id = req.query.user_id as string;
      if (req.query.start_time) filters.start_time = req.query.start_time as string;
      if (req.query.end_time) filters.end_time = req.query.end_time as string;
      
      const result = await ledgerBridge.getEntries(tabName, limit, offset, filters);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('Ledger entries error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error retrieving ledger entries'
      });
    }
  });
  
  /**
   * Validate Hash Chain Integrity
   * GET /api/ledger/validate
   */
  app.get('/api/ledger/validate', async (req: Request, res: Response) => {
    try {
      const result = await ledgerBridge.validateChain();
      
      if (result.success) {
        res.json({
          success: true,
          validation: result.validation,
          message: result.validation.valid ? 'Hash chain is valid' : 'Hash chain validation failed'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('Chain validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during chain validation'
      });
    }
  });
  
  /**
   * Get Recent Activities from All Tabs (for Overview tab)
   * GET /api/ledger/activities
   */
  app.get('/api/ledger/activities', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      const scriptContent = `
import sys
import os
import json
sys.path.append('${__dirname}')
from smart_ledger import get_all_recent_activities

try:
    activities = get_all_recent_activities(limit=${limit})
    result = {
        "success": True,
        "activities": activities,
        "total": len(activities)
    }
    print("SUCCESS:" + json.dumps(result))
except Exception as e:
    print(f"ERROR:{str(e)}")
`;

      const python = spawn('python3', ['-c', scriptContent], {
        cwd: path.join(__dirname, '..')  // Use project root, not server dir
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && output.includes('SUCCESS:')) {
          try {
            const jsonStr = output.split('SUCCESS:')[1].trim();
            const result = JSON.parse(jsonStr);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ success: false, error: 'Failed to parse activities response' });
          }
        } else {
          const errorMsg = errorOutput || output.split('ERROR:')[1] || 'Unknown error';
          res.status(500).json({ success: false, error: errorMsg.trim() });
        }
      });

      python.on('error', (err) => {
        res.status(500).json({ success: false, error: `Python execution error: ${err.message}` });
      });
      
    } catch (error) {
      console.error('Recent activities error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error retrieving recent activities'
      });
    }
  });

  /**
   * Get Ledger Statistics
   * GET /api/ledger/stats
   */
  app.get('/api/ledger/stats', async (req: Request, res: Response) => {
    try {
      const result = await ledgerBridge.getEntries('main', 1, 0); // Get stats from entries call
      
      if (result.success) {
        res.json({
          success: true,
          stats: result.stats
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('Ledger stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error retrieving ledger stats'
      });
    }
  });

  /**
   * Get Ledger Integrity Counts (for Overview dashboard)
   * GET /api/ledger/counts
   */
  app.get('/api/ledger/counts', async (req: Request, res: Response) => {
    try {
      const scriptContent = `
import sys
import os
import json
sys.path.append('${__dirname}')
from smart_ledger import get_ledger

try:
    # Get counts from each tab ledger
    ledger_counts = {}
    tab_ledgers = ["modules", "nodes", "domains", "equipment", "users", "system"]
    
    for tab_name in tab_ledgers:
        ledger = get_ledger(tab_name)
        stats = ledger.get_stats()
        ledger_counts[tab_name] = stats.get("total_entries", 0)
    
    result = {
        "success": True,
        "counts": ledger_counts
    }
    print("SUCCESS:" + json.dumps(result))
except Exception as e:
    print(f"ERROR:{str(e)}")
`;

      const python = spawn('python3', ['-c', scriptContent], {
        cwd: path.join(__dirname, '..')  // Use project root, not server dir
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && output.includes('SUCCESS:')) {
          try {
            const jsonStr = output.split('SUCCESS:')[1].trim();
            const result = JSON.parse(jsonStr);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({
              success: false,
              error: 'Failed to parse ledger counts response'
            });
          }
        } else {
          const errorMsg = errorOutput || output.split('ERROR:')[1] || 'Unknown error';
          res.status(500).json({
            success: false,
            error: errorMsg.trim()
          });
        }
      });

      python.on('error', (err) => {
        res.status(500).json({
          success: false,
          error: `Python execution error: ${err.message}`
        });
      });

    } catch (error) {
      console.error('Ledger counts error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error retrieving ledger counts'
      });
    }
  });

  console.log('📋 SMART-Ledger API routes registered');
}