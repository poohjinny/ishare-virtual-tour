import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type RefObject,
} from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import type { Tour } from '../types/tour';
import type { TourViewerHandle } from '../viewer/viewerHandle';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  buildTourLocation,
  legacyQueryRedirectPath,
  legacyTourPathRedirect,
  resolveSceneId,
  resolveTourRoute,
  toNamingOpportunitySearchValue,
} from '../utils/tourPaths';

export interface SyncSceneToUrlOptions {
  /** Drop `?no=` when updating the scene path (normal scene navigation). */
  clearNamingOpportunity?: boolean;
}

interface UseTourRouteSyncOptions {
  tour: Tour;
  currentSceneId: string;
  isTransitioning: boolean;
  /** Synchronous ref — immune to React batching delays unlike `isTransitioning` state. */
  transitioningRef?: MutableRefObject<boolean>;
  viewerRef: RefObject<TourViewerHandle | null>;
  syncSceneFromRoute: (sceneId: string) => void;
  pendingNamingSelectionRef?: RefObject<{
    sceneId: string;
    hotspotId: string;
  } | null>;
}

export function useTourRouteSync({
  tour,
  currentSceneId,
  isTransitioning,
  transitioningRef,
  viewerRef,
  syncSceneFromRoute,
  pendingNamingSelectionRef,
}: UseTourRouteSyncOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    tourOrScene,
    tourId,
    sceneId: sceneParam,
  } = useParams<{ tourOrScene?: string; tourId?: string; sceneId?: string }>();

  const syncingFromUrlRef = useRef(false);
  const syncingToUrlRef = useRef(false);
  /** Scene id we pushed to the URL — keep URL→viewer blocked until Router catches up. */
  const pendingToUrlSceneIdRef = useRef<string | null>(null);

  const route = useMemo(
    () => resolveTourRoute(tourOrScene ?? tourId, sceneParam),
    [sceneParam, tourId, tourOrScene],
  );

  const routeSceneId = useMemo(
    () => resolveSceneId(route.tourId, route.sceneId),
    [route.sceneId, route.tourId],
  );

  useEffect(() => {
    const legacyPath =
      legacyQueryRedirectPath(searchParams) ??
      legacyTourPathRedirect(location.pathname, searchParams);
    if (legacyPath && legacyPath !== location.pathname + location.search) {
      navigate(legacyPath, { replace: true });
    }
  }, [location.pathname, location.search, navigate, searchParams]);

  useEffect(() => {
    if (route.tourId !== tour.id) {
      return;
    }

    // Outbound URL sync in flight — wait until route matches before snapping viewer.
    if (pendingToUrlSceneIdRef.current !== null) {
      if (routeSceneId === pendingToUrlSceneIdRef.current) {
        pendingToUrlSceneIdRef.current = null;
        syncingToUrlRef.current = false;
      } else {
        return;
      }
    }

    if (
      routeSceneId === currentSceneId ||
      isTransitioning ||
      transitioningRef?.current ||
      syncingToUrlRef.current ||
      syncingFromUrlRef.current
    ) {
      return;
    }

    const pendingNaming = pendingNamingSelectionRef?.current;
    if (
      pendingNaming?.sceneId === routeSceneId &&
      searchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY) ===
        toNamingOpportunitySearchValue(tour, pendingNaming.hotspotId)
    ) {
      return;
    }

    const scene = tour.scenes[routeSceneId];
    if (!scene) {
      return;
    }

    syncingFromUrlRef.current = true;
    syncSceneFromRoute(routeSceneId);

    void viewerRef.current
      ?.navigateToScene(routeSceneId, scene.defaultView)
      .finally(() => {
        syncingFromUrlRef.current = false;
      });
  }, [
    currentSceneId,
    isTransitioning,
    syncSceneFromRoute,
    route.tourId,
    routeSceneId,
    tour.id,
    tour.scenes,
    viewerRef,
    pendingNamingSelectionRef,
    searchParams,
    transitioningRef,
  ]);

  useEffect(() => {
    if (route.tourId !== tour.id) {
      return;
    }

    if (
      isTransitioning ||
      syncingFromUrlRef.current ||
      syncingToUrlRef.current ||
      currentSceneId !== routeSceneId
    ) {
      return;
    }

    const target = buildTourLocation(
      tour.id,
      currentSceneId,
      tour.firstScene,
      searchParams,
    );

    if (location.pathname + location.search === target) {
      return;
    }

    pendingToUrlSceneIdRef.current = currentSceneId;
    syncingToUrlRef.current = true;
    navigate(target, { replace: true });
  }, [
    currentSceneId,
    isTransitioning,
    location.pathname,
    location.search,
    navigate,
    route.tourId,
    routeSceneId,
    searchParams,
    tour.firstScene,
    tour.id,
  ]);

  const syncSceneToUrl = useCallback(
    (sceneId: string, options?: SyncSceneToUrlOptions) => {
      if (syncingFromUrlRef.current) {
        return;
      }

      // Client switch can update the URL before this tour instance unmounts.
      if (route.tourId !== tour.id) {
        return;
      }

      const patch =
        options?.clearNamingOpportunity ?
          { [NAMING_OPPORTUNITY_SEARCH_KEY]: null }
        : undefined;

      const target = buildTourLocation(
        tour.id,
        sceneId,
        tour.firstScene,
        searchParams,
        patch,
      );

      if (location.pathname + location.search === target) {
        return;
      }

      pendingToUrlSceneIdRef.current = sceneId;
      syncingToUrlRef.current = true;
      navigate(target);
    },
    [
      location.pathname,
      location.search,
      navigate,
      route.tourId,
      searchParams,
      tour.firstScene,
      tour.id,
    ],
  );

  return { routeSceneId, syncSceneToUrl };
}
