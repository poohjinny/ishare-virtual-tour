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
  buildTourLocation,
  legacyQueryRedirectPath,
  resolveSceneId,
  resolveTourRoute,
} from '../utils/tourPaths';

interface UseTourRouteSyncOptions {
  tour: Tour;
  currentSceneId: string;
  isTransitioning: boolean;
  viewerRef: RefObject<PanoramaViewerHandle | null>;
  syncSceneFromRoute: (sceneId: string) => void;
}

export function useTourRouteSync({
  tour,
  currentSceneId,
  isTransitioning,
  viewerRef,
  syncSceneFromRoute,
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
    const legacyPath = legacyQueryRedirectPath(searchParams);
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
  ]);

  const syncSceneToUrl = useCallback(
    (sceneId: string) => {
      if (syncingFromUrlRef.current) {
        return;
      }

      // Client switch can update the URL before this tour instance unmounts.
      if (route.tourId !== tour.id) {
        return;
      }

      const target = buildTourLocation(
        tour.id,
        sceneId,
        tour.firstScene,
        searchParams,
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
