/**
 * utils/responsive.ts
 * Pact is portrait-locked (app.json) but must still hold up across phone
 * widths from ~320px (old small Android) to ~430px (Pro Max) and tablets
 * (iOS supportsTablet: true, plus large Android tablets), which can exceed
 * 1000px. Rather than fixed px everywhere, screens read layout decisions
 * from here so one breakpoint change fixes every screen at once.
 */
import { useWindowDimensions } from 'react-native';

/** Below this, we're in phone layout; at/above, tablet layout kicks in. */
export const TABLET_BREAKPOINT = 600;

/** Content column cap on tablets — phone-shaped card widths, not edge-to-edge. */
export const MAX_CONTENT_WIDTH = 480;

/** iPhone SE width — the baseline every fixed design measurement was drawn against. */
const BASE_WIDTH = 375;

export interface Responsive {
  width: number;
  height: number;
  isTablet: boolean;
  /** Horizontal screen padding — wider gutter on tablets so content doesn't hug the frame. */
  gutter: number;
  /** Clamped scale factor for width-dependent sizing (decorative elements, etc). */
  scale: number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.85), isTablet ? 1.6 : 1.15);
  return { width, height, isTablet, gutter: isTablet ? 32 : 24, scale };
}

/** Moderate scaling for one-off numeric values (e.g. decorative blob size) — caps runaway growth on tablets. */
export function moderateScale(size: number, width: number, factor = 0.3): number {
  const raw = size * (width / BASE_WIDTH);
  return size + (raw - size) * factor;
}
