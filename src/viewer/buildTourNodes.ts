import type { Scene, Tour } from '../types/tour';
import { resolveNavHotspotLabel } from '../utils/navHotspotLabel';
import { hotspotToMarkerConfig } from './buildMarkers';

/** VirtualTourPlugin node list from tour JSON. */
export function buildVirtualTourNodes(tour: Tour) {
  return Object.values(tour.scenes).map((scene) => ({
    id: scene.id,
    name: scene.title,
    panorama: scene.panorama,
    links: [],
    markers: scene.hotspots.map((hotspot) =>
      hotspotToMarkerConfig(hotspot, tour, scene),
    ),
  }));
}

export type VirtualTourNodePatch = {
  id: string;
  name?: string;
  panorama?: string;
  markers?: ReturnType<typeof hotspotToMarkerConfig>[];
  links?: [];
};

function inheritedNavLabelsChanged(
  scene: Scene,
  previousTour: Tour | undefined,
  nextTour: Tour,
): boolean {
  if (!previousTour) return false;

  for (const hotspot of scene.hotspots) {
    if (hotspot.type !== 'nav') continue;
    if (
      resolveNavHotspotLabel(hotspot, previousTour) !==
      resolveNavHotspotLabel(hotspot, nextTour)
    ) {
      return true;
    }
  }
  return false;
}

/** Scene fields that naming-opportunity pills/panels inherit or display. */
export function inheritedNamingSceneFieldsChanged(
  prevScene: Scene,
  nextScene: Scene,
): boolean {
  return (
    prevScene.title !== nextScene.title ||
    prevScene.description !== nextScene.description ||
    prevScene.placeLead !== nextScene.placeLead ||
    prevScene.previewVideoUrl !== nextScene.previewVideoUrl ||
    prevScene.videoUrl !== nextScene.videoUrl ||
    prevScene.videoPoster !== nextScene.videoPoster
  );
}

/**
 * Nav pills/previews on `scene` depend on target scene titles + place copy.
 * Rebuild markers when any nav target's display fields (or NO list) change.
 */
function navTargetPreviewSourcesChanged(
  scene: Scene,
  previousTour: Tour | undefined,
  nextTour: Tour,
): boolean {
  if (!previousTour) return false;

  for (const hotspot of scene.hotspots) {
    if (hotspot.type !== 'nav') continue;
    const targetId = hotspot.targetScene?.trim();
    if (!targetId) continue;

    const prevTarget = previousTour.scenes[targetId];
    const nextTarget = nextTour.scenes[targetId];
    if (!prevTarget || !nextTarget) return true;
    if (inheritedNamingSceneFieldsChanged(prevTarget, nextTarget)) return true;
    if (
      JSON.stringify(prevTarget.hotspots) !==
      JSON.stringify(nextTarget.hotspots)
    ) {
      return true;
    }
  }
  return false;
}

/** True when current-scene markers should rebuild after a tour save. */
export function currentSceneMarkersNeedRefresh(
  prevScene: Scene | undefined,
  nextScene: Scene,
  previousTour: Tour | undefined,
  nextTour: Tour,
): boolean {
  if (!prevScene) return true;
  return (
    JSON.stringify(prevScene.hotspots) !== JSON.stringify(nextScene.hotspots) ||
    inheritedNamingSceneFieldsChanged(prevScene, nextScene) ||
    inheritedNavLabelsChanged(nextScene, previousTour, nextTour) ||
    navTargetPreviewSourcesChanged(nextScene, previousTour, nextTour)
  );
}

/** @deprecated Use {@link currentSceneMarkersNeedRefresh}. */
export function sceneUpdateShouldRefreshOpenInfoPanel(
  prevScene: Scene | undefined,
  nextScene: Scene,
): boolean {
  if (!prevScene) return true;
  return (
    JSON.stringify(prevScene.hotspots) !== JSON.stringify(nextScene.hotspots) ||
    inheritedNamingSceneFieldsChanged(prevScene, nextScene)
  );
}

/** Diff scene fields that map to VirtualTour nodes (skip defaultView, thumbnail, etc.). */
export function buildVirtualTourNodePatch(
  prevScene: Scene | undefined,
  nextScene: Scene,
  nextTour: Tour,
  previousTour?: Tour,
): VirtualTourNodePatch | null {
  if (!prevScene) {
    return {
      id: nextScene.id,
      name: nextScene.title,
      panorama: nextScene.panorama,
      links: [],
      markers: nextScene.hotspots.map((hotspot) =>
        hotspotToMarkerConfig(hotspot, nextTour, nextScene),
      ),
    };
  }

  const patch: VirtualTourNodePatch = { id: nextScene.id };
  let changed = false;

  if (prevScene.title !== nextScene.title) {
    patch.name = nextScene.title;
    changed = true;
  }
  if (prevScene.panorama !== nextScene.panorama) {
    patch.panorama = nextScene.panorama;
    changed = true;
  }
  if (
    JSON.stringify(prevScene.hotspots) !== JSON.stringify(nextScene.hotspots) ||
    inheritedNavLabelsChanged(nextScene, previousTour, nextTour) ||
    inheritedNamingSceneFieldsChanged(prevScene, nextScene) ||
    navTargetPreviewSourcesChanged(nextScene, previousTour, nextTour)
  ) {
    patch.markers = nextScene.hotspots.map((hotspot) =>
      hotspotToMarkerConfig(hotspot, nextTour, nextScene),
    );
    changed = true;
  }

  return changed ? patch : null;
}
