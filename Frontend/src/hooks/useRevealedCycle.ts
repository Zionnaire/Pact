import { useAsync } from './useAsync';
import { revealService } from '../services/reveal.service';

export function useRevealedCycle(cycleId: string | undefined) {
  return useAsync(() => {
    if (!cycleId) return Promise.resolve(null);
    return revealService.getRevealed(cycleId);
  }, [cycleId]);
}
