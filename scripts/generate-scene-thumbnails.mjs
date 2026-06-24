/**
 * Bake scene thumbnails from each scene's defaultView.
 *
 * Usage:
 *   npm run generate-thumbnails
 *   node scripts/generate-scene-thumbnails.mjs --tour ken-sargent-house
 *   node scripts/generate-scene-thumbnails.mjs --dry-run
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderEquirectPreviewToFile,
  resolveThumbnailFilePath,
  resolveThumbnailWebPath,
} from './lib/equirectPreviewNode.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(root, 'assets');
const toursDir = join(root, 'tours');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const tourFlagIndex = args.indexOf('--tour');
const tourFilter = tourFlagIndex >= 0 ? args[tourFlagIndex + 1] : undefined;

const THUMBNAIL_WIDTH = Number(process.env.THUMBNAIL_WIDTH ?? 640);
const THUMBNAIL_QUALITY = Number(process.env.THUMBNAIL_QUALITY ?? 85);

function listTourFiles() {
  return readdirSync(toursDir).filter(
    (name) =>
      name.endsWith('.json') &&
      !name.endsWith('-knowledge.json') &&
      name !== 'catalog.json',
  );
}

function resolvePanoramaFilePath(panoramaWebPath) {
  const relative = panoramaWebPath.replace(/^\/assets\//, '');
  return join(assetsRoot, relative);
}

async function processTour(tourFileName) {
  const tourPath = join(toursDir, tourFileName);
  const tour = JSON.parse(readFileSync(tourPath, 'utf8'));
  const tourId = tour.id ?? tourFileName.replace(/\.json$/, '');

  if (tourFilter && tourId !== tourFilter) {
    return { tourId, updated: 0, skipped: 0 };
  }

  let updated = 0;
  let skipped = 0;

  for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
    if (!scene?.panorama || !scene?.defaultView) {
      console.warn(`[${tourId}] skip ${sceneId}: missing panorama/defaultView`);
      skipped += 1;
      continue;
    }

    const thumbnailWebPath = resolveThumbnailWebPath(scene.panorama, sceneId);
    const thumbnailFilePath = resolveThumbnailFilePath(
      assetsRoot,
      thumbnailWebPath,
    );
    const panoramaFilePath = resolvePanoramaFilePath(scene.panorama);

    if (dryRun) {
      console.log(`[dry-run] ${tourId}/${sceneId} → ${thumbnailWebPath}`);
      updated += 1;
      continue;
    }

    mkdirSync(dirname(thumbnailFilePath), { recursive: true });
    await renderEquirectPreviewToFile(
      panoramaFilePath,
      scene.defaultView,
      thumbnailFilePath,
      { width: THUMBNAIL_WIDTH, quality: THUMBNAIL_QUALITY },
    );

    scene.thumbnail = thumbnailWebPath;
    updated += 1;
    console.log(`[${tourId}] ${sceneId} → ${thumbnailWebPath}`);
  }

  if (!dryRun && updated > 0) {
    writeFileSync(tourPath, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
  }

  return { tourId, updated, skipped };
}

const tourFiles = listTourFiles();
if (tourFiles.length === 0) {
  console.error('No tour JSON files found.');
  process.exit(1);
}

console.log(
  `Generating scene thumbnails${dryRun ? ' (dry-run)' : ''}${tourFilter ? ` for ${tourFilter}` : ''}…`,
);

const results = [];
for (const tourFile of tourFiles) {
  results.push(await processTour(tourFile));
}

const totalUpdated = results.reduce((sum, entry) => sum + entry.updated, 0);
const totalSkipped = results.reduce((sum, entry) => sum + entry.skipped, 0);

console.log(
  `Done. ${totalUpdated} thumbnail(s) ${dryRun ? 'planned' : 'generated'}, ${totalSkipped} skipped.`,
);
