/**
 * Conventional tour asset URLs. SPA, tour-og Worker, and Dev/bake scripts
 * share this module. Tour JSON stores identity (+ overrides); load infers
 * `/assets/{clientId}/{tourId}/…` paths.
 */

export function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

export function getTourAssetBasePath(tour) {
  const id = tour?.id?.trim();
  if (!id) throw new Error('tour.id is required');
  const clientId = String(tour.clientId ?? id).trim() || id;
  return `/assets/${clientId}/${id}`;
}

export function tourAssetPath(tour, ...segments) {
  const suffix = segments.filter(Boolean).join('/');
  return suffix ?
      `${getTourAssetBasePath(tour)}/${suffix}`
    : getTourAssetBasePath(tour);
}

export function isModel3dTour(tour) {
  return tour?.viewerType === 'model3d';
}

/** Scene-card bake folder (`scene.thumbnail`). */
export const SCENE_THUMB_DIR = 'scene-thumbs';
/** Naming-pin bake folder (`hotspot.preview.image`). */
export const HOTSPOT_THUMB_DIR = 'hotspot-thumbs';

export function conventionalPanoramaPath(tour, sceneId) {
  return tourAssetPath(tour, 'panoramas', `${sceneId}.webp`);
}

export function conventionalThumbnailPath(tour, sceneId) {
  return tourAssetPath(tour, SCENE_THUMB_DIR, `${sceneId}.webp`);
}

export function conventionalPreviewPath(tour, hotspotId) {
  return tourAssetPath(tour, HOTSPOT_THUMB_DIR, `${hotspotId}.webp`);
}

export function conventionalDonorLogoPath(tour, folderId) {
  return tourAssetPath(tour, 'naming', folderId, 'donor-logo.png');
}

export function conventionalTourModelPath(tour, ext = 'glb') {
  return tourAssetPath(tour, 'models', `${tour.id}.${ext}`);
}

export function conventionalSceneModelPath(tour, sceneId, ext = 'glb') {
  return tourAssetPath(tour, 'models', `${sceneId}.${ext}`);
}

export function conventionalClientLogoPath(clientId) {
  const id = String(clientId || '').trim();
  if (!id) throw new Error('clientId is required');
  return `/assets/${id}/brand/logo.png`;
}

export function conventionalClientFaviconPngPath(clientId) {
  const id = String(clientId || '').trim();
  if (!id) throw new Error('clientId is required');
  return `/assets/${id}/favicon.png`;
}

export function conventionalClientFaviconIcoPath(clientId) {
  const id = String(clientId || '').trim();
  if (!id) throw new Error('clientId is required');
  return `/assets/${id}/favicon.ico`;
}

export function conventionalTourLogoPath(tour) {
  return tourAssetPath(tour, 'brand', 'logo.png');
}

export function conventionalTourFaviconPngPath(tour) {
  return tourAssetPath(tour, 'favicon.png');
}

export function conventionalTourFaviconIcoPath(tour) {
  return tourAssetPath(tour, 'favicon.ico');
}

export function resolveClientLogoPath(clientId, explicit) {
  const override = explicitAssetPath(explicit);
  if (override) return override;
  const id = String(clientId || '').trim();
  return id ? conventionalClientLogoPath(id) : null;
}

/** Catalog client branding with conventional logo filled in (favicon stays probed). */
export function hydrateCatalogClientBranding(client) {
  if (!client?.id) return client?.branding ?? null;
  const logo = resolveClientLogoPath(client.id, client.branding?.logo);
  if (!logo && !client.branding) return null;
  if (logo && client.branding?.logo === logo) return client.branding;
  if (!logo) return client.branding ?? null;
  return { ...client.branding, logo };
}

/** Tour-only logo: `true` / conventional path, string override, omit → inherit client. */
export function resolveTourLogoPath(tour, explicit) {
  if (explicit === true) return conventionalTourLogoPath(tour);
  return explicitAssetPath(explicit);
}

export function isConventionalClientLogoPath(clientId, path) {
  const id = String(clientId || '').trim();
  const trimmed = explicitAssetPath(path);
  return Boolean(id && trimmed && trimmed === conventionalClientLogoPath(id));
}

export function isConventionalClientFaviconPath(clientId, path) {
  const id = String(clientId || '').trim();
  const trimmed = explicitAssetPath(path);
  if (!id || !trimmed) return false;
  return (
    trimmed === conventionalClientFaviconPngPath(id) ||
    trimmed === conventionalClientFaviconIcoPath(id)
  );
}

export function isConventionalTourLogoPath(tour, path) {
  const trimmed = explicitAssetPath(path);
  return Boolean(trimmed && trimmed === conventionalTourLogoPath(tour));
}

export function isConventionalTourFaviconPath(tour, path) {
  const trimmed = explicitAssetPath(path);
  if (!trimmed) return false;
  return (
    trimmed === conventionalTourFaviconPngPath(tour) ||
    trimmed === conventionalTourFaviconIcoPath(tour)
  );
}

