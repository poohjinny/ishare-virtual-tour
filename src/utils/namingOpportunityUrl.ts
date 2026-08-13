import type { Hotspot, Tour } from '../types/tour';
import {
  findNamingHotspotByNamingId,
  findNamingHotspotInTour,
} from './findTourHotspot';
import {
  isNamingHotspot,
  resolveHotspotNamingRecord,
} from './namingSceneInherit';
import { isNamingRoutable } from './namingVisibility';
import {
  isOpaqueNamingSearchValue,
  namingSearchValueMatches,
  toCanonicalNamingSearchValue,
} from './namingOpportunitySearch.mjs';
import type { SceneVisibilityAudience } from './sceneVisibility';

/** Deep link — open naming opportunity panel (`?no={no_*}`). */
export const NAMING_OPPORTUNITY_SEARCH_KEY = 'no';

interface NamingOpportunityLink {
  sceneId: string;
  hotspotId: string;
  namingId: string;
  searchValue: string;
}

function listNamingOpportunityLinks(tour: Tour): NamingOpportunityLink[] {
  const items: NamingOpportunityLink[] = [];

  const appendLink = (sceneId: string, hotspot: Hotspot) => {
    if (!isNamingHotspot(hotspot)) return;
    const namingId = hotspot.namingId?.trim();
    const searchValue = toCanonicalNamingSearchValue({ namingId });
    if (!namingId || !searchValue) return;

    items.push({ sceneId, hotspotId: hotspot.id, namingId, searchValue });
  };

  for (const hotspot of tour.hotspots ?? []) {
    if (!isNamingHotspot(hotspot)) continue;
    appendLink(hotspot.sceneId ?? tour.firstScene, hotspot);
  }

  for (const scene of Object.values(tour.scenes)) {
    for (const hotspot of scene.hotspots) {
      if (tour.hotspots?.some((entry) => entry.id === hotspot.id)) continue;
      appendLink(scene.id, hotspot);
    }
  }

  return items;
}

/** True when this scene can host the naming pin for URL purposes. */
export function sceneHostsNamingHotspot(
  tour: Tour,
  sceneId: string,
  hotspotId: string,
): boolean {
  const scene = tour.scenes[sceneId];
  if (!scene) return false;
  if (scene.hotspots?.some((hotspot) => hotspot.id === hotspotId)) {
    return true;
  }
  return (tour.hotspots ?? []).some((hotspot) => {
    if (hotspot.id !== hotspotId || !isNamingHotspot(hotspot)) return false;
    // model3d tour-level pin: visible from any viewpoint unless it names a host.
    if (!hotspot.sceneId?.trim()) return true;
    return hotspot.sceneId === sceneId;
  });
}

/**
 * Scene to put in a naming share / OG URL.
 * Prefer the caller's scene when it actually hosts the pin; otherwise the
 * placement scene. Avoids falling back to `firstScene` (Overview).
 */
export function resolveNamingShareSceneId(
  tour: Tour,
  sceneId: string | null | undefined,
  namingHotspotId?: string | null,
): string {
  const requested = sceneId?.trim() || '';
  if (!namingHotspotId?.trim()) {
    return requested && tour.scenes[requested] ? requested : tour.firstScene;
  }
  if (requested && sceneHostsNamingHotspot(tour, requested, namingHotspotId)) {
    return requested;
  }
  return (
    findNamingHotspotInTour(tour, namingHotspotId)?.sceneId ??
    (requested && tour.scenes[requested] ? requested : tour.firstScene)
  );
}

/** Serialize a naming-opportunity hotspot for `?no=` (`no_*`). */
export function toNamingOpportunitySearchValue(
  tour: Tour,
  hotspotId: string,
): string | null {
  for (const item of listNamingOpportunityLinks(tour)) {
    if (item.hotspotId === hotspotId) {
      return item.searchValue || null;
    }
  }
  return null;
}

function isLinkRoutable(
  tour: Tour,
  item: Pick<NamingOpportunityLink, 'hotspotId' | 'namingId' | 'sceneId'>,
  audience: SceneVisibilityAudience,
): boolean {
  const found =
    findNamingHotspotInTour(tour, item.hotspotId) ??
    findNamingHotspotByNamingId(tour, item.namingId);
  const hotspot = found?.hotspot;
  if (!hotspot) return false;
  return isNamingRoutable(resolveHotspotNamingRecord(tour, hotspot), audience);
}

/** Resolve `?no=` to a naming-opportunity hotspot (`no_*` only). */
export function resolveNamingOpportunityFromSearch(
  tour: Tour,
  searchValue: string,
  audience: SceneVisibilityAudience = {},
): { hotspotId: string; sceneId: string } | null {
  const trimmed = searchValue.trim();
  if (!isOpaqueNamingSearchValue(trimmed)) return null;

  const links = listNamingOpportunityLinks(tour);

  for (const item of links) {
    if (!namingSearchValueMatches(trimmed, { namingId: item.namingId })) {
      continue;
    }
    if (!isLinkRoutable(tour, item, audience)) continue;
    return { hotspotId: item.hotspotId, sceneId: item.sceneId };
  }

  const byNamingId = findNamingHotspotByNamingId(tour, trimmed);
  if (
    byNamingId &&
    isNamingRoutable(
      resolveHotspotNamingRecord(tour, byNamingId.hotspot),
      audience,
    )
  ) {
    return { hotspotId: byNamingId.hotspot.id, sceneId: byNamingId.sceneId };
  }

  return null;
}
