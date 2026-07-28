import type { Hotspot, Scene, Tour } from '../types/tour';
import { isNamingHotspot } from './namingSceneInherit';
import { isNamingHotspotVisibleInExplore } from './namingVisibility';

/** Same tiers as catalog tours — omit / undefined = public. */
export type SceneVisibility = 'public' | 'unlisted' | 'internal';

export type SceneVisibilityAudience = {
  /** `?dev=1` (or equivalent authoring context). */
  dev?: boolean;
};

/**
 * In-viewer hotspot markers use Explore visibility for nav destinations:
 * public only. Unlisted/internal stay reachable via direct URL (and Dev panel /
 * `?dev=1` for internal), not as in-space nav pills.
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
 * Direct URL / share / programmatic navigate destination.
 * public + unlisted always; internal only when `dev`.
 * In-space nav markers use {@link isSceneVisibleInExplore} instead.
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

/**
 * Drop nav markers whose destination is not Explore-visible (public), and
 * naming pins whose catalog visibility is not Explore-public.
 * Unlisted/internal stay reachable via direct URL / `?no=` (and `?dev=1`
 * for internal), not as in-space markers — including authoring (`?dev=1`).
 */
export function filterHotspotsForAudience(
  tour: {
    scenes?: Tour['scenes'];
    namingOpportunities?: Tour['namingOpportunities'];
  },
  hotspots: Hotspot[],
  _audience: SceneVisibilityAudience = {},
): Hotspot[] {
  const scenes = tour.scenes;
  // Callers that only merge hotspot lists (no scene map) skip visibility filtering.
  if (!scenes) return hotspots;

  return hotspots.filter((hotspot) => {
    if (hotspot.type === 'nav') {
      if (!hotspot.targetScene) return true;
      const target = scenes[hotspot.targetScene];
      if (!target) return false;
      return isSceneVisibleInExplore(target);
    }

    if (isNamingHotspot(hotspot)) {
      return isNamingHotspotVisibleInExplore(tour, hotspot);
    }

    return true;
  });
}
