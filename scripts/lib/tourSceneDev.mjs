import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

// libvips keeps files it touches memory-mapped in its operation cache. On
// Windows that mapping blocks re-opening the same path for writing, so a second
// panorama/thumbnail re-upload to an existing file fails with an EINVAL
// "unable to open for write". Disabling the cache releases the handle after each
// write — negligible cost for dev-only image conversions.
sharp.cache(false);
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
const MODEL_UPLOAD_EXTENSIONS = new Set(['glb', 'gltf']);
const MAX_MODEL_UPLOAD_BYTES = 100 * 1024 * 1024;
/** Orbit distance when no camera pose is captured (see ThreeDViewer computeViewCameraState). */
const DEFAULT_3D_VIEW = { yaw: 0, pitch: 0, zoom: 2 };

function roundCoord(value) {
  return +Number(value).toFixed(1);
}

function isWorldHotspotPosition(position) {
  return (
    typeof position?.x === 'number' &&
    typeof position?.y === 'number' &&
    typeof position?.z === 'number'
  );
}

function isViewHotspotPosition(position) {
  return (
    typeof position?.yaw === 'number' && typeof position?.pitch === 'number'
  );
}

export function normalizeDefaultView(view) {
  const normalized = {
    yaw: roundCoord(view.yaw),
    pitch: roundCoord(view.pitch),
    zoom: view.zoom ?? 0,
  };
  if (
    view.target &&
    typeof view.target.x === 'number' &&
    typeof view.target.y === 'number' &&
    typeof view.target.z === 'number'
  ) {
    normalized.target = {
      x: +Number(view.target.x).toFixed(2),
      y: +Number(view.target.y).toFixed(2),
      z: +Number(view.target.z).toFixed(2),
    };
  }
  return normalized;
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

export function normalizeHotspotPosition(position) {
  if (isWorldHotspotPosition(position)) {
    return {
      x: +Number(position.x).toFixed(2),
      y: +Number(position.y).toFixed(2),
      z: +Number(position.z).toFixed(2),
    };
  }
  if (isViewHotspotPosition(position)) {
    return { yaw: roundCoord(position.yaw), pitch: roundCoord(position.pitch) };
  }
  throw new Error('position must have {yaw, pitch} or {x, y, z}');
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

function applyNavHotspotPreviewFields(record, { previewImage }) {
  const image = previewImage?.trim();
  if (!image) return;

  record.preview = { image };
}

function mergeNavHotspotPreview(hotspot, { previewImage }) {
  const preview = { ...(hotspot.preview ?? {}) };

  if (previewImage !== undefined) {
    const image = previewImage?.trim();
    if (image) preview.image = image;
    else delete preview.image;
  }

  if (Object.keys(preview).length) hotspot.preview = preview;
  else delete hotspot.preview;
}

export function buildNavHotspotRecord({
  name,
  position,
  targetSceneId,
  targetSceneTitle,
  instant,
  navVariant,
  previewImage,
}) {
  const targetScene = targetSceneId.trim();
  if (!targetScene) throw new Error('Target scene is required');

  const inheritedTitle = (targetSceneTitle ?? '').trim();
  const override = (name ?? '').trim();
  const displayName = override || inheritedTitle;
  if (!displayName) {
    throw new Error('Hotspot name or target scene title is required');
  }

  const slug =
    slugifyHotspotName(displayName) || slugifyHotspotName(targetScene);
  if (!slug) {
    throw new Error('Hotspot name must contain letters or numbers');
  }

  const record = {
    id: `nav-to-${slug}`,
    type: 'nav',
    position: normalizeHotspotPosition(position),
    targetScene,
  };

  if (override && override !== inheritedTitle) {
    record.label = override;
  }

  if (instant) {
    record.instant = true;
  }

  const resolvedNavVariant = parseNavHotspotVariant(navVariant);
  if (resolvedNavVariant) {
    record.navVariant = resolvedNavVariant;
  }

  applyNavHotspotPreviewFields(record, { previewImage });

  return record;
}

const NAMING_STATUSES = new Set(['open', 'closed', 'reserved', 'soon']);

function applyPopupMediaFields(popup, { videoUrl, image }) {
  const nextVideoUrl = videoUrl?.trim();
  const nextImage = image?.trim();
  if (nextVideoUrl) popup.videoUrl = nextVideoUrl;
  if (nextImage) popup.image = nextImage;
}

function applySceneVideoField(scene, videoUrl) {
  if (videoUrl === undefined) return;
  const nextVideoUrl = videoUrl?.trim();
  if (nextVideoUrl) {
    scene.videoUrl = nextVideoUrl;
  } else {
    delete scene.videoUrl;
  }
}

function applyScenePreviewVideoField(scene, previewVideoUrl) {
  if (previewVideoUrl === undefined) return;
  const nextPreviewVideoUrl = previewVideoUrl?.trim();
  if (nextPreviewVideoUrl) {
    scene.previewVideoUrl = nextPreviewVideoUrl;
  } else {
    delete scene.previewVideoUrl;
  }
}

function inheritedNamingOpportunityName(sceneTitle) {
  const title = (sceneTitle ?? '').trim();
  return title ? `${title} Naming Opportunity` : '';
}

export function buildNamingHotspotRecord({
  name,
  position,
  price,
  status,
  body,
  videoUrl,
  image,
  sceneTitle,
  sceneDescription,
  scenePreviewVideoUrl,
}) {
  const inheritedTitle = (sceneTitle ?? '').trim();
  const overrideTitle = (name ?? '').trim();
  const displayTitle = overrideTitle || inheritedTitle;
  if (!displayTitle) {
    throw new Error('Hotspot name or scene title is required');
  }

  const slug = slugifyHotspotName(displayTitle);
  const priceValue = normalizeNamingPriceStorage(price);
  const statusValue = status?.trim() || 'soon';

  if (!slug) throw new Error('Hotspot name must contain letters or numbers');
  if (!Number.isFinite(priceValue)) throw new Error('Price is required');
  if (!NAMING_STATUSES.has(statusValue)) {
    throw new Error(`Invalid naming status: ${statusValue}`);
  }

  const inheritedBody = (sceneDescription ?? '').trim();
  const overrideBody = (body ?? '').trim();
  const inheritedVideo = (scenePreviewVideoUrl ?? '').trim();
  const overrideVideo = (videoUrl ?? '').trim();

  const popup = {
    display: 'anchored',
    namingOpportunity: { price: priceValue, status: statusValue },
  };

  if (overrideTitle && overrideTitle !== inheritedTitle) {
    popup.title = overrideTitle;
    popup.namingOpportunity.name =
      inheritedNamingOpportunityName(overrideTitle);
  }

  if (overrideBody && overrideBody !== inheritedBody) {
    popup.body = overrideBody;
  }

  applyPopupMediaFields(popup, {
    videoUrl:
      overrideVideo && overrideVideo !== inheritedVideo ?
        overrideVideo
      : undefined,
    image,
  });

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

function appendTourHotspot(tour, sceneId, hotspot) {
  if (!Array.isArray(tour.hotspots)) {
    tour.hotspots = [];
  }
  const ids = new Set(tour.hotspots.map((entry) => entry.id));
  const uniqueId = resolveUniqueHotspotId(ids, hotspot.id);
  const record =
    uniqueId === hotspot.id ? { ...hotspot } : { ...hotspot, id: uniqueId };
  if (record.type !== 'nav' && !record.sceneId) {
    record.sceneId = sceneId;
  }
  tour.hotspots.push(record);
  return record;
}

function appendSceneHotspot(tour, sceneId, hotspot) {
  if (tour.viewerType === 'model3d') {
    return appendTourHotspot(tour, sceneId, hotspot);
  }

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

  if (tour.viewerType === 'model3d') {
    const tourHotspot = tour.hotspots?.find((entry) => entry.id === hotspotId);
    if (tourHotspot) {
      return { scene, hotspot: tourHotspot };
    }
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
  const { hotspot } = findSceneHotspot(tour, sceneId, resolvedHotspotId);

  if (tour.viewerType === 'model3d') {
    tour.hotspots = (tour.hotspots ?? []).filter(
      (entry) => entry.id !== resolvedHotspotId,
    );
  } else {
    const { scene } = findSceneHotspot(tour, sceneId, resolvedHotspotId);
    scene.hotspots = scene.hotspots.filter(
      (entry) => entry.id !== resolvedHotspotId,
    );
  }

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
    (!isViewHotspotPosition(position) && !isWorldHotspotPosition(position))
  ) {
    throw new Error('position must have {yaw, pitch} or {x, y, z}');
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

  if (tour.viewerType === 'model3d') {
    const thumbnailWebPath = await saveUploadedSceneThumbnailWebp({
      assetsRoot,
      root,
      tour,
      sceneId,
      fileBuffer: panoramaFileBuffer,
    });
    scene.panorama = thumbnailWebPath;
    scene.thumbnail = thumbnailWebPath;
    writeTourJson(tourPath, tour);
    return {
      tourPath,
      sceneId,
      panorama: thumbnailWebPath,
      thumbnail: thumbnailWebPath,
    };
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

export async function replaceTourModel({
  root,
  toursDir,
  assetsRoot,
  tourId,
  modelFileBuffer,
  modelFileName,
}) {
  if (!modelFileBuffer?.length) {
    throw new Error('modelFile is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  if (tour.viewerType !== 'model3d') {
    throw new Error('Tour is not a 3D model tour');
  }

  const modelWebPath = await saveUploadedTourModel({
    assetsRoot,
    root,
    tour,
    fileBuffer: modelFileBuffer,
    fileName: modelFileName,
  });
  tour.model = `${modelWebPath}?v=${Date.now()}`;

  for (const scene of Object.values(tour.scenes ?? {})) {
    if (scene.model) {
      delete scene.model;
    }
  }

  writeTourJson(tourPath, tour);
  return { tourPath, tourId, model: modelWebPath };
}

/** @deprecated Use {@link replaceTourModel} — sceneId is ignored. */
export async function replaceSceneModel(payload) {
  const { sceneId: _sceneId, ...rest } = payload;
  return replaceTourModel(rest);
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
  previewVideoUrl,
  videoUrl,
  tourTitle,
}) {
  const label = title.trim();
  const id = sceneId?.trim() || slugifyHotspotName(label);
  const panoramaPath = panorama?.trim();
  const tour = tourTitle?.trim() || 'this facility';

  if (!label) throw new Error('Scene title is required');
  if (!id) throw new Error('Scene title must contain letters or numbers');
  if (!panoramaPath) throw new Error('Panorama path is required');

  const record = {
    id,
    title: label,
    description: description?.trim() || defaultSceneDescription(tour, label),
    panorama: panoramaPath,
    defaultView: normalizeDefaultView(
      defaultView ?? { yaw: 0, pitch: 0, zoom: 17 },
    ),
    hotspots: [],
  };
  applyScenePreviewVideoField(record, previewVideoUrl);
  applySceneVideoField(record, videoUrl);
  return record;
}

export function buildDefaultModelWebPath(tour, sceneId, ext = 'glb') {
  const clientId = tour.clientId ?? tour.id;
  return `/assets/${clientId}/${tour.id}/models/${sceneId}.${ext}`;
}

/** Shared GLB path for model3d tours — one file per tour. */
export function buildDefaultTourModelWebPath(tour, ext = 'glb') {
  const clientId = tour.clientId ?? tour.id;
  return `/assets/${clientId}/${tour.id}/models/${tour.id}.${ext}`;
}

export function buildDefaultSceneThumbnailWebPath(tour, sceneId) {
  const clientId = tour.clientId ?? tour.id;
  return `/assets/${clientId}/${tour.id}/thumbnails/${sceneId}.webp`;
}

export function buildDefaultHotspotPreviewWebPath(tour, hotspotId) {
  const clientId = tour.clientId ?? tour.id;
  return `/assets/${clientId}/${tour.id}/previews/${hotspotId}.webp`;
}

export function assertModelUploadFileName(fileName) {
  const trimmed = fileName?.trim();
  if (!trimmed) throw new Error('Model file is required');
  const ext = trimmed.toLowerCase().split('.').pop();
  if (!ext || !MODEL_UPLOAD_EXTENSIONS.has(ext)) {
    throw new Error('Model must be .glb or .gltf');
  }
  return trimmed;
}

function modelExtensionFromFileName(fileName) {
  return assertModelUploadFileName(fileName).split('.').pop().toLowerCase();
}

export function buildSceneRecord3D({
  title,
  sceneId,
  model,
  thumbnail,
  defaultView,
  description,
  tourTitle,
  tour,
}) {
  const label = title.trim();
  const id = sceneId?.trim() || slugifyHotspotName(label);
  const modelPath = model?.trim();
  const tourLabel = tourTitle?.trim() || 'this facility';
  const cardImage =
    thumbnail?.trim() || buildDefaultSceneThumbnailWebPath(tour, id);

  if (!label) throw new Error('Scene title is required');
  if (!id) throw new Error('Scene title must contain letters or numbers');

  const record = {
    id,
    title: label,
    description:
      description?.trim() || defaultSceneDescription(tourLabel, label),
    panorama: cardImage,
    thumbnail: cardImage,
    defaultView: normalizeDefaultView(defaultView ?? DEFAULT_3D_VIEW),
    hotspots: [],
  };

  if (modelPath) {
    record.model = modelPath;
  }

  return record;
}

export async function saveUploadedTourModel({
  assetsRoot,
  root,
  tour,
  fileBuffer,
  fileName,
}) {
  if (!fileBuffer?.length) {
    throw new Error('Model file is empty');
  }
  if (fileBuffer.length > MAX_MODEL_UPLOAD_BYTES) {
    throw new Error('Model file is too large (max 100 MB)');
  }

  const ext = modelExtensionFromFileName(fileName);
  const webPath = buildDefaultTourModelWebPath(tour, ext);
  const filePath = resolvePanoramaFilePath(assetsRoot, webPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, fileBuffer);
  syncAssetToPublic(root, filePath, webPath);
  return webPath;
}

export async function saveUploadedModel({
  assetsRoot,
  root,
  tour,
  sceneId,
  fileBuffer,
  fileName,
}) {
  if (!fileBuffer?.length) {
    throw new Error('Model file is empty');
  }
  if (fileBuffer.length > MAX_MODEL_UPLOAD_BYTES) {
    throw new Error('Model file is too large (max 100 MB)');
  }

  const ext = modelExtensionFromFileName(fileName);
  const webPath = buildDefaultModelWebPath(tour, sceneId, ext);
  const filePath = resolvePanoramaFilePath(assetsRoot, webPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, fileBuffer);
  syncAssetToPublic(root, filePath, webPath);
  return webPath;
}

export async function saveUploadedSceneThumbnailWebp({
  assetsRoot,
  root,
  tour,
  sceneId,
  fileBuffer,
}) {
  if (!fileBuffer?.length) {
    throw new Error('Thumbnail file is empty');
  }
  if (fileBuffer.length > MAX_PANORAMA_UPLOAD_BYTES) {
    throw new Error('Thumbnail file is too large (max 50 MB)');
  }

  const webPath = buildDefaultSceneThumbnailWebPath(tour, sceneId);
  const filePath = resolvePanoramaFilePath(assetsRoot, webPath);
  mkdirSync(dirname(filePath), { recursive: true });
  await sharp(fileBuffer).webp({ quality: 85 }).toFile(filePath);
  syncAssetToPublic(root, filePath, webPath);
  return webPath;
}

export async function saveUploadedHotspotPreviewWebp({
  assetsRoot,
  root,
  tour,
  hotspotId,
  fileBuffer,
}) {
  if (!fileBuffer?.length) {
    throw new Error('Preview file is empty');
  }
  if (fileBuffer.length > MAX_PANORAMA_UPLOAD_BYTES) {
    throw new Error('Preview file is too large (max 50 MB)');
  }

  const webPath = buildDefaultHotspotPreviewWebPath(tour, hotspotId);
  const filePath = resolvePanoramaFilePath(assetsRoot, webPath);
  mkdirSync(dirname(filePath), { recursive: true });
  await sharp(fileBuffer).webp({ quality: 85 }).toFile(filePath);
  syncAssetToPublic(root, filePath, webPath);
  return webPath;
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
  modelFileBuffer,
  modelFileName,
  thumbnailFileBuffer,
  defaultView,
  description,
  previewVideoUrl,
  videoUrl,
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

  if (tour.viewerType === 'model3d') {
    if (!tour.model?.trim() && !modelFileBuffer?.length) {
      throw new Error(
        'Tour has no model — upload a GLB when creating the tour, or pass modelFile once',
      );
    }

    if (modelFileBuffer?.length) {
      const modelWebPath = await saveUploadedTourModel({
        assetsRoot,
        root,
        tour,
        fileBuffer: modelFileBuffer,
        fileName: modelFileName,
      });
      tour.model = modelWebPath;
    }

    let thumbnailWebPath;
    if (thumbnailFileBuffer?.length) {
      thumbnailWebPath = await saveUploadedSceneThumbnailWebp({
        assetsRoot,
        root,
        tour,
        sceneId: resolvedSceneId,
        fileBuffer: thumbnailFileBuffer,
      });
    }

    const record = buildSceneRecord3D({
      title,
      sceneId: resolvedSceneId,
      thumbnail: thumbnailWebPath,
      defaultView,
      description,
      tourTitle: tour.title,
      tour,
    });

    if (!tour.scenes) {
      tour.scenes = {};
    }
    tour.scenes[record.id] = record;
    writeTourJson(tourPath, tour);
    persistTourContentPlaceholders(toursDir, tourId);
    return { tourPath, scene: record };
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
    previewVideoUrl,
    videoUrl,
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
  const resolvedTargetId = targetSceneId.trim();
  const hotspot = buildNavHotspotRecord({
    name,
    position,
    targetSceneId: resolvedTargetId,
    targetSceneTitle: tour.scenes[resolvedTargetId]?.title,
    instant,
    navVariant,
    previewImage,
  });
  appendSceneHotspot(tour, sceneId, hotspot);
  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export async function createNamingHotspot({
  root,
  assetsRoot,
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
  targetView,
  previewFileBuffer,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const hostScene = tour.scenes?.[sceneId?.trim()];
  const hotspot = buildNamingHotspotRecord({
    name,
    position,
    price,
    status,
    body,
    videoUrl,
    image,
    sceneTitle: hostScene?.title,
    sceneDescription: hostScene?.description,
    scenePreviewVideoUrl: hostScene?.previewVideoUrl,
  });

  if (tour.viewerType === 'model3d') {
    if (targetView) {
      hotspot.targetView = normalizeDefaultView(targetView);
    }
    if (previewFileBuffer?.length) {
      if (!root || !assetsRoot) {
        throw new Error('Preview capture requires dev asset paths');
      }
      const previewWebPath = await saveUploadedHotspotPreviewWebp({
        assetsRoot,
        root,
        tour,
        hotspotId: hotspot.id,
        fileBuffer: previewFileBuffer,
      });
      hotspot.preview = { image: previewWebPath };
    }
  }

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

  const labelProvided = label !== undefined;
  const nextLabel = typeof label === 'string' ? label.trim() : undefined;
  const nextTargetSceneId = targetSceneId?.trim();
  const hasInstant = instant !== undefined;
  const hasNavVariant = navVariant !== undefined;
  const hasPreviewImage = previewImage !== undefined;
  const wantsClearPreview = clearPreviewImage === true;

  if (
    !labelProvided &&
    !nextTargetSceneId &&
    !hasInstant &&
    !hasNavVariant &&
    !hasPreviewImage &&
    !wantsClearPreview
  ) {
    throw new Error(
      'At least one of label, targetSceneId, instant, navVariant, previewImage, or clearPreviewImage is required',
    );
  }

  if (nextTargetSceneId) {
    assertTargetSceneExists(tour, nextTargetSceneId);
    hotspot.targetScene = nextTargetSceneId;
  }

  if (labelProvided) {
    const targetId = hotspot.targetScene?.trim() ?? '';
    const targetTitle = tour.scenes[targetId]?.title?.trim() ?? '';
    if (!nextLabel || nextLabel === targetTitle) {
      delete hotspot.label;
    } else {
      hotspot.label = nextLabel;
    }
  }

  // Nav arrival follows the target scene defaultView at runtime; drop any
  // legacy per-hotspot targetView so stale data doesn't linger.
  if (hotspot.targetView) {
    delete hotspot.targetView;
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
    mergeNavHotspotPreview(hotspot, { previewImage });
  }

  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export async function updateNamingHotspot({
  root,
  assetsRoot,
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
  targetView,
  previewFileBuffer,
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

  const titleProvided = title !== undefined;
  const nextTitle = typeof title === 'string' ? title.trim() : undefined;
  const hasPrice = price !== undefined;
  const nextStatus = status?.trim();
  const bodyProvided = body !== undefined;
  const nextBody = typeof body === 'string' ? body.trim() : undefined;
  const hasVideoUrl = videoUrl !== undefined;
  const hasImage = image !== undefined;

  const hostScene = tour.scenes?.[sceneId];
  const inheritedTitle = hostScene?.title?.trim() ?? '';
  const inheritedBody = hostScene?.description?.trim() ?? '';
  const inheritedVideo = hostScene?.previewVideoUrl?.trim() ?? '';

  if (titleProvided) {
    if (!nextTitle || nextTitle === inheritedTitle) {
      delete hotspot.popup.title;
      delete hotspot.popup.namingOpportunity.name;
    } else {
      hotspot.popup.title = nextTitle;
      hotspot.popup.namingOpportunity.name =
        inheritedNamingOpportunityName(nextTitle);
    }
  }
  if (hasPrice) {
    hotspot.popup.namingOpportunity.price = normalizeNamingPriceStorage(price);
  }
  if (nextStatus) {
    if (!NAMING_STATUSES.has(nextStatus)) {
      throw new Error(`Invalid naming status: ${nextStatus}`);
    }
    hotspot.popup.namingOpportunity.status = nextStatus;
  }
  if (bodyProvided) {
    if (!nextBody || nextBody === inheritedBody) {
      delete hotspot.popup.body;
    } else {
      hotspot.popup.body = nextBody;
    }
  }
  if (hasVideoUrl) {
    const nextVideoUrl = videoUrl?.trim();
    if (!nextVideoUrl || nextVideoUrl === inheritedVideo) {
      delete hotspot.popup.videoUrl;
    } else {
      hotspot.popup.videoUrl = nextVideoUrl;
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

  const hasTargetView = targetView !== undefined && targetView !== null;
  const hasPreviewFile = previewFileBuffer !== undefined;

  if (targetView) {
    hotspot.targetView = normalizeDefaultView(targetView);
  }

  if (previewFileBuffer?.length) {
    if (!root || !assetsRoot) {
      throw new Error('Preview capture requires dev asset paths');
    }
    const previewWebPath = await saveUploadedHotspotPreviewWebp({
      assetsRoot,
      root,
      tour,
      hotspotId: resolvedHotspotId,
      fileBuffer: previewFileBuffer,
    });
    hotspot.preview = { image: previewWebPath };
  }

  if (
    !titleProvided &&
    !hasPrice &&
    !nextStatus &&
    !bodyProvided &&
    !hasVideoUrl &&
    !hasImage &&
    !hasTargetView &&
    !hasPreviewFile
  ) {
    throw new Error(
      'At least one of title, price, status, body, videoUrl, image, targetView, or preview is required',
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

function clearMatchingNavLabelsForTargetScene(tour, targetSceneId, oldTitle) {
  const clearFrom = (hotspots) => {
    if (!Array.isArray(hotspots)) return;
    for (const hotspot of hotspots) {
      if (hotspot.type !== 'nav') continue;
      if (hotspot.targetScene !== targetSceneId) continue;
      if (hotspot.label?.trim() === oldTitle) {
        delete hotspot.label;
      }
    }
  };

  for (const scene of Object.values(tour.scenes ?? {})) {
    clearFrom(scene.hotspots);
  }
  clearFrom(tour.hotspots);
}

/** Drop NO copy overrides that still matched the previous host-scene values. */
function clearMatchingNamingInheritFields(
  scene,
  { oldTitle, oldDescription, oldPreviewVideoUrl },
) {
  if (!Array.isArray(scene?.hotspots)) return;

  const oldInheritedName =
    oldTitle ? inheritedNamingOpportunityName(oldTitle) : '';

  for (const hotspot of scene.hotspots) {
    if (hotspot.type !== 'info' || !hotspot.popup?.namingOpportunity) continue;
    const popup = hotspot.popup;

    if (oldTitle && popup.title?.trim() === oldTitle) {
      delete popup.title;
    }
    if (
      oldInheritedName &&
      popup.namingOpportunity.name?.trim() === oldInheritedName
    ) {
      delete popup.namingOpportunity.name;
    }
    if (oldDescription != null && popup.body?.trim() === oldDescription) {
      delete popup.body;
    }
    if (
      oldPreviewVideoUrl != null &&
      popup.videoUrl?.trim() === oldPreviewVideoUrl
    ) {
      delete popup.videoUrl;
    }
  }
}

export function updateScene({
  toursDir,
  tourId,
  sceneId,
  title,
  description,
  previewVideoUrl,
  videoUrl,
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
  const hasPreviewVideoUrl = previewVideoUrl !== undefined;
  const hasVideoUrl = videoUrl !== undefined;
  const wantsFirstScene = Boolean(setAsFirstScene);
  const hasMap = map !== undefined && map !== null;
  const wantsClearMap = clearMap === true;

  if (
    !nextTitle &&
    !hasDescription &&
    !hasPreviewVideoUrl &&
    !hasVideoUrl &&
    !wantsFirstScene &&
    !hasMap &&
    !wantsClearMap
  ) {
    throw new Error(
      'At least one of title, description, previewVideoUrl, videoUrl, setAsFirstScene, map, or clearMap is required',
    );
  }

  const oldTitle = scene.title?.trim() ?? '';
  const oldDescription = scene.description?.trim() ?? '';
  const oldPreviewVideoUrl = scene.previewVideoUrl?.trim() ?? '';

  if (nextTitle) {
    scene.title = nextTitle;
    if (oldTitle && oldTitle !== nextTitle) {
      clearMatchingNavLabelsForTargetScene(tour, resolvedSceneId, oldTitle);
    }
  }

  if (hasDescription) {
    scene.description =
      nextDescription ||
      defaultSceneDescription(tour.title, scene.title ?? resolvedSceneId);
  }

  if (hasPreviewVideoUrl) {
    applyScenePreviewVideoField(scene, previewVideoUrl);
  }

  if (
    (nextTitle && oldTitle && oldTitle !== nextTitle) ||
    (hasDescription && oldDescription !== (scene.description?.trim() ?? '')) ||
    (hasPreviewVideoUrl &&
      oldPreviewVideoUrl !== (scene.previewVideoUrl?.trim() ?? ''))
  ) {
    clearMatchingNamingInheritFields(scene, {
      oldTitle: nextTitle && oldTitle !== nextTitle ? oldTitle : undefined,
      oldDescription:
        hasDescription && oldDescription !== (scene.description?.trim() ?? '') ?
          oldDescription
        : undefined,
      oldPreviewVideoUrl:
        (
          hasPreviewVideoUrl &&
          oldPreviewVideoUrl !== (scene.previewVideoUrl?.trim() ?? '')
        ) ?
          oldPreviewVideoUrl
        : undefined,
    });
  }

  if (hasVideoUrl) {
    applySceneVideoField(scene, videoUrl);
  }

  if (wantsFirstScene) {
    tour.firstScene = resolvedSceneId;
  }

  if (tour.viewerType === 'model3d' && (hasMap || wantsClearMap)) {
    throw new Error('Scene map pins are not supported for model3d tours');
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

  if (Array.isArray(tour.hotspots)) {
    tour.hotspots = tour.hotspots.filter((hotspot) => {
      if (hotspot.type === 'nav' && hotspot.targetScene === resolvedSceneId) {
        return false;
      }
      if (hotspot.sceneId === resolvedSceneId && hotspot.type !== 'nav') {
        return false;
      }
      return true;
    });
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
  thumbnailFileBuffer,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const scene = tour.scenes?.[sceneId];
  if (!scene) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  const defaultView = updateSceneDefaultView(tour, sceneId, view);

  const is3D = tour.viewerType === 'model3d';
  let thumbnail;
  if (is3D) {
    if (!thumbnailFileBuffer?.length) {
      throw new Error(
        '3D thumbnail capture is required — save landing view from the dev panel while the model is visible',
      );
    }
    const thumbnailWebPath = await saveUploadedSceneThumbnailWebp({
      assetsRoot,
      root,
      tour,
      sceneId,
      fileBuffer: thumbnailFileBuffer,
    });
    scene.panorama = thumbnailWebPath;
    scene.thumbnail = thumbnailWebPath;
    thumbnail = thumbnailWebPath;
  } else {
    ({ thumbnail } = await bakeSceneThumbnail({
      root,
      assetsRoot,
      tour,
      sceneId,
      view: defaultView,
    }));
  }

  writeTourJson(tourPath, tour);
  return { tourPath, defaultView, thumbnail: thumbnail ?? null };
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
