import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Hotspot } from '../types/tour';

/** Dev Manage — highlight the hotspot being edited or moved. */
export const DEV_HOTSPOT_FOCUS_CLASS = 'hotspot--dev-focus';

export function setDevFocusedHotspot(
  markers: MarkersPlugin,
  hotspotId: string | null,
): void {
  for (const marker of markers.getMarkers()) {
    const hotspot = marker.data?.hotspot as Hotspot | undefined;
    if (!hotspot) continue;

    const button = marker.domElement.querySelector(
      '.hotspot-nav, .hotspot-info, .hotspot-general-info',
    );
    if (!(button instanceof HTMLElement)) continue;

    const isFocused = !!hotspotId && marker.id === hotspotId;
    button.classList.toggle(DEV_HOTSPOT_FOCUS_CLASS, isFocused);
  }
}
