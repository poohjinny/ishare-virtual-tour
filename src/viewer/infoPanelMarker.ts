import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Hotspot, PopupContent } from '../types/tour';
import {
  buildAnchoredPopupHtml,
  glassPanelMarkerSize,
} from '../components/tourGlassPanelHtml';
import { setActiveInfoHotspot } from './infoHotspotActive';

/** Degrees above hotspot pitch — panel anchor is bottom center */
const PANEL_PITCH_OFFSET = 5;
const PANEL_ID_SUFFIX = '-panel';
const PANEL_EXIT_MS = 150;

const closingPanelIds = new Set<string>();

function panelMarkerId(hotspotId: string): string {
  return `${hotspotId}${PANEL_ID_SUFFIX}`;
}

export function closeAnchoredInfoPanel(
  markers: MarkersPlugin,
  animate = true,
): void {
  let clearingActive = false;

  for (const marker of markers.getMarkers()) {
    if (!marker.data?.infoPanel) continue;

    if (!clearingActive) {
      setActiveInfoHotspot(markers, null);
      clearingActive = true;
    }

    const id = marker.id;
    if (closingPanelIds.has(id)) continue;

    if (!animate) {
      closingPanelIds.delete(id);
      markers.removeMarker(id);
      continue;
    }

    const shell = marker.domElement.querySelector('.tour-glass-panel__shell');
    if (!(shell instanceof HTMLElement)) {
      markers.removeMarker(id);
      continue;
    }

    closingPanelIds.add(id);
    shell.classList.remove('tour-glass-panel__shell--enter');
    shell.classList.add('tour-glass-panel__shell--exit');

    window.setTimeout(() => {
      closingPanelIds.delete(id);
      try {
        if (markers.getMarker(id)) {
          markers.removeMarker(id);
        }
      } catch {
        /* marker already removed */
      }
    }, PANEL_EXIT_MS);
  }
}

export function getOpenAnchoredPanelHostId(
  markers: MarkersPlugin,
): string | null {
  for (const marker of markers.getMarkers()) {
    const hostId = marker.data?.hostHotspotId as string | undefined;
    if (marker.data?.infoPanel && hostId) return hostId;
  }
  return null;
}

export function openAnchoredInfoPanel(
  markers: MarkersPlugin,
  hotspot: Hotspot,
): void {
  if (!hotspot.popup) return;

  closeAnchoredInfoPanel(markers, false);

  const id = panelMarkerId(hotspot.id);
  markers.addMarker({
    id,
    html: buildAnchoredPopupHtml(hotspot.popup, hotspot.id),
    size: glassPanelMarkerSize(hotspot.popup, hotspot.id),
    position: {
      yaw: `${hotspot.position.yaw}deg`,
      pitch: `${hotspot.position.pitch + PANEL_PITCH_OFFSET}deg`,
    },
    anchor: 'bottom center',
    data: { infoPanel: true, hostHotspotId: hotspot.id },
  });

  setActiveInfoHotspot(markers, hotspot.id);
}

export function toggleAnchoredInfoPanel(
  markers: MarkersPlugin,
  hotspot: Hotspot,
): void {
  const openHostId = getOpenAnchoredPanelHostId(markers);
  if (openHostId === hotspot.id) {
    closeAnchoredInfoPanel(markers, true);
    return;
  }
  openAnchoredInfoPanel(markers, hotspot);
}

export function isAnchoredPopup(popup: PopupContent): boolean {
  return popup.display === 'anchored';
}
