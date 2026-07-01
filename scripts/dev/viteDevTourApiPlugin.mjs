import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import {
  applySceneLanding,
  assertPanoramaUploadFileName,
  createNamingHotspot,
  createInfoHotspot,
  createNavHotspot,
  createScene,
  deleteHotspot,
  deleteScene,
  readTourJson,
  replaceScenePanorama,
  resolveTourJsonPath,
  updateHotspotPosition,
  updateInfoHotspot,
  updateNavHotspot,
  updateNamingHotspot,
  updateScene,
} from '../lib/tourSceneDev.mjs';
import { createTour, listCatalogClients } from '../lib/tourCreateDev.mjs';
import { createClient, updateClient } from '../lib/clientDev.mjs';
import { updateTour, findCatalogTourEntry } from '../lib/tourUpdateDev.mjs';
import {
  deleteTour,
  validateDeleteTourPayload,
} from '../lib/tourDeleteDev.mjs';
import {
  clearTourFloorPlan,
  updateTourFloorPlan,
  validateUpdateTourFloorPlanPayload,
} from '../lib/tourFloorPlanDev.mjs';
import {
  normalizePrimaryColor,
  suggestBrandingFromWebsite,
} from '../lib/tourBrandDev.mjs';
import { suggestContactFromWebsite } from '../lib/tourContactDev.mjs';
import {
  readKnowledgeJson,
  updateKnowledge,
  validateUpdateKnowledgePayload,
  buildKnowledgeStub,
} from '../lib/tourKnowledgeDev.mjs';

const RESERVED_TOUR_API_IDS = new Set([
  'create',
  'update',
  'delete',
  'suggest-branding',
]);

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const toursDir = join(root, 'tours');
const assetsRoot = join(root, 'assets');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function validateScenePayload(body) {
  const { tourId, sceneId, defaultView } = body ?? {};
  if (!tourId || !sceneId || !defaultView) {
    throw new Error('tourId, sceneId, and defaultView are required');
  }
  if (
    typeof defaultView.yaw !== 'number' ||
    typeof defaultView.pitch !== 'number'
  ) {
    throw new Error('defaultView.yaw and defaultView.pitch must be numbers');
  }
  return { tourId, sceneId, defaultView };
}

function validateHotspotPayload(body) {
  const { tourId, sceneId, name, position } = body ?? {};
  if (!tourId || !sceneId || !name || !position) {
    throw new Error('tourId, sceneId, name, and position are required');
  }
  if (typeof position.yaw !== 'number' || typeof position.pitch !== 'number') {
    throw new Error('position.yaw and position.pitch must be numbers');
  }
  return {
    tourId,
    sceneId,
    name,
    position,
    targetSceneId: body.targetSceneId,
    instant: typeof body.instant === 'boolean' ? body.instant : undefined,
    previewImage:
      typeof body.previewImage === 'string' ? body.previewImage : undefined,
  };
}

function validateCreateScenePayload(body) {
  const {
    tourId,
    title,
    panoramaFileBase64,
    panoramaFileName,
    defaultView,
    description,
    sceneId,
  } = body ?? {};
  if (!tourId || !title) {
    throw new Error('tourId and title are required');
  }
  if (!panoramaFileBase64) {
    throw new Error('panoramaFile is required');
  }
  if (
    defaultView &&
    (typeof defaultView.yaw !== 'number' ||
      typeof defaultView.pitch !== 'number')
  ) {
    throw new Error('defaultView.yaw and defaultView.pitch must be numbers');
  }

  assertPanoramaUploadFileName(panoramaFileName);
  const panoramaFileBuffer = Buffer.from(panoramaFileBase64, 'base64');
  if (!panoramaFileBuffer.length) {
    throw new Error('Panorama file is empty');
  }

  return {
    tourId,
    title,
    panoramaFileBuffer,
    defaultView,
    description,
    sceneId,
  };
}

function validateHotspotIdPayload(body) {
  const { tourId, sceneId, hotspotId } = body ?? {};
  if (!tourId || !sceneId || !hotspotId?.trim()) {
    throw new Error('tourId, sceneId, and hotspotId are required');
  }
  return { tourId, sceneId, hotspotId: hotspotId.trim() };
}

