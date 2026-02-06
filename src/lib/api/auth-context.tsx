// Pro Parenting App - Auth Context & Hooks
// React hooks for authentication state management

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  signUp as apiSignUp,
  signIn as apiSignIn,
  signOut as apiSignOut,
  getCurrentAuthUser,
  onAuthStateChange,
  resetPassword as apiResetPassword,
  updatePassword as apiUpdatePassword,
  updateProfile as apiUpdateProfile,
  isAuthenticated as checkIsAuthenticated,
  type AuthUser,
  type SignUpData,
  type SignInData,
} from './auth';
import { supabase, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { name?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentAuthUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((event, authUser) => {
      setUser(authUser);
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  // Presence heartbeat — updates last_seen_at every 60s while app is in foreground
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;

    const sendHeartbeat = async () => {
      try {
        await supabase
          .from('parents')
          .update({ last_seen_at: new Date().toISOString() } as never)
          .eq('id', user.id);
      } catch {
        // silently ignore heartbeat failures
      }
    };

    // Send immediately on mount / sign-in
    sendHeartbeat();

    // Then every 60 seconds
    const interval = setInterval(sendHeartbeat, 60_000);

    // Also send when app comes back to foreground
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') sendHeartbeat();
    };
    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [user]);

  const signUp = useCallback(async (data: SignUpData) => {
    setIsLoading(true);
    try {
      const result = await apiSignUp(data);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (data: SignInData) => {
    setIsLoading(true);
    try {
      const result = await apiSignIn(data);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return { success: result.success, error: result.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiSignOut();
      if (result.success) {
        setUser(null);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return apiResetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return apiUpdatePassword(newPassword);
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; email?: string }) => {
    const result = await apiUpdateProfile(updates);
    if (result.success) {
      // Refresh user data
      const currentUser = await getCurrentAuthUser();
      setUser(currentUser);
    }
    return result;
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentAuthUser();
    setUser(currentUser);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user is authenticated (without full context)
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get current user (without full context)
 */
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if user has admin role
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.role === 'superadmin';
}
