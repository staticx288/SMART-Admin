// Dashboard API Routes for SMART Testing Node Demo
// Add these routes to server/infrastructure-express-routes.ts

import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import dashboardSchemas from '../dashboard-schemas.json' assert { type: 'json' };

const router = express.Router();

// WebSocket server for real-time updates
let wss: WebSocketServer;

// Initialize WebSocket server
export function initializeDashboardWS(server: any) {
  wss = new WebSocketServer({ server, path: '/dashboard-ws' });
  
  wss.on('connection', (ws) => {
    console.log('Dashboard client connected');
    
    // Send initial configuration
    ws.send(JSON.stringify({
      type: 'config',
      data: {
        scenarios: dashboardSchemas.scenarios,
        workflow_stages: dashboardSchemas.workflow_stages,
        event_types: dashboardSchemas.event_types
      }
    }));
  });
}

// Broadcast real-time events to connected clients
function broadcastEvent(event: any) {
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'event',
          data: event
        }));
      }
    });
  }
}

// GET /api/dashboard/scenarios - List all available test scenarios
router.get('/scenarios', (req, res) => {
  res.json({
    success: true,
    data: dashboardSchemas.scenarios
  });
});

// GET /api/dashboard/scenario/:id - Get specific scenario details
router.get('/scenario/:id', (req, res) => {
  const scenario = dashboardSchemas.scenarios.find(s => s.id === req.params.id);
  if (!scenario) {
    return res.status(404).json({ success: false, error: 'Scenario not found' });
  }
  res.json({
    success: true,
    data: scenario
  });
});

// POST /api/dashboard/run-scenario - Start scenario execution
router.post('/run-scenario', async (req, res) => {
  const { scenarioId, options } = req.body;
  
  const scenario = dashboardSchemas.scenarios.find(s => s.id === scenarioId);
  if (!scenario) {
    return res.status(404).json({ success: false, error: 'Scenario not found' });
  }

  // Start simulation session
  const sessionId = `session-${Date.now()}`;
  
  res.json({
    success: true,
    data: {
      sessionId,
      scenario: scenario,
      status: 'started',
      estimatedDuration: '23 minutes'
    }
  });

  // Simulate real-time workflow execution
  executeScenarioSimulation(sessionId, scenario, options);
});

