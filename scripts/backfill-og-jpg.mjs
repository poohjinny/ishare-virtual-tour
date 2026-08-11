/**
 * Backfill static JPG siblings next to WebP assets used for share og:image.
 *
 * Walks assets thumbnails/ and previews/ folders for *.webp files.
 *
 * Usage:
 *   node scripts/backfill-og-jpg.mjs
 *   node scripts/backfill-og-jpg.mjs --dry-run
 *   node scripts/backfill-og-jpg.mjs --dir gphospitalfoundation
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

sharp.cache(false);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(root, 'assets');
const publicAssetsRoot = join(root, 'public', 'assets');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dirFlag = args.indexOf('--dir');
const dirFilter = dirFlag >= 0 ? args[dirFlag + 1] : '';
const JPEG_QUALITY = Number(process.env.OG_JPEG_QUALITY ?? 80);

const FOLDER_NAMES = new Set(['thumbnails', 'previews']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!/\.webp$/i.test(name)) continue;
    const folder = dirname(full).replace(/\\/g, '/').split('/').pop();
    if (!FOLDER_NAMES.has(folder)) continue;
    out.push(full);
  }
  return out;
}

function syncJpgToPublic(assetsJpgPath) {
  const rel = relative(assetsRoot, assetsJpgPath);
  const dest = join(publicAssetsRoot, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(assetsJpgPath, dest);
}

async function main() {
  if (!existsSync(assetsRoot)) {
    console.error('assets/ not found');
    process.exit(1);
  }

  const start = dirFilter ? join(assetsRoot, dirFilter) : assetsRoot;
  if (!existsSync(start)) {
    console.error(`directory not found: ${start}`);
    process.exit(1);
  }

  const files = walk(start);
  let written = 0;
  let skipped = 0;

  console.log(
    `Backfilling OG JPG siblings${dryRun ? ' (dry-run)' : ''}… (${files.length} webp)`,
  );

  for (const webpPath of files) {
    const jpgPath = webpPath.replace(/\.webp$/i, '.jpg');
    const rel = relative(assetsRoot, webpPath).replace(/\\/g, '/');
    if (existsSync(jpgPath)) {
      skipped += 1;
      continue;
    }
    if (dryRun) {
      console.log(`[dry-run] ${rel} → ${rel.replace(/\.webp$/i, '.jpg')}`);
      written += 1;
      continue;
    }
    await sharp(webpPath)
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(jpgPath);
    if (existsSync(publicAssetsRoot)) {
      syncJpgToPublic(jpgPath);
    }
    console.log(`[ok] ${rel} → ${rel.replace(/\.webp$/i, '.jpg')}`);
    written += 1;
  }

  console.log(
    `Done. ${written} jpg ${dryRun ? 'planned' : 'written'}, ${skipped} already present.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
