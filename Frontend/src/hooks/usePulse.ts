import { useAsync } from './useAsync';
import { pulseService } from '../services/pulse.service';

export function usePulse() {
  return useAsync(() => pulseService.get(), []);
}
