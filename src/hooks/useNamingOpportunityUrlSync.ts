import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Tour } from '../types/tour';
import type { PanoramaViewerHandle } from '../viewer/PanoramaViewer';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  buildTourLocation,
  resolveNamingOpportunityFromSearch,
  toNamingOpportunitySearchValue,
} from '../utils/tourPaths';

interface UseNamingOpportunityUrlSyncOptions {
  tour: Tour;
  currentSceneId: string;
  isTransitioning: boolean;
  splashDone: boolean;
  viewerRef: RefObject<PanoramaViewerHandle | null>;
  pendingNamingSelectionRef: RefObject<{
    sceneId: string;
    hotspotId: string;
  } | null>;
  setActiveNamingHotspotId: (hotspotId: string | null) => void;
}

export function useNamingOpportunityUrlSync({
  tour,
  currentSceneId,
  isTransitioning,
  splashDone,
  viewerRef,
  pendingNamingSelectionRef,
  setActiveNamingHotspotId,
}: UseNamingOpportunityUrlSyncOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const lastAppliedNoRef = useRef<string | null>(null);

  const syncNamingOpportunityToUrl = useCallback(
    (hotspotId: string | null, sceneId: string = currentSceneId) => {
      const searchValue = hotspotId ? toNamingOpportunitySearchValue(tour, hotspotId) : null;
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
      currentSceneId,
      location.pathname,
      location.search,
      navigate,
      searchParams,
      tour.firstScene,
      tour.id,
    ],
  );

  const clearNamingOpportunityFromUrl = useCallback(() => {
    lastAppliedNoRef.current = null;
    syncNamingOpportunityToUrl(null);
  }, [syncNamingOpportunityToUrl]);

  const openNamingOpportunity = useCallback(
    (sceneId: string, hotspotId: string) => {
      pendingNamingSelectionRef.current = { sceneId, hotspotId };
      setActiveNamingHotspotId(hotspotId);
      lastAppliedNoRef.current = toNamingOpportunitySearchValue(tour, hotspotId);
      viewerRef.current?.goToNamingOpportunity(sceneId, hotspotId);
      syncNamingOpportunityToUrl(hotspotId, sceneId);
    },
    [
      pendingNamingSelectionRef,
      setActiveNamingHotspotId,
      syncNamingOpportunityToUrl,
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

    const resolved = resolveNamingOpportunityFromSearch(tour, noSearchValue);
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
    viewerRef.current?.goToNamingOpportunity(sceneId, hotspotId);
    syncNamingOpportunityToUrl(hotspotId, sceneId);
  }, [
    clearNamingOpportunityFromUrl,
    isTransitioning,
    noSearchValue,
    pendingNamingSelectionRef,
    setActiveNamingHotspotId,
    splashDone,
    syncNamingOpportunityToUrl,
    tour,
    viewerRef,
  ]);

  return {
    openNamingOpportunity,
    syncNamingOpportunityToUrl,
    clearNamingOpportunityFromUrl,
  };
}
