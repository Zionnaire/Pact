import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth.service';
import { pactService } from '../services/pact.service';
import { registerAuthFailureHandler } from '../services/api';
import { tokenStorage } from '../utils/storage';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (params: { displayName: string; email?: string; phone?: string; password: string }) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  /** No account required beforehand — creates a minimal one and pairs in a single step. */
  quickJoin: (code: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (params: { displayName?: string; bio?: string }) => Promise<void>;
  completeProfile: (params: { email?: string; phone?: string; password: string }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  leavePact: () => Promise<void>;
  setAvatarUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const { user: fetchedUser } = await authService.me();
      setUser(fetchedUser);
    } catch {
      await tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    registerAuthFailureHandler(() => setUser(null));
    hydrate();
  }, [hydrate]);

  const register: AuthContextValue['register'] = async (params) => {
    const newUser = await authService.register(params);
    setUser(newUser);
  };

  const login: AuthContextValue['login'] = async (identifier, password) => {
    const loggedInUser = await authService.login(identifier, password);
    setUser(loggedInUser);
  };

  const quickJoin: AuthContextValue['quickJoin'] = async (code, displayName) => {
    const joinedUser = await pactService.quickJoin(code, displayName);
    setUser(joinedUser);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const logoutAll = async () => {
    await authService.logoutAll();
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const { user: fetchedUser } = await authService.me();
    setUser(fetchedUser);
  }, []);

  const updateProfile: AuthContextValue['updateProfile'] = async (params) => {
    const updated = await authService.updateProfile(params);
    setUser(updated);
  };

  const completeProfile: AuthContextValue['completeProfile'] = async (params) => {
    const updated = await authService.completeProfile(params);
    setUser(updated);
  };

  const deleteAccount = async (password: string) => {
    await authService.deleteAccount(password);
    setUser(null);
  };

  const leavePact = async () => {
    await pactService.leave();
    await refreshUser();
  };

  const setAvatarUrl = (url: string) => {
    setUser((current) => (current ? { ...current, avatarUrl: url } : current));
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    register,
    login,
    quickJoin,
    logout,
    logoutAll,
    refreshUser,
    updateProfile,
    completeProfile,
    deleteAccount,
    leavePact,
    setAvatarUrl,
  }), [user, isLoading, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
