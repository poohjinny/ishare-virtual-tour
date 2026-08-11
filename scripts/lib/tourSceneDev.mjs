import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
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
  allocateOpaqueId,
  assertEntityId,
  OPAQUE_NAMING_ID_PREFIX,
} from './opaqueId.mjs';
import {
  renderEquirectPreviewToFile,
  resolveThumbnailFilePath,
  resolveThumbnailWebPath,
} from './equirectPreviewNode.mjs';
import {
  defaultInfoBody,
  defaultNamingBody,
} from './devContentPlaceholders.mjs';
import { normalizeNamingPriceStorage } from './namingPrice.mjs';
import { namingDonorAllowsLogo, normalizeNamingDonor } from './namingDonor.mjs';
import { encodePanoramaWebp } from './panoramaEncode.mjs';
import { persistTourContentPlaceholders } from './tourContentSync.mjs';
import {
  assertSceneVisibility,
  isScenePublic,
  resolveSceneVisibility,
} from './sceneVisibility.mjs';
import { assertNamingVisibility } from './namingVisibility.mjs';
import {
  markPlaceOverviewManual,
  suppressPlaceOverviewOnDelete,
  syncPlaceOverviewFromScene,
  syncPlaceOverviewPositionToView,
  ensurePlaceOverviewHotspot,
} from './placeOverview.mjs';

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

const NAMING_STATUSES = new Set(['open', 'sold', 'reserved', 'soon']);

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
  return (sceneTitle ?? '').trim();
}

function isNamingHotspotRecord(hotspot) {
  return (
    hotspot?.type === 'info' &&
    Boolean(hotspot.namingId?.trim() || hotspot.popup?.namingOpportunity)
  );
}

function ensureNamingCatalog(tour) {
  if (
    !tour.namingOpportunities ||
    typeof tour.namingOpportunities !== 'object'
  ) {
    tour.namingOpportunities = {};
  }
  return tour.namingOpportunities;
}

function allocateNamingId(tour) {
  const catalog = ensureNamingCatalog(tour);
  return allocateOpaqueId(OPAQUE_NAMING_ID_PREFIX, Object.keys(catalog));
}

function getNamingRecordForHotspot(tour, hotspot) {
  const namingId = hotspot.namingId?.trim();
  if (namingId && tour.namingOpportunities?.[namingId]) {
    return tour.namingOpportunities[namingId];
  }
  return null;
}

/**
 * Build naming pin + catalog record fields (catalog written by caller).
 * @deprecated Prefer {@link buildNamingCatalogRecord} + {@link buildNamingPlacementHotspot}.
 */
export function buildNamingHotspotRecord(options) {
  const record = buildNamingCatalogRecord(options);
  const hotspot = buildNamingPlacementHotspot({
    namingId: options.namingId,
    displayName:
      options.name?.trim() ||
      options.sceneTitle?.trim() ||
      record.name ||
      'naming',
    position: options.position,
  });
  return { hotspot, record };
}

/** Tour-level naming catalog entry (`no_*`) — business fields only. */
export function buildNamingCatalogRecord({
  namingId,
  name,
  price,
  status,
  body,
  videoUrl,
  image,
  donor,
  visibility,
  sceneTitle,
  sceneDescription,
  scenePreviewVideoUrl,
}) {
  const inheritedTitle = (sceneTitle ?? '').trim();
  const overrideTitle = (name ?? '').trim();
  const displayTitle = overrideTitle || inheritedTitle;
  if (!displayTitle) {
    throw new Error('Naming name or scene title is required');
  }

  const priceValue = normalizeNamingPriceStorage(price);
  const statusValue = status?.trim() || 'soon';
  const resolvedNamingId = namingId?.trim();
  const nextVisibility = assertNamingVisibility(visibility);

  if (!Number.isFinite(priceValue)) throw new Error('Price is required');
  if (!NAMING_STATUSES.has(statusValue)) {
    throw new Error(`Invalid naming status: ${statusValue}`);
  }
  if (!resolvedNamingId) {
    throw new Error('namingId is required');
  }

  const inheritedBody = (sceneDescription ?? '').trim();
  const overrideBody = (body ?? '').trim();
  const inheritedVideo = (scenePreviewVideoUrl ?? '').trim();
  const overrideVideo = (videoUrl ?? '').trim();
  const overrideImage = (image ?? '').trim();
  const normalizedDonor = normalizeNamingDonor(donor, { status: statusValue });

  /** @type {Record<string, unknown>} */
  const record = {
    id: resolvedNamingId,
    price: priceValue,
    status: statusValue,
  };

  if (overrideTitle && overrideTitle !== inheritedTitle) {
    record.name = inheritedNamingOpportunityName(overrideTitle);
  }
  if (overrideBody && overrideBody !== inheritedBody) {
    record.body = overrideBody;
  }
  if (overrideVideo && overrideVideo !== inheritedVideo) {
    record.videoUrl = overrideVideo;
  }
  if (overrideImage) {
    record.image = overrideImage;
  }
  if (normalizedDonor) {
    record.donor = normalizedDonor;
  }
  if (nextVisibility && nextVisibility !== 'public') {
    record.visibility = nextVisibility;
  }

  return record;
}

