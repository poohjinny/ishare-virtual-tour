import type { Hotspot, Scene, Tour, ViewPosition } from '../types/tour';
import { resolveSceneHotspots } from './resolveSceneHotspots';

export function isModel3dTour(tour: Pick<Tour, 'viewerType'>): boolean {
  return tour.viewerType === 'model3d';
}

export function findHotspotInTour(
  tour: Tour,
  hotspotId: string,
): { hotspot: Hotspot; sceneId?: string } | null {
  const tourHit = tour.hotspots?.find((entry) => entry.id === hotspotId);
  if (tourHit) {
    return { hotspot: tourHit, sceneId: tourHit.sceneId };
  }

  for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
    const hotspot = scene.hotspots?.find((entry) => entry.id === hotspotId);
    if (hotspot) {
      return { hotspot, sceneId };
    }
  }

  return null;
}

/** Camera pose when opening a model3d naming hotspot — per-hotspot, not scene landing. */
export function resolveModel3dNamingTargetView(
  tour: Tour,
  hotspot: Hotspot,
  sceneId?: string,
): ViewPosition | undefined {
  if (hotspot.targetView) return hotspot.targetView;
  const viewpointId = hotspot.sceneId ?? sceneId ?? tour.firstScene;
  return tour.scenes[viewpointId]?.defaultView;
}

/** Scene containing a naming-opportunity info hotspot, if any. */
export function findNamingHotspotInTour(
  tour: Tour,
  hotspotId: string,
): { sceneId: string; hotspot: Hotspot } | null {
  const tourHit = tour.hotspots?.find(
    (entry) =>
      entry.id === hotspotId &&
      entry.type === 'info' &&
      entry.popup?.namingOpportunity,
  );
  if (tourHit) {
    return { sceneId: tourHit.sceneId ?? tour.firstScene, hotspot: tourHit };
  }

  for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
    const hotspot = scene.hotspots?.find(
      (entry) =>
        entry.id === hotspotId &&
        entry.type === 'info' &&
        entry.popup?.namingOpportunity,
    );
    if (hotspot) {
      return { sceneId, hotspot };
    }
  }

  return null;
}

/** Info hotspots with popup content — for nav preview and explore directory. */
export function listSceneInfoHotspots(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  scene: Pick<Scene, 'id' | 'hotspots'>,
): Hotspot[] {
  if (isModel3dTour(tour)) {
    const tourInfo = (tour.hotspots ?? []).filter(
      (hotspot) =>
        hotspot.type === 'info' &&
        hotspot.popup &&
        hotspot.sceneId === scene.id,
    );
    const legacySceneInfo = scene.hotspots.filter(
      (hotspot) => hotspot.type === 'info' && hotspot.popup,
    );
    return resolveSceneHotspots(
      { hotspots: tourInfo },
      { hotspots: legacySceneInfo },
    ).filter((hotspot) => hotspot.type === 'info' && hotspot.popup);
  }

  return scene.hotspots.filter(
    (hotspot) => hotspot.type === 'info' && hotspot.popup,
  );
}

/** Nav hotspots on the shared model (`model3d` tour tab). */
export function listDevTourNavHotspots(tour: Tour): Hotspot[] {
  if (!isModel3dTour(tour)) return [];

  const fromTour = (tour.hotspots ?? []).filter(
    (hotspot) => hotspot.type === 'nav',
  );
  const legacyNav: Hotspot[] = [];

  for (const scene of Object.values(tour.scenes)) {
    for (const hotspot of scene.hotspots) {
      if (
        hotspot.type === 'nav' &&
        !fromTour.some((entry) => entry.id === hotspot.id)
      ) {
        legacyNav.push(hotspot);
      }
    }
  }

  return [...fromTour, ...legacyNav];
}

/** All tour-level markers for the dev panel (`model3d` tour tab). */
export function listDevTourHotspots(tour: Tour): Hotspot[] {
  if (!isModel3dTour(tour)) return [];

  const fromTour = tour.hotspots ?? [];
  const legacy: Hotspot[] = [];

  for (const scene of Object.values(tour.scenes)) {
    for (const hotspot of scene.hotspots) {
      if (!fromTour.some((entry) => entry.id === hotspot.id)) {
        legacy.push(hotspot);
      }
    }
  }

  return [...fromTour, ...legacy];
}

/** All hotspot ids — for dev create id preview / uniqueness. */
export function listAllTourHotspotIds(tour: Tour): string[] {
  const ids = new Set<string>();
  for (const hotspot of tour.hotspots ?? []) {
    ids.add(hotspot.id);
  }
  for (const scene of Object.values(tour.scenes)) {
    for (const hotspot of scene.hotspots) {
      ids.add(hotspot.id);
    }
  }
  return [...ids];
}
