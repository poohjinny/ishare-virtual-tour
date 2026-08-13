import type { Hotspot, Scene, Tour } from '../types/tour';
import {
  assertCatalogVisibility,
  resolveCatalogVisibility,
  type CatalogVisibility,
} from './catalogVisibilityCore.mjs';
import {
  isNamingHotspot,
  resolveHotspotNamingRecord,
} from './namingSceneInherit';
import {
  isNamingHotspotRoutable,
  isNamingHotspotVisibleInExplore,
  resolveNamingVisibility,
} from './namingVisibility';

/** Same tiers as catalog tours — omit / undefined = public. */
export type SceneVisibility = CatalogVisibility;

export type SceneVisibilityAudience = {
  /** `?dev=1` (or equivalent authoring context). */
  dev?: boolean;
};

/**
 * In-viewer hotspot markers (visitor): Explore visibility for nav destinations —
 * public only. Unlisted/internal stay reachable via direct URL (and Dev panel /
 * `?dev=1` for internal), not as visitor-facing nav pills.
 * Authoring (`audience.dev`) uses {@link isSceneRoutable} instead so pins stay
 * visible as ghosts for placement / Manage hover.
 */
export const VIEWER_MARKER_AUDIENCE: SceneVisibilityAudience = {};

/** Dev Manage / authoring lists — walk unlisted + internal nav edges. */
export const AUTHORING_SCENE_AUDIENCE: SceneVisibilityAudience = { dev: true };

export function resolveSceneVisibility(
  scene: Pick<Scene, 'visibility'> | null | undefined,
): SceneVisibility {
  return resolveCatalogVisibility(scene);
}

export function isScenePublic(
  scene: Pick<Scene, 'visibility'> | null | undefined,
): boolean {
  return resolveSceneVisibility(scene) === 'public';
}

export function assertSceneVisibility(
  visibility?: string | null,
): SceneVisibility | undefined {
  return assertCatalogVisibility(visibility);
}

/**
 * Dev manage-list chips — Public is the default (no badge), like naming
 * `open` status. Only Unlisted / Internal need a visible exception chip.
 */
export function catalogVisibilityShowsManageBadge(
  visibility: SceneVisibility | string | null | undefined,
): visibility is 'unlisted' | 'internal' {
  return visibility === 'unlisted' || visibility === 'internal';
}

export function catalogVisibilityManageBadgeLabel(
  visibility: 'unlisted' | 'internal',
): string {
  return visibility === 'unlisted' ? 'Unlisted' : 'Internal';
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
 * Visitor in-space nav markers use {@link isSceneVisibleInExplore} instead.
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
 * Effective visibility for a marker pin (nav → target scene, naming → catalog).
 * Used for Manage badges and authoring ghost chrome.
 */
export function resolveHotspotMarkerVisibility(
  tour: {
    scenes?: Tour['scenes'];
    namingOpportunities?: Tour['namingOpportunities'];
  },
  hotspot: Hotspot,
): SceneVisibility {
  if (hotspot.type === 'nav') {
    if (!hotspot.targetScene || !tour.scenes) return 'public';
    const target = tour.scenes[hotspot.targetScene];
    return target ? resolveSceneVisibility(target) : 'public';
  }

  if (isNamingHotspot(hotspot)) {
    return resolveNamingVisibility(resolveHotspotNamingRecord(tour, hotspot));
  }

  return 'public';
}

/**
 * Drop nav / naming markers that the audience should not see in-space.
 * Visitor: Explore-public only.
 * Authoring (`audience.dev`): routable pins (unlisted + internal) stay as ghosts.
 */
export function filterHotspotsForAudience(
  tour: {
    scenes?: Tour['scenes'];
    namingOpportunities?: Tour['namingOpportunities'];
  },
  hotspots: Hotspot[],
  audience: SceneVisibilityAudience = {},
): Hotspot[] {
  const scenes = tour.scenes;
  // Callers that only merge hotspot lists (no scene map) skip visibility filtering.
  if (!scenes) return hotspots;

  return hotspots.filter((hotspot) => {
    if (hotspot.type === 'nav') {
      if (!hotspot.targetScene) return true;
      const target = scenes[hotspot.targetScene];
      if (!target) return false;
      return audience.dev ?
          isSceneRoutable(target, audience)
        : isSceneVisibleInExplore(target);
    }

    if (isNamingHotspot(hotspot)) {
      return audience.dev ?
          isNamingHotspotRoutable(tour, hotspot, audience)
        : isNamingHotspotVisibleInExplore(tour, hotspot);
    }

    return true;
  });
}
