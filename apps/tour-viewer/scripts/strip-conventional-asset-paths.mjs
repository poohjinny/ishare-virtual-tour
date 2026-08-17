/**
 * One-shot: drop conventional `/assets/…` URLs from tour JSON.
 * Runtime infers them via `src/utils/tourAssetResolve.mjs`.
 *
 *   node scripts/strip-conventional-asset-paths.mjs
 *   node scripts/strip-conventional-asset-paths.mjs --dry-run
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  stripConventionalCatalogBranding,
  stripConventionalTourAssets,
} from '../src/utils/tourAssetResolve.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const toursDir = join(root, 'tours');
const dryRun = process.argv.includes('--dry-run');

function listTourFiles() {
  return readdirSync(toursDir).filter(
    (name) =>
      name.endsWith('.json') &&
      !name.endsWith('-knowledge.json') &&
      name !== 'catalog.json',
  );
}

const totals = { panorama: 0, thumbnail: 0, preview: 0, logo: 0, tours: 0 };

for (const fileName of listTourFiles()) {
  const tourPath = join(toursDir, fileName);
  const tour = JSON.parse(readFileSync(tourPath, 'utf8'));
  const counts = stripConventionalTourAssets(tour);
  const changed =
    counts.panorama + counts.thumbnail + counts.preview + counts.logo;
  if (!changed) {
    console.log(`[${tour.id ?? fileName}] already clean`);
    continue;
  }

  totals.panorama += counts.panorama;
  totals.thumbnail += counts.thumbnail;
  totals.preview += counts.preview;
  totals.logo += counts.logo;
  totals.tours += 1;

  console.log(
    `[${tour.id ?? fileName}] panorama=${counts.panorama} thumbnail=${counts.thumbnail} preview=${counts.preview} logo=${counts.logo}${dryRun ? ' (dry-run)' : ''}`,
  );

  if (!dryRun) {
    writeFileSync(tourPath, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
  }
}

console.log(
  `Done. ${totals.tours} tour(s), panorama=${totals.panorama} thumbnail=${totals.thumbnail} preview=${totals.preview} logo=${totals.logo}${dryRun ? ' (dry-run)' : ''}.`,
);

const catalogPath = join(toursDir, 'catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const catalogCounts = stripConventionalCatalogBranding(catalog);
if (catalogCounts.logo + catalogCounts.favicon) {
  console.log(
    `[catalog.json] logo=${catalogCounts.logo} favicon=${catalogCounts.favicon}${dryRun ? ' (dry-run)' : ''}`,
  );
  if (!dryRun) {
    writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  }
} else {
  console.log('[catalog.json] already clean');
}
