import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Hotspot } from '../types/tour';

export const NAV_HOTSPOT_ACTIVE_CLASS = 'hotspot-nav--active';

export function setActiveNavHotspot(
  markers: MarkersPlugin,
  hotspotId: string | null,
): void {
  for (const marker of markers.getMarkers()) {
    const hotspot = marker.data?.hotspot as Hotspot | undefined;
    if (hotspot?.type !== 'nav') continue;

    const button = marker.domElement.querySelector('.hotspot-nav');
    if (!(button instanceof HTMLElement)) continue;

    const isActive = !!hotspotId && marker.id === hotspotId;
    button.classList.toggle(NAV_HOTSPOT_ACTIVE_CLASS, isActive);
    button.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  }
}
