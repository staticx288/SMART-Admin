/**
 * Application Settings Management
 * Handles configuration storage and retrieval
 */

import * as fs from 'fs';
import * as path from 'path';

interface AppSetting {
  id: string;
  category: string;
  key: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'password' | 'path';
  value: any;
  defaultValue: any;
  required: boolean;
}

export class SettingsManager {
  private static settingsFile = path.resolve(process.cwd(), 'smart-admin-settings.json');
  private static defaultSettings: AppSetting[] = [
    // Database Settings
    {
      id: "db-host",
      category: "database",
      key: "database.host",
      name: "Database Host",
      description: "PostgreSQL database server hostname or IP address",
      type: "string",
      value: "localhost",
      defaultValue: "localhost",
      required: true
    },
    {
      id: "db-port",
      category: "database", 
      key: "database.port",
      name: "Database Port",
      description: "PostgreSQL database server port",
      type: "number",
      value: 5432,
      defaultValue: 5432,
      required: true
    },
    {
      id: "db-name",
      category: "database",
      key: "database.name", 
      name: "Database Name",
      description: "Name of the SmartAdmin database",
      type: "string",
      value: "smart_admin",
      defaultValue: "smart_admin",
      required: true
    },
    {
      id: "db-user",
      category: "database",
      key: "database.username",
      name: "Database Username", 
      description: "Username for database connection",
      type: "string",
      value: "smart_admin",
      defaultValue: "smart_admin",
      required: true
    },
    {
      id: "db-password",
      category: "database",
      key: "database.password",
      name: "Database Password",
      description: "Password for database connection",
      type: "password",
      value: "",
      defaultValue: "",
      required: true
    },
    
    // Storage Paths
    {
      id: "modules-path",
      category: "storage",
      key: "paths.modules",
      name: "Modules Directory",
      description: "Directory where SMART-Business modules are located",
      type: "path",
      value: "./smart_business_module",
      defaultValue: "./smart_business_module", 
      required: true
    },
    {
      id: "domains-path",
      category: "storage",
      key: "paths.domains",
      name: "Domain Ecosystems Directory",
      description: "Directory where generated domain ecosystems are saved",
      type: "path",
      value: "./data/domains",
      defaultValue: "./data/domains",
      required: true
    },
    {
      id: "deployments-path",
      category: "storage",
      key: "paths.deployments",
      name: "Deployments Directory", 
      description: "Directory where deployment packages are created",
      type: "path",
      value: "./data/deployments",
      defaultValue: "./data/deployments",
      required: true
    },
    {
      id: "backups-path",
      category: "storage",
      key: "paths.backups",
      name: "Backups Directory",
      description: "Directory for system backups and exports",
      type: "path", 
      value: "./data/backups",
      defaultValue: "./data/backups",
      required: true
    },
    
    // Network Settings
    {
      id: "api-port",
      category: "network",
      key: "network.api.port",
      name: "API Server Port",
      description: "Port for the backend API server",
      type: "number",
      value: 5000,
      defaultValue: 5000,
      required: true
    },
    {
      id: "frontend-port", 
      category: "network",
      key: "network.frontend.port",
      name: "Frontend Port",
      description: "Port for the frontend development server",
      type: "number",
      value: 5173,
      defaultValue: 5173,
      required: true
    },
    {
      id: "node-subnet",
      category: "network",
      key: "network.node.subnet", 
      name: "Node Discovery Subnet",
      description: "Network subnet for discovering deployment nodes",
      type: "string",
      value: "192.168.1.0/24",
      defaultValue: "192.168.1.0/24",
      required: true
    },
    
    // Security
    {
      id: "encryption-key",
      category: "security",
      key: "security.encryption.key",
      name: "Encryption Key",
      description: "Master encryption key for sensitive data",
      type: "password",
      value: "",
      defaultValue: "",
      required: true
    },
    {
      id: "session-timeout",
      category: "security", 
      key: "security.session.timeout",
      name: "Session Timeout (minutes)",
      description: "User session timeout in minutes",
      type: "number",
      value: 60,
      defaultValue: 30,
      required: true
    }
  ];

  static getSettings(): AppSetting[] {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const data = fs.readFileSync(this.settingsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    
    // Return defaults if file doesn't exist or loading fails
    return [...this.defaultSettings];
  }

  static saveSettings(settings: AppSetting[]): boolean {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  static getSetting(key: string): any {
    const settings = this.getSettings();
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : null;
  }

  static setSetting(key: string, value: any): boolean {
    const settings = this.getSettings();
    const settingIndex = settings.findIndex(s => s.key === key);
    
    if (settingIndex !== -1) {
      settings[settingIndex].value = value;
      return this.saveSettings(settings);
    }
    
    return false;
  }

  static resetToDefaults(): boolean {
    return this.saveSettings([...this.defaultSettings]);
  }

  static getModulesPath(): string {
    const modulesPath = this.getSetting('paths.modules');
    return modulesPath || './smart_business_module';
  }

  static getDomainsPath(): string {
    const domainsPath = this.getSetting('paths.domains');
    return domainsPath || './data/domains';
  }

  static getDeploymentsPath(): string {
    const deploymentsPath = this.getSetting('paths.deployments');
    return deploymentsPath || './data/deployments';
  }

  static getBackupsPath(): string {
    const backupsPath = this.getSetting('paths.backups');
    return backupsPath || './data/backups';
  }
}

export default SettingsManager;
