import type { Scene } from '../types/tour';
import { buildNavPreviewNamingItems } from './navPreview';

export interface TourDirectoryNamingItem {
  sceneId: string;
  sceneTitle: string;
  hotspotId: string;
  name: string;
  statusLabel: string;
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
        statusLabel: naming.statusLabel,
        statusModifier: naming.statusModifier,
      });
    }
  }

  return items;
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
      item.statusLabel.toLowerCase().includes(q),
  );
}
