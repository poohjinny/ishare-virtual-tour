import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  bakeSceneThumbnail,
  buildSceneRecord,
  buildSceneRecord3D,
  saveUploadedTourModel,
  saveUploadedPanoramaWebp,
  saveUploadedSceneThumbnailWebp,
  slugifyHotspotName,
  writeTourJson,
} from './tourSceneDev.mjs';
import { syncKnowledgeFromTour } from './devContentPlaceholders.mjs';
import { normalizePrimaryColor, saveTourBrandAssets } from './tourBrandDev.mjs';
import {
  applyDefaultTransition,
  applyImmersiveBackground,
} from './tourUpdateDev.mjs';
import {
  readCatalogJson,
  resolveClientWebsite,
  writeCatalogJson,
} from './tourCatalogDev.mjs';

const DEFAULT_TRANSITION = { speed: '500ms', effect: 'fade' };
const DEFAULT_VIEW = { yaw: 0, pitch: 0, zoom: 17 };
const DEFAULT_3D_VIEW = { yaw: 0, pitch: 0, zoom: 50 };
const DEFAULT_PRIMARY_COLOR = '#007078';

function assertSlug(value, label) {
  const slug = slugifyHotspotName(value);
  if (!slug) {
    throw new Error(`${label} must contain letters or numbers`);
  }
  return slug;
}

function buildTourRecord({
  tourId,
  clientId,
  category,
  tourTitle,
  scene,
  brandingMode,
  branding,
  viewerType,
  model,
}) {
  const record = {
    id: tourId,
    clientId,
    category,
    title: tourTitle,
    firstScene: scene.id,
    defaultTransition: DEFAULT_TRANSITION,
    scenes: { [scene.id]: scene },
  };

  if (viewerType === 'model3d') {
    record.viewerType = 'model3d';
    if (model?.trim()) {
      record.model = model.trim();
    }
  }

  if (brandingMode === 'custom' && branding) {
    record.branding = branding;
  }

  return record;
}

async function applyCreateTourBranding({
  root,
  assetsRoot,
  brandingMode,
  clientId,
  tourId,
  catalogClient,
  tourTitle,
  primaryColor,
  logoFileBuffer,
  faviconFileBuffer,
  logoAlt,
}) {
  if (brandingMode !== 'custom') {
    return { brandingMode: 'client' };
  }

  const color = normalizePrimaryColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR;
  const resolvedLogoAlt = logoAlt?.trim() || catalogClient.name || tourTitle;

  const brandAssets = await saveTourBrandAssets({
    root,
    assetsRoot,
    clientId,
    tourId,
    logoFileBuffer,
    faviconFileBuffer,
  });

  const branding = { primaryColor: color };
  if (brandAssets.savedLogo) {
    branding.logo = brandAssets.logoWebPath;
    branding.logoAlt = resolvedLogoAlt;
  }
  if (brandAssets.savedFavicon) {
    branding.favicon = brandAssets.faviconWebPath;
  }

  return { brandingMode: 'custom', branding };
}

function normalizeCatalogTourSummary(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || undefined;
}

function buildCatalogTourEntry({
  tourId,
  tourTitle,
  category,
  visibility,
  featured = false,
  tourSummary,
}) {
  const entry = { id: tourId, category, name: tourTitle, visibility, featured };
  const summary = normalizeCatalogTourSummary(tourSummary);
  if (summary) {
    entry.summary = summary;
  }
  return entry;
}

function registerTourInCatalog({
  catalog,
  clientId,
  tourId,
  tourTitle,
  tourSummary,
  category,
  visibility,
  featured = false,
}) {
  const client = catalog.clients?.find((entry) => entry.id === clientId);
  if (!client) {
    throw new Error(`Client not found in catalog: ${clientId}`);
  }
  if (client.tours?.some((entry) => entry.id === tourId)) {
    throw new Error(`Tour id already in catalog: ${tourId}`);
  }
  if (!client.tours) {
    client.tours = [];
  }
  client.tours.push(
    buildCatalogTourEntry({
      tourId,
      tourTitle,
      category,
      visibility,
      featured,
      tourSummary,
    }),
  );
  return client;
}

export function listCatalogClients(toursDir) {
  const catalog = readCatalogJson(toursDir);
  return (catalog.clients ?? []).map((client) => ({
    id: client.id,
    name: client.name,
    website: client.website ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    phoneLabel: client.phoneLabel ?? '',
    fax: client.fax ?? '',
    faxLabel: client.faxLabel ?? '',
    address: client.address ?? '',
    branding: client.branding ?? null,
    tourCount: client.tours?.length ?? 0,
  }));
}

