import { useAsync } from './useAsync';
import { notificationService } from '../services/notification.service';

export function useNotifications() {
  return useAsync(() => notificationService.list(), []);
}
