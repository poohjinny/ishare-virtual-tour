import type { ViewPosition } from '../types/tour';

export function toPsvZoom(zoom?: number): number {
  if (zoom === undefined || zoom === 0) return 50;
  return zoom;
}

/** Tour JSON zoom (0 = default wide) from PSV zoom level (50 = default). */
export function fromPsvZoom(psvZoom: number): number {
  return Math.round(psvZoom) === 50 ? 0 : Math.round(psvZoom);
}

/** Match {@link PanoramaViewer} FOV limits (degrees). */
export const PSV_MIN_FOV = 18;
export const PSV_MAX_FOV = 105;

/** PSV zoom level (0 = widest) → vertical FOV in degrees. */
export function psvZoomLevelToVerticalFov(zoomLvl: number): number {
  const t = Math.max(0, Math.min(100, zoomLvl)) / 100;
  return PSV_MAX_FOV - t * (PSV_MAX_FOV - PSV_MIN_FOV);
}

export function viewPositionToVerticalFov(view: ViewPosition): number {
  return psvZoomLevelToVerticalFov(toPsvZoom(view.zoom));
}
