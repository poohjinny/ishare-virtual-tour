import type { Hotspot, Tour, ViewPosition } from '../types/tour';
import {
  findHotspotInTour,
  findNamingHotspotInTour,
  isModel3dTour,
  resolveModel3dNamingTargetView,
} from '../utils/findTourHotspot';
import { isPlaceOverviewHotspot } from '../utils/placeOverview';

export function findFramableInfoHotspotInTour(
  tour: Tour,
  hotspotId: string,
  fallbackSceneId: string,
): { sceneId: string; hotspot: Hotspot } | null {
  const naming = findNamingHotspotInTour(tour, hotspotId);
  if (naming) return naming;

  // Place-overview pins share id `info-place` — prefer the requested scene.
  const onPreferred = tour.scenes[fallbackSceneId]?.hotspots?.find(
    (entry) => entry.id === hotspotId,
  );
  if (onPreferred && isPlaceOverviewHotspot(onPreferred)) {
    return { sceneId: fallbackSceneId, hotspot: onPreferred };
  }

  const hit = findHotspotInTour(tour, hotspotId);
  if (!hit?.hotspot || !isPlaceOverviewHotspot(hit.hotspot)) return null;
  return { sceneId: hit.sceneId ?? fallbackSceneId, hotspot: hit.hotspot };
}

export function resolveNamingOpportunityView(
  tour: Tour,
  sceneId: string,
  hotspotId: string,
): ViewPosition | undefined {
  const found = findFramableInfoHotspotInTour(tour, hotspotId, sceneId);
  if (!found?.hotspot) return undefined;

  if (isModel3dTour(tour)) {
    return resolveModel3dNamingTargetView(
      tour,
      found.hotspot,
      found.sceneId ?? sceneId,
    );
  }

  const pos = found.hotspot.position as ViewPosition;
  if (typeof pos?.yaw !== 'number' || typeof pos?.pitch !== 'number') {
    return undefined;
  }
  const scene = tour.scenes[found.sceneId ?? sceneId];
  return {
    yaw: pos.yaw,
    pitch: pos.pitch,
    zoom: pos.zoom ?? scene?.defaultView?.zoom,
  };
}
