import { api } from './api';
import type { ApiResponse, EntryType } from '../types';

export const aiService = {
  async toneCheck(draft: string, type?: EntryType): Promise<string> {
    const { data } = await api.post<ApiResponse<{ suggestion: string }>>('/ai/tone-check', { draft, type });
    return data.data.suggestion;
  },
};
