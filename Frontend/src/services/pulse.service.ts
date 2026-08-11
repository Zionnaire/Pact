import { api } from './api';
import type { ApiResponse, PulseSummary } from '../types';

export const pulseService = {
  async get(): Promise<PulseSummary> {
    const { data } = await api.get<ApiResponse<PulseSummary>>('/pulse');
    return data.data;
  },
};
