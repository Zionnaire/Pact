import { api } from './api';
import type { ApiResponse, Subscription } from '../types';

export const subscriptionService = {
  async get(): Promise<Subscription> {
    const { data } = await api.get<ApiResponse<Subscription>>('/subscriptions');
    return data.data;
  },

  async checkout(email: string): Promise<{ authorization_url: string; reference: string }> {
    const { data } = await api.post<ApiResponse<{ authorization_url: string; reference: string }>>(
      '/subscriptions/checkout',
      { email },
    );
    return data.data;
  },
};
