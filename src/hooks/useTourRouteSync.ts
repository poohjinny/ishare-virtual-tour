import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import type { Tour } from '../types/tour';
import type { PanoramaViewerHandle } from '../viewer/PanoramaViewer';
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
  viewerRef: RefObject<PanoramaViewerHandle | null>;
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

    if (
      routeSceneId === currentSceneId ||
      isTransitioning ||
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

    syncingToUrlRef.current = true;
    navigate(target, { replace: true });
    queueMicrotask(() => {
      syncingToUrlRef.current = false;
    });
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

      syncingToUrlRef.current = true;
      navigate(target);
      queueMicrotask(() => {
        syncingToUrlRef.current = false;
      });
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
