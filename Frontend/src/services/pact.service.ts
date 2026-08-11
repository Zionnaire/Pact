import { api } from './api';
import type { ApiResponse, Pact, Cycle, Invite, HomeSnapshot } from '../types';

export interface CreatePactParams {
  name?: string;
  cycleLengthDays?: number;
  revealDay?: number;
  revealTime?: string;
  timezone?: string;
  intentions?: string[];
}

export interface UpdatePactParams {
  name?: string;
  cycleLengthDays?: number;
  revealDay?: number;
  revealTime?: string;
  timezone?: string;
  cycleName?: string;
}

export const pactService = {
  async create(params: CreatePactParams): Promise<{ pact: Pact; cycle: Cycle }> {
    const { data } = await api.post<ApiResponse<{ pact: Pact; cycle: Cycle }>>('/pacts', params);
    return data.data;
  },

  async update(params: UpdatePactParams): Promise<{ pact: Pact; cycle: Cycle | null }> {
    const { data } = await api.patch<ApiResponse<{ pact: Pact; cycle: Cycle | null }>>('/pacts/me', params);
    return data.data;
  },

  async getMine(): Promise<Pact> {
    const { data } = await api.get<ApiResponse<Pact>>('/pacts/me');
    return data.data;
  },

  async getHomeSnapshot(): Promise<HomeSnapshot> {
    const { data } = await api.get<ApiResponse<HomeSnapshot>>('/home');
    return data.data;
  },

  async createInvite(channel: 'sms' | 'link', phone?: string): Promise<{ invite: Invite; inviteLink: string }> {
    const { data } = await api.post<ApiResponse<{ invite: Invite; inviteLink: string }>>('/pacts/invites', { channel, phone });
    return data.data;
  },

  async listInvites(): Promise<Invite[]> {
    const { data } = await api.get<ApiResponse<Invite[]>>('/pacts/invites');
    return data.data;
  },

  async cancelInvite(id: string): Promise<void> {
    await api.delete(`/pacts/invites/${id}`);
  },

  async acceptInvite(code: string): Promise<Pact> {
    const { data } = await api.post<ApiResponse<Pact>>(`/pacts/invites/${code}/accept`);
    return data.data;
  },

  async pause(): Promise<Pact> {
    const { data } = await api.patch<ApiResponse<Pact>>('/pacts/me/pause');
    return data.data;
  },

  async resume(): Promise<Pact> {
    const { data } = await api.patch<ApiResponse<Pact>>('/pacts/me/resume');
    return data.data;
  },
};
