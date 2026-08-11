import { useAsync } from './useAsync';
import { talkService } from '../services/talk.service';

export function useTalks() {
  return useAsync(() => talkService.list(), []);
}
