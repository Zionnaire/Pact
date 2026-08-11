/**
 * theme/tokens.ts
 * Raw hex values for the handful of places NativeWind classNames can't
 * reach (StatusBar, native SVG fills, chart libraries). tailwind.config.js
 * is still the source of truth — keep these two in sync by hand.
 */

export const colors = {
  brandPaper: '#F9F7F2',
  brandInk: '#1E1E1E',
  brandPlum: '#5B1F24',
  brandPlumDeep: '#3A1218',
  brandClay: '#C36341',
  brandGold: '#D4AF37',

  typeRant: '#E5989B',
  typeJoy: '#B5838D',
  typeNeed: '#E29578',
  typeNote: '#83C5BE',

  border: 'rgba(30,30,30,0.08)',
  borderOnDark: 'rgba(249,247,242,0.08)',
} as const;

export const entryTypeColor: Record<'rant' | 'appreciation' | 'request' | 'observation', string> = {
  rant: colors.typeRant,
  appreciation: colors.typeJoy,
  request: colors.typeNeed,
  observation: colors.typeNote,
};

export const entryTypeLabel: Record<'rant' | 'appreciation' | 'request' | 'observation', string> = {
  rant: 'Rant',
  appreciation: 'Appreciation',
  request: 'Request',
  observation: 'Observation',
};