// Simulate SMART Testing Node workflow execution
async function executeScenarioSimulation(sessionId: string, scenario: any, options: any = {}) {
  const speed = options.speed || 1; // 1x = real-time, 10x = 10x faster
  
  // Timing based on 23-minute real workflow (in milliseconds, adjusted by speed)
  const timings = {
    gatekeeper: 2000 / speed,      // 2 seconds
    vision: 3000 / speed,          // 3 seconds  
    safety: 1500 / speed,          // 1.5 seconds
    maintenance: 2500 / speed,     // 2.5 seconds
    compliance: 2000 / speed,      // 2 seconds
    standards: 2000 / speed,       // 2 seconds
    test_execution: 15000 / speed, // 15 seconds (simulated test)
    qa: 3000 / speed,              // 3 seconds
    guardian: 2000 / speed,        // 2 seconds
    handoff: 2000 / speed          // 2 seconds
  };

  try {
    // Start workflow
    broadcastEvent({
      sessionId,
      type: 'workflow_started',
      timestamp: Date.now(),
      scenario: scenario.id,
      contract: scenario.contract,
      partId: scenario.partId,
      operator: scenario.operator,
      station: scenario.station
    });

    // Execute each stage based on scenario
    for (const stage of dashboardSchemas.workflow_stages) {
      await new Promise(resolve => setTimeout(resolve, timings[stage.id as keyof typeof timings] || 1000));
      
      const stageResult = executeWorkflowStage(sessionId, scenario, stage);
      broadcastEvent(stageResult);
      
      // If this stage fails and matches the scenario's expected failure point, stop here
      if (!stageResult.success && stage.id === scenario.failurePoint) {
        broadcastEvent({
          sessionId,
          type: 'workflow_failed',
          timestamp: Date.now(),
          failurePoint: stage.id,
          reason: stageResult.reason,
          contract: scenario.contract,
          ledgerEntries: stageResult.ledgerEntries || 0
        });
        return;
      }
      
      // If this is a failure scenario but we haven't reached the failure point yet, continue
      if (scenario.expectedResult !== 'complete' && stage.id === scenario.failurePoint) {
        continue;
      }
    }

    // Success completion
    if (scenario.expectedResult === 'complete') {
      broadcastEvent({
        sessionId,
        type: 'workflow_completed',
        timestamp: Date.now(),
        contract: scenario.contract,
        partId: scenario.partId,
        nextStation: 'MT-Station-B1',
        ledgerEntries: 11,
        broadcastsSent: 20,
        alertsGenerated: 0
      });
    }

  } catch (error) {
    broadcastEvent({
      sessionId,
      type: 'workflow_error',
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Execute individual workflow stage
function executeWorkflowStage(sessionId: string, scenario: any, stage: any) {
  const baseEvent = {
    sessionId,
    timestamp: Date.now(),
    stage: stage.id,
    stageName: stage.name,
    icon: stage.icon
  };

  // Simulate stage-specific logic based on scenario
  switch (stage.id) {
    case 'gatekeeper':
      return executeGatekeeperStage(baseEvent, scenario);
    case 'vision':
      return executeVisionStage(baseEvent, scenario);
    case 'safety':
      return executeSafetyStage(baseEvent, scenario);
    case 'maintenance':
      return executeMaintenanceStage(baseEvent, scenario);
    case 'compliance':
      return executeComplianceStage(baseEvent, scenario);
    case 'standards':
      return executeStandardsStage(baseEvent, scenario);
    case 'test-execution':
      return executeTestStage(baseEvent, scenario);
    case 'qa':
      return executeQAStage(baseEvent, scenario);
    case 'guardian':
      return executeGuardianStage(baseEvent, scenario);
    case 'handoff':
      return executeHandoffStage(baseEvent, scenario);
    default:
      return {
        ...baseEvent,
        type: 'stage_completed',
        success: true,
        validations: []
      };
  }
}

// Stage execution functions
function executeGatekeeperStage(baseEvent: any, scenario: any) {
  const validations = [];
  let success = true;
  let reason = '';

  // SmartContract validation
  if (scenario.id === 'wrong-contract') {
    validations.push({
      check: 'SmartContract validity',
      result: false,
      message: `${scenario.contract} not valid for ${scenario.station}`
    });
    success = false;
    reason = 'SmartContract not valid for station';
  } else {
    validations.push({
      check: 'SmartContract validity', 
      result: true,
      message: `${scenario.contract} valid for ${scenario.station}`
    });
  }

  // Operator validation
  if (scenario.id === 'missing-certs') {
    validations.push({
      check: 'Operator authorization',
      result: false,
      message: `Operator missing required certifications: ${scenario.missingCerts?.join(', ')}`
    });
    success = false;
    reason = 'Insufficient operator certifications';
  } else {
    validations.push({
      check: 'Operator authorization',
      result: true,
      message: 'Operator authorized with required certifications'
    });
  }

  // SmartContract presence
  if (scenario.id === 'missing-standards') {
    validations.push({
      check: 'Required SmartContracts',
      result: false,
      message: `Missing required SmartContracts: ${scenario.missingContracts?.join(', ')}`
    });
    success = false;
    reason = 'Missing required SmartContracts';
  } else {
    validations.push({
      check: 'Required SmartContracts',
      result: true,
      message: 'All required SmartContracts present'
    });
  }

  return {
    ...baseEvent,
    type: success ? 'stage_completed' : 'stage_failed',
    success,
    reason,
    validations,
    ledgerEntries: success ? 1 : 0
  };
}

function executeVisionStage(baseEvent: any, scenario: any) {
  const validations = [];
  let success = true;
  let reason = '';

  // QR scanning always succeeds
  validations.push({
    check: 'QR code scanning',
    result: true,
    message: `QR code valid - Part ID: ${scenario.partId}`
  });

  // Part verification
  if (scenario.id === 'wrong-part') {
    validations.push({
      check: 'Part verification',
      result: false,
      message: `Part verification failed - Expected: ${scenario.expectedPart}, Got: ${scenario.partId}`
    });
    success = false;
    reason = 'Part mismatch detected by vision system';
  } else {
    validations.push({
      check: 'Part verification',
      result: true,
      message: 'Part verified - Match confidence: 95.00%'
    });
  }

  return {
    ...baseEvent,
    type: success ? 'stage_completed' : 'stage_failed',
    success,
    reason,
    validations,
    ledgerEntries: success ? 1 : 0
  };
}

function executeSafetyStage(baseEvent: any, scenario: any) {
  const validations = [];
  let success = true;
  let reason = '';

  // PPE compliance
  if (scenario.id === 'safety-token' && scenario.missingToken === 'PPE_REQUIRED') {
    validations.push({
      check: 'PPE compliance',
      result: false,
      message: 'PPE compliance failed - no Safety token'
    });
    success = false;
    reason = 'Missing PPE compliance token';
  } else {
    validations.push({
      check: 'PPE compliance',
      result: true,
      message: 'PPE compliance verified via SF-PPE-STD contract'
    });
  }

  // HAZMAT clearance (usually passes)
  validations.push({
    check: 'HAZMAT clearance',
    result: true,
    message: 'HAZMAT clearance verified via SF-LP-C contract'
  });

  return {
    ...baseEvent,
    type: success ? 'stage_completed' : 'stage_failed',
    success,
    reason,
    validations,
    ledgerEntries: success ? 1 : 0
  };
}

function executeMaintenanceStage(baseEvent: any, scenario: any) {
  return {
    ...baseEvent,
    type: 'stage_completed',
    success: true,
    validations: [
      {
        check: 'Equipment calibration',
        result: true,
        message: 'Equipment calibration verified via MN-LP-A contract'
      },
      {
        check: 'Environmental conditions',
        result: true, 
        message: 'Environmental conditions validated via maintenance sensors'
      },
      {
        check: 'Tool readiness',
        result: true,
        message: 'Tools calibrated and ready per MN-TOOL-CAL contract'
      }
    ],
    ledgerEntries: 1
  };
}

function executeComplianceStage(baseEvent: any, scenario: any) {
  return {
    ...baseEvent,
    type: 'stage_completed',
    success: true,
    validations: [
      {
        check: 'Pre-test completion',
        result: true,
        message: 'Pre-test requirements completion verified via LP-Checklist-Red'
      },
      {
        check: 'Operator acknowledgment',
        result: true,
        message: 'Operator acknowledgement confirmed via SP-LP-PROCESS-2'
      }
    ],
    ledgerEntries: 1
  };
}

function executeStandardsStage(baseEvent: any, scenario: any) {
  return {
    ...baseEvent,
    type: 'stage_completed',
    success: true,
    validations: [
      {
        check: 'ASTM E165 standard',
        result: true,
        message: 'ASTM E165 liquid penetrant standard verified via ST-ASTM-E165'
      },
      {
        check: 'ISO 9001 standard',
        result: true,
        message: 'ISO 9001 quality management verified via ST-ISO-9001'
      }
    ],
    ledgerEntries: 1
  };
}

function executeTestStage(baseEvent: any, scenario: any) {
  return {
    ...baseEvent,
    type: 'stage_completed',
    success: true,
    validations: [
      {
        check: 'Test execution',
        result: true,
        message: 'Liquid penetrant test completed successfully'
      }
    ],
    ledgerEntries: 1
  };
}

function executeQAStage(baseEvent: any, scenario: any) {
  return {
    ...baseEvent,
    type: 'stage_completed',
    success: true,
    validations: [
      {
        check: 'Test procedure adherence',
        result: true,
        message: 'Test procedure followed correctly'
      },
      {
        check: 'Result accuracy',
        result: true,
        message: 'Test results within acceptable parameters'
      }
    ],
    ledgerEntries: 1
  };
}

function executeGuardianStage(baseEvent: any, scenario: any) {
  return {
    ...baseEvent,
    type: 'stage_completed',
    success: true,
    validations: [
      {
        check: 'All signoffs verification',
        result: true,
        message: "All required signoffs received: ['Safety', 'Maintenance', 'Compliance', 'Standards', 'QA']"
      },
      {
        check: 'Local backup creation',
        result: true,
        message: `Local backup saved: test_results_${scenario.contract}.json`
      }
    ],
    ledgerEntries: 1
  };
}

function executeHandoffStage(baseEvent: any, scenario: any) {
  return {
    ...baseEvent,
    type: 'stage_completed',
    success: true,
    validations: [
      {
        check: 'Business Hub transfer',
        result: true,
        message: 'Business Hub transfer complete'
      },
      {
        check: 'Next station routing',
        result: true,
        message: 'MT-Station-B1 transfer complete'
      }
    ],
    ledgerEntries: 1
  };
}

// GET /api/dashboard/workflow-stages - Get workflow stage definitions
router.get('/workflow-stages', (req, res) => {
  res.json({
    success: true,
    data: dashboardSchemas.workflow_stages
  });
});

// GET /api/dashboard/contracts - Get SmartContract definitions  
router.get('/contracts', (req, res) => {
  res.json({
    success: true,
    data: dashboardSchemas.smart_contracts
  });
});

// GET /api/dashboard/certifications - Get certification definitions
router.get('/certifications', (req, res) => {
  res.json({
    success: true,
    data: dashboardSchemas.certifications
  });
});

export default router;