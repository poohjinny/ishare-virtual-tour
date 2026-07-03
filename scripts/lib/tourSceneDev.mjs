import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import {
  renderEquirectPreviewToFile,
  resolveThumbnailFilePath,
  resolveThumbnailWebPath,
} from './equirectPreviewNode.mjs';
import {
  defaultInfoBody,
  defaultNamingBody,
  defaultSceneDescription,
} from './devContentPlaceholders.mjs';
import { normalizeNamingPriceStorage } from './namingPrice.mjs';
import { persistTourContentPlaceholders } from './tourContentSync.mjs';

const THUMBNAIL_WIDTH = Number(process.env.THUMBNAIL_WIDTH ?? 640);
const THUMBNAIL_QUALITY = Number(process.env.THUMBNAIL_QUALITY ?? 85);
const MAX_PANORAMA_UPLOAD_BYTES = 50 * 1024 * 1024;

const PANORAMA_UPLOAD_EXTENSIONS = new Set(['webp', 'jpg', 'jpeg', 'png']);

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

function roundMapCoord(value) {
  return +Number(value).toFixed(3);
}

export function normalizeMapPosition(map) {
  if (
    typeof map?.x !== 'number' ||
    typeof map?.y !== 'number' ||
    typeof map?.heading !== 'number'
  ) {
    throw new Error('map.x, map.y, and map.heading must be numbers');
  }

  const x = Number(map.x);
  const y = Number(map.y);
  if (x < 0 || x > 1 || y < 0 || y > 1) {
    throw new Error('map.x and map.y must be between 0 and 1');
  }

  return {
    x: roundMapCoord(x),
    y: roundMapCoord(y),
    heading: roundCoord(map.heading),
  };
}

