import { api } from './api';
import type { ApiResponse, Talk } from '../types';

export const talkService = {
  async schedule(scheduledFor: string, agendaEntryIds: string[] = []): Promise<Talk> {
    const { data } = await api.post<ApiResponse<Talk>>('/talks', { scheduledFor, agendaEntryIds });
    return data.data;
  },

  async list(): Promise<Talk[]> {
    const { data } = await api.get<ApiResponse<Talk[]>>('/talks');
    return data.data;
  },
};
