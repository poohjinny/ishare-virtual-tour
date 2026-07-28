import type { Hotspot, Scene, Tour } from '../types/tour';

/** Same tiers as catalog tours — omit / undefined = public. */
export type SceneVisibility = 'public' | 'unlisted' | 'internal';

export type SceneVisibilityAudience = {
  /** `?dev=1` (or equivalent authoring context). */
  dev?: boolean;
};

/**
 * In-viewer hotspot markers always use visitor routing rules so authors in
 * `?dev=1` see the same nav set as the public tour. Internal destinations stay
 * reachable via Dev panel / direct URL when `?dev=1`.
 */
export const VIEWER_MARKER_AUDIENCE: SceneVisibilityAudience = {};

export function resolveSceneVisibility(
  scene: Pick<Scene, 'visibility'> | null | undefined,
): SceneVisibility {
  const value = scene?.visibility;
  if (value === 'unlisted' || value === 'internal') return value;
  return 'public';
}

/** Explore directory / browse lists — public scenes only. */
export function isSceneVisibleInExplore(
  scene: Pick<Scene, 'visibility'> | null | undefined,
): boolean {
  return resolveSceneVisibility(scene) === 'public';
}

/**
 * Direct URL / share / nav hotspot destination.
 * public + unlisted always; internal only when `dev`.
 */
export function isSceneRoutable(
  scene: Pick<Scene, 'visibility'> | null | undefined,
  audience: SceneVisibilityAudience = {},
): boolean {
  const visibility = resolveSceneVisibility(scene);
  if (visibility === 'internal') return Boolean(audience.dev);
  return true;
}

export function listExploreScenes(tour: Pick<Tour, 'scenes'>): Scene[] {
  return Object.values(tour.scenes).filter(isSceneVisibleInExplore);
}

export function listRoutableScenes(
  tour: Pick<Tour, 'scenes'>,
  audience: SceneVisibilityAudience = {},
): Scene[] {
  return Object.values(tour.scenes).filter((scene) =>
    isSceneRoutable(scene, audience),
  );
}

/**
 * Resolve a URL/share scene id for the current audience.
 * Missing or non-routable (e.g. internal without `?dev=1`) → `firstScene`.
 */
export function resolveRoutableSceneId(
  tour: Pick<Tour, 'scenes' | 'firstScene'>,
  sceneId: string | null | undefined,
  audience: SceneVisibilityAudience = {},
): string {
  if (
    sceneId &&
    tour.scenes[sceneId] &&
    isSceneRoutable(tour.scenes[sceneId], audience)
  ) {
    return sceneId;
  }
  return tour.firstScene;
}

/** Drop nav markers whose destination is not routable for this audience. */
export function filterHotspotsForAudience(
  tour: { scenes?: Tour['scenes'] },
  hotspots: Hotspot[],
  audience: SceneVisibilityAudience = {},
): Hotspot[] {
  const scenes = tour.scenes;
  // Callers that only merge hotspot lists (no scene map) skip visibility filtering.
  if (!scenes) return hotspots;

  return hotspots.filter((hotspot) => {
    if (hotspot.type !== 'nav' || !hotspot.targetScene) return true;
    const target = scenes[hotspot.targetScene];
    if (!target) return false;
    return isSceneRoutable(target, audience);
  });
}
