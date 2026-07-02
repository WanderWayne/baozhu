#!/usr/bin/env node
/**
 * Capture mini + H5 screenshots, side-by-side + pixel diff.
 * Usage: node compare-parity.cjs game 101
 *        node compare-parity.cjs levels
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const Jimp = require('jimp');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

const { getMiniViewport } = require('./get-mini-viewport.cjs');

const toolsDir = __dirname;
const outDir = path.join(toolsDir, 'screenshots');
let VIEWPORT = { w: 390, h: 844 };

const mode = process.argv[2] || 'game';
const levelId = process.argv[3] || '101';

function runNode(script, args = [], extraEnv = {}) {
  const r = spawnSync(process.execPath, [path.join(toolsDir, script), ...args], {
    cwd: toolsDir,
    encoding: 'utf8',
    timeout: 120000,
    env: { ...process.env, ...extraEnv },
  });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0) {
    throw new Error(`${script} exited ${r.status}`);
  }
}

function toPngBitmap(jimpImage) {
  const png = new PNG({ width: jimpImage.bitmap.width, height: jimpImage.bitmap.height });
  png.data = Buffer.from(jimpImage.bitmap.data);
  return png;
}

function fromPngBitmap(png) {
  return new Jimp({ width: png.width, height: png.height, data: Buffer.from(png.data) });
}

async function resizeToViewport(imgPath) {
  const img = await Jimp.read(imgPath);
  img.cover(VIEWPORT.w, VIEWPORT.h, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_TOP);
  return img;
}

async function comparePair(miniPath, h5Path, baseName) {
  const mini = await resizeToViewport(miniPath);
  const h5 = await resizeToViewport(h5Path);

  const side = new Jimp(VIEWPORT.w * 2, VIEWPORT.h, 0xffffffff);
  side.composite(h5, 0, 0);
  side.composite(mini, VIEWPORT.w, 0);

  const comparePath = path.join(outDir, `${baseName}-compare.png`);
  await side.writeAsync(comparePath);

  const pngA = toPngBitmap(h5);
  const pngB = toPngBitmap(mini);
  const diffPng = new PNG({ width: VIEWPORT.w, height: VIEWPORT.h });
  const diffPixels = pixelmatch(pngA.data, pngB.data, diffPng.data, VIEWPORT.w, VIEWPORT.h, {
    threshold: 0.12,
    includeAA: true,
  });
  const diffPct = ((diffPixels / (VIEWPORT.w * VIEWPORT.h)) * 100).toFixed(2);
  const diffPath = path.join(outDir, `${baseName}-diff.png`);
  fs.writeFileSync(diffPath, PNG.sync.write(diffPng));

  return { comparePath, diffPath, diffPct, diffPixels };
}

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let miniPath;
  let h5Path;
  let baseName;

  if (mode === 'levels') {
    baseName = 'levels';
    miniPath = path.join(outDir, 'levels-mini.png');
    h5Path = path.join(outDir, 'levels-h5.png');
    console.log('=== Capture mini: levels ===');
    runNode('capture-levels.cjs');
    console.log('=== Capture H5: levels ===');
    runNode('capture-levels-h5.cjs');
  } else if (mode === 'game') {
    VIEWPORT = await getMiniViewport();
    console.log(`viewport: ${VIEWPORT.w}x${VIEWPORT.h} (from mini windowHeight)`);
    baseName = `game-${levelId}`;
    miniPath = path.join(outDir, `${baseName}-mini.png`);
    h5Path = path.join(outDir, `${baseName}-h5.png`);
    console.log(`=== Capture mini: game ${levelId} ===`);
    runNode('capture-game.cjs', [levelId]);
    miniPath = path.join(outDir, `game-${levelId}-mini.png`);
    console.log(`=== Capture H5: game ${levelId} ===`);
    runNode('capture-game-h5.cjs', [levelId], {
      VIEWPORT_W: String(VIEWPORT.w),
      VIEWPORT_H: String(VIEWPORT.h),
    });
    h5Path = path.join(outDir, `game-${levelId}-h5.png`);
  } else {
    throw new Error(`Unknown mode: ${mode}. Use game|levels`);
  }

  if (!fs.existsSync(miniPath) || !fs.existsSync(h5Path)) {
    throw new Error(`Missing screenshots:\n  mini: ${miniPath}\n  h5:   ${h5Path}`);
  }

  console.log('=== Compare ===');
  const result = await comparePair(miniPath, h5Path, baseName);
  console.log(`compare: ${result.comparePath}`);
  console.log(`diff:    ${result.diffPath}`);
  console.log(`diffPixels: ${result.diffPixels} (${result.diffPct}% of viewport)`);
  console.log('PASS threshold: <12% (emoji/SVG tolerance); iterate UI until below.');
})().catch((err) => {
  console.error('COMPARE_FAILED:', err.message || err);
  process.exit(1);
});
