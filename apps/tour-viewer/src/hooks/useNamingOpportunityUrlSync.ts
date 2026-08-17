import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Tour } from '../types/tour';
import type { TourViewerHandle } from '../viewer-shared/viewerHandle';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  buildTourLocation,
  resolveNamingOpportunityFromSearch,
  sceneHostsNamingHotspot,
  toNamingOpportunitySearchValue,
} from '../utils/tourPaths';

interface UseNamingOpportunityUrlSyncOptions {
  tour: Tour;
  currentSceneId: string;
  /** Scene already in the address bar — keep this when only patching `?no=`. */
  urlSceneId?: string | null;
  isTransitioning: boolean;
  splashDone: boolean;
  /** `?dev=1` — required for internal naming deep links. */
  audience?: { dev?: boolean };
  viewerRef: RefObject<TourViewerHandle | null>;
  pendingNamingSelectionRef: RefObject<{
    sceneId: string;
    hotspotId: string;
  } | null>;
  setActiveNamingHotspotId: (hotspotId: string | null) => void;
}

export function useNamingOpportunityUrlSync({
  tour,
  currentSceneId,
  urlSceneId = null,
  isTransitioning,
  splashDone,
  audience = {},
  viewerRef,
  pendingNamingSelectionRef,
  setActiveNamingHotspotId,
}: UseNamingOpportunityUrlSyncOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const lastAppliedNoRef = useRef<string | null>(null);

  const pathSceneId =
    urlSceneId && tour.scenes[urlSceneId] ? urlSceneId : currentSceneId;

  const syncNamingOpportunityToUrl = useCallback(
    (hotspotId: string | null, sceneId: string = pathSceneId) => {
      const searchValue =
        hotspotId ? toNamingOpportunitySearchValue(tour, hotspotId) : null;
      lastAppliedNoRef.current = searchValue;

      const target = buildTourLocation(
        tour.id,
        sceneId,
        tour.firstScene,
        searchParams,
        { [NAMING_OPPORTUNITY_SEARCH_KEY]: searchValue },
      );

      if (location.pathname + location.search === target) {
        return;
      }

      navigate(target, { replace: true });
    },
    [
      location.pathname,
      location.search,
      navigate,
      pathSceneId,
      searchParams,
      tour.firstScene,
      tour.id,
    ],
  );

  const clearNamingOpportunityFromUrl = useCallback(() => {
    lastAppliedNoRef.current = null;
    syncNamingOpportunityToUrl(null);
  }, [syncNamingOpportunityToUrl]);

  /**
   * `?no=` is inbound only (share / OG / paste). In-app open must not write it —
   * drop it when the open hotspot no longer matches the deep link.
   */
  const reconcileNamingOpportunityUrl = useCallback(
    (hotspotId: string | null) => {
      const current = searchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY);
      if (!current) return;
      if (hotspotId) {
        const resolved = resolveNamingOpportunityFromSearch(
          tour,
          current,
          audience,
        );
        if (resolved?.hotspotId === hotspotId) return;
      }
      clearNamingOpportunityFromUrl();
    },
    [audience, clearNamingOpportunityFromUrl, searchParams, tour],
  );

  const openNamingOpportunity = useCallback(
    (sceneId: string, hotspotId: string) => {
      pendingNamingSelectionRef.current = { sceneId, hotspotId };

      const started = viewerRef.current?.goToNamingOpportunity(
        sceneId,
        hotspotId,
      );
      if (!started) {
        pendingNamingSelectionRef.current = null;
        return;
      }

      setActiveNamingHotspotId(hotspotId);
      reconcileNamingOpportunityUrl(hotspotId);
    },
    [
      pendingNamingSelectionRef,
      reconcileNamingOpportunityUrl,
      setActiveNamingHotspotId,
      viewerRef,
    ],
  );

  const noSearchValue = searchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY);

  useEffect(() => {
    lastAppliedNoRef.current = null;
  }, [tour.id]);

  useEffect(() => {
    if (!splashDone || isTransitioning) {
      return;
    }

    if (!noSearchValue) {
      lastAppliedNoRef.current = null;
      return;
    }

    const resolved = resolveNamingOpportunityFromSearch(
      tour,
      noSearchValue,
      audience,
    );
    if (!resolved) {
      clearNamingOpportunityFromUrl();
      return;
    }

    const { hotspotId, sceneId } = resolved;

    if (lastAppliedNoRef.current === noSearchValue) {
      return;
    }

    lastAppliedNoRef.current = noSearchValue;
    pendingNamingSelectionRef.current = { sceneId, hotspotId };
    setActiveNamingHotspotId(hotspotId);
    const started = viewerRef.current?.goToNamingOpportunity(
      sceneId,
      hotspotId,
    );
    if (!started) {
      pendingNamingSelectionRef.current = null;
      setActiveNamingHotspotId(null);
      return;
    }
    // Keep the address-bar scene when it actually hosts this pin. Catalog
    // `sceneId` (firstScene fallback / stale placement) was rewriting the path.
    const keepUrlScene =
      Boolean(pathSceneId) &&
      (pathSceneId === sceneId ||
        sceneHostsNamingHotspot(tour, pathSceneId, hotspotId));
    syncNamingOpportunityToUrl(hotspotId, keepUrlScene ? pathSceneId : sceneId);
  }, [
    audience,
    clearNamingOpportunityFromUrl,
    isTransitioning,
    noSearchValue,
    pathSceneId,
    pendingNamingSelectionRef,
    setActiveNamingHotspotId,
    splashDone,
    syncNamingOpportunityToUrl,
    tour,
    viewerRef,
  ]);

  return {
    openNamingOpportunity,
    reconcileNamingOpportunityUrl,
    clearNamingOpportunityFromUrl,
  };
}