function validateHotspotPositionPayload(body) {
  const { tourId, sceneId, hotspotId, position } = body ?? {};
  if (!tourId || !sceneId || !hotspotId?.trim() || !position) {
    throw new Error('tourId, sceneId, hotspotId, and position are required');
  }
  if (typeof position.yaw !== 'number' || typeof position.pitch !== 'number') {
    throw new Error('position.yaw and position.pitch must be numbers');
  }
  return { tourId, sceneId, hotspotId: hotspotId.trim(), position };
}

function validateReplacePanoramaPayload(body) {
  const { tourId, sceneId, panoramaFileBase64, panoramaFileName } = body ?? {};
  if (!tourId || !sceneId) {
    throw new Error('tourId and sceneId are required');
  }
  if (!panoramaFileBase64) {
    throw new Error('panoramaFile is required');
  }

  assertPanoramaUploadFileName(panoramaFileName);
  const panoramaFileBuffer = Buffer.from(panoramaFileBase64, 'base64');
  if (!panoramaFileBuffer.length) {
    throw new Error('Panorama file is empty');
  }

  return { tourId, sceneId, panoramaFileBuffer };
}

function validateSceneIdPayload(body) {
  const { tourId, sceneId } = body ?? {};
  if (!tourId || !sceneId?.trim()) {
    throw new Error('tourId and sceneId are required');
  }
  return { tourId, sceneId: sceneId.trim() };
}

function validateUpdateScenePayload(body) {
  const {
    tourId,
    sceneId,
    title,
    description,
    setAsFirstScene,
    map,
    clearMap,
  } = body ?? {};
  if (!tourId || !sceneId?.trim()) {
    throw new Error('tourId and sceneId are required');
  }
  if (
    !title?.trim() &&
    description === undefined &&
    setAsFirstScene !== true &&
    map === undefined &&
    clearMap !== true
  ) {
    throw new Error(
      'At least one of title, description, setAsFirstScene, map, or clearMap is required',
    );
  }

  let normalizedMap;
  if (map !== undefined && map !== null) {
    if (typeof map !== 'object') {
      throw new Error('map must be an object');
    }
    normalizedMap = map;
  }

  return {
    tourId,
    sceneId: sceneId.trim(),
    title,
    description,
    setAsFirstScene: setAsFirstScene === true,
    map: normalizedMap,
    clearMap: clearMap === true,
  };
}

function validateOptionalViewPayload(view, label) {
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
  return view;
}

function validateNavHotspotUpdatePayload(body) {
  const {
    tourId,
    sceneId,
    hotspotId,
    label,
    targetSceneId,
    targetView,
    syncTargetViewFromScene,
    instant,
    previewImage,
    clearPreviewImage,
  } = body ?? {};
  if (!tourId || !sceneId || !hotspotId?.trim()) {
    throw new Error('tourId, sceneId, and hotspotId are required');
  }
  if (
    !label?.trim() &&
    !targetSceneId?.trim() &&
    targetView === undefined &&
    syncTargetViewFromScene !== true &&
    instant === undefined &&
    previewImage === undefined &&
    clearPreviewImage !== true
  ) {
    throw new Error(
      'At least one of label, targetSceneId, targetView, instant, previewImage, clearPreviewImage, or syncTargetViewFromScene is required',
    );
  }
  return {
    tourId,
    sceneId,
    hotspotId: hotspotId.trim(),
    label,
    targetSceneId,
    targetView: validateOptionalViewPayload(targetView, 'targetView'),
    syncTargetViewFromScene: syncTargetViewFromScene === true,
    instant: typeof instant === 'boolean' ? instant : undefined,
    previewImage: typeof previewImage === 'string' ? previewImage : undefined,
    clearPreviewImage: clearPreviewImage === true,
  };
}

function validateNamingHotspotUpdatePayload(body) {
  const {
    tourId,
    sceneId,
    hotspotId,
    title,
    price,
    status,
    body: copy,
    videoUrl,
    image,
  } = body ?? {};
  if (!tourId || !sceneId || !hotspotId?.trim()) {
    throw new Error('tourId, sceneId, and hotspotId are required');
  }
  if (
    !title?.trim() &&
    !price?.trim() &&
    !status?.trim() &&
    !copy?.trim() &&
    videoUrl === undefined &&
    image === undefined
  ) {
    throw new Error(
      'At least one of title, price, status, body, videoUrl, or image is required',
    );
  }
  return {
    tourId,
    sceneId,
    hotspotId: hotspotId.trim(),
    title,
    price,
    status,
    body: copy,
    videoUrl,
    image,
  };
}

