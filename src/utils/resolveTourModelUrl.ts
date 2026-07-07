import type { Scene, Tour } from '../types/tour';

/** GLB/GLTF URL for a 3D scene — per-scene override, then tour model, then legacy panorama. */
export function resolveTourSceneModelUrl(
  tour: Pick<Tour, 'model'>,
  scene: Pick<Scene, 'model' | 'panorama'>,
): string | null {
  const url =
    scene.model?.trim() || tour.model?.trim() || scene.panorama?.trim();
  return url || null;
}
