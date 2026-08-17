import type {
  Hotspot,
  NamingOpportunity,
  NamingOpportunityRecord,
  PopupContent,
  Scene,
  Tour,
} from '../types/tour';
import { resolveFirstPublicNamingBody } from './firstPublicNamingBody';
import { defaultNamingDescription } from './namingDescriptionPlaceholder';
import { isPlaceOverviewHotspot } from './placeOverview';
import { isDefaultSceneDescription } from './sceneDescriptionPlaceholder';

function resolvePlaceOverviewPopupBody(
  tour: Pick<Tour, 'hotspots' | 'viewerType' | 'namingOpportunities'> & {
    title?: string;
  },
  host: Scene | undefined,
  fallback: string,
): string {
  if (!host) return fallback;
  const tourTitle = tour.title?.trim();
  const description = host.description?.trim();
  if (
    description &&
    !isDefaultSceneDescription(description, tourTitle, host.title)
  ) {
    return description;
  }
  const namingBody = resolveFirstPublicNamingBody(tour, host);
  if (namingBody) return namingBody;
  return fallback;
}
/** Naming title derived from a scene title when catalog `name` is omitted. */
export function inheritedNamingOpportunityName(sceneTitle: string): string {
  return sceneTitle.trim();
}

/** Host scene for a naming/info hotspot — `sceneId` (model3d) or the panorama scene that owns it. */
export function resolveHotspotHostScene(
  tour: Pick<Tour, 'scenes'>,
  hotspot: Hotspot,
  fallbackScene?: Scene | null,
): Scene | undefined {
  const linkedId = hotspot.sceneId?.trim();
  if (linkedId && tour.scenes[linkedId]) return tour.scenes[linkedId];
  return fallbackScene ?? undefined;
}

/** True when this info hotspot is a naming opportunity pin. */
export function isNamingHotspot(hotspot: Hotspot): boolean {
  if (hotspot.type !== 'info') return false;
  if (hotspot.namingId?.trim()) return true;
  return Boolean(hotspot.popup?.namingOpportunity);
}

export function lookupNamingRecord(
  tour: Pick<Tour, 'namingOpportunities'>,
  namingId: string | null | undefined,
): NamingOpportunityRecord | undefined {
  const id = namingId?.trim();
  if (!id) return undefined;
  return tour.namingOpportunities?.[id];
}

/**
 * Catalog record or legacy embedded `popup.namingOpportunity`.
 * Returns undefined when the hotspot is not a naming pin / broken ref.
 */
export function resolveHotspotNamingRecord(
  tour: Pick<Tour, 'namingOpportunities'>,
  hotspot: Hotspot,
): NamingOpportunityRecord | (NamingOpportunity & { id?: string }) | undefined {
  const fromCatalog = lookupNamingRecord(tour, hotspot.namingId);
  if (fromCatalog) return fromCatalog;

  const legacy = hotspot.popup?.namingOpportunity;
  if (legacy) return legacy;

  return undefined;
}

/** Resolved display naming fields (name always filled when possible). */
export function resolveHotspotNamingOpportunity(
  tour: Pick<Tour, 'namingOpportunities'>,
  hotspot: Hotspot,
  scene?: Scene | null,
): NamingOpportunity | undefined {
  const record = resolveHotspotNamingRecord(tour, hotspot);
  if (!record) return undefined;

  const sceneTitle = scene?.title?.trim() ?? '';
  const inheritedName = inheritedNamingOpportunityName(sceneTitle);
  const name = record.name?.trim() || inheritedName;
  if (!name && !Number.isFinite(record.price)) return undefined;

  const next: NamingOpportunity = {
    name: name || inheritedName || 'Naming Opportunity',
    price: record.price,
  };
  if (record.priceLabel?.trim()) next.priceLabel = record.priceLabel.trim();
  if (record.status) next.status = record.status;
  if (record.donor) next.donor = record.donor;
  return next;
}

/**
 * Merge catalog + scene inherit + popup placement overrides into a display popup.
 * Place-overview pins inherit scene title/description; other non-naming info is unchanged.
 */
