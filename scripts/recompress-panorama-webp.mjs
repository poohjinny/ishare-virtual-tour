/**
 * Recompress tour panorama WebPs (optional downscale) using the shared encode
 * settings from `scripts/lib/panoramaEncode.mjs`.
 *
 * Usage:
 *   node scripts/recompress-panorama-webp.mjs gphospitalfoundation/ken-sargent-house/panoramas
 *
 * Env:
 *   WEBP_QUALITY / PANORAMA_WEBP_QUALITY   default 90
 *   WEBP_MAX_WIDTH / PANORAMA_MAX_WIDTH    default 8192
 *
 * Lower WEBP_QUALITY only when deliberately trading quality for size — do not
 * force a uniform MB budget across scenes.
 */
import { readdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  encodePanoramaWebp,
  PANORAMA_MAX_WIDTH,
  PANORAMA_WEBP_QUALITY,
} from './lib/panoramaEncode.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(root, 'assets');

const relativeDir = process.argv[2]?.replace(/^\//, '');
if (!relativeDir) {
  console.error(
    'Usage: node scripts/recompress-panorama-webp.mjs <dir-under-assets>',
  );
  process.exit(1);
}

const dir = join(assetsRoot, relativeDir);
const files = readdirSync(dir)
  .filter((name) => /\.webp$/i.test(name))
  .sort();

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

console.log(
  `Recompress ${relativeDir} (quality=${PANORAMA_WEBP_QUALITY}, maxWidth=${PANORAMA_MAX_WIDTH})\n`,
);

let totalBefore = 0;
let totalAfter = 0;

for (const name of files) {
  const input = join(dir, name);
  const temp = join(dir, `.${name}.tmp.webp`);
  const before = statSync(input).size;
  const meta = await sharp(input).metadata();

  await encodePanoramaWebp(input, temp, { effort: 6 });

  const after = statSync(temp).size;
  if (after >= before && (meta.width ?? 0) <= PANORAMA_MAX_WIDTH) {
    unlinkSync(temp);
    console.log(`${name}\t${formatBytes(before)}\t(skipped — not smaller)`);
    totalBefore += before;
    totalAfter += before;
    continue;
  }

  unlinkSync(input);
  renameSync(temp, input);
  totalBefore += before;
  totalAfter += after;
  const saved = before - after;
  console.log(
    `${name}\t${meta.width}→≤${PANORAMA_MAX_WIDTH}\t${formatBytes(before)} → ${formatBytes(after)}\t-${((saved / before) * 100).toFixed(1)}%`,
  );
}

console.log(
  `\nTotal: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (${formatBytes(totalBefore - totalAfter)} saved, -${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%)`,
);
