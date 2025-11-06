/**
 * Simple Authentication System for SMART-Admin Dashboard
 * Phase 1: Basic login tracking for activity attribution
 * Phase 2: Will integrate with SMART-ID People system (STF-xxxxx, etc.)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'technician' | 'viewer';
  smartId?: string; // Future: STF-xxxxx, CTR-xxxxx, VIS-xxxxx
  createdAt: string;
  lastLogin?: string;
}

interface Session {
  sessionId: string;
  userId: string;
  username: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
}

export class SimpleAuth {
  private usersFile = './data/users.json';
  private sessionsFile = './data/sessions.json';
  private users: User[] = [];
  private sessions: Map<string, Session> = new Map();

  constructor() {
    this.ensureDataDirectory();
    this.loadUsers();
    this.loadSessions();
    this.createDefaultAdmin();
  }

  private ensureDataDirectory() {
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadUsers() {
    try {
      if (fs.existsSync(this.usersFile)) {
        const data = fs.readFileSync(this.usersFile, 'utf8');
        this.users = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  private loadSessions() {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf8');
        const sessionArray = JSON.parse(data);
        this.sessions = new Map(sessionArray.map((s: Session) => [s.sessionId, s]));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.sessions = new Map();
    }
  }

  private saveSessions() {
    try {
      const sessionArray = Array.from(this.sessions.values());
      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionArray, null, 2));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  private createDefaultAdmin() {
    if (this.users.length === 0) {
      const defaultUser: User = {
        id: 'usr_admin_' + Date.now(),
        username: 'admin',
        passwordHash: this.hashPassword('admin123'), // Default password
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      this.users.push(defaultUser);
      this.saveUsers();
      console.log('🔐 Created default admin user (username: admin, password: admin123)');
    }
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public async login(username: string, password: string, ipAddress?: string): Promise<{ success: boolean; sessionId?: string; user?: any; error?: string }> {
    try {
      const user = this.users.find(u => u.username === username);
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      const passwordHash = this.hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Create session
      const sessionId = this.generateSessionId();
      const session: Session = {
        sessionId,
        userId: user.id,
        username: user.username,
        role: user.role,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        ipAddress
      };

      this.sessions.set(sessionId, session);
      this.saveSessions();

      // Update last login
      user.lastLogin = new Date().toISOString();
      this.saveUsers();

      return {
        success: true,
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          smartId: user.smartId
        }
      };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  public logout(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      this.saveSessions();
      return true;
    }
    return false;
  }

  public validateSession(sessionId: string): { valid: boolean; user?: any } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false };
    }

    // Check if session expired
    if (new Date() > new Date(session.expiresAt)) {
      this.sessions.delete(sessionId);
      this.saveSessions();
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        id: session.userId,
        username: session.username,
        role: session.role
      }
    };
  }

  public createUser(username: string, password: string, role: 'admin' | 'technician' | 'viewer'): { success: boolean; error?: string; user?: any } {
    try {
      // Check if username already exists
      if (this.users.find(u => u.username === username)) {
        return { success: false, error: 'Username already exists' };
      }

      const user: User = {
        id: 'usr_' + Date.now(),
        username,
        passwordHash: this.hashPassword(password),
        role,
        createdAt: new Date().toISOString()
      };

      this.users.push(user);
      this.saveUsers();

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to create user' };
    }
  }

  public getUsers(): any[] {
    return this.users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      smartId: user.smartId,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));
  }

  public getActiveSessions(): Session[] {
    const now = new Date();
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => new Date(session.expiresAt) > now);
    
    // Clean up expired sessions
    const expiredSessions: string[] = [];
    this.sessions.forEach((session, sessionId) => {
      if (new Date(session.expiresAt) <= now) {
        expiredSessions.push(sessionId);
      }
    });
    expiredSessions.forEach(sessionId => this.sessions.delete(sessionId));
    this.saveSessions();

    return activeSessions;
  }
}

// Global auth instance
export const auth = new SimpleAuth();

// Middleware function for Express routes
export function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'No session provided' });
  }

  const validation = auth.validateSession(sessionId);
  if (!validation.valid) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // Add user info to request
  req.user = validation.user;
  next();
}

// Optional middleware - just adds user info if session exists
export function optionalAuth(req: any, res: any, next: any) {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  
  if (sessionId) {
    const validation = auth.validateSession(sessionId);
    if (validation.valid) {
      req.user = validation.user;
    }
  }
  
  next();
}