import type { Viewer } from '@photo-sphere-viewer/core';
import type { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import type { Tour, ViewPosition } from '../types/tour';
import { toPsvZoom } from '../utils/psvZoom';
import { LANDING_ZOOM_OUT } from './landingTransition';
import {
  findEgressHotspot,
  findIngressHotspot,
  isGoingDeeper,
} from './sceneDepth';

function toRad(deg: number): string {
  return `${deg}deg`;
}

/** PSV animate(): number = fixed duration in ms. */
const DEEP_FOCUS_MS = 600;
/** Brief hold at max zoom-out so the wide arrive step is visible. */
const DEEP_ARRIVE_WIDE_HOLD_MS = 280;
const DEEP_ARRIVE_ZOOM_MS = 900;
const SHALLOW_FOCUS_MS = 600;
const SHALLOW_INGRESS_MS = 500;
const SHALLOW_ARRIVE_MS = 900;
const MENU_ZOOM_BUMP_MS = 220;
const FADE_MS = '400ms';

const HOTSPOT_ZOOM_DELTA = 38;
const MENU_ZOOM_DELTA = 20;
const MAX_FOCUS_ZOOM = 92;

/** Zoomed-in pose when arriving on a shallower scene via ingress hotspot. */
const SHALLOW_INGRESS_ZOOM = 86;

function isDevTransitionLog(): boolean {
  return (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('dev') === '1'
  );
}

function logTransition(step: string, detail?: unknown): void {
  if (!isDevTransitionLog()) return;
  console.log('[transition]', step, detail ?? '');
}

async function fadeToScene(
  virtualTour: VirtualTourPlugin,
  targetSceneId: string,
): Promise<boolean> {
  try {
    const result = await virtualTour.setCurrentNode(targetSceneId, {
      effect: 'fade',
      speed: FADE_MS,
      rotation: false,
    });
    return result !== false;
  } catch {
    return false;
  }
}

async function waitForPanoramaReady(viewer: Viewer): Promise<void> {
  await new Promise<void>((resolve) => {
    const onLoaded = () => {
      viewer.removeEventListener('panorama-loaded', onLoaded);
      resolve();
    };
    viewer.addEventListener('panorama-loaded', onLoaded);
  });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function applyView(
  viewer: Viewer,
  yaw: number,
  pitch: number,
  zoom: number,
): void {
  viewer.rotate({ yaw: toRad(yaw), pitch: toRad(pitch) });
  viewer.zoom(zoom);
}

async function animateView(
  viewer: Viewer,
  view: Partial<ViewPosition> & { zoom: number },
  speedMs: number,
): Promise<void> {
  try {
    const animation = viewer.animate({
      ...(view.yaw !== undefined ? { yaw: toRad(view.yaw) } : {}),
      ...(view.pitch !== undefined ? { pitch: toRad(view.pitch) } : {}),
      zoom: view.zoom,
      speed: speedMs,
      easing: 'inOutCubic',
    });
    if (animation) await animation;
    else viewer.zoom(view.zoom);
  } catch {
    if (view.yaw !== undefined && view.pitch !== undefined) {
      viewer.rotate({ yaw: toRad(view.yaw), pitch: toRad(view.pitch) });
    }
    viewer.zoom(view.zoom);
  }
}

async function animateZoom(
  viewer: Viewer,
  zoom: number,
  speedMs: number,
): Promise<void> {
  try {
    const animation = viewer.animate({
      zoom,
      speed: speedMs,
      easing: 'inOutCubic',
    });
    if (animation) await animation;
    else viewer.zoom(zoom);
  } catch {
    viewer.zoom(zoom);
  }
}

async function focusHotspot(
  viewer: Viewer,
  position: ViewPosition,
  speedMs: number,
): Promise<void> {
  const focusZoom = Math.min(
    viewer.getZoomLevel() + HOTSPOT_ZOOM_DELTA,
    MAX_FOCUS_ZOOM,
  );
  await viewer.animate({
    yaw: toRad(position.yaw),
    pitch: toRad(position.pitch),
    zoom: focusZoom,
    speed: speedMs,
    easing: 'inOutCubic',
  });
}

async function menuZoomBump(viewer: Viewer): Promise<void> {
  await viewer.animate({
    zoom: Math.min(viewer.getZoomLevel() + MENU_ZOOM_DELTA, 90),
    speed: MENU_ZOOM_BUMP_MS,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deeper: focus(in) → fade → snap wide@targetView → hold → zoom-in
 * See docs/SCENE_TRANSITIONS.md
 */
async function navigateDeeper(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  targetSceneId: string,
  targetView: ViewPosition,
  hotspotPosition?: ViewPosition,
): Promise<boolean> {
  logTransition('deeper:start', { targetSceneId, targetView, hotspotPosition });

  if (hotspotPosition) {
    logTransition('deeper:pre-focus-hotspot', hotspotPosition);
    await focusHotspot(viewer, hotspotPosition, DEEP_FOCUS_MS);
  } else {
    logTransition('deeper:pre-menu-bump');
    await menuZoomBump(viewer);
  }

  await viewer.stopAnimation();

  if (!(await fadeToScene(virtualTour, targetSceneId))) {
    return false;
  }

  await viewer.stopAnimation();
  await waitForPanoramaReady(viewer);

  logTransition('deeper:arrive-wide', {
    yaw: targetView.yaw,
    pitch: targetView.pitch,
    zoom: LANDING_ZOOM_OUT,
  });
  applyView(viewer, targetView.yaw, targetView.pitch, LANDING_ZOOM_OUT);
  await delay(DEEP_ARRIVE_WIDE_HOLD_MS);

  logTransition('deeper:settle-zoom', { zoom: toPsvZoom(targetView.zoom) });
  await animateZoom(viewer, toPsvZoom(targetView.zoom), DEEP_ARRIVE_ZOOM_MS);

  return true;
}

/**
 * Shallower: focus(egress,in) → fade → tight@ingress → zoom-out@targetView
 * See docs/SCENE_TRANSITIONS.md
 */
async function navigateShallower(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  tour: Tour,
  fromSceneId: string,
  targetSceneId: string,
  targetView: ViewPosition,
  hotspotPosition?: ViewPosition,
): Promise<boolean> {
  const fromScene = tour.scenes[fromSceneId];
  const egressPosition =
    hotspotPosition ??
    (fromScene ?
      findEgressHotspot(fromScene, targetSceneId)?.position
    : undefined);

  logTransition('shallower:start', {
    fromSceneId,
    targetSceneId,
    egressPosition,
    targetView,
  });

  if (egressPosition) {
    logTransition('shallower:pre-focus-egress', egressPosition);
    await focusHotspot(viewer, egressPosition, SHALLOW_FOCUS_MS);
  } else {
    logTransition('shallower:pre-menu-bump');
    await menuZoomBump(viewer);
  }

  const targetScene = tour.scenes[targetSceneId];
  const ingress =
    targetScene ? findIngressHotspot(targetScene, fromSceneId) : undefined;

  await viewer.stopAnimation();

  if (!(await fadeToScene(virtualTour, targetSceneId))) {
    return false;
  }

  await viewer.stopAnimation();
  await waitForPanoramaReady(viewer);

  if (ingress) {
    logTransition('shallower:ingress', ingress.position);
    await animateView(
      viewer,
      {
        yaw: ingress.position.yaw,
        pitch: ingress.position.pitch,
        zoom: SHALLOW_INGRESS_ZOOM,
      },
      SHALLOW_INGRESS_MS,
    );
  }

  logTransition('shallower:settle', targetView);
  await animateView(
    viewer,
    {
      yaw: targetView.yaw,
      pitch: targetView.pitch,
      zoom: toPsvZoom(targetView.zoom),
    },
    SHALLOW_ARRIVE_MS,
  );

  return true;
}

export async function navigateToScene(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  targetSceneId: string,
  targetView?: ViewPosition,
  hotspotPosition?: ViewPosition,
  tour?: Tour,
  fromSceneId?: string,
): Promise<boolean> {
  const view = targetView ?? { yaw: 0, pitch: 0, zoom: 0 };

  if (tour && fromSceneId && fromSceneId !== targetSceneId) {
    if (isGoingDeeper(tour, fromSceneId, targetSceneId)) {
      return navigateDeeper(
        viewer,
        virtualTour,
        targetSceneId,
        view,
        hotspotPosition,
      );
    }
    return navigateShallower(
      viewer,
      virtualTour,
      tour,
      fromSceneId,
      targetSceneId,
      view,
      hotspotPosition,
    );
  }

  return navigateDeeper(
    viewer,
    virtualTour,
    targetSceneId,
    view,
    hotspotPosition,
  );
}
