// optimize-board.js
// This script uses sharp (installed as a devDependency) to create an optimized WebP
// version of the game board and a 600px PNG fallback for srcset.

const sharp = require('sharp');
const path = require('path');

// Resolve paths relative to the project root (the cwd when we run the script).
const src = path.resolve('assets', 'images', 'menstrual-maze-board.png');
const outWebp = path.resolve('assets', 'images', 'menstrual-maze-board.webp');
const out600 = path.resolve('assets', 'images', 'menstrual-maze-board-600.png');

(async () => {
  try {
    // 1200px wide WebP (quality 85)
    await sharp(src)
      .resize({ width: 1200 })
      .webp({ quality: 85 })
      .toFile(outWebp);
    console.log('✅ Created WebP:', outWebp);

    // 600px fallback PNG
    await sharp(src)
      .resize({ width: 600 })
      .png({ quality: 90 })
      .toFile(out600);
    console.log('✅ Created 600px PNG fallback:', out600);
  } catch (err) {
    console.error('❌ Optimization error:', err);
    process.exit(1);
  }
})();
