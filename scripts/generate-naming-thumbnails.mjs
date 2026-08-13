/**
 * Bake naming-opportunity Explore previews from each pin's hotspot.position.
 * Writes files only — tour JSON omits conventional preview paths.
 *
 * Usage:
 *   npm run generate-naming-thumbnails
 *   node scripts/generate-naming-thumbnails.mjs --tour t_l01wnq8eh6
 *   node scripts/generate-naming-thumbnails.mjs --dry-run
 */
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderEquirectPreviewToFile,
  resolveThumbnailFilePath,
} from './lib/equirectPreviewNode.mjs';
import { resolveNamingHotspotBakeView } from './lib/tourSceneDev.mjs';
import {
  conventionalPreviewPath,
  isModel3dTour,
  isNamingHotspot,
  resolveScenePanoramaPath,
} from '../src/utils/tourAssetResolve.mjs';

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

  if (isModel3dTour(tour)) {
    console.log(`[${tourId}] skip model3d (use Dev capture for NO previews)`);
    return { tourId, updated: 0, skipped: 0 };
  }

  let updated = 0;
  let skipped = 0;

  for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
    const panoramaWebPath = resolveScenePanoramaPath(
      tour,
      sceneId,
      scene?.panorama,
    );
    if (!panoramaWebPath) continue;

    for (const hotspot of scene.hotspots ?? []) {
      if (!isNamingHotspot(hotspot)) continue;

      const view = resolveNamingHotspotBakeView(tour, scene, hotspot);
      if (!view) {
        console.warn(
          `[${tourId}] skip ${hotspot.id}: missing yaw/pitch position`,
        );
        skipped += 1;
        continue;
      }

      const previewWebPath = conventionalPreviewPath(tour, hotspot.id);
      const previewFilePath = resolveThumbnailFilePath(
        assetsRoot,
        previewWebPath,
      );
      const panoramaFilePath = resolvePanoramaFilePath(panoramaWebPath);

      if (dryRun) {
        console.log(
          `[dry-run] ${tourId}/${sceneId}/${hotspot.id} → ${previewWebPath}`,
        );
        updated += 1;
        continue;
      }

      mkdirSync(dirname(previewFilePath), { recursive: true });
      await renderEquirectPreviewToFile(
        panoramaFilePath,
        view,
        previewFilePath,
        { width: THUMBNAIL_WIDTH, quality: THUMBNAIL_QUALITY },
      );

      updated += 1;
      console.log(`[${tourId}] ${hotspot.id} → ${previewWebPath}`);
    }
  }

  return { tourId, updated, skipped };
}

const tourFiles = listTourFiles();
if (tourFiles.length === 0) {
  console.error('No tour JSON files found.');
  process.exit(1);
}

console.log(
  `Generating naming thumbnails${dryRun ? ' (dry-run)' : ''}${tourFilter ? ` for ${tourFilter}` : ''}…`,
);

const results = [];
for (const tourFile of tourFiles) {
  results.push(await processTour(tourFile));
}

const totalUpdated = results.reduce((sum, entry) => sum + entry.updated, 0);
const totalSkipped = results.reduce((sum, entry) => sum + entry.skipped, 0);

console.log(
  `Done. ${totalUpdated} naming preview(s) ${dryRun ? 'planned' : 'generated'}, ${totalSkipped} skipped.`,
);
