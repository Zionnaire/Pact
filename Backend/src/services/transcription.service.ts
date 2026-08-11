/**
 * services/transcription.service.ts
 * Fire-and-forget best-effort transcription of a voice entry. Never throws
 * to the caller — a failed or disabled transcription must never block or
 * break playback of the underlying audio (Pact_System_Design.md invariant 7).
 */

import axios from 'axios';
import { toFile } from 'openai';
import { Entry } from '../models/Entry.model';
import { getTranscriptionClient, transcriptionEnabled, transcriptionModel } from '../configs/transcription';
import { logger } from '../utils/logger';

export async function transcribeEntryAudio(entryId: string): Promise<void> {
  const entry = await Entry.findById(entryId);
  if (!entry || !entry.audioUrl) return;

  if (!transcriptionEnabled) {
    entry.transcriptStatus = 'none';
    await entry.save();
    return;
  }

  entry.transcriptStatus = 'pending';
  await entry.save();

  try {
    const { data } = await axios.get<ArrayBuffer>(entry.audioUrl, { responseType: 'arraybuffer' });
    const file = await toFile(Buffer.from(data), 'voice-note.mp4');

    const result = await getTranscriptionClient().audio.transcriptions.create({
      file,
      model: transcriptionModel,
    });

    entry.transcript = result.text;
    entry.transcriptStatus = 'done';
    await entry.save();
  } catch (err) {
    logger.error(`Transcription failed for entry ${entryId}:`, err);
    entry.transcriptStatus = 'failed';
    await entry.save();
  }
}