/** Non-empty string override, or null to infer / omit. */
export function explicitAssetPath(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function isNamingHotspot(hotspot) {
  return Boolean(
    hotspot?.namingId?.trim() ||
    (hotspot?.type === 'info' && hotspot?.popup?.namingOpportunity),
  );
}

export function findHostHotspotIdForNaming(tour, namingId) {
  const id = namingId?.trim();
  if (!id) return null;

  const scan = (hotspots) => {
    for (const hotspot of hotspots ?? []) {
      if (hotspot?.namingId?.trim() === id && hotspot.id) return hotspot.id;
    }
    return null;
  };

  const fromTour = scan(tour?.hotspots);
  if (fromTour) return fromTour;

  for (const scene of Object.values(tour?.scenes ?? {})) {
    const found = scan(scene?.hotspots);
    if (found) return found;
  }
  return null;
}

export function resolveScenePanoramaPath(tour, sceneId, explicit) {
  const override = explicitAssetPath(explicit);
  if (override) return override;
  if (!sceneId || isModel3dTour(tour)) return null;
  return conventionalPanoramaPath(tour, sceneId);
}

export function resolveSceneThumbnailPath(tour, sceneId, explicit) {
  const override = explicitAssetPath(explicit);
  if (override) return override;
  if (!sceneId) return null;
  return conventionalThumbnailPath(tour, sceneId);
}

export function resolveHotspotPreviewPath(tour, hotspot, explicit) {
  const override = explicitAssetPath(explicit);
  if (override) return override;
  if (!hotspot?.id || !isNamingHotspot(hotspot)) return null;
  return conventionalPreviewPath(tour, hotspot.id);
}

/**
 * Donor logo: omit = none, `true` = conventional file, string = override.
 * Conventional file is `naming/{hostHotspotId}/donor-logo.png`.
 */
export function resolveDonorLogoPath(tour, namingId, explicit) {
  if (explicit === true) {
    const folderId = findHostHotspotIdForNaming(tour, namingId);
    return folderId ? conventionalDonorLogoPath(tour, folderId) : null;
  }
  return explicitAssetPath(explicit);
}

export function isConventionalPanoramaPath(tour, sceneId, path) {
  const trimmed = explicitAssetPath(path);
  if (!trimmed || !sceneId) return false;
  if (trimmed === conventionalPanoramaPath(tour, sceneId)) return true;
  return (
    isModel3dTour(tour) && trimmed === conventionalThumbnailPath(tour, sceneId)
  );
}

export function isConventionalThumbnailPath(tour, sceneId, path) {
  const trimmed = explicitAssetPath(path);
  if (!trimmed || !sceneId) return false;
  return trimmed === conventionalThumbnailPath(tour, sceneId);
}

export function isConventionalPreviewPath(tour, hotspotId, path) {
  const trimmed = explicitAssetPath(path);
  if (!trimmed || !hotspotId) return false;
  return trimmed === conventionalPreviewPath(tour, hotspotId);
}

export function isConventionalDonorLogoPath(tour, namingId, path) {
  const trimmed = explicitAssetPath(path);
  if (!trimmed) return false;
  const hostId = findHostHotspotIdForNaming(tour, namingId);
  return Boolean(hostId && trimmed === conventionalDonorLogoPath(tour, hostId));
}

function stripHotspotAssets(tour, hotspot) {
  if (!hotspot || typeof hotspot !== 'object') return 0;
  let stripped = 0;
  const image = hotspot.preview?.image;
  if (
    image !== undefined &&
    isNamingHotspot(hotspot) &&
    isConventionalPreviewPath(tour, hotspot.id, image)
  ) {
    delete hotspot.preview.image;
    if (hotspot.preview && Object.keys(hotspot.preview).length === 0) {
      delete hotspot.preview;
    }
    stripped += 1;
  }
  return stripped;
}

/**
 * Mutates tour JSON: drop asset URLs that match convention.
 * `donor.logo` conventional paths become `true`.
 * @returns {{ panorama: number, thumbnail: number, preview: number, logo: number }}
 */
export function stripConventionalTourAssets(tour) {
  const counts = { panorama: 0, thumbnail: 0, preview: 0, logo: 0 };
  if (!tour || typeof tour !== 'object') return counts;

  for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
    if (!scene || typeof scene !== 'object') continue;

    if (isConventionalPanoramaPath(tour, sceneId, scene.panorama)) {
      delete scene.panorama;
      counts.panorama += 1;
    }
    if (isConventionalThumbnailPath(tour, sceneId, scene.thumbnail)) {
      delete scene.thumbnail;
      counts.thumbnail += 1;
    }

    for (const hotspot of scene.hotspots ?? []) {
      counts.preview += stripHotspotAssets(tour, hotspot);
    }
  }

  for (const hotspot of tour.hotspots ?? []) {
    counts.preview += stripHotspotAssets(tour, hotspot);
  }

  for (const [namingId, record] of Object.entries(
    tour.namingOpportunities ?? {},
  )) {
    const logo = record?.donor?.logo;
    if (logo === true) continue;
    if (isConventionalDonorLogoPath(tour, namingId, logo)) {
      record.donor.logo = true;
      counts.logo += 1;
    }
  }

  if (tour.branding && typeof tour.branding === 'object') {
    if (tour.branding.logo === true) {
      /* already conventional */
    } else if (isConventionalTourLogoPath(tour, tour.branding.logo)) {
      tour.branding.logo = true;
      counts.logo += 1;
    }
    if (isConventionalTourFaviconPath(tour, tour.branding.favicon)) {
      delete tour.branding.favicon;
      counts.logo += 1;
    }
  }

  return counts;
}

/**
 * Mutates catalog.json: drop conventional client logo/favicon paths.
 * @returns {{ logo: number, favicon: number }}
 */
export function stripConventionalCatalogBranding(catalog) {
  const counts = { logo: 0, favicon: 0 };
  if (!catalog || typeof catalog !== 'object') return counts;

  for (const client of catalog.clients ?? []) {
    const branding = client?.branding;
    if (!branding || typeof branding !== 'object' || !client.id) continue;
    if (isConventionalClientLogoPath(client.id, branding.logo)) {
      delete branding.logo;
      counts.logo += 1;
    }
    if (isConventionalClientFaviconPath(client.id, branding.favicon)) {
      delete branding.favicon;
      counts.favicon += 1;
    }
  }

  return counts;
}
