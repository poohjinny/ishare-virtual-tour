import type { Hotspot, Scene, Tour } from '../types/tour';

/** BFS depth from firstScene along nav hotspots (overview = 0). */
export function buildSceneDepths(tour: Tour): Record<string, number> {
  const depths: Record<string, number> = {};
  const queue = [tour.firstScene];
  depths[tour.firstScene] = 0;

  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    const scene = tour.scenes[sceneId];
    if (!scene) continue;

    for (const hotspot of scene.hotspots) {
      if (
        hotspot.type !== 'nav' ||
        !hotspot.targetScene ||
        depths[hotspot.targetScene] !== undefined
      ) {
        continue;
      }
      depths[hotspot.targetScene] = depths[sceneId] + 1;
      queue.push(hotspot.targetScene);
    }
  }

  return depths;
}

export function getSceneDepth(tour: Tour, sceneId: string): number {
  return buildSceneDepths(tour)[sceneId] ?? 0;
}

export function isGoingDeeper(
  tour: Tour,
  fromSceneId: string,
  toSceneId: string,
): boolean {
  return getSceneDepth(tour, toSceneId) > getSceneDepth(tour, fromSceneId);
}

/** Nav hotspot on target that links back toward the scene we came from. */
export function findIngressHotspot(
  targetScene: Scene,
  fromSceneId: string,
): Hotspot | undefined {
  return targetScene.hotspots.find(
    (h) => h.type === 'nav' && h.targetScene === fromSceneId,
  );
}

/** Nav hotspot on current scene that points to the shallower target. */
export function findEgressHotspot(
  scene: Scene,
  targetSceneId: string,
): Hotspot | undefined {
  return scene.hotspots.find(
    (h) => h.type === 'nav' && h.targetScene === targetSceneId,
  );
}
