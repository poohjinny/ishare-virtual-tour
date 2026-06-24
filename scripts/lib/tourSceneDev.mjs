import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import {
  renderEquirectPreviewToFile,
  resolveThumbnailFilePath,
  resolveThumbnailWebPath,
} from './equirectPreviewNode.mjs';

const THUMBNAIL_WIDTH = Number(process.env.THUMBNAIL_WIDTH ?? 640);
const THUMBNAIL_QUALITY = Number(process.env.THUMBNAIL_QUALITY ?? 85);

function roundCoord(value) {
  return +Number(value).toFixed(1);
}

export function normalizeDefaultView(view) {
  return {
    yaw: roundCoord(view.yaw),
    pitch: roundCoord(view.pitch),
    zoom: view.zoom ?? 0,
  };
}

export function normalizeHotspotPosition(position) {
  return { yaw: roundCoord(position.yaw), pitch: roundCoord(position.pitch) };
}

/** "Parking Lot" → `parking-lot` (matches tour scene / hotspot id convention). */
export function slugifyHotspotName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildNavHotspotRecord({
  name,
  position,
  targetSceneId,
  targetView,
}) {
  const label = name.trim();
  const slug = slugifyHotspotName(label);
  const targetScene = targetSceneId.trim();

  if (!label) throw new Error('Hotspot name is required');
  if (!slug) throw new Error('Hotspot name must contain letters or numbers');
  if (!targetScene) throw new Error('Target scene is required');

  return {
    id: `nav-to-${slug}`,
    type: 'nav',
    label,
    position: normalizeHotspotPosition(position),
    targetScene,
    targetView: normalizeDefaultView(
      targetView ?? { yaw: 0, pitch: 0, zoom: 17 },
    ),
  };
}

const NAMING_STATUSES = new Set(['on_sale', 'sold', 'reserved', 'coming_soon']);

export function buildNamingHotspotRecord({
  name,
  position,
  price,
  status,
  body,
}) {
  const title = name.trim();
  const slug = slugifyHotspotName(title);
  const priceValue = price?.trim();
  const statusValue = status?.trim() || 'coming_soon';
  const bodyValue = body?.trim();

  if (!title) throw new Error('Hotspot name is required');
  if (!slug) throw new Error('Hotspot name must contain letters or numbers');
  if (!priceValue) throw new Error('Price is required');
  if (!NAMING_STATUSES.has(statusValue)) {
    throw new Error(`Invalid naming status: ${statusValue}`);
  }
  if (!bodyValue) throw new Error('Body copy is required');

  return {
    id: `info-${slug}`,
    type: 'info',
    position: normalizeHotspotPosition(position),
    popup: {
      display: 'anchored',
      title,
      namingOpportunity: {
        name: `${title} Naming Opportunity`,
        price: priceValue,
        status: statusValue,
      },
      body: bodyValue,
    },
  };
}

function appendSceneHotspot(tour, sceneId, hotspot) {
  const scene = tour.scenes?.[sceneId];
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  if (!Array.isArray(scene.hotspots)) {
    scene.hotspots = [];
  }
  if (scene.hotspots.some((entry) => entry.id === hotspot.id)) {
    throw new Error(`Hotspot id already exists: ${hotspot.id}`);
  }
  scene.hotspots.push(hotspot);
  return hotspot;
}

function assertTargetSceneExists(tour, targetSceneId) {
  if (!tour.scenes?.[targetSceneId]) {
    throw new Error(`Target scene not found: ${targetSceneId}`);
  }
}

