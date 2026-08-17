/**
 * One-shot: kebab / slug hotspot ids → opaque `h_*`.
 * Renames preview webps + naming donor folders and rewrites tour JSON paths.
 *
 *   node scripts/migrate-opaque-hotspot-ids.mjs
 *   node scripts/migrate-opaque-hotspot-ids.mjs --dry-run
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allocateOpaqueId,
  isOpaqueHotspotId,
  OPAQUE_HOTSPOT_ID_PREFIX,
} from './lib/opaqueId.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(root, 'assets');
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

function collectHotspots(tour) {
  const items = [];
  for (const hotspot of tour.hotspots ?? []) {
    if (!hotspot?.id) continue;
    items.push(hotspot);
  }
  for (const scene of Object.values(tour.scenes ?? {})) {
    for (const hotspot of scene.hotspots ?? []) {
      if (!hotspot?.id) continue;
      items.push(hotspot);
    }
  }
  return items;
}

function collectTakenIds(tour) {
  return new Set(collectHotspots(tour).map((hotspot) => hotspot.id));
}

function assetPathFromWeb(webPath) {
  const relative = String(webPath || '').replace(/^\/assets\//, '');
  return join(assetsRoot, relative);
}

function retargetPreviewPath(webPath, oldId, newId) {
  const value = String(webPath || '').trim();
  if (!value) return '';
  const from = `/hotspot-thumbs/${oldId}.webp`;
  const to = `/hotspot-thumbs/${newId}.webp`;
  return value.includes(from) ? value.replaceAll(from, to) : value;
}

function retargetNamingPath(webPath, oldId, newId) {
  const value = String(webPath || '').trim();
  if (!value) return '';
  const from = `/naming/${oldId}/`;
  const to = `/naming/${newId}/`;
  return value.includes(from) ? value.replaceAll(from, to) : value;
}

function moveOrCopy(fromWeb, toWeb, usedSources) {
  if (!fromWeb || !toWeb || fromWeb === toWeb) return;
  const fromPath = assetPathFromWeb(fromWeb);
  const toPath = assetPathFromWeb(toWeb);
  if (!existsSync(fromPath)) return;
  const copy = usedSources.has(fromWeb) || existsSync(toPath);
  usedSources.add(fromWeb);
  if (dryRun) return;
  mkdirSync(dirname(toPath), { recursive: true });
  if (copy) copyFileSync(fromPath, toPath);
  else renameSync(fromPath, toPath);
}

function removeEmptyDir(webDir) {
  if (!webDir || dryRun) return;
  const dirPath = assetPathFromWeb(webDir);
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) return;
  if (readdirSync(dirPath).length > 0) return;
  try {
    rmdirSync(dirPath);
  } catch {
    /* ignore */
  }
}

function migrateTourFile(fileName) {
  const tourPath = join(toursDir, fileName);
  const tour = JSON.parse(readFileSync(tourPath, 'utf8'));
  const taken = collectTakenIds(tour);
  const usedSources = new Set();
  const renames = [];

  for (const hotspot of collectHotspots(tour)) {
    const oldId = hotspot.id;
    if (isOpaqueHotspotId(oldId)) continue;

    const newId = allocateOpaqueId(OPAQUE_HOTSPOT_ID_PREFIX, taken);
    taken.add(newId);
    taken.delete(oldId);

    if (oldId === 'info-place' || hotspot.role === 'placeOverview') {
      hotspot.role = 'placeOverview';
    }

    const previewFrom = hotspot.preview?.image?.trim() || '';
    const previewTo = retargetPreviewPath(previewFrom, oldId, newId);
    if (previewFrom && previewTo !== previewFrom) {
      moveOrCopy(previewFrom, previewTo, usedSources);
      hotspot.preview = { ...hotspot.preview, image: previewTo };
    }

    const popupImageFrom = hotspot.popup?.image?.trim() || '';
    const popupImageTo = retargetPreviewPath(popupImageFrom, oldId, newId);
    if (hotspot.popup && popupImageFrom && popupImageTo !== popupImageFrom) {
      moveOrCopy(popupImageFrom, popupImageTo, usedSources);
      hotspot.popup.image = popupImageTo;
    }

    const namingId = hotspot.namingId?.trim();
    const donor = namingId ? tour.namingOpportunities?.[namingId]?.donor : null;
    const donorFrom = donor?.logo?.trim() || '';
    const donorTo = retargetNamingPath(donorFrom, oldId, newId);
    if (donor && donorFrom && donorTo !== donorFrom) {
      moveOrCopy(donorFrom, donorTo, usedSources);
      donor.logo = donorTo;
      removeEmptyDir(donorFrom.replace(/\/[^/]+$/, '/'));
    }

    hotspot.id = newId;
    renames.push(`${oldId} → ${newId}`);
  }

  if (!dryRun && renames.length > 0) {
    writeFileSync(tourPath, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
  }

  return { tourId: tour.id ?? fileName, renames };
}

let total = 0;
for (const fileName of listTourFiles()) {
  const { tourId, renames } = migrateTourFile(fileName);
  if (renames.length === 0) {
    console.log(`[${tourId}] already opaque`);
    continue;
  }
  total += renames.length;
  console.log(
    `[${tourId}] ${renames.length} hotspot id(s)${dryRun ? ' (dry-run)' : ''}`,
  );
  for (const line of renames) console.log(`  ${line}`);
}
console.log(`${dryRun ? 'Would update' : 'Updated'} ${total} hotspot id(s).`);
