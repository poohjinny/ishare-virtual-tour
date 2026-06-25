import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  bakeSceneThumbnail,
  buildSceneRecord,
  saveUploadedPanoramaWebp,
  slugifyHotspotName,
  writeTourJson,
} from './tourSceneDev.mjs';
import { syncKnowledgeFromTour } from './devContentPlaceholders.mjs';
import { normalizePrimaryColor, saveTourBrandAssets } from './tourBrandDev.mjs';

const DEFAULT_TRANSITION = { speed: '500ms', effect: 'fade' };
const DEFAULT_VIEW = { yaw: 0, pitch: 0, zoom: 17 };
const DEFAULT_PRIMARY_COLOR = '#007078';

function readCatalogJson(toursDir) {
  const catalogPath = join(toursDir, 'catalog.json');
  if (!existsSync(catalogPath)) {
    throw new Error('catalog.json not found');
  }
  return JSON.parse(readFileSync(catalogPath, 'utf8'));
}

function writeCatalogJson(toursDir, catalog) {
  const catalogPath = join(toursDir, 'catalog.json');
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

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
  websiteUrl,
  clientName,
  scene,
  primaryColor,
  hasLogo,
  hasFavicon,
}) {
  const url = websiteUrl?.trim() || 'https://example.com';
  const orgName = clientName?.trim() || tourTitle;
  const color = normalizePrimaryColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR;

  return {
    id: tourId,
    clientId,
    category,
    url,
    title: tourTitle,
    organization: { name: orgName, website: url },
    branding: {
      ...(hasLogo ?
        {
          logo: `/assets/${clientId}/${tourId}/brand/logo.png`,
          logoAlt: orgName,
        }
      : {}),
      primaryColor: color,
      ...(hasFavicon ?
        { favicon: `/assets/${clientId}/${tourId}/favicon.png` }
      : {}),
    },
    firstScene: scene.id,
    defaultTransition: DEFAULT_TRANSITION,
    scenes: { [scene.id]: scene },
  };
}

function registerTourInCatalog({
  catalog,
  mode,
  clientId,
  clientName,
  tourId,
  tourTitle,
  category,
  visibility,
  featured = false,
}) {
  if (mode === 'new') {
    if (catalog.clients?.some((client) => client.id === clientId)) {
      throw new Error(`Client id already exists: ${clientId}`);
    }
    if (!catalog.clients) {
      catalog.clients = [];
    }
    catalog.clients.push({
      id: clientId,
      name: clientName,
      tours: [{ id: tourId, category, name: tourTitle, visibility, featured }],
    });
    return;
  }

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
  client.tours.push({
    id: tourId,
    category,
    name: tourTitle,
    visibility,
    featured,
  });
}

export function listCatalogClients(toursDir) {
  const catalog = readCatalogJson(toursDir);
  return (catalog.clients ?? []).map((client) => ({
    id: client.id,
    name: client.name,
    tourCount: client.tours?.length ?? 0,
  }));
}

export async function createTour({
  root,
  toursDir,
  assetsRoot,
  mode,
  clientId: rawClientId,
  clientName,
  tourId: rawTourId,
  tourTitle,
  category,
  websiteUrl,
  firstSceneTitle,
  panoramaFileBuffer,
  logoFileBuffer,
  faviconFileBuffer,
  primaryColor,
  defaultView,
  visibility = 'unlisted',
  featured = false,
}) {
  if (mode !== 'existing' && mode !== 'new') {
    throw new Error('mode must be existing or new');
  }
  if (!rawTourId?.trim() || !tourTitle?.trim() || !category?.trim()) {
    throw new Error('tourId, tourTitle, and category are required');
  }
  if (!firstSceneTitle?.trim()) {
    throw new Error('firstSceneTitle is required');
  }
  if (!panoramaFileBuffer?.length) {
    throw new Error('panoramaFile is required');
  }
  if (mode === 'new' && !clientName?.trim()) {
    throw new Error('clientName is required for a new client');
  }
  if (mode === 'existing' && !rawClientId?.trim()) {
    throw new Error('clientId is required for an existing client');
  }

  const tourId = assertSlug(rawTourId, 'Tour id');
  const clientId =
    mode === 'new' ?
      assertSlug(rawClientId ?? clientName, 'Client id')
    : assertSlug(rawClientId, 'Client id');
  const sceneId = slugifyHotspotName(firstSceneTitle.trim()) || 'overview';
  const tourTitleValue = tourTitle.trim();
  const sceneTitleValue = firstSceneTitle.trim();

  const tourJsonCandidate = join(toursDir, `${tourId}.json`);
  if (existsSync(tourJsonCandidate)) {
    throw new Error(`Tour already exists: ${tourId}`);
  }

  const catalog = readCatalogJson(toursDir);
  registerTourInCatalog({
    catalog,
    mode,
    clientId,
    clientName: clientName?.trim() ?? tourTitleValue,
    tourId,
    tourTitle: tourTitleValue,
    category: category.trim(),
    visibility,
    featured,
  });

  const tourStub = { id: tourId, clientId };

  const panoramaWebPath = await saveUploadedPanoramaWebp({
    assetsRoot,
    root,
    tour: tourStub,
    sceneId,
    fileBuffer: panoramaFileBuffer,
  });

  const scene = buildSceneRecord({
    title: sceneTitleValue,
    sceneId,
    panorama: panoramaWebPath,
    defaultView: defaultView ?? DEFAULT_VIEW,
    tourTitle: tourTitleValue,
  });

  mkdirSync(join(assetsRoot, clientId, tourId, 'brand'), { recursive: true });
  mkdirSync(join(assetsRoot, clientId, tourId, 'panoramas'), {
    recursive: true,
  });
  mkdirSync(join(assetsRoot, clientId, tourId, 'thumbnails'), {
    recursive: true,
  });

  const brandAssets = await saveTourBrandAssets({
    root,
    assetsRoot,
    clientId,
    tourId,
    logoFileBuffer,
    faviconFileBuffer,
  });

  const tour = buildTourRecord({
    tourId,
    clientId,
    category: category.trim(),
    tourTitle: tourTitleValue,
    websiteUrl,
    clientName: mode === 'new' ? clientName?.trim() : undefined,
    scene,
    primaryColor,
    hasLogo: brandAssets.savedLogo,
    hasFavicon: brandAssets.savedFavicon,
  });

  await bakeSceneThumbnail({
    root,
    assetsRoot,
    tour,
    sceneId: scene.id,
    view: scene.defaultView,
  });

  const tourPath = join(toursDir, `${tourId}.json`);
  const knowledgePath = join(toursDir, `${tourId}-knowledge.json`);

  writeTourJson(tourPath, tour);
  writeFileSync(
    knowledgePath,
    `${JSON.stringify(syncKnowledgeFromTour(tour, null), null, 2)}\n`,
    'utf8',
  );
  writeCatalogJson(toursDir, catalog);

  return { tourPath, knowledgePath, tour, firstSceneId: scene.id, clientId };
}
