import { api } from './api';
import type { ApiResponse, EntryResponse, Resolution, ResolutionStatus } from '../types';

export const responseService = {
  async respond(entryId: string, body: string, reaction?: string): Promise<EntryResponse> {
    const { data } = await api.post<ApiResponse<EntryResponse>>(`/entries/${entryId}/responses`, { body, reaction });
    return data.data;
  },

  async setResolution(entryId: string, status: ResolutionStatus): Promise<Resolution> {
    const { data } = await api.patch<ApiResponse<Resolution>>(`/entries/${entryId}/resolution`, { status });
    return data.data;
  },
};
