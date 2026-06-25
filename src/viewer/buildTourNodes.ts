import type { Scene, Tour } from '../types/tour';
import { hotspotToMarkerConfig } from './buildMarkers';

/** VirtualTourPlugin node list from tour JSON. */
export function buildVirtualTourNodes(tour: Tour) {
  return Object.values(tour.scenes).map((scene) => ({
    id: scene.id,
    name: scene.title,
    panorama: scene.panorama,
    links: [],
    markers: scene.hotspots.map(hotspotToMarkerConfig),
  }));
}

export type VirtualTourNodePatch = {
  id: string;
  name?: string;
  panorama?: string;
  markers?: ReturnType<typeof hotspotToMarkerConfig>[];
  links?: [];
};

/** Diff scene fields that map to VirtualTour nodes (skip defaultView, thumbnail, etc.). */
export function buildVirtualTourNodePatch(
  prevScene: Scene | undefined,
  nextScene: Scene,
): VirtualTourNodePatch | null {
  if (!prevScene) {
    return {
      id: nextScene.id,
      name: nextScene.title,
      panorama: nextScene.panorama,
      links: [],
      markers: nextScene.hotspots.map(hotspotToMarkerConfig),
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
    JSON.stringify(prevScene.hotspots) !== JSON.stringify(nextScene.hotspots)
  ) {
    patch.markers = nextScene.hotspots.map(hotspotToMarkerConfig);
    changed = true;
  }

  return changed ? patch : null;
}
