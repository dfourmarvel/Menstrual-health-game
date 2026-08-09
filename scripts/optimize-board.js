// optimize-board.js
// Uses sharp (a devDependency) to generate responsive board variants:
// 600w and 1200w, each as WebP (small, primary) and PNG (fallback).
// Run from the project root: node scripts/optimize-board.js

const sharp = require('sharp');
const path = require('path');

// Resolve paths relative to the project root (the cwd when we run the script).
const src = path.resolve('assets', 'images', 'menstrual-maze-board.png');
const base = path.resolve('assets', 'images', 'menstrual-maze-board');

const variants = [
  { width: 600, format: 'webp', opts: { quality: 82 } },
  { width: 1200, format: 'webp', opts: { quality: 82 } },
  { width: 600, format: 'png', opts: { quality: 90 } },
  { width: 1200, format: 'png', opts: { quality: 90 } },
];

(async () => {
  try {
    for (const v of variants) {
      const out = `${base}-${v.width}.${v.format}`;
      await sharp(src).resize({ width: v.width })[v.format](v.opts).toFile(out);
      console.log('✅ Created', out);
    }
  } catch (err) {
    console.error('❌ Optimization error:', err);
    process.exit(1);
  }
})();
