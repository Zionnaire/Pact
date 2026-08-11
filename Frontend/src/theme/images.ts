/**
 * theme/images.ts
 * Hotlinked photography for the few "key moment" screens where an
 * illustration/gradient reads as generic — Welcome and select empty states.
 * Everywhere else keeps the gradient/icon system. Sourced from Unsplash
 * (free to use, no attribution required, but credited here as good practice).
 * These are third-party URLs: no offline fallback, and they can change or
 * go down upstream. Swap the URL here if a photo ever needs replacing.
 */

export const IMAGES = {
  /** Welcome screen hero — Joen Patrick Caagbay, "Silhouette of hugging couple during golden hour" (Unsplash). */
  welcomeHero:
    'https://images.unsplash.com/photo-1559752809-ba9b6f20adeb?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  /** Journal/writing empty states — Kelly Sikkema, "A person writing on a notebook on a wooden table" (Unsplash). */
  journalWriting:
    'https://images.unsplash.com/photo-1642543492421-5a1f854e126c?fm=jpg&q=80&w=800&auto=format&fit=crop',
} as const;
