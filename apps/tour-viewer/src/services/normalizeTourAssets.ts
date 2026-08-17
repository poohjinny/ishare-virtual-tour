import type {
  Hotspot,
  NamingOpportunityRecord,
  PopupContent,
  Tour,
  TourImmersiveBackground,
} from '../types/tour';
import { appendCacheBust, withBaseUrl } from '../utils/assetUrl';
import { GLOBAL_IMMERSIVE_BACKGROUND } from '../constants/immersiveBackground';
import { parseNamingPriceInput } from '../utils/namingPrice';
import { normalizePlayTour } from '../utils/playTour';
import {
  resolveDonorLogoPath,
  resolveHotspotPreviewPath,
  resolveScenePanoramaPath,
  resolveSceneThumbnailPath,
  resolveTourLogoPath,
} from '../utils/tourAssetResolve.mjs';

function resolvePublicAssetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return withBaseUrl(path);
}

function normalizePopupContent(popup: PopupContent): PopupContent {
  let next = popup;

  if (popup.image) {
    next = { ...next, image: withBaseUrl(popup.image) };
  }

  if (popup.namingOpportunity) {
    const price = parseNamingPriceInput(popup.namingOpportunity.price);
    const donorLogo = popup.namingOpportunity.donor?.logo;
    const nextDonorLogo =
      typeof donorLogo === 'string' ? withBaseUrl(donorLogo) : undefined;
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

function normalizeNamingRecord(
  tour: Tour,
  record: NamingOpportunityRecord,
): NamingOpportunityRecord {
  const price = parseNamingPriceInput(record.price);
  const resolvedLogo = resolveDonorLogoPath(tour, record.id, record.donor?.logo);
  const nextDonorLogo = resolvePublicAssetUrl(resolvedLogo);
  const image = record.image?.trim();
  const nextImage = image ? withBaseUrl(image) : undefined;
  const videoUrl = record.videoUrl?.trim();
  const nextVideoUrl =
    videoUrl && !/^https?:\/\//i.test(videoUrl) ?
      withBaseUrl(videoUrl)
    : videoUrl;
  const priceChanged = price != null && price !== record.price;
  const logoChanged = Boolean(nextDonorLogo && nextDonorLogo !== record.donor?.logo);
  const imageChanged = Boolean(nextImage && nextImage !== record.image);
  const videoChanged = Boolean(
    nextVideoUrl && nextVideoUrl !== record.videoUrl,
  );

  if (!priceChanged && !logoChanged && !imageChanged && !videoChanged) {
    return record;
  }

  return {
    ...record,
    ...(priceChanged ? { price: price! } : {}),
    ...(logoChanged && record.donor ?
      { donor: { ...record.donor, logo: nextDonorLogo } }
    : {}),
    ...(imageChanged ? { image: nextImage } : {}),
    ...(videoChanged ? { videoUrl: nextVideoUrl } : {}),
  };
}

function normalizeHotspot(tour: Tour, hotspot: Hotspot): Hotspot {
  const previewImage = resolveHotspotPreviewPath(
    tour,
    hotspot,
    hotspot.preview?.image,
  );
  const preview =
    previewImage ?
      { ...hotspot.preview, image: withBaseUrl(previewImage) }
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

/** Infer conventional asset URLs and prefix Vite `base` for runtime. */
export function normalizeTourAssets(tour: Tour): Tour {
  const namingOpportunities =
    tour.namingOpportunities ?
      Object.fromEntries(
        Object.entries(tour.namingOpportunities).map(([id, record]) => [
          id,
          normalizeNamingRecord(tour, record),
        ]),
      )
    : undefined;

  return withNormalizedPlayTour({
    ...tour,
    ...(tour.hotspots ?
      { hotspots: tour.hotspots.map((hotspot) => normalizeHotspot(tour, hotspot)) }
    : {}),
    ...(namingOpportunities ? { namingOpportunities } : {}),
    branding: tour.branding ?
      (() => {
        const logo = resolveTourLogoPath(tour, tour.branding.logo);
        const favicon =
          typeof tour.branding.favicon === 'string' && tour.branding.favicon ?
            withBaseUrl(tour.branding.favicon)
          : undefined;
        return {
          ...tour.branding,
          ...(logo ? { logo: withBaseUrl(logo) } : {}),
          ...(favicon ? { favicon } : {}),
        };
      })()
    : undefined,
    immersiveBackground: normalizeImmersiveBackground(
      tour.immersiveBackground ?? GLOBAL_IMMERSIVE_BACKGROUND,
    ),
    ...(tour.model ? { model: withBaseUrl(tour.model) } : {}),
    scenes: Object.fromEntries(
      Object.entries(tour.scenes).map(([id, scene]) => {
        const panorama = resolvePublicAssetUrl(
          resolveScenePanoramaPath(tour, id, scene.panorama),
        );
        const thumbnail = resolvePublicAssetUrl(
          resolveSceneThumbnailPath(tour, id, scene.thumbnail),
        );
        return [
          id,
          {
            ...scene,
            ...(scene.model ? { model: withBaseUrl(scene.model) } : {}),
            ...(panorama ? { panorama } : { panorama: undefined }),
            ...(thumbnail ? { thumbnail } : {}),
            hotspots: scene.hotspots.map((hotspot) =>
              normalizeHotspot(tour, hotspot),
            ),
          },
        ];
      }),
    ),
  });
}

function withNormalizedPlayTour(tour: Tour): Tour {
  const playTour = normalizePlayTour(tour, tour.playTour);
  if (!playTour) {
    if (!tour.playTour) return tour;
    const { playTour: _removed, ...rest } = tour;
    return rest;
  }
  if (playTour === tour.playTour) return tour;
  return { ...tour, playTour };
}

function donorLogoUrl(logo: unknown): string {
  return typeof logo === 'string' ? logo.trim() : '';
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
    let next = hotspot;
    const previewImage =
      typeof hotspot.preview?.image === 'string' ?
        hotspot.preview.image.trim()
      : '';
    if (previewImage) {
      next = {
        ...next,
        preview: {
          ...hotspot.preview,
          image: appendCacheBust(previewImage, version),
        },
      };
    }

    const logo = donorLogoUrl(hotspot.popup?.namingOpportunity?.donor?.logo);
    if (!logo || !hotspot.popup?.namingOpportunity?.donor) return next;
    return {
      ...next,
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

  const bustNamingCatalog = (): Tour['namingOpportunities'] | undefined => {
    const catalog = tour.namingOpportunities;
    if (!catalog) return undefined;
    let changed = false;
    const next: NonNullable<Tour['namingOpportunities']> = {};
    for (const [id, record] of Object.entries(catalog)) {
      const logo = donorLogoUrl(record.donor?.logo);
      if (!logo || !record.donor) {
        next[id] = record;
        continue;
      }
      changed = true;
      next[id] = {
        ...record,
        donor: { ...record.donor, logo: appendCacheBust(logo, version) },
      };
    }
    return changed ? next : catalog;
  };

  const namingOpportunities = bustNamingCatalog();

  return {
    ...tour,
    ...(tour.hotspots ? { hotspots: bustHotspots(tour.hotspots) } : {}),
    ...(namingOpportunities !== tour.namingOpportunities ?
      { namingOpportunities }
    : {}),
    scenes: Object.fromEntries(
      Object.entries(tour.scenes).map(([id, scene]) => {
        const bustedThumbnail =
          scene.thumbnail ?
            appendCacheBust(scene.thumbnail, version)
          : undefined;
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
