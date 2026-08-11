import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { pactService } from '../services/pact.service';
import { useAuth } from './AuthContext';
import type { HomeSnapshot } from '../types';

interface PactContextValue {
  snapshot: HomeSnapshot | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
}

const PactContext = createContext<PactContextValue | undefined>(undefined);

export function PactProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.pactId) {
      setSnapshot(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await pactService.getHomeSnapshot();
      setSnapshot(data);
    } finally {
      setIsLoading(false);
    }
  }, [user?.pactId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pause = async () => {
    await pactService.pause();
    await refresh();
  };

  const resume = async () => {
    await pactService.resume();
    await refresh();
  };

  const value = useMemo<PactContextValue>(() => ({
    snapshot, isLoading, refresh, pause, resume,
  }), [snapshot, isLoading, refresh]);

  return <PactContext.Provider value={value}>{children}</PactContext.Provider>;
}

export function usePact(): PactContextValue {
  const ctx = useContext(PactContext);
  if (!ctx) throw new Error('usePact must be used within PactProvider');
  return ctx;
}
