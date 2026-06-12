import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Hotspot } from '../types/tour';

export const INFO_HOTSPOT_ACTIVE_CLASS = 'hotspot-info--active';

export function setActiveInfoHotspot(
  markers: MarkersPlugin,
  hotspotId: string | null,
): void {
  for (const marker of markers.getMarkers()) {
    const hotspot = marker.data?.hotspot as Hotspot | undefined;
    if (hotspot?.type !== 'info') continue;

    const button = marker.domElement.querySelector('.hotspot-info');
    if (!(button instanceof HTMLElement)) continue;

    const isActive = !!hotspotId && marker.id === hotspotId;
    button.classList.toggle(INFO_HOTSPOT_ACTIVE_CLASS, isActive);
    button.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  }
}
