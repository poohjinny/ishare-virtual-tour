/**
 * Convert selected JPG assets to WebP (lossy).
 * Uses the same max width + quality as Dev Panel upload
 * (`scripts/lib/panoramaEncode.mjs`).
 *
 * Usage: node scripts/convert-jpg-to-webp.mjs <relative-path-from-assets> [...]
 * Example: node scripts/convert-jpg-to-webp.mjs gphospitalfoundation/ken-sargent-house/panoramas/overview.jpg
 *
 * Env: WEBP_QUALITY / PANORAMA_WEBP_QUALITY, WEBP_MAX_WIDTH / PANORAMA_MAX_WIDTH
 */
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  encodePanoramaWebp,
  PANORAMA_MAX_WIDTH,
  PANORAMA_WEBP_QUALITY,
} from './lib/panoramaEncode.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(root, 'assets');

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error(
    'Usage: node scripts/convert-jpg-to-webp.mjs <path-under-assets> [...]',
  );
  process.exit(1);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const results = [];

for (const relative of inputs) {
  const input = join(assetsRoot, relative.replace(/^\//, ''));
  const output = input.replace(/\.jpe?g$/i, '.webp');
  const before = statSync(input).size;

  await encodePanoramaWebp(input, output);

  const after = statSync(output).size;
  const saved = before - after;
  const pct = ((saved / before) * 100).toFixed(1);

  results.push({
    file: relative.replace(/\\/g, '/'),
    before,
    after,
    saved,
    pct,
  });
}

console.log(
  `WebP quality: ${PANORAMA_WEBP_QUALITY}, maxWidth: ${PANORAMA_MAX_WIDTH}\n`,
);
console.log('file\tbefore\tafter\tsaved\t%');
for (const row of results) {
  console.log(
    `${row.file}\t${formatBytes(row.before)}\t${formatBytes(row.after)}\t${formatBytes(row.saved)}\t-${row.pct}%`,
  );
}

const totalBefore = results.reduce((sum, row) => sum + row.before, 0);
const totalAfter = results.reduce((sum, row) => sum + row.after, 0);
const totalSaved = totalBefore - totalAfter;
console.log(
  `\nTotal: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (${formatBytes(totalSaved)} saved, -${((totalSaved / totalBefore) * 100).toFixed(1)}%)`,
);
