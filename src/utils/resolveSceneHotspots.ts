import type { Hotspot, Scene, Tour } from '../types/tour';

/**
 * Hotspots active for a scene — tour-level world markers merged with legacy
 * per-scene entries (`model3d` tours should use {@link Tour.hotspots} only).
 * Scene wins on duplicate `id`.
 */
export function resolveSceneHotspots(
  tour: Pick<Tour, 'hotspots'>,
  scene: Pick<Scene, 'hotspots'>,
): Hotspot[] {
  const tourHotspots = tour.hotspots ?? [];
  const sceneHotspots = scene.hotspots ?? [];
  if (tourHotspots.length === 0) return [...sceneHotspots];
  if (sceneHotspots.length === 0) return [...tourHotspots];

  const byId = new Map<string, Hotspot>();
  for (const hotspot of tourHotspots) {
    byId.set(hotspot.id, hotspot);
  }
  for (const hotspot of sceneHotspots) {
    byId.set(hotspot.id, hotspot);
  }
  return [...byId.values()];
}

/** Nav hotspots reachable from a scene — used for breadcrumbs and depth graph. */
export function resolveSceneNavHotspots(
  tour: Pick<Tour, 'hotspots'>,
  scene: Pick<Scene, 'hotspots'>,
): Hotspot[] {
  return resolveSceneHotspots(tour, scene).filter(
    (hotspot) => hotspot.type === 'nav' && hotspot.targetScene,
  );
}