export async function createNavHotspot({
  toursDir,
  tourId,
  sceneId,
  name,
  position,
  targetSceneId,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  assertTargetSceneExists(tour, targetSceneId);
  const targetScene = tour.scenes[targetSceneId];
  const hotspot = buildNavHotspotRecord({
    name,
    position,
    targetSceneId,
    targetView: targetScene?.defaultView,
  });
  appendSceneHotspot(tour, sceneId, hotspot);
  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export async function createNamingHotspot({
  toursDir,
  tourId,
  sceneId,
  name,
  position,
  price,
  status,
  body,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const hotspot = buildNamingHotspotRecord({
    name,
    position,
    price,
    status,
    body,
  });
  appendSceneHotspot(tour, sceneId, hotspot);
  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export function resolveTourJsonPath(toursDir, tourId) {
  const tourPath = join(toursDir, `${tourId}.json`);
  if (!existsSync(tourPath)) {
    throw new Error(`Tour not found: ${tourId}`);
  }
  return tourPath;
}

export function readTourJson(tourPath) {
  return JSON.parse(readFileSync(tourPath, 'utf8'));
}

export function writeTourJson(tourPath, tour) {
  writeFileSync(tourPath, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
}

function resolvePanoramaFilePath(assetsRoot, panoramaWebPath) {
  const relative = panoramaWebPath.replace(/^\/assets\//, '');
  return join(assetsRoot, relative);
}

function syncThumbnailToPublic(root, thumbnailFilePath, thumbnailWebPath) {
  const relative = thumbnailWebPath.replace(/^\/assets\//, '');
  const publicPath = join(root, 'public', 'assets', relative);
  mkdirSync(dirname(publicPath), { recursive: true });
  copyFileSync(thumbnailFilePath, publicPath);
}

export function updateSceneDefaultView(tour, sceneId, view) {
  const scene = tour.scenes?.[sceneId];
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  scene.defaultView = normalizeDefaultView(view);
  return scene.defaultView;
}

export async function bakeSceneThumbnail({
  root,
  assetsRoot,
  tour,
  sceneId,
  view,
}) {
  const scene = tour.scenes?.[sceneId];
  if (!scene?.panorama) {
    throw new Error(`Scene "${sceneId}" is missing panorama`);
  }

  const renderView = normalizeDefaultView(view ?? scene.defaultView);
  const thumbnailWebPath = resolveThumbnailWebPath(scene.panorama, sceneId);
  const thumbnailFilePath = resolveThumbnailFilePath(
    assetsRoot,
    thumbnailWebPath,
  );
  const panoramaFilePath = resolvePanoramaFilePath(assetsRoot, scene.panorama);

  mkdirSync(dirname(thumbnailFilePath), { recursive: true });
  await renderEquirectPreviewToFile(
    panoramaFilePath,
    renderView,
    thumbnailFilePath,
    { width: THUMBNAIL_WIDTH, quality: THUMBNAIL_QUALITY },
  );

  scene.thumbnail = thumbnailWebPath;
  syncThumbnailToPublic(root, thumbnailFilePath, thumbnailWebPath);

  return { thumbnail: thumbnailWebPath, defaultView: renderView };
}

export async function applySceneDefaultView({
  toursDir,
  tourId,
  sceneId,
  view,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const defaultView = updateSceneDefaultView(tour, sceneId, view);
  writeTourJson(tourPath, tour);
  return { tourPath, defaultView };
}

/** Save defaultView and bake matching scene thumbnail in one write. */
export async function applySceneLanding({
  root,
  toursDir,
  assetsRoot,
  tourId,
  sceneId,
  view,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const defaultView = updateSceneDefaultView(tour, sceneId, view);
  const { thumbnail } = await bakeSceneThumbnail({
    root,
    assetsRoot,
    tour,
    sceneId,
    view: defaultView,
  });
  writeTourJson(tourPath, tour);
  return { tourPath, defaultView, thumbnail };
}

export async function applySceneThumbnail({
  root,
  toursDir,
  assetsRoot,
  tourId,
  sceneId,
  view,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const result = await bakeSceneThumbnail({
    root,
    assetsRoot,
    tour,
    sceneId,
    view,
  });
  writeTourJson(tourPath, tour);
  return { tourPath, ...result };
}
