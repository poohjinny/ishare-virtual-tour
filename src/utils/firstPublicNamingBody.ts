import type { Hotspot, Scene, Tour } from '../types/tour';
import { listSceneInfoHotspots } from './findTourHotspot';
import { isNamingUsableForPlaceLead } from './namingVisibility';

function isNamingPin(hotspot: Hotspot): boolean {
  if (hotspot.type !== 'info') return false;
  if (hotspot.namingId?.trim()) return true;
  return Boolean(hotspot.popup?.namingOpportunity);
}

/**
 * First naming body usable for place soft-lead / overview inherit
 * (public + unlisted; skips internal). Order follows {@link listSceneInfoHotspots}.
 */
export function resolveFirstPublicNamingBody(
  tour: Pick<Tour, 'hotspots' | 'viewerType' | 'namingOpportunities'>,
  scene: Scene,
): string | null {
  const catalog = tour.namingOpportunities ?? {};

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    if (!isNamingPin(hotspot)) continue;
    const namingId = hotspot.namingId?.trim();
    const record = namingId ? catalog[namingId] : undefined;
    if (namingId && !isNamingUsableForPlaceLead(record)) continue;

    const legacyBody =
      (
        hotspot.popup?.namingOpportunity as { body?: string } | undefined
      )?.body?.trim() ?? '';
    const body =
      hotspot.popup?.body?.trim() || record?.body?.trim() || legacyBody;
    if (body) return body;
  }

  return null;
}
