import type { Hotspot, Tour, TourImmersiveBackground } from '../types/tour';
import { withBaseUrl } from '../utils/assetUrl';
import { GLOBAL_IMMERSIVE_BACKGROUND } from '../constants/immersiveBackground';

function normalizeHotspot(hotspot: Hotspot): Hotspot {
  const preview =
    hotspot.preview?.image ?
      { ...hotspot.preview, image: withBaseUrl(hotspot.preview.image) }
    : hotspot.preview;

  const popup =
    hotspot.popup?.image ?
      { ...hotspot.popup, image: withBaseUrl(hotspot.popup.image) }
    : hotspot.popup;

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
    scenes: Object.fromEntries(
      Object.entries(tour.scenes).map(([id, scene]) => [
        id,
        {
          ...scene,
          panorama: withBaseUrl(scene.panorama),
          thumbnail: scene.thumbnail ? withBaseUrl(scene.thumbnail) : undefined,
          hotspots: scene.hotspots.map(normalizeHotspot),
        },
      ]),
    ),
  };
}
