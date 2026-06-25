import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  readTourJson,
  resolveTourJsonPath,
  writeTourJson,
} from './tourSceneDev.mjs';
import { normalizePrimaryColor, saveTourBrandAssets } from './tourBrandDev.mjs';

function readCatalogJson(toursDir) {
  const catalogPath = join(toursDir, 'catalog.json');
  if (!existsSync(catalogPath)) {
    return null;
  }
  return JSON.parse(readFileSync(catalogPath, 'utf8'));
}

function writeCatalogJson(toursDir, catalog) {
  const catalogPath = join(toursDir, 'catalog.json');
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

function updateCatalogTourEntry({
  catalog,
  clientId,
  tourId,
  tourTitle,
  category,
  visibility,
  featured,
}) {
  const client = catalog.clients?.find((entry) => entry.id === clientId);
  if (!client) return;

  const entry = client.tours?.find((tour) => tour.id === tourId);
  if (!entry) return;

  entry.name = tourTitle;
  entry.category = category;
  if (visibility) {
    entry.visibility = visibility;
  }
  if (typeof featured === 'boolean') {
    entry.featured = featured;
  }
}

const CATALOG_VISIBILITIES = new Set(['public', 'unlisted', 'internal']);

export function findCatalogTourEntry(toursDir, clientId, tourId) {
  const catalog = readCatalogJson(toursDir);
  if (!catalog) return null;

  const client = catalog.clients?.find((entry) => entry.id === clientId);
  if (!client) return null;

  const entry = client.tours?.find((tour) => tour.id === tourId);
  if (!entry) return null;

  return {
    visibility: entry.visibility ?? 'public',
    featured: entry.featured ?? false,
  };
}

export function assertCatalogVisibility(value) {
  const visibility = value?.trim();
  if (!visibility || !CATALOG_VISIBILITIES.has(visibility)) {
    throw new Error('visibility must be public, unlisted, or internal');
  }
  return visibility;
}

function updateKnowledgeFile({
  toursDir,
  tourId,
  tourTitle,
  websiteUrl,
  organizationName,
}) {
  const knowledgePath = join(toursDir, `${tourId}-knowledge.json`);
  if (!existsSync(knowledgePath)) return;

  const knowledge = JSON.parse(readFileSync(knowledgePath, 'utf8'));
  const nextWebsite = websiteUrl?.trim();
  const nextTitle = tourTitle?.trim();
  const nextOrgName = organizationName?.trim();

  if (nextWebsite) {
    knowledge.url = nextWebsite;
  }
  if (nextOrgName || nextTitle) {
    knowledge.global = knowledge.global ?? {};
    if (nextOrgName) {
      knowledge.global.facilityName = nextOrgName;
    } else if (nextTitle) {
      knowledge.global.facilityName = nextTitle;
    }
  }

  writeFileSync(
    knowledgePath,
    `${JSON.stringify(knowledge, null, 2)}\n`,
    'utf8',
  );
}

function assertGoogleFontSourceUrl(url) {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(url.trim());
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'fonts.googleapis.com'
    ) {
      throw new Error(
        'fontSourceUrl must be an https://fonts.googleapis.com/ URL',
      );
    }
    return url.trim();
  } catch (error) {
    if (error instanceof Error && error.message.includes('fontSourceUrl')) {
      throw error;
    }
    throw new Error('fontSourceUrl must be a valid URL');
  }
}

function applyOptionalOrganizationField(organization, key, value) {
  if (value === undefined) return;
  const trimmed = value.trim();
  if (trimmed) {
    organization[key] = trimmed;
  } else {
    delete organization[key];
  }
}

const TRANSITION_EFFECTS = new Set(['fade', 'black']);

function applyProductFullName(tour, productFullName) {
  if (productFullName === undefined) return;
  const trimmed = productFullName.trim();
  if (trimmed) {
    tour.productFullName = trimmed;
  } else {
    delete tour.productFullName;
  }
}

