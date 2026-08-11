/**
 * Source of truth for Pact's design tokens — mirrors Pact_Design_System.md.
 * Never hardcode hex values in components; reference these tokens instead.
 */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          paper: '#F9F7F2',
          ink: '#1E1E1E',
          plum: '#5B1F24',
          'plum-deep': '#3A1218',
          clay: '#C36341',
          gold: '#D4AF37',
        },
        type: {
          rant: '#E5989B',
          joy: '#B5838D',
          need: '#E29578',
          note: '#83C5BE',
        },
        background: '#F9F7F2',
        foreground: '#1E1E1E',
        card: '#ffffff',
        primary: '#5B1F24',
        secondary: '#F1EBE1',
        muted: '#F1EBE1',
        accent: '#D4AF37',
        border: 'rgba(30,30,30,0.08)',
      },
      fontFamily: {
        // Expo Google Fonts loads each weight as its own family name — RN
        // can't synthesize bold/semibold from a single regular-weight font
        // the way web/CSS can. `font-bold`/`font-semibold` utilities are
        // therefore cosmetic no-ops here; use these explicit weight tokens
        // (e.g. className="font-sans-semibold") wherever real weight matters.
        serif: ['Fraunces_600SemiBold'],
        'serif-bold': ['Fraunces_700Bold'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
