import type { Viewer } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { PopupContent, Tour } from '../types/tour';
import { isAnchoredPopup, openAnchoredInfoPanel } from './infoPanelMarker';
import { setActiveInfoHotspot } from './infoHotspotActive';

export interface PendingNamingInfoTarget {
  sceneId: string;
  hotspotId: string;
}

const MAX_OPEN_ATTEMPTS = 48;

let openAttemptId = 0;

export function openNamingInfoHotspot(
  viewer: Viewer,
  markers: MarkersPlugin,
  tour: Tour,
  sceneId: string,
  hotspotId: string,
  onModalPopup?: (popup: PopupContent) => void,
): boolean {
  const hotspot = tour.scenes[sceneId]?.hotspots.find(
    (h) => h.id === hotspotId,
  );
  if (!hotspot?.popup) return false;

  if (isAnchoredPopup(hotspot.popup)) {
    openAnchoredInfoPanel(viewer, markers, hotspot);
  } else {
    setActiveInfoHotspot(markers, hotspot.id);
    onModalPopup?.(hotspot.popup);
  }

  return true;
}

export function scheduleOpenPendingNamingInfoHotspot(
  viewer: Viewer,
  markers: MarkersPlugin,
  getCurrentSceneId: () => string | undefined,
  tour: Tour,
  pending: PendingNamingInfoTarget,
  onModalPopup?: (popup: PopupContent) => void,
  onOpened?: () => void,
): void {
  const attemptId = ++openAttemptId;
  let attempts = 0;

  const tryOpen = () => {
    if (attemptId !== openAttemptId) return;

    const currentSceneId = getCurrentSceneId();
    if (currentSceneId !== pending.sceneId) {
      if (attempts++ < MAX_OPEN_ATTEMPTS) {
        requestAnimationFrame(tryOpen);
      }
      return;
    }

    if (
      !markers.getMarker(pending.hotspotId) &&
      attempts++ < MAX_OPEN_ATTEMPTS
    ) {
      requestAnimationFrame(tryOpen);
      return;
    }

    if (
      openNamingInfoHotspot(
        viewer,
        markers,
        tour,
        pending.sceneId,
        pending.hotspotId,
        onModalPopup,
      )
    ) {
      onOpened?.();
    }
  };

  requestAnimationFrame(tryOpen);
}
