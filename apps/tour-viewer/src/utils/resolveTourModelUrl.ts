import type { Scene, Tour } from '../types/tour';

/** GLB/GLTF URL for a 3D scene — per-scene override, then tour model. */
export function resolveTourSceneModelUrl(
  tour: Pick<Tour, 'model'>,
  scene: Pick<Scene, 'model'>,
): string | null {
  const url = scene.model?.trim() || tour.model?.trim();
  return url || null;
}
