import { stripNamingOpportunitySuffix } from '../data/namingOpportunityStatus';
import type { Hotspot, Tour } from '../types/tour';
import { slugifyHotspotName } from './devHotspotLogger';
import { findNamingHotspotInTour } from './tourDirectory';

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
      return index === 0 ?
          lower
        : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function namingOpportunityDisplayName(hotspot: Hotspot): string | null {
  const naming = hotspot.popup?.namingOpportunity;
  if (!naming) return null;
  return stripNamingOpportunitySuffix(naming.name);
}

function legacyKebabFromHotspotId(hotspotId: string): string {
  return hotspotId.startsWith(NAMING_OPPORTUNITY_HOTSPOT_PREFIX)
    ? hotspotId.slice(NAMING_OPPORTUNITY_HOTSPOT_PREFIX.length)
    : hotspotId;
}

interface NamingOpportunityLink {
  sceneId: string;
  hotspotId: string;
  searchValue: string;
  legacyCamelCase: string;
  legacyKebab: string;
  nameSlug: string;
}

function listNamingOpportunityLinks(tour: Tour): NamingOpportunityLink[] {
  const items: NamingOpportunityLink[] = [];

  for (const scene of Object.values(tour.scenes)) {
    for (const hotspot of scene.hotspots) {
      const displayName = namingOpportunityDisplayName(hotspot);
      if (hotspot.type !== 'info' || !displayName) continue;

      items.push({
        sceneId: scene.id,
        hotspotId: hotspot.id,
        searchValue: namingOpportunityNameToKebabCase(displayName),
        legacyCamelCase: namingOpportunityNameToCamelCase(displayName),
        legacyKebab: legacyKebabFromHotspotId(hotspot.id),
        nameSlug: slugifyHotspotName(displayName),
      });
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

/** Resolve `?no=` to a naming-opportunity hotspot (kebab-case name; legacy formats accepted). */
export function resolveNamingOpportunityFromSearch(
  tour: Tour,
  searchValue: string,
): { hotspotId: string; sceneId: string } | null {
  const trimmed = searchValue.trim();
  if (!trimmed) return null;

  const links = listNamingOpportunityLinks(tour);

  for (const item of links) {
    if (item.searchValue === trimmed) {
      return { hotspotId: item.hotspotId, sceneId: item.sceneId };
    }
  }

  for (const item of links) {
    if (item.searchValue.toLowerCase() === trimmed.toLowerCase()) {
      return { hotspotId: item.hotspotId, sceneId: item.sceneId };
    }
  }

  for (const item of links) {
    if (
      item.legacyCamelCase === trimmed ||
      item.legacyCamelCase.toLowerCase() === trimmed.toLowerCase()
    ) {
      return { hotspotId: item.hotspotId, sceneId: item.sceneId };
    }
  }

  for (const item of links) {
    if (
      item.legacyKebab === trimmed ||
      item.nameSlug === trimmed ||
      item.hotspotId === trimmed
    ) {
      return { hotspotId: item.hotspotId, sceneId: item.sceneId };
    }
  }

  const direct = findNamingHotspotInTour(tour, trimmed);
  if (direct) {
    return { hotspotId: trimmed, sceneId: direct.sceneId };
  }

  if (!trimmed.startsWith(NAMING_OPPORTUNITY_HOTSPOT_PREFIX)) {
    const prefixedId = `${NAMING_OPPORTUNITY_HOTSPOT_PREFIX}${trimmed}`;
    const prefixed = findNamingHotspotInTour(tour, prefixedId);
    if (prefixed) {
      return { hotspotId: prefixedId, sceneId: prefixed.sceneId };
    }
  }

  return null;
}
