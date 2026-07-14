/**
 * Scene navigation — load the target panorama, then Virtual Tour setCurrentNode.
 * No background prefetch of neighbors or other scenes; only the destination
 * is loaded (keeps the current scene visible until the cached texture is ready).
 */
import type { Viewer } from '@photo-sphere-viewer/core';
import type { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';

import type { Tour, ViewPosition } from '../types/tour';
import { toPsvZoom } from '../utils/psvZoom';

type PreloadEntry = boolean | Promise<unknown>;

interface VirtualTourPreloadState {
  preload: Record<string, PreloadEntry>;
}

function getPreloadMap(
  virtualTour: VirtualTourPlugin,
): Record<string, PreloadEntry> {
  return (virtualTour as unknown as { state: VirtualTourPreloadState }).state
    .preload;
}

function toPsvPosition(view: ViewPosition) {
  return {
    yaw: (view.yaw * Math.PI) / 180,
    pitch: (view.pitch * Math.PI) / 180,
  };
}

function preloadPanorama(viewer: Viewer, panorama: string): Promise<unknown> {
  return viewer.textureLoader.preloadPanorama(panorama);
}

function enqueueScenePreload(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  sceneId: string,
  panorama: string,
): Promise<unknown> | null {
  const preload = getPreloadMap(virtualTour);
  const existing = preload[sceneId];

  if (existing === true) return null;
  if (existing && typeof existing !== 'boolean') return existing;

  const promise = preloadPanorama(viewer, panorama)
    .then(() => {
      preload[sceneId] = true;
    })
    .catch((err: unknown) => {
      delete preload[sceneId];
      throw err;
    });

  preload[sceneId] = promise;
  return promise;
}

/** Wait for an in-flight load or start one; registers with VT preload cache. */
export async function ensureScenePreloaded(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  sceneId: string,
  panorama: string,
): Promise<void> {
  const existing = getPreloadMap(virtualTour)[sceneId];

  if (existing === true) return;

  if (existing && typeof existing !== 'boolean') {
    await existing;
    return;
  }

  const promise = enqueueScenePreload(viewer, virtualTour, sceneId, panorama);
  if (promise) await promise;
}

export async function navigateToScene(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  tour: Tour,
  targetSceneId: string,
  targetView?: ViewPosition,
  isActive?: () => boolean,
): Promise<boolean> {
  if (isActive && !isActive()) {
    return false;
  }

  const scene = tour.scenes[targetSceneId];
  if (!scene) return false;

  const view = targetView ?? scene.defaultView;

  try {
    await ensureScenePreloaded(
      viewer,
      virtualTour,
      targetSceneId,
      scene.panorama,
    );

    if (isActive && !isActive()) {
      return false;
    }

    return (
      (await virtualTour.setCurrentNode(targetSceneId, {
        showLoader: false,
        rotation: false,
        rotateTo: toPsvPosition(view),
        zoomTo: toPsvZoom(view.zoom),
      })) !== false
    );
  } catch (err) {
    if (isActive && !isActive()) {
      return false;
    }
    console.error('[navigateToScene]', targetSceneId, err);
    return false;
  }
}
