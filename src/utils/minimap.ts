import type { Scene } from '../types/tour';
import { toPsvZoom } from './psvZoom';

/** Match PanoramaViewer FOV limits (°). */
const MIN_FOV = 18;
const MAX_FOV = 105;

function psvZoomToVFov(psvZoom: number): number {
  const t = Math.min(100, Math.max(0, psvZoom)) / 100;
  return MAX_FOV * (MIN_FOV / MAX_FOV) ** t;
}

function vFovToHFov(vFov: number, aspect = 16 / 9): number {
  const vRad = (vFov * Math.PI) / 180;
  const hRad = 2 * Math.atan(Math.tan(vRad / 2) * aspect);
  return (hRad * 180) / Math.PI;
}

/** Approximate horizontal FOV from tour JSON zoom (before viewer is ready). */
export function tourZoomToHFov(zoom?: number): number {
  return vFovToHFov(psvZoomToVFov(toPsvZoom(zoom)));
}

/** Map bearing (°): 0 = up on plan, clockwise — from scene heading + yaw delta. */
export function mapBearing(scene: Scene, yaw: number): number | null {
  if (!scene.map) return null;
  return normalizeBearing(scene.map.heading + (yaw - scene.defaultView.yaw));
}

/** 0–360° */
export function normalizeBearing(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Bearing on floor plan from point A to B (0 = up, clockwise). */
export function bearingBetweenMapPoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return normalizeBearing((Math.atan2(dx, -dy) * 180) / Math.PI);
}

/**
 * Derive `map.heading` when the viewer looks at `lookYaw` toward a target on the plan.
 * heading = mapBearingToTarget − (lookYaw − defaultView.yaw)
 */
export function headingFromMapLook(
  scene: Scene,
  lookYaw: number,
  mapBearingToTarget: number,
): number {
  return normalizeBearing(
    mapBearingToTarget - (lookYaw - scene.defaultView.yaw),
  );
}

function polarToXY(
  cx: number,
  cy: number,
  radius: number,
  degFromUp: number,
): { x: number; y: number } {
  const rad = ((degFromUp - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/** SVG wedge path for horizontal field of view on the floor plan. */
export function buildFovWedgePath(
  cx: number,
  cy: number,
  radius: number,
  bearingDeg: number,
  hFovDeg: number,
): string {
  const half = Math.min(hFovDeg / 2, 179);
  const start = polarToXY(cx, cy, radius, bearingDeg - half);
  const end = polarToXY(cx, cy, radius, bearingDeg + half);
  const largeArc = hFovDeg > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

export interface MapPoint {
  sceneId: string;
  title: string;
  x: number;
  y: number;
}

export function getMappedScenes(scenes: Record<string, Scene>): MapPoint[] {
  return Object.values(scenes)
    .filter((scene): scene is Scene & { map: NonNullable<Scene['map']> } =>
      Boolean(scene.map),
    )
    .map((scene) => ({
      sceneId: scene.id,
      title: scene.title,
      x: scene.map.x,
      y: scene.map.y,
    }));
}
