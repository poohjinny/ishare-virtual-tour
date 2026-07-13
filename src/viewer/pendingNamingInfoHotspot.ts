import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { Viewer } from '@photo-sphere-viewer/core';
import type { PopupContent, Tour, ViewPosition } from '../types/tour';
import {
  findNamingHotspotInTour,
  isModel3dTour,
  resolveModel3dNamingTargetView,
} from '../utils/findTourHotspot';
import {
  resolveHotspotHostScene,
  resolveNamingPopup,
} from '../utils/namingSceneInherit';
import { toPsvZoom } from '../utils/psvZoom';
import { glassPanelMarkerSize } from '../components/tourGlassPanelHtml';
import {
  getOpenAnchoredPanelHostId,
  isAnchoredPopup,
  openAnchoredInfoPanel,
} from './infoPanelMarker';
import { setActiveInfoHotspot } from './infoHotspotActive';
import { computeAnchoredPanelFramedView } from './anchoredPanelCameraNudge';

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
  const found = findNamingHotspotInTour(tour, hotspotId);
  if (!found?.hotspot.popup) return undefined;

  if (isModel3dTour(tour)) {
    return resolveModel3dNamingTargetView(
      tour,
      found.hotspot,
      found.sceneId ?? sceneId,
    );
  }

  const pos = found.hotspot.position as ViewPosition;
  const scene = tour.scenes[found.sceneId ?? sceneId];
  return {
    yaw: pos.yaw,
    pitch: pos.pitch,
    zoom: pos.zoom ?? scene?.defaultView?.zoom,
  };
}

/**
 * NO target view pre-tilted so the anchored panel above the hotspot lands fully
 * framed in one camera move — lets the entry animation replace the old
 * "aim at hotspot, then nudge up" two-step. Falls back to the plain hotspot view
 * for model3d tours and modal (non-anchored) popups, which aren't camera-framed.
 */
export function resolveNamingOpportunityFramedView(
  viewer: Viewer,
  tour: Tour,
  sceneId: string,
  hotspotId: string,
): ViewPosition | undefined {
  const base = resolveNamingOpportunityView(tour, sceneId, hotspotId);
  if (!base) return undefined;

  if (isModel3dTour(tour)) return base;

  const found = findNamingHotspotInTour(tour, hotspotId);
  const popup = found?.hotspot.popup;
  if (!popup || !isAnchoredPopup(popup)) return base;

  const hostScene = resolveHotspotHostScene(
    tour,
    found.hotspot,
    tour.scenes[found.sceneId ?? sceneId],
  );
  const resolvedPopup =
    popup.namingOpportunity ? resolveNamingPopup(popup, hostScene) : popup;

  const { height } = glassPanelMarkerSize(resolvedPopup, hotspotId, tour);
  const framed = computeAnchoredPanelFramedView(
    viewer,
    { yawDeg: base.yaw, pitchDeg: base.pitch },
    height,
    toPsvZoom(base.zoom),
  );
  if (!framed) return base;

  return { yaw: framed.yawDeg, pitch: framed.pitchDeg, zoom: base.zoom };
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
  /**
   * Skip the panel's clip-correcting camera nudge on open. Set when the camera
   * was already pre-framed (single-move NO entry) so the panel doesn't get a
   * second, redundant camera move.
   */
  skipCameraNudge?: boolean;
}

const MAX_OPEN_ATTEMPTS = 120;

let openAttemptId = 0;

export function openNamingInfoHotspot(
  viewer: Viewer,
  markers: MarkersPlugin,
  tour: Tour,
  sceneId: string,
  hotspotId: string,
  onModalPopup?: (popup: PopupContent) => void,
  hideShare = false,
  skipCameraNudge = false,
): boolean {
  const hotspot = tour.scenes[sceneId]?.hotspots.find(
    (h) => h.id === hotspotId,
  );
  if (!hotspot?.popup) return false;

  const hostScene = resolveHotspotHostScene(
    tour,
    hotspot,
    tour.scenes[sceneId],
  );
  const resolvedHotspot =
    hotspot.popup.namingOpportunity ?
      { ...hotspot, popup: resolveNamingPopup(hotspot.popup, hostScene) }
    : hotspot;

  if (isAnchoredPopup(resolvedHotspot.popup)) {
    openAnchoredInfoPanel(viewer, markers, resolvedHotspot, tour, hideShare, {
      skipCameraNudge,
    });
  } else {
    setActiveInfoHotspot(markers, hotspot.id);
    onModalPopup?.(resolvedHotspot.popup!);
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
  onFailed?: () => void,
  hideShare = false,
): void {
  const attemptId = ++openAttemptId;
  let attempts = 0;

  const tryOpen = () => {
    if (attemptId !== openAttemptId) return;

    const currentSceneId = getCurrentSceneId();
    if (currentSceneId !== pending.sceneId) {
      if (attempts++ < MAX_OPEN_ATTEMPTS) {
        requestAnimationFrame(tryOpen);
      } else {
        onFailed?.();
      }
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
        hideShare,
        pending.skipCameraNudge ?? false,
      )
    ) {
      onOpened?.();
      return;
    }

    if (attempts++ < MAX_OPEN_ATTEMPTS) {
      requestAnimationFrame(tryOpen);
    } else {
      onFailed?.();
    }
  };

  requestAnimationFrame(tryOpen);
}
