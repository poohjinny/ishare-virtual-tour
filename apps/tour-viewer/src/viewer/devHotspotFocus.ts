import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Hotspot } from '../types/tour';
import {
  DEV_HOTSPOT_FOCUS_CLASS,
  DEV_HOTSPOT_MOVE_CLASS,
} from '../viewer-shared/devHotspotFocus';

const HOTSPOT_BUTTON_SELECTOR =
  '.hotspot-nav, .hotspot-info, .hotspot-general-info';

function forEachHotspotButton(
  markers: MarkersPlugin,
  fn: (button: HTMLElement, hotspot: Hotspot, markerId: string) => void,
): void {
  for (const marker of markers.getMarkers()) {
    const hotspot = marker.data?.hotspot as Hotspot | undefined;
    if (!hotspot) continue;

    const button = marker.domElement.querySelector(HOTSPOT_BUTTON_SELECTOR);
    if (!(button instanceof HTMLElement)) continue;

    fn(button, hotspot, marker.id);
  }
}

export function setDevFocusedHotspot(
  markers: MarkersPlugin,
  hotspotId: string | null,
): void {
  forEachHotspotButton(markers, (button, _hotspot, markerId) => {
    button.classList.toggle(
      DEV_HOTSPOT_FOCUS_CLASS,
      !!hotspotId && markerId === hotspotId,
    );
  });
}

export function setDevMovingHotspot(
  markers: MarkersPlugin,
  hotspotId: string | null,
): void {
  forEachHotspotButton(markers, (button, _hotspot, markerId) => {
    button.classList.toggle(
      DEV_HOTSPOT_MOVE_CLASS,
      !!hotspotId && markerId === hotspotId,
    );
  });
}
