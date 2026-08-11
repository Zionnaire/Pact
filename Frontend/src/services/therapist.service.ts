import { api } from './api';
import type { ApiResponse, TherapistGrant, TherapistScope, PulseSummary } from '../types';

export const therapistService = {
  async grant(therapistEmail: string, scopes: TherapistScope[], expiresInDays = 90): Promise<{ grant: TherapistGrant; portalLink: string }> {
    const { data } = await api.post<ApiResponse<{ grant: TherapistGrant; portalLink: string }>>('/therapist/grants', {
      therapistEmail,
      scopes,
      expiresInDays,
    });
    return data.data;
  },

  async listGrants(): Promise<TherapistGrant[]> {
    const { data } = await api.get<ApiResponse<TherapistGrant[]>>('/therapist/grants');
    return data.data;
  },

  async revoke(id: string): Promise<void> {
    await api.delete(`/therapist/grants/${id}`);
  },

  /** Called from the therapist-facing portal screen using the magic-link token, not a partner session. */
  async getSummary(therapistToken: string): Promise<Partial<PulseSummary>> {
    const { data } = await api.get<ApiResponse<Partial<PulseSummary>>>('/therapist/summary', {
      headers: { Authorization: `Bearer ${therapistToken}` },
    });
    return data.data;
  },
};
