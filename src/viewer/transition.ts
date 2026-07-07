/**
 * Scene navigation — preload target panorama, then Virtual Tour setCurrentNode.
 * Preload keeps the current scene visible; PSV fade overlays the cached texture.
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

/** Wait for an in-flight preload or start one; registers with VT preload cache. */
export async function ensureScenePreloaded(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  sceneId: string,
  panorama: string,
): Promise<void> {
  const preload = getPreloadMap(virtualTour);
  const existing = preload[sceneId];

  if (existing === true) return;

  if (existing && typeof existing !== 'boolean') {
    await existing;
    return;
  }

  const promise = preloadPanorama(viewer, panorama)
    .then(() => {
      preload[sceneId] = true;
    })
    .catch((err: unknown) => {
      delete preload[sceneId];
      throw err;
    });

  preload[sceneId] = promise;
  await promise;
}

/** Background preload of other tour scenes (deduped via VT preload map). */
export function preloadOtherScenes(
  viewer: Viewer,
  virtualTour: VirtualTourPlugin,
  tour: Tour,
  currentSceneId: string,
): void {
  for (const scene of Object.values(tour.scenes)) {
    if (scene.id === currentSceneId) continue;

    const preload = getPreloadMap(virtualTour);
    const existing = preload[scene.id];
    if (existing === true || (existing && typeof existing !== 'boolean')) {
      continue;
    }

    const promise = preloadPanorama(viewer, scene.panorama)
      .then(() => {
        preload[scene.id] = true;
      })
      .catch(() => {
        delete preload[scene.id];
      });

    preload[scene.id] = promise;
  }
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