export async function createTour({
  root,
  toursDir,
  assetsRoot,
  clientId: rawClientId,
  tourId: rawTourId,
  tourTitle,
  tourSummary,
  category,
  firstSceneTitle,
  panoramaFileBuffer,
  modelFileBuffer,
  modelFileName,
  thumbnailFileBuffer,
  viewerType = 'panorama',
  logoFileBuffer,
  faviconFileBuffer,
  primaryColor,
  logoAlt,
  defaultView,
  visibility = 'unlisted',
  featured = false,
  brandingMode = 'client',
  transitionEffect,
  transitionSpeed,
  immersiveAudio,
  immersivePlaylist,
  immersivePlaylistManifest,
  immersiveVolume,
  clearImmersiveBackground,
}) {
  if (!rawClientId?.trim()) {
    throw new Error('clientId is required');
  }
  if (!rawTourId?.trim() || !tourTitle?.trim() || !category?.trim()) {
    throw new Error('tourId, tourTitle, and category are required');
  }
  if (!firstSceneTitle?.trim()) {
    throw new Error('firstSceneTitle is required');
  }

  const isModel3d = viewerType === 'model3d';
  if (isModel3d) {
    if (!modelFileBuffer?.length) {
      throw new Error('modelFile is required');
    }
  } else if (!panoramaFileBuffer?.length) {
    throw new Error('panoramaFile is required');
  }

  if (brandingMode !== 'client' && brandingMode !== 'custom') {
    throw new Error('brandingMode must be client or custom');
  }

  const resolvedBrandingMode = brandingMode === 'custom' ? 'custom' : 'client';

  const tourId = assertSlug(rawTourId, 'Tour id');
  const clientId = assertSlug(rawClientId, 'Client id');
  const sceneId = slugifyHotspotName(firstSceneTitle.trim()) || 'overview';
  const tourTitleValue = tourTitle.trim();
  const sceneTitleValue = firstSceneTitle.trim();

  const tourJsonCandidate = join(toursDir, `${tourId}.json`);
  if (existsSync(tourJsonCandidate)) {
    throw new Error(`Tour already exists: ${tourId}`);
  }

  const catalog = readCatalogJson(toursDir);
  const catalogClient = registerTourInCatalog({
    catalog,
    clientId,
    tourId,
    tourTitle: tourTitleValue,
    tourSummary,
    category: category.trim(),
    visibility,
    featured,
  });

  const tourStub = { id: tourId, clientId };

  let scene;
  let tourModelWebPath;
  if (isModel3d) {
    mkdirSync(join(assetsRoot, clientId, tourId, 'models'), {
      recursive: true,
    });
    mkdirSync(join(assetsRoot, clientId, tourId, 'thumbnails'), {
      recursive: true,
    });

    tourModelWebPath = await saveUploadedTourModel({
      assetsRoot,
      root,
      tour: tourStub,
      fileBuffer: modelFileBuffer,
      fileName: modelFileName,
    });

    let thumbnailWebPath;
    if (thumbnailFileBuffer?.length) {
      thumbnailWebPath = await saveUploadedSceneThumbnailWebp({
        assetsRoot,
        root,
        tour: tourStub,
        sceneId,
        fileBuffer: thumbnailFileBuffer,
      });
    }

    scene = buildSceneRecord3D({
      title: sceneTitleValue,
      sceneId,
      thumbnail: thumbnailWebPath,
      defaultView: defaultView ?? DEFAULT_3D_VIEW,
      tourTitle: tourTitleValue,
      tour: tourStub,
    });
  } else {
    const panoramaWebPath = await saveUploadedPanoramaWebp({
      assetsRoot,
      root,
      tour: tourStub,
      sceneId,
      fileBuffer: panoramaFileBuffer,
    });

    scene = buildSceneRecord({
      title: sceneTitleValue,
      sceneId,
      panorama: panoramaWebPath,
      defaultView: defaultView ?? DEFAULT_VIEW,
      tourTitle: tourTitleValue,
    });
  }

  mkdirSync(join(assetsRoot, clientId, tourId, 'brand'), { recursive: true });
  if (!isModel3d) {
    mkdirSync(join(assetsRoot, clientId, tourId, 'panoramas'), {
      recursive: true,
    });
    mkdirSync(join(assetsRoot, clientId, tourId, 'thumbnails'), {
      recursive: true,
    });
  }

  const brandingResult = await applyCreateTourBranding({
    root,
    assetsRoot,
    brandingMode: resolvedBrandingMode,
    clientId,
    tourId,
    catalogClient,
    tourTitle: tourTitleValue,
    primaryColor,
    logoFileBuffer,
    faviconFileBuffer,
    logoAlt,
  });

  const tour = buildTourRecord({
    tourId,
    clientId,
    category: category.trim(),
    tourTitle: tourTitleValue,
    scene,
    brandingMode: brandingResult.brandingMode,
    branding: brandingResult.branding,
    viewerType: isModel3d ? 'model3d' : 'panorama',
    model: isModel3d ? tourModelWebPath : undefined,
  });

  applyDefaultTransition({ tour, transitionEffect, transitionSpeed });
  applyImmersiveBackground({
    tour,
    immersiveAudio,
    immersivePlaylist,
    immersivePlaylistManifest,
    immersiveVolume,
    clearImmersiveBackground,
  });

  if (!isModel3d) {
    await bakeSceneThumbnail({
      root,
      assetsRoot,
      tour,
      sceneId: scene.id,
      view: scene.defaultView,
    });
  }

  const tourPath = join(toursDir, `${tourId}.json`);
  const knowledgePath = join(toursDir, `${tourId}-knowledge.json`);

  writeTourJson(tourPath, tour);
  writeFileSync(
    knowledgePath,
    `${JSON.stringify(
      syncKnowledgeFromTour(tour, null, {
        clientWebsite: resolveClientWebsite(catalogClient),
        clientName: catalogClient.name,
      }),
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeCatalogJson(toursDir, catalog);

  return { tourPath, knowledgePath, tour, firstSceneId: scene.id, clientId };
}
