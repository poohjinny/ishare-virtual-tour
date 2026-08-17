import type { Hotspot } from '../types/tour';

export function isPlaceOverviewHotspot(
  hotspot: Pick<Hotspot, 'role' | 'id' | 'type'> | null | undefined,
): boolean {
  return Boolean(
    hotspot && hotspot.type === 'info' && hotspot.role === 'placeOverview',
  );
}
