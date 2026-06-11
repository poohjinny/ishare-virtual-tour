import { DEFAULT_TOUR_ID, listTourIds, loadTour } from '../data/loadTour';

const KNOWN_TOUR_IDS = new Set(listTourIds());

export function isKnownTourId(id: string): boolean {
  return KNOWN_TOUR_IDS.has(id);
}

export interface ResolvedTourRoute {
  tourId: string;
  sceneId: string | null;
}

/** Map `/:segment` and `/:tourId/:sceneId` params to tour + optional scene. */
export function resolveTourRoute(
  tourOrScene?: string,
  sceneId?: string,
): ResolvedTourRoute {
  if (!tourOrScene) {
    return { tourId: DEFAULT_TOUR_ID, sceneId: null };
  }

  if (sceneId !== undefined) {
    return {
      tourId: isKnownTourId(tourOrScene) ? tourOrScene : DEFAULT_TOUR_ID,
      sceneId,
    };
  }

  if (isKnownTourId(tourOrScene)) {
    return { tourId: tourOrScene, sceneId: null };
  }

  return { tourId: DEFAULT_TOUR_ID, sceneId: tourOrScene };
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
  firstSceneId: string,
): string {
  const onDefaultTour = tourId === DEFAULT_TOUR_ID;
  const onFirstScene = sceneId === firstSceneId;

  if (onDefaultTour && onFirstScene) {
    return '/';
  }
  if (onDefaultTour) {
    return `/${sceneId}`;
  }
  if (onFirstScene) {
    return `/${tourId}`;
  }
  return `/${tourId}/${sceneId}`;
}

/** Query flags preserved across in-app navigation (not tour/scene). */
export const PRESERVED_SEARCH_KEYS = [
  'embed',
  'dev',
  'chatTest',
  'errorTest',
] as const;

export function preserveSearchString(searchParams: URLSearchParams): string {
  const next = new URLSearchParams();
  for (const key of PRESERVED_SEARCH_KEYS) {
    const value = searchParams.get(key);
    if (value) {
      next.set(key, value);
    }
  }
  const serialized = next.toString();
  return serialized ? `?${serialized}` : '';
}

export function buildTourLocation(
  tourId: string,
  sceneId: string,
  firstSceneId: string,
  searchParams: URLSearchParams,
): string {
  return (
    buildTourPath(tourId, sceneId, firstSceneId) +
    preserveSearchString(searchParams)
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

  const tourId = tourQuery ?? DEFAULT_TOUR_ID;
  const tour = loadTour(tourId);
  const sceneId = resolveSceneId(
    tourId,
    sceneQuery && tour.scenes[sceneQuery] ? sceneQuery : null,
  );

  const nextSearch = new URLSearchParams(searchParams);
  nextSearch.delete('tour');
  nextSearch.delete('scene');

  const path = buildTourPath(tourId, sceneId, tour.firstScene);
  const flags = preserveSearchString(nextSearch);
  return path + flags;
}
