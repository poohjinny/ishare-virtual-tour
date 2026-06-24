import {
  DEFAULT_TOUR_ID,
  listPublicTourIds,
  listTourIds,
  loadTour,
} from '../data/loadTour';

import {
  NAMING_OPPORTUNITY_HOTSPOT_PREFIX,
  NAMING_OPPORTUNITY_SEARCH_KEY,
  namingOpportunityNameToCamelCase,
  namingOpportunityNameToKebabCase,
  resolveNamingOpportunityFromSearch,
  toNamingOpportunitySearchValue,
} from './namingOpportunityUrl';

export {
  NAMING_OPPORTUNITY_HOTSPOT_PREFIX,
  NAMING_OPPORTUNITY_SEARCH_KEY,
  namingOpportunityNameToCamelCase,
  namingOpportunityNameToKebabCase,
  resolveNamingOpportunityFromSearch,
  toNamingOpportunitySearchValue,
};

/** Old paths that used client id as the first segment → canonical tour id. */
const LEGACY_TOUR_PATH_ALIASES: Record<string, string> = {
  gphospitalfoundation: 'ken-sargent-house',
  cancerresearchsociety: 'cancer-research',
  holodomor: 'holodomor-museum',
};

const KNOWN_TOUR_IDS = new Set(listTourIds());

export function normalizeTourPathId(segment: string): string {
  return LEGACY_TOUR_PATH_ALIASES[segment] ?? segment;
}

export function isKnownTourId(id: string): boolean {
  return KNOWN_TOUR_IDS.has(normalizeTourPathId(id));
}

export function isRootPathWithoutTour(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/';
}

/** Root `/` with no tour segment — show client cards before loading a tour. */
export function needsClientIntroPick(
  pathname: string,
  tourOrScene?: string,
  tourId?: string,
  options?: { embed?: boolean; intro?: boolean | null },
): boolean {
  if (tourOrScene || tourId) return false;
  if (!isRootPathWithoutTour(pathname)) return false;

  if (options?.intro === false || options?.embed) return false;

  if (options?.intro === true) {
    return listPublicTourIds().length >= 1;
  }

  return listPublicTourIds().length > 1;
}

export type TourRouteError = 'none' | 'unknown_tour';

export interface ResolvedTourRoute {
  tourId: string;
  sceneId: string | null;
  routeError: TourRouteError;
  /** Raw tour segment from the URL when `routeError` is set. */
  requestedTourId?: string;
}

/** Map `/:segment` and `/:tourId/:sceneId` params to tour + optional scene. */
export function resolveTourRoute(
  tourOrScene?: string,
  sceneId?: string,
): ResolvedTourRoute {
  if (!tourOrScene) {
    const ids = listTourIds();
    if (ids.length === 1) {
      return { tourId: ids[0]!, sceneId: null, routeError: 'none' };
    }
    return { tourId: DEFAULT_TOUR_ID, sceneId: null, routeError: 'none' };
  }

  if (sceneId !== undefined) {
    const tourId = normalizeTourPathId(tourOrScene);
    if (!isKnownTourId(tourId)) {
      return {
        tourId,
        sceneId,
        routeError: 'unknown_tour',
        requestedTourId: tourOrScene,
      };
    }
    return { tourId, sceneId, routeError: 'none' };
  }

  const tourId = normalizeTourPathId(tourOrScene);
  if (isKnownTourId(tourId)) {
    return { tourId, sceneId: null, routeError: 'none' };
  }

  const defaultTour = loadTour(DEFAULT_TOUR_ID);
  if (defaultTour.scenes[tourOrScene]) {
    return {
      tourId: DEFAULT_TOUR_ID,
      sceneId: tourOrScene,
      routeError: 'none',
    };
  }

  return {
    tourId,
    sceneId: null,
    routeError: 'unknown_tour',
    requestedTourId: tourOrScene,
  };
}

