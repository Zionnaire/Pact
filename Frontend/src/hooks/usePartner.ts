import { useMemo } from 'react';
import { usePact } from '../contexts/PactContext';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

/** The other partner in the pact, or null if unpaired/still populating. */
export function usePartner(): User | null {
  const { snapshot } = usePact();
  const { user } = useAuth();

  return useMemo(() => {
    const partners = snapshot?.pact.partners;
    if (!Array.isArray(partners)) return null;
    const found = (partners as User[]).find((p) => typeof p === 'object' && p.id !== user?.id);
    return (found as User) ?? null;
  }, [snapshot, user]);
}
