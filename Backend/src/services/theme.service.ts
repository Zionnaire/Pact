/**
 * services/theme.service.ts
 * One cheap Groq LLM call per cycle archival to cluster recurring
 * themes from that cycle's entry text (Pact_System_Design.md §4). No-op if
 * AI isn't configured — themes simply stop accumulating, nothing breaks.
 */

import { Entry } from '../models/Entry.model';
import { Theme } from '../models/Theme.model';
import { getAiClient, aiEnabled } from '../configs/ai';
import { config } from '../configs/config';
import { classifyThemeSeverity } from '../utils/pulseScore';
import { logger } from '../utils/logger';

const THEME_PROMPT = `You extract recurring emotional/relationship themes from journal entries.
Read the entries below and return ONLY a JSON array of short theme names (2-4 words each,
e.g. "Feeling unheard", "Chore imbalance"), one per distinct theme you notice. Max 5 themes.
No prose, no markdown, just the JSON array.`;

export async function extractThemesForCycle(pactId: string, cycleId: string): Promise<void> {
  if (!aiEnabled) return;

  const entries = await Entry.find({ cycleId }).select('body transcript');
  const texts = entries.map((e) => e.body || e.transcript).filter(Boolean);
  if (texts.length === 0) return;

  try {
    const client = getAiClient();
    const completion = await client.chat.completions.create({
      model: config.ai.model,
      max_tokens: 300,
      messages: [{ role: 'user', content: `${THEME_PROMPT}\n\nEntries:\n${texts.join('\n---\n')}` }],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return;

    // Llama models sometimes wrap JSON in a ```json fence despite instructions — strip it before parsing.
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const names: string[] = JSON.parse(jsonText);

    for (const name of names) {
      const theme = await Theme.findOneAndUpdate(
        { pactId, name },
        { $inc: { mentionCount: 1 }, $set: { lastSeenAt: new Date() } },
        { upsert: true, new: true },
      );
      theme.severity = classifyThemeSeverity(theme.mentionCount);
      await theme.save();
    }
  } catch (err) {
    logger.error(`Theme extraction failed for cycle ${cycleId}:`, err);
  }
}
