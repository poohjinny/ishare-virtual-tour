import type { Scene, Tour, ViewPosition } from '../types/tour';
import { parseNamingPrice } from './namingPrice';
import { buildNavPreviewNamingItems } from './navPreview';
import { resolveNamingOpportunityView } from '../viewer/pendingNamingInfoHotspot';

export interface TourDirectoryNamingItem {
  sceneId: string;
  sceneTitle: string;
  hotspotId: string;
  name: string;
  price: string;
  priceAmount: number | null;
  statusLabel: string;
  statusShortLabel: string;
  statusModifier: string;
}

export function buildTourNamingDirectory(
  scenes: Scene[],
): TourDirectoryNamingItem[] {
  const items: TourDirectoryNamingItem[] = [];

  for (const scene of scenes) {
    for (const naming of buildNavPreviewNamingItems(scene)) {
      items.push({
        sceneId: scene.id,
        sceneTitle: scene.title,
        hotspotId: naming.hotspotId,
        name: naming.name,
        price: naming.price,
        priceAmount: parseNamingPrice(naming.price),
        statusLabel: naming.statusLabel,
        statusShortLabel: naming.statusShortLabel,
        statusModifier: naming.statusModifier,
      });
    }
  }

  return items;
}

/** Scene containing a naming-opportunity info hotspot, if any. */
export function findNamingHotspotInTour(
  tour: Tour,
  hotspotId: string,
): { sceneId: string } | null {
  for (const scene of Object.values(tour.scenes)) {
    const hotspot = scene.hotspots.find(
      (h) =>
        h.id === hotspotId && h.type === 'info' && h.popup?.namingOpportunity,
    );
    if (hotspot) {
      return { sceneId: scene.id };
    }
  }
  return null;
}

/** Landing end pose — `defaultView`, or the NO hotspot view when `?no=` matches this scene. */
export function resolveSceneLandingView(
  tour: Tour,
  sceneId: string,
  namingHotspotId: string | null | undefined,
): ViewPosition | undefined {
  const scene = tour.scenes[sceneId];
  if (!scene) return undefined;

  if (!namingHotspotId) {
    return scene.defaultView;
  }

  const loc = findNamingHotspotInTour(tour, namingHotspotId);
  if (!loc || loc.sceneId !== sceneId) {
    return scene.defaultView;
  }

  return (
    resolveNamingOpportunityView(tour, sceneId, namingHotspotId) ??
    scene.defaultView
  );
}

export function filterTourScenes(scenes: Scene[], query: string): Scene[] {
  const q = query.trim().toLowerCase();
  if (!q) return scenes;

  return scenes.filter(
    (scene) =>
      scene.title.toLowerCase().includes(q) ||
      scene.id.toLowerCase().includes(q),
  );
}

export function filterTourNamingDirectory(
  items: TourDirectoryNamingItem[],
  query: string,
): TourDirectoryNamingItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.sceneTitle.toLowerCase().includes(q) ||
      item.statusLabel.toLowerCase().includes(q) ||
      item.statusShortLabel.toLowerCase().includes(q),
  );
}

/** Preview pose for a naming-opportunity card hero. */
export function resolveNamingDirectoryPreviewView(
  scenes: Scene[],
  sceneId: string,
  hotspotId: string,
): ViewPosition | undefined {
  const scene = scenes.find((entry) => entry.id === sceneId);
  if (!scene) return undefined;

  const hotspot = scene.hotspots.find((entry) => entry.id === hotspotId);
  if (!hotspot?.popup) return scene.defaultView;

  return {
    yaw: hotspot.position.yaw,
    pitch: hotspot.position.pitch,
    zoom: hotspot.position.zoom ?? scene.defaultView?.zoom,
  };
}
