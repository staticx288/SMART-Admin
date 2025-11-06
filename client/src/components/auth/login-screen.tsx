/**
 * Login Screen for SMART-Admin Dashboard
 * Simple authentication interface with SMART branding
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Cpu } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const result = await login(username, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      // If successful, the auth context will update and redirect automatically
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* SMART Branding Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-2xl font-bold">
            <Cpu className="h-8 w-8 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              SMART-Admin
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Distributed Manufacturing Control System
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle className="text-xl">Access Control</CardTitle>
            </div>
            <CardDescription>
              Authenticate to manage your SMART infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn || !username || !password}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>

            {/* Default Credentials Helper (remove in production) */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Development Access:</strong> admin / admin123
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Status Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>SMART Business Ecosystem v2.0</p>
          <p>Revolutionary Distributed Manufacturing Platform</p>
        </div>
      </div>
    </div>
  );
};