function decodeOptionalImageBuffer(base64, label) {
  if (!base64) return null;
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    throw new Error(`${label} is empty`);
  }
  return buffer;
}

function validateClientBrandingFields(body) {
  const {
    primaryColor,
    logoFileBase64,
    faviconFileBase64,
    fontFamily,
    fontSourceUrl,
    clearFontFamily,
    clearFontSourceUrl,
  } = body ?? {};

  const normalizedPrimaryColor =
    primaryColor?.trim() ? normalizePrimaryColor(primaryColor) : undefined;
  if (primaryColor?.trim() && !normalizedPrimaryColor) {
    throw new Error('primaryColor must be a valid hex color');
  }

  if (fontSourceUrl?.trim()) {
    try {
      const parsed = new URL(fontSourceUrl.trim());
      if (
        parsed.protocol !== 'https:' ||
        parsed.hostname !== 'fonts.googleapis.com'
      ) {
        throw new Error(
          'fontSourceUrl must be an https://fonts.googleapis.com/ URL',
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fontSourceUrl')) {
        throw error;
      }
      throw new Error('fontSourceUrl must be a valid URL');
    }
  }

  return {
    primaryColor: normalizedPrimaryColor,
    logoFileBuffer: decodeOptionalImageBuffer(logoFileBase64, 'Logo file'),
    faviconFileBuffer: decodeOptionalImageBuffer(
      faviconFileBase64,
      'Favicon file',
    ),
    fontFamily: typeof fontFamily === 'string' ? fontFamily : undefined,
    fontSourceUrl:
      typeof fontSourceUrl === 'string' ? fontSourceUrl : undefined,
    clearFontFamily: clearFontFamily === true,
    clearFontSourceUrl: clearFontSourceUrl === true,
  };
}

function validateCreateClientPayload(body) {
  const {
    clientId,
    clientName,
    websiteUrl,
    clientEmail,
    clientPhone,
    clientPhoneLabel,
    clientFax,
    clientFaxLabel,
    clientAddress,
    clientLogoAlt,
  } = body ?? {};

  if (!clientName?.trim()) {
    throw new Error('clientName is required');
  }
  if (!clientId?.trim() && !clientName?.trim()) {
    throw new Error('clientId or clientName is required');
  }

  return {
    clientId,
    clientName,
    websiteUrl,
    clientLogoAlt:
      typeof clientLogoAlt === 'string' ? clientLogoAlt : undefined,
    clientEmail: typeof clientEmail === 'string' ? clientEmail : undefined,
    clientPhone: typeof clientPhone === 'string' ? clientPhone : undefined,
    clientPhoneLabel:
      typeof clientPhoneLabel === 'string' ? clientPhoneLabel : undefined,
    clientFax: typeof clientFax === 'string' ? clientFax : undefined,
    clientFaxLabel:
      typeof clientFaxLabel === 'string' ? clientFaxLabel : undefined,
    clientAddress:
      typeof clientAddress === 'string' ? clientAddress : undefined,
    ...validateClientBrandingFields(body),
  };
}

function validateUpdateClientPayload(body) {
  const {
    clientId,
    clientName,
    websiteUrl,
    clientEmail,
    clientPhone,
    clientPhoneLabel,
    clientFax,
    clientFaxLabel,
    clientAddress,
    clientLogoAlt,
  } = body ?? {};

  if (!clientId?.trim()) {
    throw new Error('clientId is required');
  }

  return {
    clientId: clientId.trim(),
    clientName: typeof clientName === 'string' ? clientName : undefined,
    websiteUrl: typeof websiteUrl === 'string' ? websiteUrl : undefined,
    clientLogoAlt:
      typeof clientLogoAlt === 'string' ? clientLogoAlt : undefined,
    clientEmail: typeof clientEmail === 'string' ? clientEmail : undefined,
    clientPhone: typeof clientPhone === 'string' ? clientPhone : undefined,
    clientPhoneLabel:
      typeof clientPhoneLabel === 'string' ? clientPhoneLabel : undefined,
    clientFax: typeof clientFax === 'string' ? clientFax : undefined,
    clientFaxLabel:
      typeof clientFaxLabel === 'string' ? clientFaxLabel : undefined,
    clientAddress:
      typeof clientAddress === 'string' ? clientAddress : undefined,
    ...validateClientBrandingFields(body),
  };
}

function validateCreateTourPayload(body) {
  const {
    clientId,
    tourId,
    tourTitle,
    category,
    tourSummary,
    firstSceneTitle,
    panoramaFileBase64,
    panoramaFileName,
    logoFileBase64,
    faviconFileBase64,
    primaryColor,
    logoAlt,
    defaultView,
    visibility,
    featured,
    brandingMode,
    transitionEffect,
    transitionSpeed,
    immersiveAudio,
    immersivePlaylist,
    immersivePlaylistManifest,
    immersiveVolume,
    clearImmersiveBackground,
  } = body ?? {};

  if (!clientId?.trim()) {
    throw new Error('clientId is required');
  }
  if (!tourId?.trim() || !tourTitle?.trim() || !category?.trim()) {
    throw new Error('tourId, tourTitle, and category are required');
  }
  if (!firstSceneTitle?.trim()) {
    throw new Error('firstSceneTitle is required');
  }
  if (!panoramaFileBase64) {
    throw new Error('panoramaFile is required');
  }
  if (
    defaultView &&
    (typeof defaultView.yaw !== 'number' ||
      typeof defaultView.pitch !== 'number')
  ) {
    throw new Error('defaultView.yaw and defaultView.pitch must be numbers');
  }

  assertPanoramaUploadFileName(panoramaFileName);
  const panoramaFileBuffer = Buffer.from(panoramaFileBase64, 'base64');
  if (!panoramaFileBuffer.length) {
    throw new Error('Panorama file is empty');
  }

  const normalizedPrimaryColor =
    primaryColor?.trim() ? normalizePrimaryColor(primaryColor) : undefined;
  if (primaryColor?.trim() && !normalizedPrimaryColor) {
    throw new Error('primaryColor must be a valid hex color');
  }

  if (
    transitionEffect?.trim() &&
    !['fade', 'black'].includes(transitionEffect.trim())
  ) {
    throw new Error('transitionEffect must be fade or black');
  }

  if (immersiveVolume !== undefined && immersiveVolume !== null) {
    const volume = Number(immersiveVolume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new Error('immersiveVolume must be a number between 0 and 1');
    }
  }

  return {
    clientId,
    tourId,
    tourTitle,
    category,
    tourSummary: typeof tourSummary === 'string' ? tourSummary : undefined,
    firstSceneTitle,
    panoramaFileBuffer,
    logoFileBuffer: decodeOptionalImageBuffer(logoFileBase64, 'Logo file'),
    faviconFileBuffer: decodeOptionalImageBuffer(
      faviconFileBase64,
      'Favicon file',
    ),
    primaryColor: normalizedPrimaryColor,
    logoAlt: typeof logoAlt === 'string' ? logoAlt : undefined,
    defaultView,
    visibility: visibility?.trim() || 'unlisted',
    featured: featured === true,
    brandingMode: brandingMode === 'custom' ? 'custom' : 'client',
    transitionEffect:
      typeof transitionEffect === 'string' ? transitionEffect : undefined,
    transitionSpeed:
      typeof transitionSpeed === 'string' ? transitionSpeed : undefined,
    immersiveAudio:
      typeof immersiveAudio === 'string' ? immersiveAudio : undefined,
    immersivePlaylist:
      typeof immersivePlaylist === 'string' ? immersivePlaylist : undefined,
    immersivePlaylistManifest:
      typeof immersivePlaylistManifest === 'string' ?
        immersivePlaylistManifest
      : undefined,
    immersiveVolume:
      immersiveVolume !== undefined && immersiveVolume !== null ?
        Number(immersiveVolume)
      : undefined,
    clearImmersiveBackground: clearImmersiveBackground === true,
  };
}

function validateInfoHotspotUpdatePayload(body) {
  const {
    tourId,
    sceneId,
    hotspotId,
    title,
    body: copy,
    display,
    videoUrl,
    image,
  } = body ?? {};
  if (!tourId || !sceneId || !hotspotId?.trim()) {
    throw new Error('tourId, sceneId, and hotspotId are required');
  }
  if (
    !title?.trim() &&
    !copy?.trim() &&
    !display?.trim() &&
    videoUrl === undefined &&
    image === undefined
  ) {
    throw new Error(
      'At least one of title, body, display, videoUrl, or image is required',
    );
  }
  if (display?.trim() && !['modal', 'anchored'].includes(display.trim())) {
    throw new Error('display must be modal or anchored');
  }
  return {
    tourId,
    sceneId,
    hotspotId: hotspotId.trim(),
    title,
    body: copy,
    display,
    videoUrl,
    image,
  };
}

function validateCreateNamingHotspotPayload(body) {
  const { tourId, sceneId, name, position } = validateHotspotPayload(body);
  const price = body?.price;
  const status = body?.status;
  const copy = body?.body;
  const videoUrl = body?.videoUrl;
  const image = body?.image;
  if (!price?.trim()) {
    throw new Error('price is required');
  }
  if (!status?.trim()) {
    throw new Error('status is required');
  }
  return {
    tourId,
    sceneId,
    name,
    position,
    price,
    status,
    body: copy,
    videoUrl,
    image,
  };
}

function validateCreateInfoHotspotPayload(body) {
  const { tourId, sceneId, name, position, title, display, videoUrl, image } =
    validateHotspotPayload(body);
  const copy = body?.body;
  if (display?.trim() && !['modal', 'anchored'].includes(display.trim())) {
    throw new Error('display must be modal or anchored');
  }
  return {
    tourId,
    sceneId,
    name,
    position,
    title,
    body: copy,
    display,
    videoUrl,
    image,
  };
}

function validateSuggestBrandingPayload(body) {
  const { websiteUrl } = body ?? {};
  if (!websiteUrl?.trim()) {
    throw new Error('websiteUrl is required');
  }
  return { websiteUrl: websiteUrl.trim() };
}

function validateUpdateTourPayload(body) {
  const {
    tourId,
    tourTitle,
    category,
    tourSummary,
    websiteUrl,
    primaryColor,
    logoAlt,
    logoFileBase64,
    faviconFileBase64,
    visibility,
    featured,
    brandingMode,
    clientDisplayName,
    clientEmail,
    clientPhone,
    clientPhoneLabel,
    clientFax,
    clientFaxLabel,
    clientAddress,
    fontFamily,
    fontSourceUrl,
    clearFontFamily,
    clearFontSourceUrl,
    productFullName,
    transitionEffect,
    transitionSpeed,
    clearDefaultTransition,
    immersiveAudio,
    immersivePlaylist,
    immersivePlaylistManifest,
    immersiveVolume,
    clearImmersiveBackground,
  } = body ?? {};

  if (!tourId?.trim()) {
    throw new Error('tourId is required');
  }
  if (!tourTitle?.trim()) {
    throw new Error('tourTitle is required');
  }
  if (!category?.trim()) {
    throw new Error('category is required');
  }

  const normalizedPrimaryColor =
    primaryColor?.trim() ? normalizePrimaryColor(primaryColor) : undefined;
  if (primaryColor?.trim() && !normalizedPrimaryColor) {
    throw new Error('primaryColor must be a valid hex color');
  }

  let normalizedVisibility;
  if (visibility?.trim()) {
    const value = visibility.trim();
    if (!['public', 'unlisted', 'internal'].includes(value)) {
      throw new Error('visibility must be public, unlisted, or internal');
    }
    normalizedVisibility = value;
  }

  if (fontSourceUrl?.trim()) {
    try {
      const parsed = new URL(fontSourceUrl.trim());
      if (
        parsed.protocol !== 'https:' ||
        parsed.hostname !== 'fonts.googleapis.com'
      ) {
        throw new Error(
          'fontSourceUrl must be an https://fonts.googleapis.com/ URL',
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fontSourceUrl')) {
        throw error;
      }
      throw new Error('fontSourceUrl must be a valid URL');
    }
  }

  if (
    transitionEffect?.trim() &&
    !['fade', 'black'].includes(transitionEffect.trim())
  ) {
    throw new Error('transitionEffect must be fade or black');
  }

  if (immersiveVolume !== undefined && immersiveVolume !== null) {
    const volume = Number(immersiveVolume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new Error('immersiveVolume must be a number between 0 and 1');
    }
  }

  return {
    tourId: tourId.trim(),
    tourTitle,
    category,
    tourSummary: typeof tourSummary === 'string' ? tourSummary : undefined,
    websiteUrl,
    primaryColor: normalizedPrimaryColor,
    logoAlt,
    logoFileBuffer: decodeOptionalImageBuffer(logoFileBase64, 'Logo file'),
    faviconFileBuffer: decodeOptionalImageBuffer(
      faviconFileBase64,
      'Favicon file',
    ),
    visibility: normalizedVisibility,
    featured: typeof featured === 'boolean' ? featured : undefined,
    brandingMode: brandingMode === 'custom' ? 'custom' : 'client',
    clientDisplayName:
      typeof clientDisplayName === 'string' ? clientDisplayName : undefined,
    clientEmail: typeof clientEmail === 'string' ? clientEmail : undefined,
    clientPhone: typeof clientPhone === 'string' ? clientPhone : undefined,
    clientPhoneLabel:
      typeof clientPhoneLabel === 'string' ? clientPhoneLabel : undefined,
    clientFax: typeof clientFax === 'string' ? clientFax : undefined,
    clientFaxLabel:
      typeof clientFaxLabel === 'string' ? clientFaxLabel : undefined,
    clientAddress:
      typeof clientAddress === 'string' ? clientAddress : undefined,
    fontFamily: typeof fontFamily === 'string' ? fontFamily : undefined,
    fontSourceUrl:
      typeof fontSourceUrl === 'string' ? fontSourceUrl : undefined,
    clearFontFamily: clearFontFamily === true,
    clearFontSourceUrl: clearFontSourceUrl === true,
    productFullName:
      typeof productFullName === 'string' ? productFullName : undefined,
    transitionEffect:
      typeof transitionEffect === 'string' ? transitionEffect : undefined,
    transitionSpeed:
      typeof transitionSpeed === 'string' ? transitionSpeed : undefined,
    clearDefaultTransition: clearDefaultTransition === true,
    immersiveAudio:
      typeof immersiveAudio === 'string' ? immersiveAudio : undefined,
    immersivePlaylist:
      typeof immersivePlaylist === 'string' ? immersivePlaylist : undefined,
    immersivePlaylistManifest:
      typeof immersivePlaylistManifest === 'string' ?
        immersivePlaylistManifest
      : undefined,
    immersiveVolume:
      immersiveVolume !== undefined && immersiveVolume !== null ?
        Number(immersiveVolume)
      : undefined,
    clearImmersiveBackground: clearImmersiveBackground === true,
  };
}

/** Dev-only API for writing tour JSON + baking scene thumbnails from the panel. */
export function viteDevTourApiPlugin() {
  return {
    name: 'vite-dev-tour-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__dev/api/')) {
          next();
          return;
        }

        try {
          const tourFetchMatch = req.url.match(/^\/__dev\/api\/tour\/([^/?]+)/);
          if (tourFetchMatch && req.method === 'GET') {
            const tourId = decodeURIComponent(tourFetchMatch[1]);
            if (RESERVED_TOUR_API_IDS.has(tourId)) {
              sendJson(res, 404, { error: 'Not found' });
              return;
            }
            const tourPath = resolveTourJsonPath(toursDir, tourId);
            const tour = readTourJson(tourPath);
            const catalog = findCatalogTourEntry(
              toursDir,
              tour.clientId ?? tour.id,
              tourId,
            );
            sendJson(res, 200, { ok: true, tour, tourPath, catalog });
            return;
          }

          const knowledgeFetchMatch = req.url.match(
            /^\/__dev\/api\/knowledge\/([^/?]+)/,
          );
          if (knowledgeFetchMatch && req.method === 'GET') {
            const tourId = decodeURIComponent(knowledgeFetchMatch[1]);
            const { knowledgePath, knowledge, missing } = readKnowledgeJson(
              toursDir,
              tourId,
            );
            sendJson(res, 200, {
              ok: true,
              tourId,
              knowledgePath,
              knowledge: knowledge ?? buildKnowledgeStub(toursDir, tourId),
              missing,
            });
            return;
          }

          if (
            req.url === '/__dev/api/catalog/clients' &&
            req.method === 'GET'
          ) {
            sendJson(res, 200, {
              ok: true,
              clients: listCatalogClients(toursDir),
            });
            return;
          }

          if (req.url === '/__dev/api/catalog' && req.method === 'GET') {
            const catalogPath = join(toursDir, 'catalog.json');
            const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
            sendJson(res, 200, { ok: true, catalog });
            return;
          }

          if (req.method !== 'POST' && req.method !== 'PATCH') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
          }

          const body = await readJsonBody(req);

          if (
            req.url === '/__dev/api/client/update' &&
            req.method === 'PATCH'
          ) {
            const payload = validateUpdateClientPayload(body);
            const result = await updateClient({
              root,
              toursDir,
              assetsRoot,
              ...payload,
            });
            sendJson(res, 200, {
              ok: true,
              clientId: result.clientId,
              client: result.client,
            });
            return;
          }

          if (req.method !== 'POST') {
            sendJson(res, 405, { error: 'Method not allowed' });
            return;
          }

          if (req.url === '/__dev/api/client/create') {
            const payload = validateCreateClientPayload(body);
            const result = await createClient({
              root,
              toursDir,
              assetsRoot,
              ...payload,
            });
            sendJson(res, 200, {
              ok: true,
              clientId: result.clientId,
              client: result.client,
            });
            return;
          }

          if (req.url === '/__dev/api/tour/suggest-branding') {
            const { websiteUrl } = validateSuggestBrandingPayload(body);
            const suggestion = await suggestBrandingFromWebsite(websiteUrl);
            sendJson(res, 200, { ok: true, ...suggestion });
            return;
          }

          if (req.url === '/__dev/api/tour/suggest-contact') {
            const { websiteUrl } = validateSuggestBrandingPayload(body);
            const suggestion = await suggestContactFromWebsite(websiteUrl);
            sendJson(res, 200, { ok: true, ...suggestion });
            return;
          }

          if (req.url === '/__dev/api/tour/update') {
            const payload = validateUpdateTourPayload(body);
            const result = await updateTour({
              root,
              toursDir,
              assetsRoot,
              ...payload,
            });
            sendJson(res, 200, {
              ok: true,
              tourId: result.tour.id,
              tourPath: result.tourPath,
              tour: result.tour,
            });
            return;
          }

          if (req.url === '/__dev/api/tour/floor-plan/update') {
            const payload = validateUpdateTourFloorPlanPayload(body);
            const result =
              payload.clearFloorPlan ?
                clearTourFloorPlan({
                  root,
                  toursDir,
                  assetsRoot,
                  tourId: payload.tourId,
                })
              : await updateTourFloorPlan({
                  root,
                  toursDir,
                  assetsRoot,
                  ...payload,
                });
            sendJson(res, 200, {
              ok: true,
              tourId: payload.tourId,
              tourPath: result.tourPath,
              tour: result.tour,
              floorPlan: result.tour.floorPlan ?? null,
            });
            return;
          }

          if (req.url === '/__dev/api/tour/delete') {
            const payload = validateDeleteTourPayload(body);
            const result = deleteTour({
              root,
              toursDir,
              assetsRoot,
              tourId: payload.tourId,
            });
            sendJson(res, 200, { ok: true, ...result });
            return;
          }

          if (req.url === '/__dev/api/knowledge/update') {
            const payload = validateUpdateKnowledgePayload(body);
            const result = updateKnowledge({ toursDir, ...payload });
            sendJson(res, 200, {
              ok: true,
              tourId: payload.tourId,
              knowledgePath: result.knowledgePath,
              knowledge: result.knowledge,
              created: result.created,
            });
            return;
          }

          if (req.url === '/__dev/api/tour/create') {
            const payload = validateCreateTourPayload(body);
            const result = await createTour({
              root,
              toursDir,
              assetsRoot,
              ...payload,
            });
            sendJson(res, 200, {
              ok: true,
              tourId: result.tour.id,
              clientId: result.clientId,
              firstSceneId: result.firstSceneId,
              tourPath: result.tourPath,
              tour: result.tour,
            });
            return;
          }

          if (req.url === '/__dev/api/scene/default-view') {
            const { tourId, sceneId, defaultView } = validateScenePayload(body);
            const result = await applySceneLanding({
              root,
              toursDir,
              assetsRoot,
              tourId,
              sceneId,
              view: defaultView,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              defaultView: result.defaultView,
              thumbnail: result.thumbnail,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/scene/create') {
            const {
              tourId,
              title,
              panoramaFileBuffer,
              defaultView,
              description,
              sceneId,
            } = validateCreateScenePayload(body);
            const result = await createScene({
              root,
              toursDir,
              assetsRoot,
              tourId,
              title,
              sceneId,
              panoramaFileBuffer,
              defaultView,
              description,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              scene: result.scene,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/scene/replace-panorama') {
            const { tourId, sceneId, panoramaFileBuffer } =
              validateReplacePanoramaPayload(body);
            const result = await replaceScenePanorama({
              root,
              toursDir,
              assetsRoot,
              tourId,
              sceneId,
              panoramaFileBuffer,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              panorama: result.panorama,
              thumbnail: result.thumbnail,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/scene/update') {
            const {
              tourId,
              sceneId,
              title,
              description,
              setAsFirstScene,
              map,
              clearMap,
            } = validateUpdateScenePayload(body);
            const result = updateScene({
              toursDir,
              tourId,
              sceneId,
              title,
              description,
              setAsFirstScene,
              map,
              clearMap,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              scene: result.scene,
              firstScene: result.firstScene,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/scene/delete') {
            const { tourId, sceneId } = validateSceneIdPayload(body);
            const result = deleteScene({ toursDir, tourId, sceneId });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId: result.sceneId,
              firstScene: result.firstScene,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/nav/update') {
            const {
              tourId,
              sceneId,
              hotspotId,
              label,
              targetSceneId,
              targetView,
              syncTargetViewFromScene,
              instant,
              previewImage,
              clearPreviewImage,
            } = validateNavHotspotUpdatePayload(body);
            const result = updateNavHotspot({
              toursDir,
              tourId,
              sceneId,
              hotspotId,
              label,
              targetSceneId,
              targetView,
              syncTargetViewFromScene,
              instant,
              previewImage,
              clearPreviewImage,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/naming/update') {
            const {
              tourId,
              sceneId,
              hotspotId,
              title,
              price,
              status,
              body: copy,
              videoUrl,
              image,
            } = validateNamingHotspotUpdatePayload(body);
            const result = updateNamingHotspot({
              toursDir,
              tourId,
              sceneId,
              hotspotId,
              title,
              price,
              status,
              body: copy,
              videoUrl,
              image,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/info/update') {
            const {
              tourId,
              sceneId,
              hotspotId,
              title,
              body: copy,
              display,
              videoUrl,
              image,
            } = validateInfoHotspotUpdatePayload(body);
            const result = updateInfoHotspot({
              toursDir,
              tourId,
              sceneId,
              hotspotId,
              title,
              body: copy,
              display,
              videoUrl,
              image,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/delete') {
            const { tourId, sceneId, hotspotId } =
              validateHotspotIdPayload(body);
            const result = await deleteHotspot({
              toursDir,
              tourId,
              sceneId,
              hotspotId,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspotId: result.hotspot.id,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/position') {
            const { tourId, sceneId, hotspotId, position } =
              validateHotspotPositionPayload(body);
            const result = await updateHotspotPosition({
              toursDir,
              tourId,
              sceneId,
              hotspotId,
              position,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/nav') {
            const {
              tourId,
              sceneId,
              name,
              position,
              targetSceneId,
              instant,
              previewImage,
            } = validateHotspotPayload(body);
            if (!targetSceneId) {
              throw new Error('targetSceneId is required for nav hotspots');
            }
            const result = await createNavHotspot({
              toursDir,
              tourId,
              sceneId,
              name,
              position,
              targetSceneId,
              instant,
              previewImage,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/naming') {
            const {
              tourId,
              sceneId,
              name,
              position,
              price,
              status,
              body: copy,
              videoUrl,
              image,
            } = validateCreateNamingHotspotPayload(body);
            const result = await createNamingHotspot({
              toursDir,
              tourId,
              sceneId,
              name,
              position,
              price,
              status,
              body: copy,
              videoUrl,
              image,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          if (req.url === '/__dev/api/hotspot/info') {
            const {
              tourId,
              sceneId,
              name,
              position,
              title,
              body: copy,
              display,
              videoUrl,
              image,
            } = validateCreateInfoHotspotPayload(body);
            const result = await createInfoHotspot({
              toursDir,
              tourId,
              sceneId,
              name,
              position,
              title,
              body: copy,
              display,
              videoUrl,
              image,
            });
            sendJson(res, 200, {
              ok: true,
              tourId,
              sceneId,
              hotspot: result.hotspot,
              tourPath: result.tourPath,
            });
            return;
          }

          sendJson(res, 404, { error: 'Not found' });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown dev API error';
          sendJson(res, 400, { error: message });
        }
      });
    },
  };
}
