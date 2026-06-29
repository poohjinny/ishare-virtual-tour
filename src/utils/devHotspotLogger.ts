import type { ViewPosition } from '../types/tour';

export interface ClickCoords {
  yaw: number;
  pitch: number;
}

export function roundCoord(value: number): number {
  return +value.toFixed(1);
}

export function formatCoords(coords: ClickCoords): string {
  return `yaw: ${coords.yaw.toFixed(1)}, pitch: ${coords.pitch.toFixed(1)}`;
}

export function formatViewPosition(view: ViewPosition): string {
  const zoom = view.zoom ?? 0;
  return `yaw: ${view.yaw.toFixed(1)}, pitch: ${view.pitch.toFixed(1)}, zoom: ${zoom}`;
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

export const DEV_HOTSPOT_NAME_STORAGE_KEY = 'ishare-dev-hotspot-name';
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

export interface DevHotspotNameOptions {
  /** Display name — e.g. "Parking Lot", "Comfort Corner". */
  name?: string;
}

export function getDevHotspotName(): string | undefined {
  if (typeof sessionStorage === 'undefined') return undefined;
  const trimmed = sessionStorage.getItem(DEV_HOTSPOT_NAME_STORAGE_KEY)?.trim();
  return trimmed || undefined;
}

export function setDevHotspotName(name: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const trimmed = name.trim();
  if (trimmed) {
    sessionStorage.setItem(DEV_HOTSPOT_NAME_STORAGE_KEY, trimmed);
  } else {
    sessionStorage.removeItem(DEV_HOTSPOT_NAME_STORAGE_KEY);
  }
}

function resolveHotspotName(
  options?: DevHotspotNameOptions,
): string | undefined {
  const fromOptions = options?.name?.trim();
  if (fromOptions) return fromOptions;
  return getDevHotspotName();
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

/** Nav preview hotspot — paste into current scene `hotspots[]`. */
export function formatNavHotspotJson(
  yaw: number,
  pitch: number,
  scene?: DevSceneRef,
  options?: DevHotspotNameOptions,
): string {
  const position = { yaw: roundCoord(yaw), pitch: roundCoord(pitch) };
  const displayName = resolveHotspotName(options);
  const slug = displayName ? slugifyHotspotName(displayName) : undefined;

  return JSON.stringify(
    {
      ...devSceneContext(scene),
      hotspotType: 'nav',
      ...(displayName ? { hotspotName: displayName } : {}),
      hotspot: {
        id: slug ? `nav-to-${slug}` : 'nav-to-target-scene',
        type: 'nav',
        label: displayName ?? 'Destination label',
        position,
        targetScene: slug ?? 'target-scene-id',
        targetView: { yaw: 0, pitch: 0, zoom: 17 },
      },
    },
    null,
    2,
  );
}

/** Naming opportunity (NO) info hotspot — paste into target scene `hotspots[]`. */
export function formatNamingHotspotJson(
  yaw: number,
  pitch: number,
  scene?: DevSceneRef,
  options?: DevHotspotNameOptions,
): string {
  const position = { yaw: roundCoord(yaw), pitch: roundCoord(pitch) };
  const displayName = resolveHotspotName(options);
  const slug = displayName ? slugifyHotspotName(displayName) : undefined;
  const title = displayName ?? 'Naming title';

  return JSON.stringify(
    {
      ...devSceneContext(scene),
      hotspotType: 'naming',
      ...(displayName ? { hotspotName: displayName } : {}),
      hotspot: {
        id: slug ? `info-${slug}` : 'info-naming-id',
        type: 'info',
        position,
        popup: {
          display: 'anchored',
          title,
          namingOpportunity: {
            name: `${title} Naming Opportunity`,
            price: '$75,000',
            status: 'soon',
          },
          body: 'First paragraph describing the naming opportunity…',
        },
      },
    },
    null,
    2,
  );
}

/** @deprecated Use {@link formatNavHotspotJson} or {@link formatNamingHotspotJson}. */
export function formatHotspotPositionJson(
  yaw: number,
  pitch: number,
  scene?: DevSceneRef,
): string {
  return JSON.stringify(
    {
      ...devSceneContext(scene),
      position: { yaw: roundCoord(yaw), pitch: roundCoord(pitch) },
    },
    null,
    2,
  );
}

export function logHotspotClick(
  coords: ClickCoords,
  scene?: DevSceneRef,
  options?: DevHotspotNameOptions,
): void {
  const storedName = getDevHotspotName();
  const nameOptions: DevHotspotNameOptions | undefined =
    options?.name !== undefined ? options
    : storedName ? { name: storedName }
    : undefined;

  const tourLabel =
    (scene?.tourId ?? scene?.clientId) ?
      ` [${scene.tourId ?? scene.clientId}]`
    : '';
  const sceneLabel = scene?.id ? ` "${scene.id}"` : '';
  console.log(
    `[dev] Hotspot click${tourLabel}${sceneLabel} — ${formatCoords(coords)}`,
  );
  console.log(
    '[dev] Nav hotspot JSON:\n',
    formatNavHotspotJson(coords.yaw, coords.pitch, scene, nameOptions),
  );
  console.log(
    '[dev] NO hotspot JSON:\n',
    formatNamingHotspotJson(coords.yaw, coords.pitch, scene, nameOptions),
  );
}

export function logLandingView(scene: DevSceneRef, view: ViewPosition): void {
  const tourLabel = scene.tourId ?? scene.clientId;
  console.log(
    `[dev] Landing view${tourLabel ? ` [${tourLabel}]` : ''} "${scene.id}"${scene.title ? ` (${scene.title})` : ''} — ${formatViewPosition(view)}`,
  );
  console.log(formatLandingJson(scene, view));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
