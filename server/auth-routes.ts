/**
 * Authentication API Routes for SMART-Admin Dashboard
 * Simple login system that tracks user actions
 */

import { Request, Response } from 'express';
import { SimpleAuth } from './auth';

const auth = new SimpleAuth();

export function setupAuthRoutes(app: any) {

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username and password required' 
        });
      }

      const result = await auth.login(username, password, req.ip);
      
      if (result.success && result.sessionId) {
        // Set session cookie
        res.cookie('sessionId', result.sessionId, {
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        });

        return res.json({
          success: true,
          user: result.user
        });
      } else {
        return res.status(401).json({
          success: false,
          error: result.error || 'Login failed'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during login'
      });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
      
      if (sessionId) {
        auth.logout(sessionId as string);
        res.clearCookie('sessionId');
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during logout'
      });
    }
  });

  // Check current session
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ 
          authenticated: false,
          error: 'No session found' 
        });
      }

      const validation = auth.validateSession(sessionId as string);
      
      if (validation.valid) {
        return res.json({
          authenticated: true,
          user: validation.user
        });
      } else {
        res.clearCookie('sessionId');
        return res.status(401).json({
          authenticated: false,
          error: 'Invalid or expired session'
        });
      }
    } catch (error) {
      console.error('Session validation error:', error);
      return res.status(500).json({
        authenticated: false,
        error: 'Server error during session validation'
      });
    }
  });

  // Admin-only: Create new user
  app.post('/api/auth/users', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid || validation.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { username, password, role } = req.body;
      
      if (!username || !password || !role) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username, password, and role required' 
        });
      }

      const result = auth.createUser(username, password, role);
      
      return res.json(result);
    } catch (error) {
      console.error('User creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during user creation'
      });
    }
  });

  // Admin-only: List all users
  app.get('/api/auth/users', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid || validation.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const users = auth.getUsers();
      const activeSessions = auth.getActiveSessions();
      
      return res.json({
        users,
        activeSessions: activeSessions.length
      });
    } catch (error) {
      console.error('Users list error:', error);
      return res.status(500).json({
        error: 'Server error retrieving users'
      });
    }
  });

  // Admin-only: Get active sessions
  app.get('/api/auth/sessions', async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
      
      if (!sessionId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const validation = auth.validateSession(sessionId as string);
      if (!validation.valid || validation.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const sessions = auth.getActiveSessions();
      
      return res.json({ sessions });
    } catch (error) {
      console.error('Sessions list error:', error);
      return res.status(500).json({
        error: 'Server error retrieving sessions'
      });
    }
  });

}