function validateOptionalViewPosition(view, label) {
  if (view === undefined || view === null) return undefined;
  if (typeof view !== 'object') {
    throw new Error(`${label} must be an object`);
  }
  if (typeof view.yaw !== 'number' || typeof view.pitch !== 'number') {
    throw new Error(`${label}.yaw and ${label}.pitch must be numbers`);
  }
  if (view.zoom !== undefined && typeof view.zoom !== 'number') {
    throw new Error(`${label}.zoom must be a number`);
  }
  return normalizeDefaultView(view);
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

/** Append `-2`, `-3`, … when `baseId` is already used in the scene. */
export function resolveUniqueHotspotId(existingIds, baseId) {
  const ids = existingIds instanceof Set ? existingIds : new Set(existingIds);
  if (!ids.has(baseId)) return baseId;
  let index = 2;
  while (ids.has(`${baseId}-${index}`)) {
    index += 1;
  }
  return `${baseId}-${index}`;
}

function parseNavHotspotVariant(value) {
  if (value === 'back' || value === 'hub') return value;
  return undefined;
}

export function buildNavHotspotRecord({
  name,
  position,
  targetSceneId,
  targetView,
  instant,
  navVariant,
  previewImage,
}) {
  const label = name.trim();
  const slug = slugifyHotspotName(label);
  const targetScene = targetSceneId.trim();

  if (!label) throw new Error('Hotspot name is required');
  if (!slug) throw new Error('Hotspot name must contain letters or numbers');
  if (!targetScene) throw new Error('Target scene is required');

  const record = {
    id: `nav-to-${slug}`,
    type: 'nav',
    label,
    position: normalizeHotspotPosition(position),
    targetScene,
    targetView: normalizeDefaultView(
      targetView ?? { yaw: 0, pitch: 0, zoom: 17 },
    ),
  };

  if (instant) {
    record.instant = true;
  }

  const resolvedNavVariant = parseNavHotspotVariant(navVariant);
  if (resolvedNavVariant) {
    record.navVariant = resolvedNavVariant;
  }

  const previewPath = previewImage?.trim();
  if (previewPath) {
    record.preview = { image: previewPath };
  }

  return record;
}

const NAMING_STATUSES = new Set(['open', 'closed', 'reserved', 'soon']);

function applyPopupMediaFields(popup, { videoUrl, image }) {
  const nextVideoUrl = videoUrl?.trim();
  const nextImage = image?.trim();
  if (nextVideoUrl) popup.videoUrl = nextVideoUrl;
  if (nextImage) popup.image = nextImage;
}

export function buildNamingHotspotRecord({
  name,
  position,
  price,
  status,
  body,
  videoUrl,
  image,
  tourTitle,
}) {
  const title = name.trim();
  const slug = slugifyHotspotName(title);
  const priceValue = normalizeNamingPriceStorage(price);
  const statusValue = status?.trim() || 'soon';
  const bodyValue = body?.trim() || defaultNamingBody(title, tourTitle);

  if (!title) throw new Error('Hotspot name is required');
  if (!slug) throw new Error('Hotspot name must contain letters or numbers');
  if (!priceValue) throw new Error('Price is required');
  if (!NAMING_STATUSES.has(statusValue)) {
    throw new Error(`Invalid naming status: ${statusValue}`);
  }

  const popup = {
    display: 'anchored',
    title,
    namingOpportunity: {
      name: `${title} Naming Opportunity`,
      price: priceValue,
      status: statusValue,
    },
    body: bodyValue,
  };
  applyPopupMediaFields(popup, { videoUrl, image });

  return {
    id: `info-${slug}`,
    type: 'info',
    position: normalizeHotspotPosition(position),
    popup,
  };
}

const INFO_DISPLAYS = new Set(['modal', 'anchored']);

export function buildInfoHotspotRecord({
  name,
  position,
  title,
  body,
  display,
  videoUrl,
  image,
  visitScene,
  tourTitle,
}) {
  const titleValue = (title ?? name)?.trim();
  const slug = slugifyHotspotName(titleValue);
  const bodyValue = body?.trim() || defaultInfoBody(titleValue, tourTitle);
  const displayValue = display?.trim() || 'anchored';

  if (!titleValue) throw new Error('Hotspot name is required');
  if (!slug) throw new Error('Hotspot name must contain letters or numbers');
  if (!INFO_DISPLAYS.has(displayValue)) {
    throw new Error('display must be modal or anchored');
  }

  const popup = { display: displayValue, title: titleValue, body: bodyValue };
  applyPopupMediaFields(popup, { videoUrl, image });

  const nextVisitScene = visitScene?.trim();
  if (nextVisitScene) {
    popup.visitScene = nextVisitScene;
  }

  return {
    id: `info-${slug}`,
    type: 'info',
    position: normalizeHotspotPosition(position),
    popup,
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
  const ids = new Set(scene.hotspots.map((entry) => entry.id));
  const uniqueId = resolveUniqueHotspotId(ids, hotspot.id);
  const record =
    uniqueId === hotspot.id ? hotspot : { ...hotspot, id: uniqueId };
  scene.hotspots.push(record);
  return record;
}

function findSceneHotspot(tour, sceneId, hotspotId) {
  const scene = tour.scenes?.[sceneId];
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }
  const hotspot = scene.hotspots?.find((entry) => entry.id === hotspotId);
  if (!hotspot) {
    throw new Error(`Hotspot not found: ${hotspotId}`);
  }
  return { scene, hotspot };
}

export function deleteHotspot({ toursDir, tourId, sceneId, hotspotId }) {
  const resolvedHotspotId = hotspotId?.trim();
  if (!resolvedHotspotId) {
    throw new Error('hotspotId is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const { scene, hotspot } = findSceneHotspot(tour, sceneId, resolvedHotspotId);
  scene.hotspots = scene.hotspots.filter(
    (entry) => entry.id !== resolvedHotspotId,
  );
  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export function updateHotspotPosition({
  toursDir,
  tourId,
  sceneId,
  hotspotId,
  position,
}) {
  const resolvedHotspotId = hotspotId?.trim();
  if (!resolvedHotspotId) {
    throw new Error('hotspotId is required');
  }
  if (
    !position ||
    typeof position.yaw !== 'number' ||
    typeof position.pitch !== 'number'
  ) {
    throw new Error('position.yaw and position.pitch must be numbers');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const { hotspot } = findSceneHotspot(tour, sceneId, resolvedHotspotId);
  hotspot.position = normalizeHotspotPosition(position);
  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export async function replaceScenePanorama({
  root,
  toursDir,
  assetsRoot,
  tourId,
  sceneId,
  panoramaFileBuffer,
}) {
  if (!panoramaFileBuffer?.length) {
    throw new Error('panoramaFile is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const scene = tour.scenes?.[sceneId];
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  const panoramaWebPath = await saveUploadedPanoramaWebp({
    assetsRoot,
    root,
    tour,
    sceneId,
    fileBuffer: panoramaFileBuffer,
  });
  scene.panorama = panoramaWebPath;

  const { thumbnail } = await bakeSceneThumbnail({
    root,
    assetsRoot,
    tour,
    sceneId,
    view: scene.defaultView,
  });

  writeTourJson(tourPath, tour);
  return { tourPath, sceneId, panorama: panoramaWebPath, thumbnail };
}

function assertTargetSceneExists(tour, targetSceneId) {
  if (!tour.scenes?.[targetSceneId]) {
    throw new Error(`Target scene not found: ${targetSceneId}`);
  }
}

export function buildDefaultPanoramaWebPath(tour, sceneId) {
  const clientId = tour.clientId ?? tour.id;
  return `/assets/${clientId}/${tour.id}/panoramas/${sceneId}.webp`;
}

export function buildSceneRecord({
  title,
  sceneId,
  panorama,
  defaultView,
  description,
  tourTitle,
}) {
  const label = title.trim();
  const id = sceneId?.trim() || slugifyHotspotName(label);
  const panoramaPath = panorama?.trim();
  const tour = tourTitle?.trim() || 'this facility';

  if (!label) throw new Error('Scene title is required');
  if (!id) throw new Error('Scene title must contain letters or numbers');
  if (!panoramaPath) throw new Error('Panorama path is required');

  return {
    id,
    title: label,
    description: description?.trim() || defaultSceneDescription(tour, label),
    panorama: panoramaPath,
    defaultView: normalizeDefaultView(
      defaultView ?? { yaw: 0, pitch: 0, zoom: 17 },
    ),
    hotspots: [],
  };
}

function syncAssetToPublic(root, assetsFilePath, webPath) {
  const relative = webPath.replace(/^\/assets\//, '');
  const publicPath = join(root, 'public', 'assets', relative);
  mkdirSync(dirname(publicPath), { recursive: true });
  copyFileSync(assetsFilePath, publicPath);
}

export function assertPanoramaUploadFileName(fileName) {
  const trimmed = fileName?.trim();
  if (!trimmed) throw new Error('Panorama file is required');
  const ext = trimmed.toLowerCase().split('.').pop();
  if (!ext || !PANORAMA_UPLOAD_EXTENSIONS.has(ext)) {
    throw new Error('Panorama must be .webp, .jpg, .jpeg, or .png');
  }
  return trimmed;
}

export async function saveUploadedPanoramaWebp({
  assetsRoot,
  root,
  tour,
  sceneId,
  fileBuffer,
}) {
  if (!fileBuffer?.length) {
    throw new Error('Panorama file is empty');
  }
  if (fileBuffer.length > MAX_PANORAMA_UPLOAD_BYTES) {
    throw new Error('Panorama file is too large (max 50 MB)');
  }

  const webPath = buildDefaultPanoramaWebPath(tour, sceneId);
  const filePath = resolvePanoramaFilePath(assetsRoot, webPath);
  mkdirSync(dirname(filePath), { recursive: true });

  await sharp(fileBuffer).webp({ quality: 90 }).toFile(filePath);
  syncAssetToPublic(root, filePath, webPath);

  return webPath;
}

export async function createScene({
  root,
  toursDir,
  assetsRoot,
  tourId,
  title,
  sceneId,
  panoramaFileBuffer,
  defaultView,
  description,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const resolvedSceneId = sceneId?.trim() || slugifyHotspotName(title.trim());

  if (!title.trim()) throw new Error('Scene title is required');
  if (!resolvedSceneId) {
    throw new Error('Scene title must contain letters or numbers');
  }
  if (tour.scenes?.[resolvedSceneId]) {
    throw new Error(`Scene id already exists: ${resolvedSceneId}`);
  }
  if (!panoramaFileBuffer?.length) {
    throw new Error('panoramaFile is required');
  }

  const panoramaWebPath = await saveUploadedPanoramaWebp({
    assetsRoot,
    root,
    tour,
    sceneId: resolvedSceneId,
    fileBuffer: panoramaFileBuffer,
  });

  const record = buildSceneRecord({
    title,
    sceneId: resolvedSceneId,
    panorama: panoramaWebPath,
    defaultView,
    description,
    tourTitle: tour.title,
  });

  if (!tour.scenes) {
    tour.scenes = {};
  }
  tour.scenes[record.id] = record;

  await bakeSceneThumbnail({
    root,
    assetsRoot,
    tour,
    sceneId: record.id,
    view: record.defaultView,
  });

  writeTourJson(tourPath, tour);
  persistTourContentPlaceholders(toursDir, tourId);
  return { tourPath, scene: record };
}

export async function createNavHotspot({
  toursDir,
  tourId,
  sceneId,
  name,
  position,
  targetSceneId,
  instant,
  navVariant,
  previewImage,
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
    instant,
    navVariant,
    previewImage,
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
  videoUrl,
  image,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const hotspot = buildNamingHotspotRecord({
    name,
    position,
    price,
    status,
    body,
    videoUrl,
    image,
    tourTitle: tour.title,
  });
  appendSceneHotspot(tour, sceneId, hotspot);
  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export async function createInfoHotspot({
  toursDir,
  tourId,
  sceneId,
  name,
  position,
  title,
  body,
  display,
  videoUrl,
  image,
  visitScene,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const hotspot = buildInfoHotspotRecord({
    name,
    position,
    title,
    body,
    display,
    videoUrl,
    image,
    visitScene,
    tourTitle: tour.title,
  });
  appendSceneHotspot(tour, sceneId, hotspot);
  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export function updateNavHotspot({
  toursDir,
  tourId,
  sceneId,
  hotspotId,
  label,
  targetSceneId,
  targetView,
  syncTargetViewFromScene,
  instant,
  navVariant,
  previewImage,
  clearPreviewImage,
}) {
  const resolvedHotspotId = hotspotId?.trim();
  if (!resolvedHotspotId) {
    throw new Error('hotspotId is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const { hotspot } = findSceneHotspot(tour, sceneId, resolvedHotspotId);

  if (hotspot.type !== 'nav') {
    throw new Error(`Hotspot is not nav: ${resolvedHotspotId}`);
  }

  const nextLabel = label?.trim();
  const nextTargetSceneId = targetSceneId?.trim();
  const hasTargetView = targetView !== undefined && targetView !== null;
  const hasInstant = instant !== undefined;
  const hasNavVariant = navVariant !== undefined;
  const hasPreviewImage = previewImage !== undefined;
  const wantsClearPreview = clearPreviewImage === true;
  const wantsSyncTargetView = syncTargetViewFromScene === true;

  if (
    !nextLabel &&
    !nextTargetSceneId &&
    !hasTargetView &&
    !hasInstant &&
    !hasNavVariant &&
    !hasPreviewImage &&
    !wantsClearPreview &&
    !wantsSyncTargetView
  ) {
    throw new Error(
      'At least one of label, targetSceneId, targetView, instant, navVariant, previewImage, clearPreviewImage, or syncTargetViewFromScene is required',
    );
  }

  if (nextLabel) {
    hotspot.label = nextLabel;
  }

  if (nextTargetSceneId) {
    assertTargetSceneExists(tour, nextTargetSceneId);
    hotspot.targetScene = nextTargetSceneId;
    if (!hasTargetView && !wantsSyncTargetView) {
      hotspot.targetView = normalizeDefaultView(
        tour.scenes[nextTargetSceneId].defaultView,
      );
    }
  }

  if (wantsSyncTargetView) {
    const resolvedTargetSceneId = hotspot.targetScene?.trim();
    if (!resolvedTargetSceneId) {
      throw new Error('Nav hotspot has no targetScene to sync targetView from');
    }
    assertTargetSceneExists(tour, resolvedTargetSceneId);
    hotspot.targetView = normalizeDefaultView(
      tour.scenes[resolvedTargetSceneId].defaultView,
    );
  } else if (hasTargetView) {
    hotspot.targetView = validateOptionalViewPosition(targetView, 'targetView');
  }

  if (hasInstant) {
    if (instant) {
      hotspot.instant = true;
    } else {
      delete hotspot.instant;
    }
  }

  if (hasNavVariant) {
    const resolvedNavVariant = parseNavHotspotVariant(navVariant);
    if (resolvedNavVariant) {
      hotspot.navVariant = resolvedNavVariant;
    } else {
      delete hotspot.navVariant;
    }
  }

  if (wantsClearPreview) {
    delete hotspot.preview;
  } else if (hasPreviewImage) {
    const previewPath = previewImage?.trim();
    if (previewPath) {
      hotspot.preview = { image: previewPath };
    } else {
      delete hotspot.preview;
    }
  }

  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export function updateNamingHotspot({
  toursDir,
  tourId,
  sceneId,
  hotspotId,
  title,
  price,
  status,
  body,
  videoUrl,
  image,
}) {
  const resolvedHotspotId = hotspotId?.trim();
  if (!resolvedHotspotId) {
    throw new Error('hotspotId is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const { hotspot } = findSceneHotspot(tour, sceneId, resolvedHotspotId);

  if (hotspot.type !== 'info' || !hotspot.popup?.namingOpportunity) {
    throw new Error(
      `Hotspot is not a naming opportunity: ${resolvedHotspotId}`,
    );
  }

  const nextTitle = title?.trim();
  const nextPrice = price?.trim();
  const nextStatus = status?.trim();
  const nextBody = body?.trim();
  const hasVideoUrl = videoUrl !== undefined;
  const hasImage = image !== undefined;

  if (nextTitle) {
    hotspot.popup.title = nextTitle;
    hotspot.popup.namingOpportunity.name = `${nextTitle} Naming Opportunity`;
  }
  if (nextPrice) {
    hotspot.popup.namingOpportunity.price =
      normalizeNamingPriceStorage(nextPrice);
  }
  if (nextStatus) {
    if (!NAMING_STATUSES.has(nextStatus)) {
      throw new Error(`Invalid naming status: ${nextStatus}`);
    }
    hotspot.popup.namingOpportunity.status = nextStatus;
  }
  if (body !== undefined) {
    const opportunityTitle = nextTitle || hotspot.popup.title;
    hotspot.popup.body =
      nextBody || defaultNamingBody(opportunityTitle, tour.title);
  }
  if (hasVideoUrl) {
    const nextVideoUrl = videoUrl?.trim();
    if (nextVideoUrl) {
      hotspot.popup.videoUrl = nextVideoUrl;
    } else {
      delete hotspot.popup.videoUrl;
    }
  }
  if (hasImage) {
    const nextImage = image?.trim();
    if (nextImage) {
      hotspot.popup.image = nextImage;
    } else {
      delete hotspot.popup.image;
    }
  }

  if (
    !nextTitle &&
    !nextPrice &&
    !nextStatus &&
    body === undefined &&
    !hasVideoUrl &&
    !hasImage
  ) {
    throw new Error(
      'At least one of title, price, status, body, videoUrl, or image is required',
    );
  }

  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export function updateInfoHotspot({
  toursDir,
  tourId,
  sceneId,
  hotspotId,
  title,
  body,
  display,
  videoUrl,
  image,
  visitScene,
}) {
  const resolvedHotspotId = hotspotId?.trim();
  if (!resolvedHotspotId) {
    throw new Error('hotspotId is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const { hotspot } = findSceneHotspot(tour, sceneId, resolvedHotspotId);

  if (hotspot.type !== 'info' || !hotspot.popup) {
    throw new Error(`Hotspot is not info: ${resolvedHotspotId}`);
  }
  if (hotspot.popup.namingOpportunity) {
    throw new Error(
      `Hotspot is a naming opportunity — use naming update: ${resolvedHotspotId}`,
    );
  }

  const nextTitle = title?.trim();
  const nextBody = body?.trim();
  const nextDisplay = display?.trim();
  const hasVideoUrl = videoUrl !== undefined;
  const hasImage = image !== undefined;

  if (nextTitle) {
    hotspot.popup.title = nextTitle;
  }
  if (body !== undefined) {
    const infoTitle = nextTitle || hotspot.popup.title;
    hotspot.popup.body = nextBody || defaultInfoBody(infoTitle, tour.title);
  }
  if (nextDisplay) {
    if (!INFO_DISPLAYS.has(nextDisplay)) {
      throw new Error('display must be modal or anchored');
    }
    hotspot.popup.display = nextDisplay;
  }
  if (hasVideoUrl) {
    const nextVideoUrl = videoUrl?.trim();
    if (nextVideoUrl) {
      hotspot.popup.videoUrl = nextVideoUrl;
    } else {
      delete hotspot.popup.videoUrl;
    }
  }
  if (hasImage) {
    const nextImage = image?.trim();
    if (nextImage) {
      hotspot.popup.image = nextImage;
    } else {
      delete hotspot.popup.image;
    }
  }
  const hasVisitScene = visitScene !== undefined;
  if (hasVisitScene) {
    const nextVisitScene = visitScene?.trim();
    if (nextVisitScene) {
      hotspot.popup.visitScene = nextVisitScene;
    } else {
      delete hotspot.popup.visitScene;
    }
  }

  if (
    !nextTitle &&
    body === undefined &&
    !nextDisplay &&
    !hasVideoUrl &&
    !hasImage &&
    !hasVisitScene
  ) {
    throw new Error(
      'At least one of title, body, display, videoUrl, image, or visitScene is required',
    );
  }

  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export function updateScene({
  toursDir,
  tourId,
  sceneId,
  title,
  description,
  setAsFirstScene,
  map,
  clearMap,
}) {
  const resolvedSceneId = sceneId?.trim();
  if (!resolvedSceneId) {
    throw new Error('sceneId is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const scene = tour.scenes?.[resolvedSceneId];
  if (!scene) {
    throw new Error(`Scene not found: ${resolvedSceneId}`);
  }

  const nextTitle = title?.trim();
  const hasDescription = description !== undefined;
  const nextDescription = description?.trim();
  const wantsFirstScene = Boolean(setAsFirstScene);
  const hasMap = map !== undefined && map !== null;
  const wantsClearMap = clearMap === true;

  if (
    !nextTitle &&
    !hasDescription &&
    !wantsFirstScene &&
    !hasMap &&
    !wantsClearMap
  ) {
    throw new Error(
      'At least one of title, description, setAsFirstScene, map, or clearMap is required',
    );
  }

  if (nextTitle) {
    scene.title = nextTitle;
  }

  if (hasDescription) {
    scene.description =
      nextDescription ||
      defaultSceneDescription(tour.title, scene.title ?? resolvedSceneId);
  }

  if (wantsFirstScene) {
    tour.firstScene = resolvedSceneId;
  }

  if (wantsClearMap) {
    delete scene.map;
  } else if (hasMap) {
    scene.map = normalizeMapPosition(map);
  }

  writeTourJson(tourPath, tour);
  persistTourContentPlaceholders(toursDir, tourId);
  return { tourPath, scene, firstScene: tour.firstScene };
}

export function deleteScene({ toursDir, tourId, sceneId }) {
  const resolvedSceneId = sceneId?.trim();
  if (!resolvedSceneId) {
    throw new Error('sceneId is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);

  if (!tour.scenes?.[resolvedSceneId]) {
    throw new Error(`Scene not found: ${resolvedSceneId}`);
  }
  if (resolvedSceneId === tour.firstScene) {
    throw new Error(
      'Cannot delete firstScene — set another scene as firstScene in JSON first',
    );
  }

  for (const scene of Object.values(tour.scenes)) {
    if (!Array.isArray(scene.hotspots)) continue;
    scene.hotspots = scene.hotspots.filter(
      (hotspot) =>
        !(hotspot.type === 'nav' && hotspot.targetScene === resolvedSceneId),
    );
  }

  delete tour.scenes[resolvedSceneId];
  writeTourJson(tourPath, tour);
  return { tourPath, sceneId: resolvedSceneId, firstScene: tour.firstScene };
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
