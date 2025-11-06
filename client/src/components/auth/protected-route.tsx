/**
 * Protected Route Component
 * Shows loading screen during auth check, login screen if not authenticated,
 * or the protected content if authenticated
 */

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { LoginScreen } from '@/components/auth/login-screen';
import { Loader2, Cpu } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Cpu className="h-8 w-8 text-blue-500 animate-pulse" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              SMART-Admin
            </span>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing system...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show protected content if authenticated
  return <>{children}</>;
};