export function resolveSceneId(tourId: string, sceneId: string | null): string {
  const tour = loadTour(tourId);
  if (sceneId && tour.scenes[sceneId]) {
    return sceneId;
  }
  return tour.firstScene;
}

export function buildTourPath(
  tourId: string,
  sceneId: string,
  _firstSceneId: string,
): string {
  return `/${tourId}/${sceneId}`;
}

/** Query flags preserved across in-app navigation (not tour/scene). */
export const PRESERVED_SEARCH_KEYS = [
  'embed',
  'intro',
  'dev',
  'chatTest',
  'errorTest',
  'navPreview',
  'skipLanding',
  'splashHold',
  'clientSelector',
  NAMING_OPPORTUNITY_SEARCH_KEY,
] as const;

export type PreservedSearchKey = (typeof PRESERVED_SEARCH_KEYS)[number];

export function clonePreservedSearchParams(
  source: URLSearchParams,
  patch?: Partial<Record<PreservedSearchKey, string | null>>,
): URLSearchParams {
  const next = new URLSearchParams();
  for (const key of PRESERVED_SEARCH_KEYS) {
    let value: string | null = null;
    if (patch && key in patch) {
      value = patch[key] ?? null;
    } else {
      value = source.get(key);
    }
    if (value) {
      next.set(key, value);
    }
  }
  return next;
}

export function preservedSearchStringFrom(
  source: URLSearchParams,
  patch?: Partial<Record<PreservedSearchKey, string | null>>,
): string {
  const serialized = clonePreservedSearchParams(source, patch).toString();
  return serialized ? `?${serialized}` : '';
}

export function preserveSearchString(searchParams: URLSearchParams): string {
  return preservedSearchStringFrom(searchParams);
}

export function buildTourLocation(
  tourId: string,
  sceneId: string,
  firstSceneId: string,
  searchParams: URLSearchParams,
  patch?: Partial<Record<PreservedSearchKey, string | null>>,
): string {
  return (
    buildTourPath(tourId, sceneId, firstSceneId) +
    preservedSearchStringFrom(searchParams, patch)
  );
}

/** Legacy `/{clientId}/...` paths → canonical `/{tourId}/{sceneId}`. */
export function legacyTourPathRedirect(
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/') {
    return null;
  }

  const segments = normalized.split('/').filter(Boolean);
  const rawTourSegment = segments[0];
  if (!rawTourSegment) {
    return null;
  }

  const canonicalTourId = normalizeTourPathId(rawTourSegment);
  if (rawTourSegment === canonicalTourId || !isKnownTourId(canonicalTourId)) {
    return null;
  }

  const tour = loadTour(canonicalTourId);
  const sceneSegment = segments.length >= 2 ? segments[1] : null;
  const sceneId = resolveSceneId(
    canonicalTourId,
    sceneSegment && tour.scenes[sceneSegment] ? sceneSegment : null,
  );

  return buildTourLocation(
    canonicalTourId,
    sceneId,
    tour.firstScene,
    searchParams,
  );
}

/** Legacy `?tour=` / `?scene=` → path-based URL. */
export function legacyQueryRedirectPath(
  searchParams: URLSearchParams,
): string | null {
  const tourQuery = searchParams.get('tour');
  const sceneQuery = searchParams.get('scene');
  if (!tourQuery && !sceneQuery) {
    return null;
  }

  const tourId = normalizeTourPathId(tourQuery ?? DEFAULT_TOUR_ID);
  const tour = loadTour(isKnownTourId(tourId) ? tourId : DEFAULT_TOUR_ID);
  const resolvedTourId = tour.id;
  const sceneId = resolveSceneId(
    resolvedTourId,
    sceneQuery && tour.scenes[sceneQuery] ? sceneQuery : null,
  );

  const nextSearch = new URLSearchParams(searchParams);
  nextSearch.delete('tour');
  nextSearch.delete('scene');

  const path = buildTourPath(resolvedTourId, sceneId, tour.firstScene);
  const flags = preserveSearchString(nextSearch);
  return path + flags;
}
