#!/usr/bin/env node
/**
 * Update existing nodes with platform information from discovered agents
 * Run this after deploying new agents to update platform info
 */

const fs = require('fs');
const path = require('path');

const nodesFile = path.resolve(process.cwd(), 'data/nodes-data.json');

async function updateNodesPlatformInfo() {
  try {
    console.log('🔄 Updating nodes with platform information...');
    
    if (!fs.existsSync(nodesFile)) {
      console.log('❌ data/nodes-data.json not found');
      return;
    }
    
    const data = fs.readFileSync(nodesFile, 'utf8');
    let nodes = JSON.parse(data) || [];
    
    console.log(`📊 Found ${nodes.length} registered nodes`);
    
    // Get discovered agents data (this would need to be adapted based on your setup)
    // For now, we'll add some sample platform info to demonstrate the structure
    
    let updatedCount = 0;
    
    for (let node of nodes) {
      if (!node.platformInfo) {
        // Add platform info based on device characteristics
        let platformInfo = null;
        
        // Detect Android devices
        if (node.sshPort === 8022 || 
            (node.capabilities && node.capabilities.some(cap => 
              cap.toLowerCase().includes('android') || 
              cap.toLowerCase().includes('termux')
            ))) {
          platformInfo = {
            platform: 'android',
            os: 'Android (detected)',
            architecture: 'arm64',
            deviceModel: node.name === 'Tablet' ? 'Android Tablet' : 'Android Device'
          };
        }
        // Detect Windows devices
        else if (node.name.toLowerCase().includes('desktop') || 
                 node.name.toLowerCase().includes('pc')) {
          platformInfo = {
            platform: 'windows',
            os: 'Windows (detected)',
            architecture: 'x64',
            deviceModel: 'Windows PC'
          };
        }
        // Detect Linux devices
        else if (node.name.toLowerCase().includes('workstation') ||
                 node.name.toLowerCase().includes('ai-box') ||
                 node.name.toLowerCase().includes('nas')) {
          platformInfo = {
            platform: 'linux',
            os: 'Linux (detected)',
            architecture: 'x64',
            deviceModel: node.name.includes('workstation') ? 'Linux Workstation' : 'Linux Server'
          };
        }
        // Detect Raspberry Pi
        else if (node.name.toLowerCase().includes('raspberry') ||
                 node.ipAddress.startsWith('172.16.')) {
          platformInfo = {
            platform: 'linux',
            os: 'Raspberry Pi OS',
            architecture: 'arm64',
            deviceModel: 'Raspberry Pi'
          };
        }
        
        if (platformInfo) {
          node.platformInfo = platformInfo;
          updatedCount++;
          console.log(`✅ Updated ${node.name}: ${platformInfo.os}`);
        }
      }
    }
    
    // Write updated data back
    fs.writeFileSync(nodesFile, JSON.stringify(nodes, null, 2));
    
    console.log(`🎉 Updated ${updatedCount} nodes with platform information`);
    console.log('💡 Deploy new agents on your devices to get real-time platform data');
    
  } catch (error) {
    console.error('❌ Error updating nodes:', error);
  }
}

// Run if called directly
if (require.main === module) {
  updateNodesPlatformInfo();
}

module.exports = { updateNodesPlatformInfo };