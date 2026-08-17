import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { isGeneralInfoHotspot } from '../data/generalInfoHotspot';
import type { Hotspot } from '../types/tour';

export const INFO_HOTSPOT_ACTIVE_CLASS = 'hotspot-info--active';
export const GENERAL_INFO_HOTSPOT_ACTIVE_CLASS = 'hotspot-general-info--active';

type ActiveInfoHotspotListener = (hotspotId: string | null) => void;

let activeInfoHotspotListener: ActiveInfoHotspotListener | null = null;

export function setActiveInfoHotspotChangeListener(
  listener: ActiveInfoHotspotListener | null,
): void {
  activeInfoHotspotListener = listener;
}

export function setActiveInfoHotspot(
  markers: MarkersPlugin,
  hotspotId: string | null,
): void {
  for (const marker of markers.getMarkers()) {
    const hotspot = marker.data?.hotspot as Hotspot | undefined;
    if (hotspot?.type !== 'info') continue;

    const isActive = !!hotspotId && marker.id === hotspotId;
    const button =
      isGeneralInfoHotspot(hotspot) ?
        marker.domElement.querySelector('.hotspot-general-info')
      : marker.domElement.querySelector('.hotspot-info');
    if (!(button instanceof HTMLElement)) continue;

    const activeClass =
      isGeneralInfoHotspot(hotspot) ?
        GENERAL_INFO_HOTSPOT_ACTIVE_CLASS
      : INFO_HOTSPOT_ACTIVE_CLASS;
    button.classList.toggle(activeClass, isActive);
    button.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  }

  activeInfoHotspotListener?.(hotspotId);
}