function applyDefaultTransition({
  tour,
  transitionEffect,
  transitionSpeed,
  clearDefaultTransition,
}) {
  if (clearDefaultTransition === true) {
    delete tour.defaultTransition;
    return;
  }

  const hasEffect = transitionEffect !== undefined;
  const hasSpeed = transitionSpeed !== undefined;
  if (!hasEffect && !hasSpeed) return;

  tour.defaultTransition = tour.defaultTransition ?? {
    speed: '500ms',
    effect: 'fade',
  };

  if (hasEffect) {
    const effect = transitionEffect?.trim();
    if (!effect || !TRANSITION_EFFECTS.has(effect)) {
      throw new Error('transitionEffect must be fade or black');
    }
    tour.defaultTransition.effect = effect;
  }

  if (hasSpeed) {
    const speed = transitionSpeed?.trim();
    if (!speed) {
      delete tour.defaultTransition.speed;
    } else {
      tour.defaultTransition.speed = speed;
    }
  }

  if (!tour.defaultTransition.effect && !tour.defaultTransition.speed) {
    delete tour.defaultTransition;
  }
}

function parsePlaylistLines(value) {
  if (value === undefined) return undefined;
  const tracks = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return tracks;
}

function applyImmersiveBackground({
  tour,
  immersiveAudio,
  immersivePlaylist,
  immersivePlaylistManifest,
  immersiveVolume,
  clearImmersiveBackground,
}) {
  if (clearImmersiveBackground === true) {
    delete tour.immersiveBackground;
    return;
  }

  const hasAudio = immersiveAudio !== undefined;
  const hasPlaylist = immersivePlaylist !== undefined;
  const hasManifest = immersivePlaylistManifest !== undefined;
  const hasVolume = immersiveVolume !== undefined;

  if (!hasAudio && !hasPlaylist && !hasManifest && !hasVolume) {
    return;
  }

  const next = { ...(tour.immersiveBackground ?? {}) };

  if (hasAudio) {
    const audio = immersiveAudio?.trim();
    if (audio) {
      next.audio = audio;
      delete next.playlist;
      delete next.playlistManifest;
    } else {
      delete next.audio;
    }
  }

  if (hasPlaylist) {
    const playlist = parsePlaylistLines(immersivePlaylist);
    if (playlist?.length) {
      next.playlist = playlist;
      delete next.audio;
      delete next.playlistManifest;
    } else {
      delete next.playlist;
    }
  }

  if (hasManifest) {
    const manifest = immersivePlaylistManifest?.trim();
    if (manifest) {
      next.playlistManifest = manifest;
      delete next.audio;
      delete next.playlist;
    } else {
      delete next.playlistManifest;
    }
  }

  if (hasVolume) {
    const volume = Number(immersiveVolume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      throw new Error('immersiveVolume must be a number between 0 and 1');
    }
    next.volume = volume;
  }

  if (
    !next.audio &&
    !next.playlist?.length &&
    !next.playlistManifest &&
    next.volume === undefined
  ) {
    delete tour.immersiveBackground;
    return;
  }

  tour.immersiveBackground = next;
}

