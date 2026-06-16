import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Tour } from '../types/tour';
import type { PanoramaViewerHandle } from '../viewer/PanoramaViewer';
import { findNamingHotspotInTour } from '../utils/tourDirectory';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  buildTourLocation,
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
      lastAppliedNoRef.current = hotspotId;

      const target = buildTourLocation(
        tour.id,
        sceneId,
        tour.firstScene,
        searchParams,
        { [NAMING_OPPORTUNITY_SEARCH_KEY]: hotspotId },
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
      lastAppliedNoRef.current = hotspotId;
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

  const noHotspotId = searchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY);

  useEffect(() => {
    lastAppliedNoRef.current = null;
  }, [tour.id]);

  useEffect(() => {
    if (!splashDone || isTransitioning) {
      return;
    }

    if (!noHotspotId) {
      lastAppliedNoRef.current = null;
      return;
    }

    const loc = findNamingHotspotInTour(tour, noHotspotId);
    if (!loc) {
      clearNamingOpportunityFromUrl();
      return;
    }

    if (lastAppliedNoRef.current === noHotspotId) {
      return;
    }

    lastAppliedNoRef.current = noHotspotId;
    pendingNamingSelectionRef.current = {
      sceneId: loc.sceneId,
      hotspotId: noHotspotId,
    };
    setActiveNamingHotspotId(noHotspotId);
    viewerRef.current?.goToNamingOpportunity(loc.sceneId, noHotspotId);
    syncNamingOpportunityToUrl(noHotspotId, loc.sceneId);
  }, [
    clearNamingOpportunityFromUrl,
    isTransitioning,
    noHotspotId,
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
