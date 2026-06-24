import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Viewer } from '@photo-sphere-viewer/core';
import type { PopupContent, Tour, ViewPosition } from '../types/tour';
import { toPsvZoom } from '../utils/psvZoom';
import {
  getOpenAnchoredPanelHostId,
  isAnchoredPopup,
  openAnchoredInfoPanel,
} from './infoPanelMarker';
import { setActiveInfoHotspot } from './infoHotspotActive';

const NAMING_VIEW_ANIMATION_MS = 800;

function toDeg(deg: number): string {
  return `${deg}deg`;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

const HOTSPOT_VIEWPORT_PADDING_PX = 24;

/** True when the naming hotspot is already visible in the panorama viewport. */
export function isNamingHotspotInViewport(
  viewer: Viewer,
  markers: MarkersPlugin,
  hotspotId: string,
  view: ViewPosition,
): boolean {
  const marker = markers.getMarker(hotspotId) as
    | { domElement?: HTMLElement | SVGElement }
    | undefined;

  if (marker?.domElement) {
    return marker.domElement.classList.contains('psv-marker--visible');
  }

  const point = viewer.dataHelper.sphericalCoordsToViewerCoords({
    yaw: toRad(view.yaw),
    pitch: toRad(view.pitch),
  });

  const vw = viewer.container.clientWidth;
  const vh = viewer.container.clientHeight;
  if (vw <= 0 || vh <= 0) return false;

  const pad = HOTSPOT_VIEWPORT_PADDING_PX;
  return (
    point.x >= pad &&
    point.x <= vw - pad &&
    point.y >= pad &&
    point.y <= vh - pad
  );
}

export async function animateViewerToView(
  viewer: Viewer,
  view: ViewPosition,
): Promise<void> {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const target = {
    yaw: toDeg(view.yaw),
    pitch: toDeg(view.pitch),
    zoom: toPsvZoom(view.zoom),
  };

  try {
    await viewer.stopAnimation();
  } catch {
    /* viewer may not be animating */
  }

  if (reduceMotion) {
    viewer.rotate({ yaw: target.yaw, pitch: target.pitch });
    viewer.zoom(target.zoom);
    return;
  }

  try {
    const animation = viewer.animate({
      yaw: target.yaw,
      pitch: target.pitch,
      zoom: target.zoom,
      speed: NAMING_VIEW_ANIMATION_MS,
      easing: 'outCubic',
    });
    if (animation) await animation;
    else {
      viewer.rotate({ yaw: target.yaw, pitch: target.pitch });
      viewer.zoom(target.zoom);
    }
  } catch {
    viewer.rotate({ yaw: target.yaw, pitch: target.pitch });
    viewer.zoom(target.zoom);
  }
}

export function resolveNamingOpportunityView(
  tour: Tour,
  sceneId: string,
  hotspotId: string,
): ViewPosition | undefined {
  const scene = tour.scenes[sceneId];
  const infoHotspot = scene?.hotspots.find(
    (hotspot) => hotspot.id === hotspotId,
  );
  if (!infoHotspot?.popup) return undefined;

  return {
    yaw: infoHotspot.position.yaw,
    pitch: infoHotspot.position.pitch,
    zoom: infoHotspot.position.zoom ?? scene.defaultView?.zoom,
  };
}

/** Naming hotspot with an open panel on this scene, if any. */
export function resolveOpenNamingHotspotOnScene(
  tour: Tour,
  sceneId: string,
  markers: MarkersPlugin | null,
  activeNamingHotspotId?: string | null,
): string | null {
  const scene = tour.scenes[sceneId];
  if (!scene) return null;

  const isNamingHotspot = (hotspotId: string) => {
    const hotspot = scene.hotspots.find((item) => item.id === hotspotId);
    return Boolean(hotspot?.popup?.namingOpportunity);
  };

  if (markers) {
    const openHostId = getOpenAnchoredPanelHostId(markers);
    if (openHostId && isNamingHotspot(openHostId)) {
      return openHostId;
    }
  }

  if (activeNamingHotspotId && isNamingHotspot(activeNamingHotspotId)) {
    return activeNamingHotspotId;
  }

  return null;
}

/** Default view — scene pose, or the open NO panel view when one is active on this scene. */
export function resolveSceneRecenterView(
  tour: Tour,
  sceneId: string,
  markers: MarkersPlugin | null,
  activeNamingHotspotId?: string | null,
): ViewPosition | null {
  const scene = tour.scenes[sceneId];
  if (!scene) return null;

  const namingHotspotId = resolveOpenNamingHotspotOnScene(
    tour,
    sceneId,
    markers,
    activeNamingHotspotId,
  );

  if (namingHotspotId) {
    return (
      resolveNamingOpportunityView(tour, sceneId, namingHotspotId) ??
      scene.defaultView
    );
  }

  return scene.defaultView;
}

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
    openAnchoredInfoPanel(viewer, markers, hotspot, tour);
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
