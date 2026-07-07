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
    if (price != null && price !== popup.namingOpportunity.price) {
      next = {
        ...next,
        namingOpportunity: { ...popup.namingOpportunity, price },
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

  return {
    ...tour,
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

        if (!bustedThumbnail && !bustedPanorama) return [id, scene];

        return [
          id,
          {
            ...scene,
            ...(bustedThumbnail ? { thumbnail: bustedThumbnail } : {}),
            ...(bustedPanorama ? { panorama: bustedPanorama } : {}),
          },
        ];
      }),
    ),
  };
}
