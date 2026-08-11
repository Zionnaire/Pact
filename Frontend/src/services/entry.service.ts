import { api } from './api';
import type { ApiResponse, Entry, EntryReaction, EntryType, DropMode, ReactionKind } from '../types';

export interface CreateEntryParams {
  type: EntryType;
  body: string;
  mood?: string;
  intensity: number;
  dropMode?: DropMode;
}

export interface CreateVoiceEntryParams {
  type: EntryType;
  mood?: string;
  intensity: number;
  dropMode?: DropMode;
  audioUri: string;
}

export const entryService = {
  async create(params: CreateEntryParams): Promise<Entry> {
    const { data } = await api.post<ApiResponse<Entry>>('/entries', params);
    return data.data;
  },

  async createVoice(params: CreateVoiceEntryParams): Promise<Entry> {
    const form = new FormData();
    form.append('type', params.type);
    form.append('intensity', String(params.intensity));
    if (params.mood) form.append('mood', params.mood);
    if (params.dropMode) form.append('dropMode', params.dropMode);
    form.append('audio', {
      uri: params.audioUri,
      name: 'voice-note.m4a',
      type: 'audio/mp4',
    } as unknown as Blob);

    const { data } = await api.post<ApiResponse<Entry>>('/entries/voice', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async update(id: string, params: Partial<CreateEntryParams>): Promise<Entry> {
    const { data } = await api.patch<ApiResponse<Entry>>(`/entries/${id}`, params);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/entries/${id}`);
  },

  async listMine(cycleId?: string, limit?: number): Promise<Entry[]> {
    const { data } = await api.get<ApiResponse<Entry[]>>('/entries/mine', { params: { cycleId, limit } });
    return data.data;
  },

  async setReaction(entryId: string, reaction: ReactionKind): Promise<EntryReaction> {
    const { data } = await api.patch<ApiResponse<EntryReaction>>(`/entries/${entryId}/reaction`, { reaction });
    return data.data;
  },
};
