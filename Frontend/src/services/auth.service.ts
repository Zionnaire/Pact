import { api } from './api';
import { tokenStorage } from '../utils/storage';
import { getDeviceInfo } from '../utils/device';
import type { ApiResponse, AuthTokens, User, Pact } from '../types';

interface AuthResult extends AuthTokens {
  user: User;
}

export const authService = {
  async register(params: { displayName: string; email?: string; phone?: string; password: string }): Promise<User> {
    const device = await getDeviceInfo();
    const { data } = await api.post<ApiResponse<AuthResult>>('/auth/register', { ...params, ...device });
    await tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.user;
  },

  async login(identifier: string, password: string): Promise<User> {
    const device = await getDeviceInfo();
    const { data } = await api.post<ApiResponse<AuthResult>>('/auth/login', { identifier, password, ...device });
    await tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.user;
  },

  async logout(): Promise<void> {
    const device = await getDeviceInfo();
    try {
      await api.post('/auth/logout', { deviceId: device.deviceId });
    } finally {
      await tokenStorage.clear();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } finally {
      await tokenStorage.clear();
    }
  },

  async me(): Promise<{ user: User; pact: Pact | null }> {
    const { data } = await api.get<ApiResponse<{ user: User; pact: Pact | null }>>('/auth/me');
    return data.data;
  },

  async updateProfile(params: { displayName?: string; bio?: string }): Promise<User> {
    const { data } = await api.patch<ApiResponse<User>>('/auth/me', params);
    return data.data;
  },

  async uploadAvatar(fileUri: string): Promise<User> {
    const form = new FormData();
    form.append('avatar', {
      uri: fileUri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const { data } = await api.post<ApiResponse<User>>('/auth/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async deleteAccount(password: string): Promise<void> {
    await api.delete('/auth/me', { data: { password } });
    await tokenStorage.clear();
  },

  async exportData(): Promise<{ exportedAt: string; entryCount: number; entries: unknown[] }> {
    const { data } = await api.get<ApiResponse<{ exportedAt: string; entryCount: number; entries: unknown[] }>>('/entries/export');
    return data.data;
  },
};
