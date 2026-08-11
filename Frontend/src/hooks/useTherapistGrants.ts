import { useAsync } from './useAsync';
import { therapistService } from '../services/therapist.service';

export function useTherapistGrants() {
  return useAsync(() => therapistService.listGrants(), []);
}