export function resolveNamingPopup(
  tour: Pick<Tour, 'namingOpportunities' | 'hotspots' | 'viewerType'> & {
    scenes?: Tour['scenes'];
    title?: string;
  },
  hotspot: Hotspot,
  scene?: Scene | null,
): PopupContent | undefined {
  if (
    !hotspot.popup &&
    !isNamingHotspot(hotspot) &&
    !isPlaceOverviewHotspot(hotspot)
  ) {
    return undefined;
  }

  if (isPlaceOverviewHotspot(hotspot)) {
    const host = resolveHotspotHostScene(
      { scenes: tour.scenes ?? {} },
      hotspot,
      scene,
    );
    const title =
      host?.title?.trim() || hotspot.popup?.title?.trim() || 'Place';
    const body = resolvePlaceOverviewPopupBody(
      tour,
      host,
      hotspot.popup?.body?.trim() || title,
    );
    const base = hotspot.popup ?? {
      title: '',
      body: '',
      display: 'anchored' as const,
    };
    const videoUrl =
      base.videoUrl?.trim() || host?.previewVideoUrl?.trim() || undefined;
    const image = base.image?.trim() || host?.thumbnail?.trim() || undefined;
    const next: PopupContent = {
      ...base,
      title,
      body,
      display: base.display ?? 'anchored',
    };
    if (image) {
      next.image = image;
    } else {
      delete next.image;
    }
    if (videoUrl) {
      next.videoUrl = videoUrl;
      if (!base.videoUrl?.trim() && host?.videoPoster?.trim()) {
        next.videoPoster = host.videoPoster.trim();
      }
    } else {
      delete next.videoUrl;
      delete next.videoPoster;
    }
    return next;
  }

  if (!isNamingHotspot(hotspot)) return hotspot.popup;

  const naming = resolveHotspotNamingOpportunity(tour, hotspot, scene);
  if (!naming) return hotspot.popup;

  const record = resolveHotspotNamingRecord(tour, hotspot);
  const popup = hotspot.popup ?? {
    title: '',
    body: '',
    display: 'anchored' as const,
  };

  const sceneTitle = scene?.title?.trim() ?? '';
  const title = popup.title?.trim() || naming.name || sceneTitle;
  const catalogBody =
    record && 'body' in record ? record.body?.trim() : undefined;
  const resolvedBody =
    popup.body?.trim() || catalogBody || scene?.description?.trim() || '';
  const body =
    resolvedBody || defaultNamingDescription(naming.name, tour.title);
  const catalogVideo =
    record && 'videoUrl' in record ? record.videoUrl?.trim() : undefined;
  const catalogImage =
    record && 'image' in record ? record.image?.trim() : undefined;
  const videoUrl =
    popup.videoUrl?.trim() ||
    catalogVideo ||
    scene?.previewVideoUrl?.trim() ||
    undefined;
  // Host thumbnail when no NO image/video — Explore-style hero; no empty shell.
  const image =
    popup.image?.trim() ||
    catalogImage ||
    (!videoUrl ? scene?.thumbnail?.trim() : undefined) ||
    undefined;

  const next: PopupContent = {
    ...popup,
    title: title || popup.title || '',
    body,
    namingOpportunity: naming,
  };

  if (image) {
    next.image = image;
  } else {
    delete next.image;
  }

  if (videoUrl) {
    next.videoUrl = videoUrl;
    if (
      !popup.videoUrl?.trim() &&
      !catalogVideo &&
      scene?.videoPoster?.trim()
    ) {
      next.videoPoster = scene.videoPoster.trim();
    }
  } else {
    delete next.videoUrl;
  }

  return next;
}

/** @deprecated Prefer {@link resolveNamingPopup}(tour, hotspot, scene). */
export function resolveNamingHotspotPopup(
  tour: Pick<Tour, 'namingOpportunities' | 'hotspots' | 'viewerType'> & {
    scenes?: Tour['scenes'];
    title?: string;
  },
  hotspot: Hotspot,
  scene?: Scene | null,
): PopupContent | undefined {
  return resolveNamingPopup(tour, hotspot, scene);
}
