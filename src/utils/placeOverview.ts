import type { Hotspot } from '../types/tour';

/** Stable id for the auto place-overview pin (one per panorama scene). */
export const PLACE_OVERVIEW_HOTSPOT_ID = 'info-place';

export function isPlaceOverviewHotspot(
  hotspot: Pick<Hotspot, 'role' | 'id' | 'type'> | null | undefined,
): boolean {
  if (!hotspot || hotspot.type !== 'info') return false;
  if (hotspot.role === 'placeOverview') return true;
  return hotspot.id === PLACE_OVERVIEW_HOTSPOT_ID;
}
