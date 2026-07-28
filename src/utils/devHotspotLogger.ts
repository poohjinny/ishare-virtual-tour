import type { ViewPosition, WorldPosition } from '../types/tour';

export type ClickCoords =
  | { yaw: number; pitch: number }
  | { x: number; y: number; z: number };

export function isWorldClickCoords(
  coords: ClickCoords,
): coords is WorldPosition {
  return 'x' in coords;
}

export function roundCoord(value: number): number {
  return +value.toFixed(1);
}

export function formatCoords(coords: ClickCoords): string {
  if (isWorldClickCoords(coords)) {
    return `x: ${coords.x.toFixed(2)}, y: ${coords.y.toFixed(2)}, z: ${coords.z.toFixed(2)}`;
  }
  return `yaw: ${coords.yaw.toFixed(1)}, pitch: ${coords.pitch.toFixed(1)}`;
}

export function formatViewPosition(view: ViewPosition): string {
  const zoom = view.zoom ?? 0;
  let str = `yaw: ${view.yaw.toFixed(1)}, pitch: ${view.pitch.toFixed(1)}, zoom: ${zoom}`;
  if (view.target) {
    str += ` | target: (${view.target.x.toFixed(2)}, ${view.target.y.toFixed(2)}, ${view.target.z.toFixed(2)})`;
  }
  return str;
}

export function toViewPosition(
  yaw: number,
  pitch: number,
  zoom = 0,
): ViewPosition {
  return { yaw: roundCoord(yaw), pitch: roundCoord(pitch), zoom };
}

export interface DevSceneRef {
  id: string;
  title?: string;
  /** Tour id — included in dev JSON for multi-tour workflows. */
  tourId?: string;
  /** @deprecated Use tourId */
  clientId?: string;
}

function devSceneContext(scene?: DevSceneRef) {
  const tourId = scene?.tourId ?? scene?.clientId;
  return {
    ...(tourId ? { tour: tourId } : {}),
    ...(scene?.id ? { scene: scene.id } : {}),
    ...(scene?.title ? { sceneTitle: scene.title } : {}),
  };
}

export const DEV_NAV_NAME_STORAGE_KEY = 'ishare-dev-nav-name';
export const DEV_NO_NAME_STORAGE_KEY = 'ishare-dev-no-name';
export const DEV_SCENE_TITLE_STORAGE_KEY = 'ishare-dev-scene-title';

/** "Parking Lot" → `parking-lot` (matches tour scene / hotspot id convention). */
export function slugifyHotspotName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Append `-2`, `-3`, … when `baseId` is already used in the scene. */
export function resolveUniqueHotspotId(
  existingIds: Iterable<string>,
  baseId: string,
): string {
  const ids = existingIds instanceof Set ? existingIds : new Set(existingIds);
  if (!ids.has(baseId)) return baseId;
  let index = 2;
  while (ids.has(`${baseId}-${index}`)) {
    index += 1;
  }
  return `${baseId}-${index}`;
}

export function previewHotspotId(
  existingIds: Iterable<string>,
  baseId: string,
): string {
  return resolveUniqueHotspotId(existingIds, baseId);
}

export function formatLandingJson(
  scene: DevSceneRef,
  view: ViewPosition,
): string {
  return JSON.stringify(
    {
      ...devSceneContext(scene),
      defaultView: {
        yaw: roundCoord(view.yaw),
        pitch: roundCoord(view.pitch),
        zoom: view.zoom ?? 0,
      },
    },
    null,
    2,
  );
}

export function logLandingView(scene: DevSceneRef, view: ViewPosition): void {
  const tourLabel = scene.tourId ?? scene.clientId;
  console.log(
    `[dev] Landing view${tourLabel ? ` [${tourLabel}]` : ''} "${scene.id}"${scene.title ? ` (${scene.title})` : ''} — ${formatViewPosition(view)}`,
  );
  console.log(formatLandingJson(scene, view));
}
