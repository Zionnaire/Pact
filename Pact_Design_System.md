# Pact — Design System Spec

Direction: **Heritage minimalist** — warm paper, deep plum, clay accents. Editorial, unhurried, intentional. No gradients-on-white, no default sans stack.

**Platform:** Expo (React Native) via **NativeWind** — Tailwind-syntax utility classes that compile to native styles, so this token language survives the move from a web build almost unchanged. Source of truth is `tailwind.config.ts` (`theme.extend`), not a CSS file — RN has no stylesheet cascade. See §7 for what doesn't carry over 1:1 from a web implementation.

---

## 1. Color tokens

Defined in `tailwind.config.ts` → `theme.extend.colors`. Never hardcode hex in components.

### Brand
| Token | Value | Use |
|---|---|---|
| `brand-paper` | `#F9F7F2` | App background |
| `brand-ink` | `#1E1E1E` | Body text (opacity ramps for hierarchy) |
| `brand-plum` | `#5B1F24` | Primary surfaces, CTAs, active nav |
| `brand-plum-deep` | `#3A1218` | Reveal ceremony backdrop |
| `brand-clay` | `#C36341` | Secondary accent, eyebrow labels |
| `brand-gold` | `#D4AF37` | Stats, ceremonial highlights |

### Entry type accents
| Type | Token | Value |
|---|---|---|
| Rant | `type-rant` | `#E5989B` |
| Appreciation | `type-joy` | `#B5838D` |
| Request | `type-need` | `#E29578` |
| Observation | `type-note` | `#83C5BE` |

### Semantic — light
`background #F9F7F2` · `foreground #1E1E1E` · `card #ffffff` · `primary #5B1F24` · `secondary/muted #F1EBE1` · `accent #D4AF37` · `border rgba(30,30,30,.08)` · `radius 1rem`

### Semantic — dark (Reveal / night)
`background #14090B` · `card #22131A` · `primary #D4AF37` · `foreground #F9F7F2` · `border rgba(249,247,242,.08)`

Driven by `useColorScheme()` + NativeWind's `dark:` variant. Text hierarchy uses ink at 100 / 70 / 50 / 40 / 30% rather than extra gray tokens.

## 2. Typography

| Role | Font | Spec |
|---|---|---|
| Display / numerals | Fraunces (`font-serif`) | 2–6rem equiv., tight leading, plum or gold |
| Section heading | Fraunces | 1.125rem |
| Body / UI | Inter (`font-sans`) | 0.875rem, 400–600 |
| Eyebrow label | Inter | 10px, bold, uppercase, `tracking-[0.3em]`, clay |
| Meta / caption | Inter | 10–11px, ink/40–50 |
| Numerics | tabular figures everywhere | `Inter` supports `font-variant-numeric` via a tabular-nums weight; on RN, use the pre-built tabular cut (`Inter-Tabular` if bundled) rather than a CSS feature setting, which RN's text renderer doesn't support |

Serif is reserved for emotional or ceremonial moments (scores, cycle names, reveal copy). Sans carries all functional UI. Both families are loaded via `expo-font` / `@expo-google-fonts/*` at app boot behind a splash screen (`expo-splash-screen`) — unlike web, fonts are not "free" until the bundle loads them.

## 3. Spacing, shape, elevation

- Page gutter `mx-6` (24px); section rhythm `mb-8`; card padding `p-4`–`p-6`.
- Radii: cards `rounded-2xl` (1rem), hero/plum panels `rounded-3xl`, pills `rounded-full`.
- Elevation is expressed as hairline rings (`ring-1 ring-brand-ink/5`) on white cards, not shadows, wherever NativeWind's `ring` utility is available; where it isn't, substitute a 1px `border-brand-ink/5`. Real shadows are reserved for the floating drop FAB and any elevated sheet — implemented per-platform (`shadow-*` classes on iOS, `elevation-*` on Android; NativeWind maps both from one class, but verify visually on both).
- Dividers: `divide-brand-ink/5` where supported, otherwise an explicit border on each row.
- **Safe areas are mandatory, not optional.** Every top-level screen wraps content in `react-native-safe-area-context`'s `SafeAreaView`/`useSafeAreaInsets` — notches, status bars, and home indicators are real constraints a web build never had to account for.

