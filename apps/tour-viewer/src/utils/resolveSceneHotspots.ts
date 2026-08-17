import type { Hotspot, Scene, Tour } from '../types/tour';
import {
  filterHotspotsForAudience,
  type SceneVisibilityAudience,
} from './sceneVisibility';

/**
 * Hotspots active for a scene — tour-level world markers merged with legacy
 * per-scene entries (`model3d` tours should use {@link Tour.hotspots} only).
 * Scene wins on duplicate `id`.
 */
export function resolveSceneHotspots(
  tour: Pick<Tour, 'hotspots' | 'namingOpportunities'> & {
    scenes?: Tour['scenes'];
  },
  scene: Pick<Scene, 'hotspots'>,
  audience: SceneVisibilityAudience = {},
): Hotspot[] {
  const tourHotspots = tour.hotspots ?? [];
  const sceneHotspots = scene.hotspots ?? [];
  let merged: Hotspot[];
  if (tourHotspots.length === 0) merged = [...sceneHotspots];
  else if (sceneHotspots.length === 0) merged = [...tourHotspots];
  else {
    const byId = new Map<string, Hotspot>();
    for (const hotspot of tourHotspots) {
      byId.set(hotspot.id, hotspot);
    }
    for (const hotspot of sceneHotspots) {
      byId.set(hotspot.id, hotspot);
    }
    merged = [...byId.values()];
  }
  return filterHotspotsForAudience(tour, merged, audience);
}

/** Nav hotspots reachable from a scene — used for breadcrumbs and depth graph. */
export function resolveSceneNavHotspots(
  tour: Pick<Tour, 'hotspots' | 'namingOpportunities'> & {
    scenes?: Tour['scenes'];
  },
  scene: Pick<Scene, 'hotspots'>,
  audience: SceneVisibilityAudience = {},
): Hotspot[] {
  return resolveSceneHotspots(tour, scene, audience).filter(
    (hotspot) => hotspot.type === 'nav' && hotspot.targetScene,
  );
}