export async function updateTour({
  root,
  toursDir,
  assetsRoot,
  tourId,
  tourTitle,
  category,
  websiteUrl,
  primaryColor,
  logoAlt,
  logoFileBuffer,
  faviconFileBuffer,
  visibility,
  featured,
  organizationName,
  organizationEmail,
  organizationPhone,
  organizationPhoneLabel,
  organizationFax,
  organizationFaxLabel,
  organizationAddress,
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
}) {
  const resolvedTourId = tourId?.trim();
  if (!resolvedTourId) {
    throw new Error('tourId is required');
  }
  if (!tourTitle?.trim()) {
    throw new Error('tourTitle is required');
  }
  if (!category?.trim()) {
    throw new Error('category is required');
  }

  const tourPath = resolveTourJsonPath(toursDir, resolvedTourId);
  const tour = readTourJson(tourPath);
  const clientId = tour.clientId ?? tour.id;
  const nextTitle = tourTitle.trim();
  const nextCategory = category.trim();
  const nextWebsite = websiteUrl?.trim();
  const nextVisibility =
    visibility?.trim() ? assertCatalogVisibility(visibility) : undefined;

  tour.title = nextTitle;
  tour.category = nextCategory;

  if (nextWebsite) {
    tour.url = nextWebsite;
    tour.organization = tour.organization ?? {
      name: nextTitle,
      website: nextWebsite,
    };
    tour.organization.website = nextWebsite;
  }

  const hasOrganizationFields =
    organizationName !== undefined ||
    organizationEmail !== undefined ||
    organizationPhone !== undefined ||
    organizationPhoneLabel !== undefined ||
    organizationFax !== undefined ||
    organizationFaxLabel !== undefined ||
    organizationAddress !== undefined;

  if (hasOrganizationFields) {
    tour.organization = tour.organization ?? {
      name: organizationName?.trim() || nextTitle,
      website: nextWebsite || tour.url || '',
    };
    applyOptionalOrganizationField(
      tour.organization,
      'name',
      organizationName ?? '',
    );
    applyOptionalOrganizationField(
      tour.organization,
      'email',
      organizationEmail ?? '',
    );
    applyOptionalOrganizationField(
      tour.organization,
      'phone',
      organizationPhone ?? '',
    );
    applyOptionalOrganizationField(
      tour.organization,
      'phoneLabel',
      organizationPhoneLabel ?? '',
    );
    applyOptionalOrganizationField(
      tour.organization,
      'fax',
      organizationFax ?? '',
    );
    applyOptionalOrganizationField(
      tour.organization,
      'faxLabel',
      organizationFaxLabel ?? '',
    );
    applyOptionalOrganizationField(
      tour.organization,
      'address',
      organizationAddress ?? '',
    );
    if (!tour.organization.name?.trim()) {
      tour.organization.name = nextTitle;
    }
    if (!tour.organization.website?.trim() && nextWebsite) {
      tour.organization.website = nextWebsite;
    }
  }

  const normalizedColor =
    primaryColor?.trim() ? normalizePrimaryColor(primaryColor) : undefined;
  if (primaryColor?.trim() && !normalizedColor) {
    throw new Error('primaryColor must be a valid hex color');
  }

  tour.branding = tour.branding ?? {};
  if (normalizedColor) {
    tour.branding.primaryColor = normalizedColor;
  }

  const nextLogoAlt = logoAlt?.trim();
  if (nextLogoAlt) {
    tour.branding.logoAlt = nextLogoAlt;
  }

  const normalizedFontSourceUrl =
    fontSourceUrl !== undefined ?
      assertGoogleFontSourceUrl(fontSourceUrl)
    : undefined;
  if (clearFontFamily === true) {
    delete tour.branding.fontFamily;
  } else if (fontFamily !== undefined) {
    const nextFontFamily = fontFamily.trim();
    if (nextFontFamily) {
      tour.branding.fontFamily = nextFontFamily;
    } else {
      delete tour.branding.fontFamily;
    }
  }
  if (clearFontSourceUrl === true) {
    delete tour.branding.fontSourceUrl;
  } else if (fontSourceUrl !== undefined) {
    if (normalizedFontSourceUrl) {
      tour.branding.fontSourceUrl = normalizedFontSourceUrl;
    } else {
      delete tour.branding.fontSourceUrl;
    }
  }

  const brandAssets = await saveTourBrandAssets({
    root,
    assetsRoot,
    clientId,
    tourId: tour.id,
    logoFileBuffer,
    faviconFileBuffer,
  });

  if (brandAssets.savedLogo) {
    tour.branding.logo = brandAssets.logoWebPath;
    if (!tour.branding.logoAlt?.trim()) {
      tour.branding.logoAlt =
        nextLogoAlt || tour.organization?.name || nextTitle;
    }
  }

  if (brandAssets.savedFavicon) {
    tour.branding.favicon = brandAssets.faviconWebPath;
  }

  applyProductFullName(tour, productFullName);
  applyDefaultTransition({
    tour,
    transitionEffect,
    transitionSpeed,
    clearDefaultTransition,
  });
  applyImmersiveBackground({
    tour,
    immersiveAudio,
    immersivePlaylist,
    immersivePlaylistManifest,
    immersiveVolume,
    clearImmersiveBackground,
  });

  writeTourJson(tourPath, tour);

  const catalog = readCatalogJson(toursDir);
  if (catalog) {
    updateCatalogTourEntry({
      catalog,
      clientId,
      tourId: tour.id,
      tourTitle: nextTitle,
      category: nextCategory,
      visibility: nextVisibility,
      featured: typeof featured === 'boolean' ? featured : undefined,
    });
    writeCatalogJson(toursDir, catalog);
  }

  updateKnowledgeFile({
    toursDir,
    tourId: tour.id,
    tourTitle: nextTitle,
    websiteUrl: nextWebsite,
    organizationName: tour.organization?.name,
  });

  return { tourPath, tour };
}
