import type { Viewer } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Hotspot, PopupContent, Tour, ViewPosition } from '../types/tour';
import {
  buildAnchoredPopupHtml,
  glassPanelMarkerSize,
  initPopupVideoPlayers,
} from '../components/tourGlassPanelHtml';
import { setActiveInfoHotspot } from './infoHotspotActive';
import { enableGlassPanelTextSelection } from './glassPanelTextSelection';
import { bindGlassPanelCtaOverflowTitles } from '../utils/glassPanelCtaOverflow';
import { releaseAllTourMedia } from '../utils/tourMediaCoordinator';
import {
  anchoredPanelMarkerPosition,
  correctAnchoredPanelPixelGap,
  fitAnchoredPanelMarkerSize,
  INFO_HOTSPOT_HALF_HEIGHT_FALLBACK_PX,
  measureHotspotHalfHeightPx,
} from './anchoredPanelPosition';
import { scheduleNudgeCameraForClippedPanel } from './anchoredPanelCameraNudge';
import { notifyAnchoredPanelOpened } from './anchoredPanelVisibility';

const PANEL_ID_SUFFIX = '-panel';
const PANEL_EXIT_MS = 200;

const closingPanelIds = new Set<string>();

interface InfoPanelPositionTrack {
  panelId: string;
  hostHotspotId: string;
  hostPosition: ViewPosition;
}

let infoPanelPositionTrack: InfoPanelPositionTrack | null = null;

function panelMarkerId(hotspotId: string): string {
  return `${hotspotId}${PANEL_ID_SUFFIX}`;
}

function clearInfoPanelPositionTrack(): void {
  infoPanelPositionTrack = null;
}

export function syncInfoPanelPosition(markers: MarkersPlugin): void {
  if (
    infoPanelPositionTrack &&
    !markers.getMarker(infoPanelPositionTrack.panelId)
  ) {
    clearInfoPanelPositionTrack();
  }

  if (infoPanelPositionTrack) {
    fitAnchoredPanelMarkerSize(markers, infoPanelPositionTrack.panelId);
  }

  correctAnchoredPanelPixelGap(markers, infoPanelPositionTrack);
}

export function closeAnchoredInfoPanel(
  markers: MarkersPlugin,
  animate = true,
): void {
  releaseAllTourMedia();
  let clearingActive = false;

  for (const marker of markers.getMarkers()) {
    if (!marker.data?.infoPanel) continue;

    clearInfoPanelPositionTrack();

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
  viewer: Viewer,
  markers: MarkersPlugin,
  hotspot: Hotspot,
  tour: Tour,
  hideShare = false,
): void {
  if (!hotspot.popup) return;

  closeAnchoredInfoPanel(markers, false);

  const id = panelMarkerId(hotspot.id);
  const hostMarker = markers.getMarker(hotspot.id);
  const halfHeight = measureHotspotHalfHeightPx(
    hostMarker?.domElement,
    INFO_HOTSPOT_HALF_HEIGHT_FALLBACK_PX,
  );

  markers.addMarker({
    id,
    html: buildAnchoredPopupHtml(hotspot.popup, hotspot.id, {
      tour,
      hideShare,
    }),
    size: glassPanelMarkerSize(hotspot.popup, hotspot.id, tour, hideShare),
    position: anchoredPanelMarkerPosition(
      viewer,
      hotspot.position as ViewPosition,
      halfHeight,
    ),
    anchor: 'bottom center',
    data: { infoPanel: true, hostHotspotId: hotspot.id },
  });

  infoPanelPositionTrack = {
    panelId: id,
    hostHotspotId: hotspot.id,
    hostPosition: hotspot.position as ViewPosition,
  };

  const marker = markers.getMarker(id);
  if (marker?.domElement instanceof HTMLElement) {
    enableGlassPanelTextSelection(marker.domElement);
    bindGlassPanelCtaOverflowTitles(marker.domElement);
    requestAnimationFrame(() => {
      const live = markers.getMarker(id);
      if (live?.domElement instanceof HTMLElement) {
        initPopupVideoPlayers(live.domElement);
      }
    });
  }

  setActiveInfoHotspot(markers, hotspot.id);
  notifyAnchoredPanelOpened();

  scheduleNudgeCameraForClippedPanel(viewer, () => {
    const panelMarker = markers.getMarker(id);
    return panelMarker?.domElement instanceof HTMLElement ?
        panelMarker.domElement
      : null;
  });
}

export function toggleAnchoredInfoPanel(
  viewer: Viewer,
  markers: MarkersPlugin,
  hotspot: Hotspot,
  tour: Tour,
  hideShare = false,
): void {
  const openHostId = getOpenAnchoredPanelHostId(markers);
  if (openHostId === hotspot.id) {
    closeAnchoredInfoPanel(markers, true);
    return;
  }
  openAnchoredInfoPanel(viewer, markers, hotspot, tour, hideShare);
}

export function isAnchoredPopup(popup: PopupContent): boolean {
  if (popup.namingOpportunity) return true;
  return popup.display === 'anchored';
}
