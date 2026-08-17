import type { Hotspot, Tour } from '../types/tour';
import {
  assertCatalogVisibility,
  resolveCatalogVisibility,
  type CatalogVisibility,
} from './catalogVisibilityCore.mjs';
import {
  isNamingHotspot,
  resolveHotspotNamingRecord,
} from './namingSceneInherit';

/** Same tiers as scenes / catalog tours — omit / undefined = public. */
export type NamingVisibility = CatalogVisibility;

export type NamingVisibilityAudience = {
  /** `?dev=1` (or equivalent authoring context). */
  dev?: boolean;
};

/**
 * Catalog record visibility — omit / undefined / legacy embed = public.
 */
export function resolveNamingVisibility(
  record: object | null | undefined,
): NamingVisibility {
  return resolveCatalogVisibility(record);
}

export function assertNamingVisibility(
  visibility?: string | null,
): NamingVisibility | undefined {
  return assertCatalogVisibility(visibility);
}

/** Explore naming lists + panorama naming markers — public only. */
export function isNamingVisibleInExplore(
  record: object | null | undefined,
): boolean {
  return resolveNamingVisibility(record) === 'public';
}

/**
 * Soft place-lead / overview body inherit — public + unlisted.
 * Unlisted stays out of Explore lists but can still supply place copy.
 * Internal stays author-only.
 */
export function isNamingUsableForPlaceLead(
  record: object | null | undefined,
): boolean {
  return resolveNamingVisibility(record) !== 'internal';
}

/**
 * `?no=` / share deep link.
 * public + unlisted always; internal only when `dev`.
 */
export function isNamingRoutable(
  record: object | null | undefined,
  audience: NamingVisibilityAudience = {},
): boolean {
  const visibility = resolveNamingVisibility(record);
  if (visibility === 'internal') return Boolean(audience.dev);
  return true;
}

/** Resolve catalog (or legacy embed) visibility for a naming pin. */
export function isNamingHotspotVisibleInExplore(
  tour: Pick<Tour, 'namingOpportunities'>,
  hotspot: Hotspot,
): boolean {
  if (!isNamingHotspot(hotspot)) return true;
  return isNamingVisibleInExplore(resolveHotspotNamingRecord(tour, hotspot));
}

export function isNamingHotspotRoutable(
  tour: Pick<Tour, 'namingOpportunities'>,
  hotspot: Hotspot,
  audience: NamingVisibilityAudience = {},
): boolean {
  if (!isNamingHotspot(hotspot)) return true;
  return isNamingRoutable(resolveHotspotNamingRecord(tour, hotspot), audience);
}
