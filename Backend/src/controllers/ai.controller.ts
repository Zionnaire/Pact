import { Request, Response } from 'express';
import { AiUsage } from '../models/AiUsage.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getAiClient, aiEnabled } from '../configs/ai';
import { config } from '../configs/config';

const TONE_CHECK_PROMPT = `You help a partner soften a draft journal entry for their relationship-accountability app
before it's sealed and later revealed to their partner. Keep their meaning and honesty completely intact —
only suggest a rewrite that is less likely to land as an attack, while staying true to what they're feeling.
Return ONLY the rewritten draft text, nothing else.`;

async function checkAndIncrementDailyUsage(userId: string): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const usage = await AiUsage.findOneAndUpdate(
    { userId, date },
    { $setOnInsert: { count: 0 } },
    { upsert: true, new: true },
  );

  if (usage.count >= config.ai.toneCheckDailyLimit) {
    throw ApiError.tooMany('You have reached today\'s AI tone-check limit');
  }

  usage.count += 1;
  await usage.save();
}

export const toneCheck = asyncHandler(async (req: Request, res: Response) => {
  if (!aiEnabled) {
    throw ApiError.notImplemented('Tone-check is not configured on this server yet');
  }

  await checkAndIncrementDailyUsage(req.user!._id.toString());

  const { draft, type } = req.body;

  const client = getAiClient();
  const completion = await client.chat.completions.create({
    model: config.ai.model,
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `${TONE_CHECK_PROMPT}\n\nEntry type: ${type || 'unspecified'}\n\nDraft:\n${draft}`,
    }],
  });

  const suggestion = completion.choices[0]?.message?.content?.trim() || draft;

  // Draft is never persisted — this is a pure request/response transform.
  res.json(new ApiResponse(200, 'Tone check complete', { suggestion }));
});
