/**
 * Generate PWA app icons (192px & 512px PNG) from an inline SVG using sharp.
 * Run once with: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.resolve(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });

/* Indigo rounded-square badge with a white water droplet (the game's 🩸 motif). */
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#818cf8"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M256 96 C 256 96, 152 232, 152 312 a104 104 0 0 0 208 0 C 360 232, 256 96, 256 96 Z"
        fill="#ffffff"/>
  <circle cx="224" cy="300" r="26" fill="#c7d2fe"/>
</svg>
`;

async function build() {
  const buffer = Buffer.from(svg);
  await Promise.all([
    sharp(buffer).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png')),
    sharp(buffer).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png')),
  ]);
  console.log('Generated icon-192.png and icon-512.png in', outDir);
}

build().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