/** Scene/tour placement hotspot for an existing catalog naming id. */
export function buildNamingPlacementHotspot({
  namingId,
  displayName,
  position,
}) {
  const resolvedNamingId = namingId?.trim();
  if (!resolvedNamingId) {
    throw new Error('namingId is required');
  }

  const slugSource = (displayName ?? '').trim();
  const slug = slugifyHotspotName(slugSource);
  if (!slug) {
    throw new Error('Naming display name must contain letters or numbers');
  }

  return {
    id: `info-${slug}`,
    type: 'info',
    namingId: resolvedNamingId,
    position: normalizeHotspotPosition(position),
    popup: { display: 'anchored' },
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
  const { hotspot, scene } = findSceneHotspot(tour, sceneId, resolvedHotspotId);
  const wasNaming = isNamingHotspotRecord(hotspot);
  const namingId = hotspot.namingId?.trim();
  suppressPlaceOverviewOnDelete(scene, hotspot);

  if (tour.viewerType === 'model3d') {
    tour.hotspots = (tour.hotspots ?? []).filter(
      (entry) => entry.id !== resolvedHotspotId,
    );
  } else {
    scene.hotspots = scene.hotspots.filter(
      (entry) => entry.id !== resolvedHotspotId,
    );
  }

  if (wasNaming && namingId && tour.namingOpportunities?.[namingId]) {
    const stillPlaced = [
      ...(tour.hotspots ?? []),
      ...Object.values(tour.scenes ?? {}).flatMap((s) => s.hotspots ?? []),
    ].some((entry) => entry.namingId?.trim() === namingId);
    if (!stillPlaced) {
      delete tour.namingOpportunities[namingId];
      if (Object.keys(tour.namingOpportunities).length === 0) {
        delete tour.namingOpportunities;
      }
    }
  }

  if (wasNaming) {
    syncPlaceOverviewFromScene(tour, scene);
  }

  writeTourJson(tourPath, tour);
  return { tourPath, hotspot };
}

export async function updateHotspotPosition({
  root,
  assetsRoot,
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
  markPlaceOverviewManual(hotspot);

  if (
    root &&
    assetsRoot &&
    tour.viewerType !== 'model3d' &&
    isNamingHotspotRecord(hotspot)
  ) {
    await bakeNamingHotspotPreview({
      root,
      assetsRoot,
      tour,
      sceneId,
      hotspotId: resolvedHotspotId,
    });
  }

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
  const id = sceneId?.trim();
  const panoramaPath = panorama?.trim();

  if (!label) throw new Error('Scene title is required');
  if (!id) throw new Error('Scene id is required');
  if (!panoramaPath) throw new Error('Panorama path is required');

  const record = {
    id,
    title: label,
    panorama: panoramaPath,
    defaultView: normalizeDefaultView(
      defaultView ?? { yaw: 0, pitch: 0, zoom: 17 },
    ),
    hotspots: [],
  };
  const nextDescription = description?.trim();
  if (nextDescription) {
    record.description = nextDescription;
  }
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

export function buildDefaultNamingDonorLogoWebPath(tour, hotspotId) {
  const clientId = tour.clientId ?? tour.id;
  return `/assets/${clientId}/${tour.id}/naming/${hotspotId}/donor-logo.png`;
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
  const id = sceneId?.trim();
  const modelPath = model?.trim();

  if (!label) throw new Error('Scene title is required');
  if (!id) throw new Error('Scene id is required');

  const cardImage =
    thumbnail?.trim() || buildDefaultSceneThumbnailWebPath(tour, id);

  const record = {
    id,
    title: label,
    panorama: cardImage,
    thumbnail: cardImage,
    defaultView: normalizeDefaultView(defaultView ?? DEFAULT_3D_VIEW),
    hotspots: [],
  };
  const nextDescription = description?.trim();
  if (nextDescription) {
    record.description = nextDescription;
  }

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
  await writeOgJpegSibling(filePath, root, webPath);
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
  await writeOgJpegSibling(filePath, root, webPath);
  return webPath;
}

export async function saveUploadedNamingDonorLogo({
  assetsRoot,
  root,
  tour,
  hotspotId,
  fileBuffer,
}) {
  if (!fileBuffer?.length) {
    throw new Error('Donor logo file is empty');
  }
  if (fileBuffer.length > MAX_PANORAMA_UPLOAD_BYTES) {
    throw new Error('Donor logo file is too large (max 50 MB)');
  }

  const webPath = buildDefaultNamingDonorLogoWebPath(tour, hotspotId);
  const filePath = resolvePanoramaFilePath(assetsRoot, webPath);
  mkdirSync(dirname(filePath), { recursive: true });

  // Write via temp + replace so Windows can overwrite a path that sharp or the
  // static server still has mapped from a previous upload.
  const tempPath = `${filePath}.${process.pid}.tmp.png`;
  try {
    await sharp(fileBuffer).png().toFile(tempPath);
    if (existsSync(filePath)) unlinkSync(filePath);
    renameSync(tempPath, filePath);
  } catch (error) {
    if (existsSync(tempPath)) unlinkSync(tempPath);
    throw error;
  }

  const relative = webPath.replace(/^\/assets\//, '');
  const publicPath = join(root, 'public', 'assets', relative);
  mkdirSync(dirname(publicPath), { recursive: true });
  if (existsSync(publicPath)) unlinkSync(publicPath);
  copyFileSync(filePath, publicPath);

  return webPath;
}

function syncAssetToPublic(root, assetsFilePath, webPath) {
  const relative = webPath.replace(/^\/assets\//, '');
  const publicPath = join(root, 'public', 'assets', relative);
  mkdirSync(dirname(publicPath), { recursive: true });
  copyFileSync(assetsFilePath, publicPath);
}

/** JPG sibling next to a WebP asset for social og:image (~1200×630). */
async function writeOgJpegSibling(webpFilePath, root, webPath, quality = 80) {
  if (!/\.webp$/i.test(webpFilePath)) return;
  const jpgFilePath = webpFilePath.replace(/\.webp$/i, '.jpg');
  await sharp(webpFilePath)
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality, mozjpeg: true })
    .toFile(jpgFilePath);
  if (root && webPath) {
    syncAssetToPublic(root, jpgFilePath, webPath.replace(/\.webp$/i, '.jpg'));
  }
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

  await encodePanoramaWebp(fileBuffer, filePath);
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
  createPlaceOverview = false,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const resolvedSceneId =
    sceneId?.trim() || allocateOpaqueId('s_', Object.keys(tour.scenes ?? {}));

  if (!title.trim()) throw new Error('Scene title is required');
  assertEntityId(resolvedSceneId, 'Scene id');
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
    appendSceneToOrder(tour, record.id);
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

  if (createPlaceOverview) {
    delete record.suppressPlaceOverview;
    syncPlaceOverviewFromScene(tour, record, { createIfMissing: true });
  } else {
    record.suppressPlaceOverview = true;
  }

  appendSceneToOrder(tour, record.id);
  writeTourJson(tourPath, tour);
  persistTourContentPlaceholders(toursDir, tourId);
  return { tourPath, scene: record };
}

const SCENE_DUPLICATE_NAMING_MODES = new Set(['duplicate', 'keep', 'clear']);

function collectTourHotspotIds(tour) {
  const ids = new Set();
  for (const hotspot of tour.hotspots ?? []) {
    if (hotspot?.id) ids.add(hotspot.id);
  }
  for (const scene of Object.values(tour.scenes ?? {})) {
    for (const hotspot of scene.hotspots ?? []) {
      if (hotspot?.id) ids.add(hotspot.id);
    }
  }
  return ids;
}

function copyWebAsset(assetsRoot, root, fromWeb, toWeb) {
  const from = fromWeb?.trim();
  const to = toWeb?.trim();
  if (!from || !to || from === to) return false;
  const fromPath = resolvePanoramaFilePath(assetsRoot, from);
  if (!existsSync(fromPath)) return false;
  const toPath = resolvePanoramaFilePath(assetsRoot, to);
  mkdirSync(dirname(toPath), { recursive: true });
  copyFileSync(fromPath, toPath);
  syncAssetToPublic(root, toPath, to);
  return true;
}

function insertSceneInOrderAfter(tour, sceneId, afterSceneId) {
  const id = sceneId?.trim();
  if (!id || !tour.scenes?.[id]) return ensureTourSceneOrder(tour);
  ensureTourSceneOrder(tour);
  tour.sceneOrder = tour.sceneOrder.filter((entry) => entry !== id);
  const afterIndex = tour.sceneOrder.indexOf(afterSceneId);
  if (afterIndex >= 0) {
    tour.sceneOrder.splice(afterIndex + 1, 0, id);
  } else {
    tour.sceneOrder.push(id);
  }
  return tour.sceneOrder;
}

function cloneNamingCatalogEntry(tour, sourceNamingId, assetsRoot, root) {
  const source = tour.namingOpportunities?.[sourceNamingId];
  if (!source) return null;

  const newId = allocateNamingId(tour);
  const clone = structuredClone(source);
  clone.id = newId;

  const logo = clone.donor?.logo?.trim();
  if (logo) {
    const nextLogo = buildDefaultNamingDonorLogoWebPath(tour, newId);
    if (copyWebAsset(assetsRoot, root, logo, nextLogo)) {
      clone.donor = { ...clone.donor, logo: nextLogo };
    }
  }

  tour.namingOpportunities[newId] = clone;
  return newId;
}

function remapHotspotNaming(
  hotspot,
  namingMode,
  namingIdMap,
  tour,
  assetsRoot,
  root,
) {
  if (namingMode === 'clear') {
    delete hotspot.namingId;
    if (hotspot.popup?.namingOpportunity) {
      delete hotspot.popup.namingOpportunity;
    }
    return;
  }

  if (namingMode === 'keep') return;

  const oldId = hotspot.namingId?.trim();
  if (!oldId) return;

  let nextId = namingIdMap.get(oldId);
  if (!nextId) {
    nextId = cloneNamingCatalogEntry(tour, oldId, assetsRoot, root);
    if (!nextId) {
      delete hotspot.namingId;
      return;
    }
    namingIdMap.set(oldId, nextId);
  }
  hotspot.namingId = nextId;
}

function cloneHotspotForSceneDuplicate({
  hotspot,
  existingIds,
  namingMode,
  namingIdMap,
  tour,
  assetsRoot,
  root,
  nextSceneId,
}) {
  const next = structuredClone(hotspot);
  const baseId =
    typeof next.id === 'string' && next.id.trim() ? next.id.trim() : 'hotspot';
  next.id = resolveUniqueHotspotId(existingIds, baseId);
  existingIds.add(next.id);

  if (next.sceneId != null) {
    next.sceneId = nextSceneId;
  }

  remapHotspotNaming(next, namingMode, namingIdMap, tour, assetsRoot, root);

  const previewImage = next.preview?.image?.trim();
  if (previewImage) {
    const nextPreview = buildDefaultHotspotPreviewWebPath(tour, next.id);
    if (copyWebAsset(assetsRoot, root, previewImage, nextPreview)) {
      next.preview = { ...next.preview, image: nextPreview };
    }
  }

  return next;
}

function listSceneNavTargetIds(tour, sceneId) {
  const scene = tour.scenes?.[sceneId];
  if (!scene) return [];
  const targets = [];
  const seen = new Set();
  const pushNav = (hotspot) => {
    if (hotspot?.type !== 'nav') return;
    const target = hotspot.targetScene?.trim();
    if (!target || !tour.scenes?.[target] || seen.has(target)) return;
    seen.add(target);
    targets.push(target);
  };
  for (const hotspot of scene.hotspots ?? []) pushNav(hotspot);
  for (const hotspot of tour.hotspots ?? []) {
    if (hotspot?.sceneId !== sceneId) continue;
    pushNav(hotspot);
  }
  return targets;
}

/** BFS parent map from firstScene along nav hotspots (first visit wins). */
function buildTourSceneParentMap(tour) {
  const firstSceneId = tour.firstScene?.trim();
  const parent = new Map();
  if (!firstSceneId || !tour.scenes?.[firstSceneId]) return parent;

  const queue = [firstSceneId];
  const visited = new Set([firstSceneId]);
  while (queue.length > 0) {
    const sceneId = queue.shift();
    for (const target of listSceneNavTargetIds(tour, sceneId)) {
      if (visited.has(target)) continue;
      visited.add(target);
      parent.set(target, sceneId);
      queue.push(target);
    }
  }
  return parent;
}

/**
 * Descendants of `rootId` in the tour nav BFS tree (excludes shared branches
 * reached earlier via another parent — e.g. ED under Overview, not under JB).
 */
function listBfsDescendantSceneIds(tour, rootId) {
  const parentMap = buildTourSceneParentMap(tour);
  const childrenByParent = new Map();
  for (const [childId, parentId] of parentMap) {
    const list = childrenByParent.get(parentId) ?? [];
    list.push(childId);
    childrenByParent.set(parentId, list);
  }

  const ordered = [];
  const queue = [...(childrenByParent.get(rootId) ?? [])];
  const seen = new Set(queue);
  while (queue.length > 0) {
    const sceneId = queue.shift();
    ordered.push(sceneId);
    for (const childId of childrenByParent.get(sceneId) ?? []) {
      if (seen.has(childId)) continue;
      seen.add(childId);
      queue.push(childId);
    }
  }
  return ordered;
}

function remapHotspotSceneRefs(hotspot, sceneIdMap) {
  const target = hotspot?.targetScene?.trim();
  if (target && sceneIdMap.has(target)) {
    hotspot.targetScene = sceneIdMap.get(target);
  }
  const visit = hotspot?.popup?.visitScene?.trim();
  if (visit && sceneIdMap.has(visit)) {
    hotspot.popup.visitScene = sceneIdMap.get(visit);
  }
}

/** Nudge a copied parent→child nav so it doesn't sit exactly on the original. */
function offsetDuplicateNavPosition(position) {
  if (isWorldHotspotPosition(position)) {
    return {
      x: roundCoord(position.x + 0.2),
      y: roundCoord(position.y),
      z: roundCoord(position.z),
    };
  }
  if (isViewHotspotPosition(position)) {
    const yaw = Number(position.yaw) || 0;
    return {
      yaw: roundCoord((((yaw + 10) % 360) + 360) % 360),
      pitch: roundCoord(position.pitch),
    };
  }
  return position;
}

/**
 * Copy parent→source nav pin(s) so the hub clone sits under the same parent.
 * Returns the parent scene id when a link was added.
 */
function linkCloneUnderSameParent({
  tour,
  sourceId,
  nextHubId,
  existingIds,
  assetsRoot,
  root,
}) {
  const parentMap = buildTourSceneParentMap(tour);
  const parentId = parentMap.get(sourceId);
  if (!parentId || !tour.scenes?.[parentId]) return null;

  const sourceNavs = [];
  const seen = new Set();
  const pushNav = (kind, hotspot) => {
    if (hotspot?.type !== 'nav') return;
    if (hotspot.targetScene?.trim() !== sourceId) return;
    const id = hotspot.id?.trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    sourceNavs.push({ kind, hotspot });
  };

  for (const hotspot of tour.scenes[parentId].hotspots ?? []) {
    pushNav('scene', hotspot);
  }
  for (const hotspot of tour.hotspots ?? []) {
    if (hotspot?.sceneId !== parentId) continue;
    pushNav('tour', hotspot);
  }
  if (sourceNavs.length === 0) return null;

  for (const entry of sourceNavs) {
    const next = structuredClone(entry.hotspot);
    const baseId =
      typeof next.id === 'string' && next.id.trim() ? next.id.trim() : 'nav';
    next.id = resolveUniqueHotspotId(existingIds, baseId);
    existingIds.add(next.id);
    next.targetScene = nextHubId;
    delete next.label;
    next.position = offsetDuplicateNavPosition(next.position);

    const previewImage = next.preview?.image?.trim();
    if (previewImage) {
      const nextPreview = buildDefaultHotspotPreviewWebPath(tour, next.id);
      if (copyWebAsset(assetsRoot, root, previewImage, nextPreview)) {
        next.preview = { ...next.preview, image: nextPreview };
      }
    }

    if (entry.kind === 'tour' || tour.viewerType === 'model3d') {
      appendTourHotspot(tour, parentId, next);
    } else {
      appendSceneHotspot(tour, parentId, next);
    }
  }

  return parentId;
}

/** Strip trailing ` (copy)` / ` (copy N)` suffixes from a display title. */
export function stripDuplicateCopySuffix(title) {
  let next = typeof title === 'string' ? title.trim() : '';
  if (!next) return '';
  // Repeat so "Name (copy) (copy)" → "Name".
  while (/\s*\(copy(?:\s+\d+)?\)$/i.test(next)) {
    next = next.replace(/\s*\(copy(?:\s+\d+)?\)$/i, '').trim();
  }
  return next;
}

/**
 * Hub duplicate title: never stack `(copy)`.
 * Uses `Base (copy)`, then `Base (copy 2)`, …
 */
export function nextDuplicateCopyTitle(baseTitle, existingTitles) {
  const base = stripDuplicateCopySuffix(baseTitle) || 'Untitled';
  const taken = new Set(
    [...(existingTitles ?? [])]
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean),
  );
  let candidate = `${base} (copy)`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base} (copy ${n})`;
    n += 1;
  }
  return candidate;
}

async function cloneSceneRecordForDuplicate({
  tour,
  sourceId,
  root,
  assetsRoot,
  existingIds,
  namingMode,
  namingIdMap,
  /** `'hub'` appends a unique `(copy)` suffix; `'child'` keeps a clean title. */
  titleMode = 'hub',
}) {
  const source = tour.scenes?.[sourceId];
  if (!source) throw new Error(`Scene not found: ${sourceId}`);

  const nextId = allocateOpaqueId('s_', Object.keys(tour.scenes ?? {}));
  assertEntityId(nextId, 'Scene id');

  const nextScene = structuredClone(source);
  nextScene.id = nextId;
  const sourceTitle = source.title?.trim() || sourceId;
  if (titleMode === 'child') {
    nextScene.title = stripDuplicateCopySuffix(sourceTitle) || sourceTitle;
  } else {
    nextScene.title = nextDuplicateCopyTitle(
      sourceTitle,
      Object.values(tour.scenes ?? {}).map((scene) => scene?.title),
    );
  }

  if (tour.viewerType === 'model3d') {
    const thumbFrom = source.thumbnail?.trim() || source.panorama?.trim() || '';
    const thumbTo = buildDefaultSceneThumbnailWebPath(tour, nextId);
    if (thumbFrom && copyWebAsset(assetsRoot, root, thumbFrom, thumbTo)) {
      nextScene.thumbnail = thumbTo;
      nextScene.panorama = thumbTo;
    } else {
      nextScene.thumbnail = thumbTo;
      nextScene.panorama = thumbTo;
    }
    delete nextScene.model;
  } else {
    const panoramaFrom = source.panorama?.trim();
    if (!panoramaFrom) {
      throw new Error(`Scene "${sourceId}" is missing panorama`);
    }
    const panoramaTo = buildDefaultPanoramaWebPath(tour, nextId);
    if (!copyWebAsset(assetsRoot, root, panoramaFrom, panoramaTo)) {
      throw new Error(`Could not copy panorama for scene "${sourceId}"`);
    }
    nextScene.panorama = panoramaTo;

    const thumbFrom = source.thumbnail?.trim();
    const thumbTo = buildDefaultSceneThumbnailWebPath(tour, nextId);
    if (thumbFrom && copyWebAsset(assetsRoot, root, thumbFrom, thumbTo)) {
      nextScene.thumbnail = thumbTo;
    } else {
      delete nextScene.thumbnail;
    }
  }

  const sourceHotspots = Array.isArray(source.hotspots) ? source.hotspots : [];
  nextScene.hotspots = sourceHotspots.map((hotspot) =>
    cloneHotspotForSceneDuplicate({
      hotspot,
      existingIds,
      namingMode,
      namingIdMap,
      tour,
      assetsRoot,
      root,
      nextSceneId: nextId,
    }),
  );

  if (!tour.scenes) tour.scenes = {};
  tour.scenes[nextId] = nextScene;

  if (
    tour.viewerType !== 'model3d' &&
    !nextScene.thumbnail?.trim() &&
    nextScene.panorama?.trim()
  ) {
    await bakeSceneThumbnail({
      root,
      assetsRoot,
      tour,
      sceneId: nextId,
      view: nextScene.defaultView,
    });
  }

  if (Array.isArray(tour.hotspots) && tour.hotspots.length > 0) {
    const clonedTourHotspots = [];
    for (const hotspot of tour.hotspots) {
      if (hotspot?.sceneId !== sourceId) continue;
      clonedTourHotspots.push(
        cloneHotspotForSceneDuplicate({
          hotspot,
          existingIds,
          namingMode,
          namingIdMap,
          tour,
          assetsRoot,
          root,
          nextSceneId: nextId,
        }),
      );
    }
    if (clonedTourHotspots.length > 0) {
      tour.hotspots = [...tour.hotspots, ...clonedTourHotspots];
    }
  }

  return nextScene;
}

/**
 * Clone a scene (assets + hotspots). Inserts the copy after the source in sceneOrder.
 * @param {'duplicate'|'keep'|'clear'} namingMode
 *   duplicate — clone naming catalog entries (recommended for similar floors)
 *   keep — share the same namingId references
 *   clear — strip naming pins
 * @param {boolean} [includeChildren=false]
 *   When true, also clone BFS descendants under this scene and remap navs
 *   among the copies (Overview / shared hubs stay shared).
 * @param {boolean} [linkUnderSameParent=true]
 *   When true, copy parent→source nav pin(s) so the hub clone sits under the
 *   same parent in the tour hierarchy.
 */
export async function duplicateScene({
  root,
  toursDir,
  assetsRoot,
  tourId,
  sceneId,
  namingMode = 'duplicate',
  includeChildren = false,
  linkUnderSameParent = true,
}) {
  const mode = String(namingMode ?? 'duplicate')
    .trim()
    .toLowerCase();
  if (!SCENE_DUPLICATE_NAMING_MODES.has(mode)) {
    throw new Error('namingMode must be duplicate, keep, or clear');
  }

  const sourceId = sceneId?.trim();
  if (!sourceId) throw new Error('sceneId is required');

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const source = tour.scenes?.[sourceId];
  if (!source) throw new Error(`Scene not found: ${sourceId}`);

  const cloneIds = [sourceId];
  if (includeChildren) {
    cloneIds.push(...listBfsDescendantSceneIds(tour, sourceId));
  }

  const existingIds = collectTourHotspotIds(tour);
  const namingIdMap = new Map();
  const sceneIdMap = new Map();
  const clonedScenes = [];

  for (const oldId of cloneIds) {
    const nextScene = await cloneSceneRecordForDuplicate({
      tour,
      sourceId: oldId,
      root,
      assetsRoot,
      existingIds,
      namingMode: mode,
      namingIdMap,
      // Only the duplicated hub gets "(copy)"; child places keep clean titles.
      titleMode: oldId === sourceId ? 'hub' : 'child',
    });
    sceneIdMap.set(oldId, nextScene.id);
    clonedScenes.push(nextScene);
  }

  for (const nextScene of clonedScenes) {
    for (const hotspot of nextScene.hotspots ?? []) {
      remapHotspotSceneRefs(hotspot, sceneIdMap);
    }
  }
  const clonedHostIds = new Set(sceneIdMap.values());
  for (const hotspot of tour.hotspots ?? []) {
    const hostId = hotspot?.sceneId?.trim();
    if (!hostId || !clonedHostIds.has(hostId)) continue;
    remapHotspotSceneRefs(hotspot, sceneIdMap);
  }

  const nextHubId = sceneIdMap.get(sourceId);
  let linkedParentId = null;
  if (linkUnderSameParent && nextHubId) {
    linkedParentId = linkCloneUnderSameParent({
      tour,
      sourceId,
      nextHubId,
      existingIds,
      assetsRoot,
      root,
    });
  }

  let insertAfter = sourceId;
  for (const nextScene of clonedScenes) {
    insertSceneInOrderAfter(tour, nextScene.id, insertAfter);
    insertAfter = nextScene.id;
  }

  writeTourJson(tourPath, tour);
  persistTourContentPlaceholders(toursDir, tourId);
  return {
    tourPath,
    scene: clonedScenes[0],
    sourceSceneId: sourceId,
    clonedSceneIds: clonedScenes.map((entry) => entry.id),
    linkedParentId,
  };
}

/**
 * Clone a naming catalog entry (`no_*`).
 * @param {boolean} [includePlacements=true] — also clone placement hotspot(s)
 * @param {boolean} [resetAsOpen=false] — set status to open and clear donor
 */
export async function duplicateNamingOpportunity({
  root,
  toursDir,
  assetsRoot,
  tourId,
  namingId,
  includePlacements = true,
  resetAsOpen = false,
}) {
  const sourceId = namingId?.trim();
  if (!sourceId) throw new Error('namingId is required');

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const source = tour.namingOpportunities?.[sourceId];
  if (!source) {
    throw new Error(`Naming opportunity not found: ${sourceId}`);
  }

  const nextId = cloneNamingCatalogEntry(tour, sourceId, assetsRoot, root);
  if (!nextId) {
    throw new Error(`Could not clone naming opportunity: ${sourceId}`);
  }

  const record = tour.namingOpportunities[nextId];
  const placementRefs = [];
  const seenPlacementIds = new Set();

  const pushPlacement = (kind, sceneId, hotspot) => {
    const hotspotId = hotspot?.id?.trim();
    if (!hotspotId || seenPlacementIds.has(hotspotId)) return;
    seenPlacementIds.add(hotspotId);
    placementRefs.push({ kind, sceneId, hotspot });
  };

  for (const hotspot of tour.hotspots ?? []) {
    if (hotspot?.namingId?.trim() === sourceId) {
      pushPlacement('tour', hotspot.sceneId?.trim() || undefined, hotspot);
    }
  }

  if (tour.viewerType !== 'model3d') {
    for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
      for (const hotspot of scene.hotspots ?? []) {
        if (hotspot?.namingId?.trim() === sourceId) {
          pushPlacement('scene', sceneId, hotspot);
        }
      }
    }
  }

  const hostSceneId =
    placementRefs.find((entry) => entry.sceneId)?.sceneId ||
    Object.keys(tour.scenes ?? {})[0];
  const hostScene = hostSceneId ? tour.scenes?.[hostSceneId] : undefined;
  const displayBase =
    record.name?.trim() ||
    source.name?.trim() ||
    hostScene?.title?.trim() ||
    sourceId;
  record.name = nextDuplicateCopyTitle(
    displayBase,
    Object.values(tour.namingOpportunities ?? {}).map((entry) => entry?.name),
  );

  if (resetAsOpen) {
    record.status = 'open';
    delete record.donor;
  }

  const clonedHotspots = [];
  if (includePlacements && placementRefs.length > 0) {
    const existingIds = collectTourHotspotIds(tour);
    const touchedSceneIds = new Set();

    for (const entry of placementRefs) {
      const next = structuredClone(entry.hotspot);
      const baseId =
        typeof next.id === 'string' && next.id.trim() ?
          next.id.trim()
        : 'hotspot';
      next.id = resolveUniqueHotspotId(existingIds, baseId);
      existingIds.add(next.id);
      next.namingId = nextId;

      const previewImage = next.preview?.image?.trim();
      if (previewImage) {
        const nextPreview = buildDefaultHotspotPreviewWebPath(tour, next.id);
        if (copyWebAsset(assetsRoot, root, previewImage, nextPreview)) {
          next.preview = { ...next.preview, image: nextPreview };
        }
      }

      if (entry.kind === 'tour' || tour.viewerType === 'model3d') {
        const sceneIdForAppend =
          entry.sceneId || next.sceneId?.trim() || hostSceneId;
        if (!sceneIdForAppend) {
          throw new Error('Could not resolve scene for naming placement clone');
        }
        clonedHotspots.push(appendTourHotspot(tour, sceneIdForAppend, next));
        touchedSceneIds.add(sceneIdForAppend);
      } else {
        clonedHotspots.push(appendSceneHotspot(tour, entry.sceneId, next));
        touchedSceneIds.add(entry.sceneId);
      }
    }

    for (const sceneId of touchedSceneIds) {
      const scene = tour.scenes?.[sceneId];
      if (scene) syncPlaceOverviewFromScene(tour, scene);
    }
  }

  writeTourJson(tourPath, tour);
  return {
    tourPath,
    record,
    sourceNamingId: sourceId,
    hotspots: clonedHotspots,
  };
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

export async function createNamingOpportunity({
  root,
  assetsRoot,
  toursDir,
  tourId,
  sceneId,
  name,
  price,
  status,
  body,
  videoUrl,
  image,
  donor,
  visibility,
  donorLogoFileBuffer,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const hostScene = tour.scenes?.[sceneId?.trim()];
  const namingId = allocateNamingId(tour);
  const record = buildNamingCatalogRecord({
    namingId,
    name,
    price,
    status,
    body,
    videoUrl,
    image,
    donor,
    visibility,
    sceneTitle: hostScene?.title,
    sceneDescription: hostScene?.description,
    scenePreviewVideoUrl: hostScene?.previewVideoUrl,
  });

  if (donorLogoFileBuffer?.length) {
    if (!root || !assetsRoot) {
      throw new Error('Donor logo upload requires dev asset paths');
    }
    if (!record.donor) {
      throw new Error('Donor name is required before uploading a logo');
    }
    if (!namingDonorAllowsLogo(record.donor)) {
      throw new Error(
        'Donor affiliation is required before uploading a logo for a person',
      );
    }
    const logoWebPath = await saveUploadedNamingDonorLogo({
      assetsRoot,
      root,
      tour,
      hotspotId: namingId,
      fileBuffer: donorLogoFileBuffer,
    });
    record.donor.logo = logoWebPath;
  }

  ensureNamingCatalog(tour)[namingId] = record;
  writeTourJson(tourPath, tour);
  return { tourPath, record };
}

export async function createNamingHotspot({
  root,
  assetsRoot,
  toursDir,
  tourId,
  sceneId,
  namingId,
  position,
  targetView,
  previewFileBuffer,
}) {
  const resolvedNamingId = namingId?.trim();
  if (!resolvedNamingId) {
    throw new Error('namingId is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const hostScene = tour.scenes?.[sceneId?.trim()];
  const record = tour.namingOpportunities?.[resolvedNamingId];
  if (!record) {
    throw new Error(`Naming opportunity not found: ${resolvedNamingId}`);
  }

  const displayName =
    record.name?.trim() || hostScene?.title?.trim() || resolvedNamingId;
  const hotspot = buildNamingPlacementHotspot({
    namingId: resolvedNamingId,
    displayName,
    position,
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
  if (hostScene) {
    syncPlaceOverviewFromScene(tour, hostScene);
  }

  if (tour.viewerType !== 'model3d' && root && assetsRoot) {
    await bakeNamingHotspotPreview({
      root,
      assetsRoot,
      tour,
      sceneId,
      hotspotId: hotspot.id,
    });
  }

  writeTourJson(tourPath, tour);
  return { tourPath, hotspot, record };
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

export function createPlaceOverviewHotspot({
  toursDir,
  tourId,
  sceneId,
  position,
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

  const { hotspot } = ensurePlaceOverviewHotspot(tour, scene, position);
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
  namingId: nextNamingIdInput,
  title,
  price,
  status,
  body,
  videoUrl,
  image,
  donor,
  visibility,
  donorLogoFileBuffer,
  clearDonorLogo,
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

  if (!isNamingHotspotRecord(hotspot)) {
    throw new Error(
      `Hotspot is not a naming opportunity: ${resolvedHotspotId}`,
    );
  }

  if (!hotspot.popup) {
    hotspot.popup = { display: 'anchored' };
  }

  let namingId = hotspot.namingId?.trim();
  if (!namingId) {
    // Legacy embed still present — promote into catalog
    namingId = allocateNamingId(tour);
    hotspot.namingId = namingId;
    const legacy = hotspot.popup.namingOpportunity ?? { price: 0 };
    ensureNamingCatalog(tour)[namingId] = {
      id: namingId,
      price: normalizeNamingPriceStorage(legacy.price ?? 0),
      ...(legacy.name?.trim() ? { name: legacy.name.trim() } : {}),
      ...(legacy.priceLabel?.trim() ?
        { priceLabel: legacy.priceLabel.trim() }
      : {}),
      ...(legacy.status?.trim() ? { status: legacy.status.trim() } : {}),
      ...(legacy.donor ? { donor: legacy.donor } : {}),
    };
    delete hotspot.popup.namingOpportunity;
  }

  const catalog = ensureNamingCatalog(tour);
  const namingIdProvided = nextNamingIdInput !== undefined;
  const nextNamingId =
    typeof nextNamingIdInput === 'string' ?
      nextNamingIdInput.trim()
    : undefined;

  if (namingIdProvided) {
    if (!nextNamingId) {
      throw new Error('namingId cannot be empty');
    }
    if (!catalog[nextNamingId]) {
      throw new Error(`Naming opportunity not found: ${nextNamingId}`);
    }
    if (nextNamingId !== namingId) {
      hotspot.namingId = nextNamingId;
      // Drop placement copy overrides — they belonged to the previous NO.
      delete hotspot.popup.title;
      delete hotspot.popup.body;
      delete hotspot.popup.videoUrl;
      delete hotspot.popup.image;
      namingId = nextNamingId;
    }
  }

  const record = catalog[namingId] ?? { id: namingId, price: 0 };
  catalog[namingId] = record;

  const titleProvided = title !== undefined;
  const nextTitle = typeof title === 'string' ? title.trim() : undefined;
  const hasPrice = price !== undefined;
  const nextStatus = status?.trim();
  const bodyProvided = body !== undefined;
  const nextBody = typeof body === 'string' ? body.trim() : undefined;
  const hasVideoUrl = videoUrl !== undefined;
  const hasImage = image !== undefined;
  const hasDonor = donor !== undefined;
  const hasVisibility = visibility !== undefined;
  const nextVisibility =
    hasVisibility ? assertNamingVisibility(visibility) : undefined;
  const hasDonorLogoFile = Boolean(donorLogoFileBuffer?.length);
  const wantsClearDonorLogo = Boolean(clearDonorLogo);

  const hostScene = tour.scenes?.[sceneId];
  const inheritedTitle = hostScene?.title?.trim() ?? '';
  const inheritedBody = hostScene?.description?.trim() ?? '';
  const inheritedVideo = hostScene?.previewVideoUrl?.trim() ?? '';

  if (titleProvided) {
    if (!nextTitle || nextTitle === inheritedTitle) {
      delete hotspot.popup.title;
      delete record.name;
    } else {
      hotspot.popup.title = nextTitle;
      record.name = inheritedNamingOpportunityName(nextTitle);
    }
  }
  if (hasPrice) {
    record.price = normalizeNamingPriceStorage(price);
  }
  if (nextStatus) {
    if (!NAMING_STATUSES.has(nextStatus)) {
      throw new Error(`Invalid naming status: ${nextStatus}`);
    }
    record.status = nextStatus;
  }
  if (bodyProvided) {
    if (!nextBody || nextBody === inheritedBody) {
      delete hotspot.popup.body;
      delete record.body;
    } else {
      record.body = nextBody;
      delete hotspot.popup.body;
    }
  }
  if (hasVideoUrl) {
    const nextVideoUrl = videoUrl?.trim();
    if (!nextVideoUrl || nextVideoUrl === inheritedVideo) {
      delete record.videoUrl;
    } else {
      record.videoUrl = nextVideoUrl;
    }
    delete hotspot.popup.videoUrl;
  }
  if (hasImage) {
    const nextImage = image?.trim();
    if (nextImage) {
      record.image = nextImage;
    } else {
      delete record.image;
    }
    delete hotspot.popup.image;
  }
  if (hasVisibility) {
    if (!nextVisibility || nextVisibility === 'public') {
      delete record.visibility;
    } else {
      record.visibility = nextVisibility;
    }
  }

  const effectiveStatus = record.status;
  if (hasDonor) {
    const existingLogo = record.donor?.logo;
    const normalizedDonor = normalizeNamingDonor(
      {
        ...(donor && typeof donor === 'object' ? donor : {}),
        logo:
          donor && typeof donor === 'object' && donor.logo !== undefined ?
            donor.logo
          : existingLogo,
      },
      { status: effectiveStatus },
    );
    if (normalizedDonor) {
      record.donor = normalizedDonor;
    } else {
      delete record.donor;
    }
  } else if (nextStatus && nextStatus !== 'sold') {
    delete record.donor;
  }

  if (hasDonorLogoFile) {
    if (!root || !assetsRoot) {
      throw new Error('Donor logo upload requires dev asset paths');
    }
    if (!record.donor) {
      throw new Error('Donor name is required before uploading a logo');
    }
    if (!namingDonorAllowsLogo(record.donor)) {
      throw new Error(
        'Donor affiliation is required before uploading a logo for a person',
      );
    }
    const logoWebPath = await saveUploadedNamingDonorLogo({
      assetsRoot,
      root,
      tour,
      hotspotId: resolvedHotspotId,
      fileBuffer: donorLogoFileBuffer,
    });
    record.donor.logo = logoWebPath;
  } else if (wantsClearDonorLogo && record.donor) {
    delete record.donor.logo;
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
    !namingIdProvided &&
    !titleProvided &&
    !hasPrice &&
    !nextStatus &&
    !bodyProvided &&
    !hasVideoUrl &&
    !hasImage &&
    !hasDonor &&
    !hasDonorLogoFile &&
    !wantsClearDonorLogo &&
    !hasTargetView &&
    !hasPreviewFile
  ) {
    throw new Error(
      'At least one of namingId, title, price, status, body, videoUrl, image, donor, donor logo, targetView, or preview is required',
    );
  }

  if (hostScene) {
    syncPlaceOverviewFromScene(tour, hostScene);
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

  if (
    hotspot.type !== 'info' ||
    (!hotspot.popup && !isNamingHotspotRecord(hotspot))
  ) {
    throw new Error(`Hotspot is not info: ${resolvedHotspotId}`);
  }
  if (isNamingHotspotRecord(hotspot)) {
    throw new Error(
      `Hotspot is a naming opportunity — use naming update: ${resolvedHotspotId}`,
    );
  }
  if (!hotspot.popup) {
    throw new Error(`Hotspot is not info: ${resolvedHotspotId}`);
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
  tour,
  scene,
  { oldTitle, oldDescription, oldPreviewVideoUrl },
) {
  if (!Array.isArray(scene?.hotspots)) return;

  const oldInheritedName =
    oldTitle ? inheritedNamingOpportunityName(oldTitle) : '';
  const catalog = tour.namingOpportunities ?? {};

  for (const hotspot of scene.hotspots) {
    if (!isNamingHotspotRecord(hotspot)) continue;
    const popup = hotspot.popup ?? {};
    const record = getNamingRecordForHotspot(tour, hotspot);

    if (oldTitle && popup.title?.trim() === oldTitle) {
      delete popup.title;
    }
    if (
      record &&
      oldInheritedName &&
      record.name?.trim() === oldInheritedName
    ) {
      delete record.name;
    }
    if (oldDescription != null) {
      if (popup.body?.trim() === oldDescription) {
        delete popup.body;
      }
      if (record?.body?.trim() === oldDescription) {
        delete record.body;
      }
    }
    if (
      oldPreviewVideoUrl != null &&
      popup.videoUrl?.trim() === oldPreviewVideoUrl
    ) {
      delete popup.videoUrl;
    }
    if (
      record &&
      oldPreviewVideoUrl != null &&
      record.videoUrl?.trim() === oldPreviewVideoUrl
    ) {
      delete record.videoUrl;
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
  visibility,
  setAsFirstScene,
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
  const hasVisibility = visibility !== undefined;
  const nextVisibility =
    hasVisibility ? assertSceneVisibility(visibility) : undefined;
  const wantsFirstScene = Boolean(setAsFirstScene);

  if (
    !nextTitle &&
    !hasDescription &&
    !hasPreviewVideoUrl &&
    !hasVideoUrl &&
    !hasVisibility &&
    !wantsFirstScene
  ) {
    throw new Error(
      'At least one of title, description, previewVideoUrl, videoUrl, visibility, or setAsFirstScene is required',
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
    if (nextDescription) {
      scene.description = nextDescription;
    } else {
      delete scene.description;
    }
  }

  // Legacy bake field — drop if still present.
  if ('placeLead' in scene) {
    delete scene.placeLead;
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
    clearMatchingNamingInheritFields(tour, scene, {
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

  if (hasVisibility) {
    if (nextVisibility === undefined || nextVisibility === 'public') {
      delete scene.visibility;
    } else {
      scene.visibility = nextVisibility;
    }
  }

  if (wantsFirstScene) {
    if (!isScenePublic(scene)) {
      throw new Error(
        'firstScene must stay public — set visibility to Public before making this the first scene',
      );
    }
    tour.firstScene = resolvedSceneId;
  }

  if (resolvedSceneId === tour.firstScene && !isScenePublic(scene)) {
    throw new Error(
      'firstScene must stay public — cannot set visibility to unlisted or internal',
    );
  }

  syncPlaceOverviewFromScene(tour, scene);

  writeTourJson(tourPath, tour);
  persistTourContentPlaceholders(toursDir, tourId);
  return {
    tourPath,
    scene: {
      id: scene.id,
      title: scene.title,
      visibility: resolveSceneVisibility(scene),
    },
    firstScene: tour.firstScene,
  };
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
  removeSceneFromOrder(tour, resolvedSceneId);
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

/**
 * Keep authored Explore / Play order in sync with `tour.scenes`.
 * Missing `sceneOrder` is seeded from current scene keys (stable Object.keys).
 */
export function ensureTourSceneOrder(tour) {
  const known = new Set(Object.keys(tour.scenes ?? {}));
  const seen = new Set();
  const next = [];

  const authored = Array.isArray(tour.sceneOrder) ? tour.sceneOrder : [];
  for (const raw of authored) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!id || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }

  for (const id of Object.keys(tour.scenes ?? {})) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }

  tour.sceneOrder = next;
  return next;
}

export function appendSceneToOrder(tour, sceneId) {
  const id = sceneId?.trim();
  if (!id || !tour.scenes?.[id]) return ensureTourSceneOrder(tour);
  ensureTourSceneOrder(tour);
  if (!tour.sceneOrder.includes(id)) {
    tour.sceneOrder.push(id);
  }
  return tour.sceneOrder;
}

export function removeSceneFromOrder(tour, sceneId) {
  const id = sceneId?.trim();
  if (!id) return ensureTourSceneOrder(tour);
  if (!Array.isArray(tour.sceneOrder)) {
    return ensureTourSceneOrder(tour);
  }
  tour.sceneOrder = tour.sceneOrder.filter((entry) => entry !== id);
  return ensureTourSceneOrder(tour);
}

/**
 * Replace authored scene order. Payload must list every scene id exactly once.
 */
export function updateSceneOrder({ toursDir, tourId, sceneOrder }) {
  if (!Array.isArray(sceneOrder)) {
    throw new Error('sceneOrder must be an array of scene ids');
  }

  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const known = Object.keys(tour.scenes ?? {});
  const knownSet = new Set(known);

  const next = [];
  const seen = new Set();
  for (const raw of sceneOrder) {
    if (typeof raw !== 'string') {
      throw new Error('sceneOrder entries must be strings');
    }
    const id = raw.trim();
    if (!id) continue;
    if (!knownSet.has(id)) {
      throw new Error(`Unknown scene id in sceneOrder: ${id}`);
    }
    if (seen.has(id)) {
      throw new Error(`Duplicate scene id in sceneOrder: ${id}`);
    }
    seen.add(id);
    next.push(id);
  }

  if (next.length !== known.length) {
    throw new Error(
      `sceneOrder must include every scene exactly once (got ${next.length}, expected ${known.length})`,
    );
  }

  tour.sceneOrder = next;
  writeTourJson(tourPath, tour);
  return { tourPath, sceneOrder: next };
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

  const jpgFilePath = thumbnailFilePath.replace(/\.webp$/i, '.jpg');
  const jpgWebPath = thumbnailWebPath.replace(/\.webp$/i, '.jpg');
  if (jpgFilePath !== thumbnailFilePath && existsSync(jpgFilePath)) {
    const jpgPublic = join(
      root,
      'public',
      'assets',
      jpgWebPath.replace(/^\/assets\//, ''),
    );
    mkdirSync(dirname(jpgPublic), { recursive: true });
    copyFileSync(jpgFilePath, jpgPublic);
  }
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

/**
 * Panorama naming pin → baked Explore card preview at hotspot.position
 * (same pose as resolveNamingDirectoryPreviewView). model3d uses capture upload.
 */
export function resolveNamingHotspotBakeView(tour, scene, hotspot) {
  if (tour?.viewerType === 'model3d') return null;
  const pos = hotspot?.position;
  if (typeof pos?.yaw !== 'number' || typeof pos?.pitch !== 'number') {
    return null;
  }
  return {
    yaw: pos.yaw,
    pitch: pos.pitch,
    zoom: pos.zoom ?? scene?.defaultView?.zoom ?? 50,
  };
}

export async function bakeNamingHotspotPreview({
  root,
  assetsRoot,
  tour,
  sceneId,
  hotspotId,
}) {
  if (tour.viewerType === 'model3d') {
    return null;
  }

  const resolvedSceneId = sceneId?.trim();
  const resolvedHotspotId = hotspotId?.trim();
  if (!resolvedSceneId || !resolvedHotspotId) {
    throw new Error('sceneId and hotspotId are required');
  }

  const scene = tour.scenes?.[resolvedSceneId];
  if (!scene?.panorama) {
    throw new Error(`Scene "${resolvedSceneId}" is missing panorama`);
  }

  const { hotspot } = findSceneHotspot(
    tour,
    resolvedSceneId,
    resolvedHotspotId,
  );
  if (!isNamingHotspotRecord(hotspot)) {
    throw new Error(
      `Hotspot is not a naming opportunity: ${resolvedHotspotId}`,
    );
  }

  const renderView = resolveNamingHotspotBakeView(tour, scene, hotspot);
  if (!renderView) {
    throw new Error(
      `Naming hotspot "${resolvedHotspotId}" needs {yaw, pitch} position to bake`,
    );
  }

  const previewWebPath = buildDefaultHotspotPreviewWebPath(
    tour,
    resolvedHotspotId,
  );
  const previewFilePath = resolveThumbnailFilePath(assetsRoot, previewWebPath);
  const panoramaFilePath = resolvePanoramaFilePath(assetsRoot, scene.panorama);

  mkdirSync(dirname(previewFilePath), { recursive: true });
  await renderEquirectPreviewToFile(
    panoramaFilePath,
    renderView,
    previewFilePath,
    { width: THUMBNAIL_WIDTH, quality: THUMBNAIL_QUALITY },
  );

  hotspot.preview = { image: previewWebPath };
  syncThumbnailToPublic(root, previewFilePath, previewWebPath);

  return { previewImage: previewWebPath, view: renderView };
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
  syncPlaceOverviewPositionToView(tour, scene, defaultView);

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
