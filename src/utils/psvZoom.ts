export function toPsvZoom(zoom?: number): number {
  if (zoom === undefined || zoom === 0) return 50;
  return zoom;
}

/** Tour JSON zoom (0 = default wide) from PSV zoom level (50 = default). */
export function fromPsvZoom(psvZoom: number): number {
  return Math.round(psvZoom) === 50 ? 0 : Math.round(psvZoom);
}
