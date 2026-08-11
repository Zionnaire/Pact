import { api } from './api';
import type { ApiResponse, Cycle, RevealedEntry } from '../types';

export const revealService = {
  async toggleConsent(cycleId: string, consent: boolean): Promise<{ consented: boolean; bothConsented: boolean }> {
    const { data } = await api.post<ApiResponse<{ consented: boolean; bothConsented: boolean }>>(
      `/cycles/${cycleId}/consent`,
      { consent },
    );
    return data.data;
  },

  async reveal(cycleId: string): Promise<Cycle> {
    const { data } = await api.post<ApiResponse<Cycle>>(`/cycles/${cycleId}/reveal`);
    return data.data;
  },

  async requestDelay(cycleId: string): Promise<Cycle> {
    const { data } = await api.post<ApiResponse<Cycle>>(`/cycles/${cycleId}/delay`);
    return data.data;
  },

  async getRevealed(cycleId: string): Promise<{ cycle: Cycle; entries: RevealedEntry[] }> {
    const { data } = await api.get<ApiResponse<{ cycle: Cycle; entries: RevealedEntry[] }>>(`/cycles/${cycleId}/revealed`);
    return data.data;
  },
};
