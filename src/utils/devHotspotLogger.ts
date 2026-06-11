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
}

export function formatLandingJson(scene: DevSceneRef, view: ViewPosition): string {
  return JSON.stringify(
    {
      scene: scene.id,
      ...(scene.title ? { sceneTitle: scene.title } : {}),
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

export function formatHotspotPositionJson(yaw: number, pitch: number): string {
  return JSON.stringify(
    { position: { yaw: roundCoord(yaw), pitch: roundCoord(pitch) } },
    null,
    2,
  );
}

export function logHotspotClick(coords: ClickCoords): void {
  console.log(`[dev] Hotspot click — ${formatCoords(coords)}`);
  console.log(formatHotspotPositionJson(coords.yaw, coords.pitch));
}

export function logLandingView(scene: DevSceneRef, view: ViewPosition): void {
  console.log(
    `[dev] Landing view for "${scene.id}"${scene.title ? ` (${scene.title})` : ''} — ${formatViewPosition(view)}`,
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
