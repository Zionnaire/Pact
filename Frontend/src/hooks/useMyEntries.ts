import { useAsync } from './useAsync';
import { entryService } from '../services/entry.service';

export function useMyEntries(cycleId?: string) {
  return useAsync(() => entryService.listMine(cycleId), [cycleId]);
}
