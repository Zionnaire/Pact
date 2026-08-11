/**
 * scripts/generate-icons.js
 * Generates the app's icon set from an inline SVG — no external image
 * generation, just vector art rasterized with sharp. Run with:
 *   node scripts/generate-icons.js
 */
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');

const PLUM = '#5B1F24';
const PLUM_DEEP = '#3A1218';
const GOLD = '#D4AF37';
const PAPER = '#F9F7F2';

// Heart path in a 100x100 box, centered.
const HEART_PATH =
  'M50 88.5C50 88.5 8 62 8 32.5C8 16 20 6 34 6C42 6 48 11 50 16C52 11 58 6 66 6C80 6 92 16 92 32.5C92 62 50 88.5 50 88.5Z';

function heartSvg({ size, bg, heartColor, heartScale = 0.5, glow = false }) {
  const heartSize = size * heartScale;
  const offset = (size - heartSize) / 2;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  ${glow ? `
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${size / 2}" cy="${size * 0.42}" r="${size * 0.38}" fill="url(#glow)"/>
  ` : ''}
  <g transform="translate(${offset}, ${offset}) scale(${heartSize / 100})">
    <path d="${HEART_PATH}" fill="${heartColor}"/>
  </g>
</svg>`;
}

async function render(svg, size, outFile) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outFile);
  console.log(`wrote ${path.relative(process.cwd(), outFile)}`);
}

async function main() {
  // Main icon (iOS + generic) — full-bleed plum with a glowing gold heart.
  await render(
    heartSvg({ size: 1024, bg: PLUM, heartColor: GOLD, heartScale: 0.46, glow: true }),
    1024,
    path.join(ASSETS, 'icon.png'),
  );

  // Android adaptive icon foreground — transparent, heart kept within the
  // ~66% safe zone so it survives circle/squircle/square OS masks.
  await render(
    heartSvg({ size: 1024, bg: null, heartColor: GOLD, heartScale: 0.42 }),
    1024,
    path.join(ASSETS, 'android-icon-foreground.png'),
  );

  // Android adaptive icon background — flat plum-to-plum-deep gradient.
  const bgSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PLUM}"/>
      <stop offset="100%" stop-color="${PLUM_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`;
  await render(bgSvg, 1024, path.join(ASSETS, 'android-icon-background.png'));

  // Android 13+ monochrome/themed icon — single white silhouette, transparent bg.
  await render(
    heartSvg({ size: 1024, bg: null, heartColor: '#FFFFFF', heartScale: 0.42 }),
    1024,
    path.join(ASSETS, 'android-icon-monochrome.png'),
  );

  // Splash icon — same mark, transparent, sized down by app.json's imageWidth.
  await render(
    heartSvg({ size: 512, bg: null, heartColor: PLUM, heartScale: 0.7 }),
    512,
    path.join(ASSETS, 'splash-icon.png'),
  );

  // Web favicon.
  await render(
    heartSvg({ size: 196, bg: PAPER, heartColor: PLUM, heartScale: 0.6 }),
    196,
    path.join(ASSETS, 'favicon.png'),
  );

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