## 4. Component inventory

| Component | Notes |
|---|---|
| `TopBar` | Title + back + menu |
| `BottomNav` | 4 tabs + raised plum FAB for `/drop` (Expo Router tab navigator with a custom center button); active = plum, inactive = 40% ink |
| Cycle card | Plum panel, gold radial bloom, countdown + sealed counts |
| Entry card | White, hairline ring, type dot in accent color, mood + intensity meta. Voice entries additionally show a waveform/scrubber and duration |
| Type selector | 2×2 chip grid tinted by the four entry accents |
| Intensity meter | 5-step segmented bar, plum fill |
| Consent lock | Dual avatar state, unlocks only when both are lit |
| Stat tile | Uppercase micro-label + serif numeral |
| Progress bar | 6px track at ink/5, plum fill |
| Distribution bar | Single 12px stacked bar in the four type colors |
| Sheet / list row | Icon chip in `brand-plum/5`, label + description, chevron |
| Voice recorder | Hold-to-record FAB state, live waveform, plum record ring, auto-stop at a sane max length — **new**, backs the `Entry.audioUrl` field |
| Skeleton loader | Shimmer block matching each card's shape, ink/5 base — **new**, previously only described as "an in-screen variant" with no spec |

`MobileFrame` (the 440px desktop-phone-shell wrapper) is retired from the product itself — the product *is* the phone now. It's kept only if a marketing/waitlist website is built later to showcase the app.

## 5. Motion

- Reveal ceremony: staggered card entrance (~90ms apart), slow gold fade-in, 600–900ms easing, built with `react-native-reanimated`.
- Taps: subtle press-scale (≈0.95) on primary actions only, via `Pressable` + reanimated, paired with a light `expo-haptics` impact — haptics are a native affordance a web build couldn't offer, and this app's ceremonial moments (consent lock, reveal, resolution) are exactly where they earn their keep.
- Transitions default to color/opacity crossfades at 150–200ms; nothing bounces.
- Respect reduced motion via `AccessibilityInfo.isReduceMotionEnabled()` (RN's equivalent of `prefers-reduced-motion`): drop stagger and fades, keep state changes, skip non-essential haptics too.

## 6. Accessibility

- Touch targets minimum 44×44pt (`min-h-11 min-w-11` equivalent), enforced with `hitSlop` where visual size must stay smaller.
- Plum on paper ≈ 11:1 contrast; never place clay or gold text on white below 14px semibold.
- Type accents are always paired with a text label — color is never the sole signal.
- Every interactive element gets `accessibilityLabel` + `accessibilityRole` (RN's equivalent of `aria-label`); ceremony content fires an `AccessibilityInfo.announceForAccessibility` call, not just an animation.
- Test with VoiceOver (iOS) and TalkBack (Android) each release — there is no browser dev-tools accessibility tree to lean on here.

## 7. What changed from the original draft, and why

- **CSS custom properties → `tailwind.config.ts`.** React Native has no cascading stylesheet, so `@theme` in `src/styles.css` isn't a valid source of truth on this platform. NativeWind was chosen specifically because it lets every existing utility-class name in this doc keep working almost unchanged.
- **`MobileFrame` retired from the app.** It existed to simulate a phone inside a browser tab. Once the product ships as an actual installed app, the frame is the OS, not a component.
- **Fonts, safe areas, haptics, and a splash/app-icon spec added.** These aren't stylistic additions — they're things a native app cannot skip that a Lovable web preview never had to solve (font loading is asynchronous and blocking, screens render under notches/home indicators, there's no favicon but there is a required app icon set).
- **Voice recorder + waveform component added.** The backend already supports audio entries (Cloudinary + transcription pipeline); the design system had no corresponding component until now.
- **Skeleton loader given an explicit spec.** The original doc mentioned loading states only in passing ("handled as in-screen variants") without saying what they look like.
