import { stripNamingOpportunitySuffix } from '../data/namingOpportunityStatus';
import type { Hotspot, Tour } from '../types/tour';
import { slugifyHotspotName } from './devHotspotLogger';
import {
  findNamingHotspotByNamingId,
  findNamingHotspotInTour,
} from './findTourHotspot';
import {
  isNamingHotspot,
  resolveHotspotHostScene,
  resolveHotspotNamingRecord,
  resolveNamingPopup,
} from './namingSceneInherit';
import { isNamingRoutable } from './namingVisibility';
import type { SceneVisibilityAudience } from './sceneVisibility';

/** Deep link — open naming opportunity panel (`?no={kebab-case-name}`). */
export const NAMING_OPPORTUNITY_SEARCH_KEY = 'no';

export const NAMING_OPPORTUNITY_HOTSPOT_PREFIX = 'info-';

/** "Parking Lot" → `parking-lot` */
export function namingOpportunityNameToKebabCase(name: string): string {
  return slugifyHotspotName(name);
}

/** @deprecated Use {@link namingOpportunityNameToKebabCase}. Legacy camelCase URLs still resolve. */
export function namingOpportunityNameToCamelCase(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : (
          lower.charAt(0).toUpperCase() + lower.slice(1)
        );
    })
    .join('');
}

function namingOpportunityDisplayName(
  tour: Tour,
  sceneId: string,
  hotspot: Hotspot,
): string | null {
  if (!isNamingHotspot(hotspot)) return null;
  const scene = resolveHotspotHostScene(tour, hotspot, tour.scenes[sceneId]);
  const popup = resolveNamingPopup(tour, hotspot, scene);
  const name = popup?.namingOpportunity?.name?.trim();
  if (!name) return null;
  return stripNamingOpportunitySuffix(name);
}

function legacyKebabFromHotspotId(hotspotId: string): string {
  return hotspotId.startsWith(NAMING_OPPORTUNITY_HOTSPOT_PREFIX) ?
      hotspotId.slice(NAMING_OPPORTUNITY_HOTSPOT_PREFIX.length)
    : hotspotId;
}

interface NamingOpportunityLink {
  sceneId: string;
  hotspotId: string;
  namingId?: string;
  searchValue: string;
  legacyCamelCase: string;
  legacyKebab: string;
  nameSlug: string;
}

function listNamingOpportunityLinks(tour: Tour): NamingOpportunityLink[] {
  const items: NamingOpportunityLink[] = [];

  const appendLink = (sceneId: string, hotspot: Hotspot) => {
    const displayName = namingOpportunityDisplayName(tour, sceneId, hotspot);
    if (!isNamingHotspot(hotspot) || !displayName) return;

    items.push({
      sceneId,
      hotspotId: hotspot.id,
      namingId: hotspot.namingId?.trim() || undefined,
      searchValue: namingOpportunityNameToKebabCase(displayName),
      legacyCamelCase: namingOpportunityNameToCamelCase(displayName),
      legacyKebab: legacyKebabFromHotspotId(hotspot.id),
      nameSlug: slugifyHotspotName(displayName),
    });
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

/** Serialize a naming-opportunity hotspot id for `?no=` (kebab-case display name). */
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
    (item.namingId ? findNamingHotspotByNamingId(tour, item.namingId) : null);
  const hotspot = found?.hotspot;
  if (!hotspot) return false;
  return isNamingRoutable(resolveHotspotNamingRecord(tour, hotspot), audience);
}

/** Resolve `?no=` to a naming-opportunity hotspot (kebab-case name; legacy formats accepted). */
export function resolveNamingOpportunityFromSearch(
  tour: Tour,
  searchValue: string,
  audience: SceneVisibilityAudience = {},
): { hotspotId: string; sceneId: string } | null {
  const trimmed = searchValue.trim();
  if (!trimmed) return null;

  const links = listNamingOpportunityLinks(tour);

  const accept = (
    item: NamingOpportunityLink,
  ): { hotspotId: string; sceneId: string } | null => {
    if (!isLinkRoutable(tour, item, audience)) return null;
    return { hotspotId: item.hotspotId, sceneId: item.sceneId };
  };

  for (const item of links) {
    if (item.searchValue === trimmed) {
      const match = accept(item);
      if (match) return match;
    }
  }

  for (const item of links) {
    if (item.searchValue.toLowerCase() === trimmed.toLowerCase()) {
      const match = accept(item);
      if (match) return match;
    }
  }

  for (const item of links) {
    if (
      item.legacyCamelCase === trimmed ||
      item.legacyCamelCase.toLowerCase() === trimmed.toLowerCase()
    ) {
      const match = accept(item);
      if (match) return match;
    }
  }

  for (const item of links) {
    if (
      item.legacyKebab === trimmed ||
      item.nameSlug === trimmed ||
      item.hotspotId === trimmed ||
      item.namingId === trimmed
    ) {
      const match = accept(item);
      if (match) return match;
    }
  }

  if (trimmed.startsWith('no_')) {
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
  }

  const direct = findNamingHotspotInTour(tour, trimmed);
  if (
    direct &&
    isNamingRoutable(resolveHotspotNamingRecord(tour, direct.hotspot), audience)
  ) {
    return { hotspotId: trimmed, sceneId: direct.sceneId };
  }

  if (!trimmed.startsWith(NAMING_OPPORTUNITY_HOTSPOT_PREFIX)) {
    const prefixedId = `${NAMING_OPPORTUNITY_HOTSPOT_PREFIX}${trimmed}`;
    const prefixed = findNamingHotspotInTour(tour, prefixedId);
    if (
      prefixed &&
      isNamingRoutable(
        resolveHotspotNamingRecord(tour, prefixed.hotspot),
        audience,
      )
    ) {
      return { hotspotId: prefixedId, sceneId: prefixed.sceneId };
    }
  }

  return null;
}
