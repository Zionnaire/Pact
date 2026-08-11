import { api } from './api';
import { getDeviceInfo } from '../utils/device';
import type { ApiResponse, AppNotification } from '../types';

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    const { data } = await api.get<ApiResponse<AppNotification[]>>('/notifications');
    return data.data;
  },

  async markRead(id: string): Promise<AppNotification> {
    const { data } = await api.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`);
    return data.data;
  },

  async registerPushToken(expoPushToken: string): Promise<void> {
    const device = await getDeviceInfo();
    await api.post('/notifications/push-token', {
      expoPushToken,
      deviceId: device.deviceId,
      platform: device.platform,
    });
  },
};
