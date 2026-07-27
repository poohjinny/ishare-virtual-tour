import type {
  Hotspot,
  PopupContent,
  Tour,
  TourImmersiveBackground,
} from '../types/tour';
import { appendCacheBust, withBaseUrl } from '../utils/assetUrl';
import { GLOBAL_IMMERSIVE_BACKGROUND } from '../constants/immersiveBackground';
import { parseNamingPriceInput } from '../utils/namingPrice';

function normalizePopupContent(popup: PopupContent): PopupContent {
  let next = popup;

  if (popup.image) {
    next = { ...next, image: withBaseUrl(popup.image) };
  }

  if (popup.namingOpportunity) {
    const price = parseNamingPriceInput(popup.namingOpportunity.price);
    const donorLogo = popup.namingOpportunity.donor?.logo;
    const nextDonorLogo = donorLogo ? withBaseUrl(donorLogo) : undefined;
    const priceChanged =
      price != null && price !== popup.namingOpportunity.price;
    const logoChanged = Boolean(nextDonorLogo && nextDonorLogo !== donorLogo);

    if (priceChanged || logoChanged) {
      next = {
        ...next,
        namingOpportunity: {
          ...popup.namingOpportunity,
          ...(priceChanged ? { price } : {}),
          ...(logoChanged && popup.namingOpportunity.donor ?
            { donor: { ...popup.namingOpportunity.donor, logo: nextDonorLogo } }
          : {}),
        },
      };
    }
  }

  return next;
}

function normalizeHotspot(hotspot: Hotspot): Hotspot {
  const preview =
    hotspot.preview?.image ?
      { ...hotspot.preview, image: withBaseUrl(hotspot.preview.image) }
    : hotspot.preview;

  const popup =
    hotspot.popup ? normalizePopupContent(hotspot.popup) : hotspot.popup;

  if (preview === hotspot.preview && popup === hotspot.popup) return hotspot;

  return {
    ...hotspot,
    ...(preview !== undefined ? { preview } : {}),
    ...(popup !== undefined ? { popup } : {}),
  };
}

function normalizeImmersiveBackground(
  config: TourImmersiveBackground,
): TourImmersiveBackground {
  return {
    ...config,
    audio: config.audio ? withBaseUrl(config.audio) : undefined,
    playlist: config.playlist?.map(withBaseUrl),
    playlistManifest:
      config.playlistManifest ?
        withBaseUrl(config.playlistManifest)
      : undefined,
  };
}

/** Resolve relative asset paths for runtime (JSON files and API snapshots). */
export function normalizeTourAssets(tour: Tour): Tour {
  return {
    ...tour,
    ...(tour.hotspots ? { hotspots: tour.hotspots.map(normalizeHotspot) } : {}),
    branding:
      tour.branding ?
        {
          ...tour.branding,
          ...(tour.branding.logo ?
            { logo: withBaseUrl(tour.branding.logo) }
          : {}),
          ...(tour.branding.favicon ?
            { favicon: withBaseUrl(tour.branding.favicon) }
          : {}),
        }
      : undefined,
    floorPlan:
      tour.floorPlan ?
        { ...tour.floorPlan, image: withBaseUrl(tour.floorPlan.image) }
      : undefined,
    immersiveBackground: normalizeImmersiveBackground(
      tour.immersiveBackground ?? GLOBAL_IMMERSIVE_BACKGROUND,
    ),
    ...(tour.model ? { model: withBaseUrl(tour.model) } : {}),
    scenes: Object.fromEntries(
      Object.entries(tour.scenes).map(([id, scene]) => [
        id,
        {
          ...scene,
          ...(scene.model ? { model: withBaseUrl(scene.model) } : {}),
          panorama: withBaseUrl(scene.panorama),
          thumbnail: scene.thumbnail ? withBaseUrl(scene.thumbnail) : undefined,
          hotspots: scene.hotspots.map(normalizeHotspot),
        },
      ]),
    ),
  };
}

/** Bust scene media URLs after dev rebake/replace (same path, new file bytes). */
export function bustSceneThumbnailUrls(
  tour: Tour,
  version: number,
  options: { bustPanorama?: boolean } = {},
): Tour {
  if (version <= 0) return tour;

  const { bustPanorama = false } = options;

  const bustHotspot = (hotspot: Hotspot): Hotspot => {
    const logo = hotspot.popup?.namingOpportunity?.donor?.logo?.trim();
    if (!logo || !hotspot.popup?.namingOpportunity?.donor) return hotspot;
    return {
      ...hotspot,
      popup: {
        ...hotspot.popup,
        namingOpportunity: {
          ...hotspot.popup.namingOpportunity,
          donor: {
            ...hotspot.popup.namingOpportunity.donor,
            logo: appendCacheBust(logo, version),
          },
        },
      },
    };
  };

  const bustHotspots = (hotspots: Hotspot[]): Hotspot[] => {
    let changed = false;
    const next = hotspots.map((hotspot) => {
      const busted = bustHotspot(hotspot);
      if (busted !== hotspot) changed = true;
      return busted;
    });
    return changed ? next : hotspots;
  };

  return {
    ...tour,
    ...(tour.hotspots ? { hotspots: bustHotspots(tour.hotspots) } : {}),
    scenes: Object.fromEntries(
      Object.entries(tour.scenes).map(([id, scene]) => {
        const bustedThumbnail =
          scene.thumbnail ?
            appendCacheBust(scene.thumbnail, version)
          : undefined;
        // Panorama busting forces a viewer node reload, so only apply it when a
        // panorama was actually replaced — otherwise edits like defaultView would
        // needlessly reload the scene and drop its hotspot markers.
        const bustedPanorama =
          bustPanorama && scene.panorama ?
            appendCacheBust(scene.panorama, version)
          : undefined;
        const bustedHotspots = bustHotspots(scene.hotspots);

        if (
          !bustedThumbnail &&
          !bustedPanorama &&
          bustedHotspots === scene.hotspots
        ) {
          return [id, scene];
        }

        return [
          id,
          {
            ...scene,
            ...(bustedThumbnail ? { thumbnail: bustedThumbnail } : {}),
            ...(bustedPanorama ? { panorama: bustedPanorama } : {}),
            ...(bustedHotspots !== scene.hotspots ?
              { hotspots: bustedHotspots }
            : {}),
          },
        ];
      }),
    ),
  };
}
