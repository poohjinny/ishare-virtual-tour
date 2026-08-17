import type { Hotspot, NamingDonorKind, NamingOpportunityStatus, Scene, Tour, ViewPosition } from '../../types/tour';
import { normalizeNamingDonor } from '../../utils/namingDonor.mjs';
import { findHotspotInTour } from '../../utils/findTourHotspot';
import { isPlaceOverviewHotspot } from '../../utils/placeOverview';
import {
  isNamingHotspot,
  resolveHotspotHostScene,
  resolveNamingPopup,
} from '../../utils/namingSceneInherit';
import { resolveNavHotspotLabel } from '../../utils/navHotspotLabel';
import { buildSceneParentMap } from '../../viewer-shared/sceneDepth';

export type ActionStatus = 'idle' | 'working' | 'done' | 'error';

export function confirmDevPanelDelete(message: string): boolean {
  return window.confirm(`${message}\n\nThis cannot be undone.`);
}

export function buildDevNamingDonorPayload(options: {
  status: NamingOpportunityStatus | '';
  name: string;
  kind: NamingDonorKind;
  affiliation: string;
  website: string;
}) {
  if (options.status !== 'sold') return null;
  return normalizeNamingDonor(
    {
      name: options.name,
      kind: options.kind,
      affiliation: options.affiliation,
      website: options.website,
    },
    { status: 'sold' },
  );
}

export function isNamingInfoHotspot(hotspot: Hotspot): boolean {
  return isNamingHotspot(hotspot);
}

export function hotspotDisplayLabel(
  hotspot: Hotspot,
  tour: Tour,
  hostScene?: Scene | null,
): string {
  if (hotspot.type === 'nav') return resolveNavHotspotLabel(hotspot, tour);
  if (isPlaceOverviewHotspot(hotspot)) {
    const scene = resolveHotspotHostScene(tour, hotspot, hostScene);
    return (
      scene?.title?.trim() || hotspot.popup?.title?.trim() || 'Place overview'
    );
  }
  if (isNamingInfoHotspot(hotspot)) {
    const found = findHotspotInTour(tour, hotspot.id);
    const scene =
      resolveHotspotHostScene(tour, hotspot, hostScene) ??
      (found?.sceneId ? tour.scenes[found.sceneId] : undefined);
    const resolved = resolveNamingPopup(tour, hotspot, scene);
    return (
      resolved?.namingOpportunity?.name?.trim() ||
      resolved?.title?.trim() ||
      hotspot.id
    );
  }
  return hotspot.popup?.title?.trim() || hotspot.label?.trim() || hotspot.id;
}

export function countBfsDescendantScenes(
  firstSceneId: string,
  scenes: Record<string, Scene>,
  rootId: string,
  tourHotspots?: Hotspot[],
): number {
  const parentMap = buildSceneParentMap(firstSceneId, scenes, tourHotspots);
  const childrenByParent = new Map<string, string[]>();
  for (const [childId, parentId] of parentMap) {
    const list = childrenByParent.get(parentId) ?? [];
    list.push(childId);
    childrenByParent.set(parentId, list);
  }

  let count = 0;
  const queue = [...(childrenByParent.get(rootId) ?? [])];
  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    count += 1;
    queue.push(...(childrenByParent.get(sceneId) ?? []));
  }
  return count;
}

export function readSessionValue(key: string): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(key)?.trim() ?? '';
}

export function writeSessionValue(key: string, value: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const trimmed = value.trim();
  if (trimmed) sessionStorage.setItem(key, trimmed);
  else sessionStorage.removeItem(key);
}

export async function resolveModel3dSceneCreatePayload(options: {
  getCurrentView?: () => ViewPosition | null;
  view: ViewPosition | null;
  captureSceneThumbnail?: () => Promise<Blob | null>;
  manualThumbnailFile?: File | null;
  fallbackThumbnailFile?: File | null;
  sceneIdForFile?: string;
}): Promise<{ defaultView: ViewPosition; thumbnailFile: Blob | File }> {
  const liveView = options.getCurrentView?.() ?? options.view;
  if (!liveView) {
    throw new Error(
      'Current camera view is not available — load the model and orbit to the desired viewpoint first',
    );
  }

  let thumbnailFile: Blob | File | undefined =
    options.manualThumbnailFile ?? options.fallbackThumbnailFile ?? undefined;

  if (!thumbnailFile && options.captureSceneThumbnail) {
    const captured = await options.captureSceneThumbnail();
    if (captured) {
      const slug = options.sceneIdForFile?.trim() || 'scene';
      thumbnailFile = new File([captured], `${slug}.png`, {
        type: captured.type || 'image/png',
      });
    }
  }

  if (!thumbnailFile) {
    throw new Error(
      'Could not capture 3D thumbnail — ensure the model is loaded and visible, or upload a card image',
    );
  }

  return { defaultView: liveView, thumbnailFile };
}
