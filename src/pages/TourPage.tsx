import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { AiAssistant } from '../components/ai/AiAssistant';
import { ClientIntroPicker } from '../components/ClientIntroPicker';
import { ClientSelector } from '../components/ClientSelector';
import { DevViewPanel } from '../components/DevViewPanel';
import { InfoPopup } from '../components/InfoPopup';
import { LoadProgressBar } from '../components/LoadProgressBar';
import { PanoramaLoadError } from '../components/PanoramaLoadError';
import { TourLoadSplash } from '../components/TourLoadSplash';
import { FloorPlanMinimap } from '../components/FloorPlanMinimap';
import { TourNavFloat } from '../components/TourNavFloat';
import {
  getSceneList,
  getTourWebsite,
  loadKnowledge,
  loadTour,
  listTourIds,
  DEFAULT_TOUR_ID,
} from '../data/loadTour';
import { getTourProductFullName } from '../utils/tourProductName';
import { useAppSearchParams } from '../hooks/useAppSearchParams';
import { useTourAssistant } from '../hooks/useTourAssistant';
import { useTourRouteSync } from '../hooks/useTourRouteSync';
import { useNamingOpportunityUrlSync } from '../hooks/useNamingOpportunityUrlSync';
import { useTourState } from '../hooks/useTourState';
import { useClientTheme } from '../hooks/useClientTheme';
import { useClientFavicon } from '../hooks/useClientFavicon';
import { useClientFont } from '../hooks/useClientFont';
import type {
  PopupContent,
  ViewPosition,
  ViewerOrientation,
} from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  resolveSceneId,
  resolveTourRoute,
  buildTourLocation,
  needsClientIntroPick,
  isRootPathWithoutTour,
  NAMING_OPPORTUNITY_SEARCH_KEY,
} from '../utils/tourPaths';
import {
  resolveSceneLandingView,
  findNamingHotspotInTour,
} from '../utils/tourDirectory';
import { useHistoryNavControls } from '../hooks/useHistoryNavControls';
import { useViewerControlsVisible } from '../hooks/useViewerControlsVisible';
import {
  PanoramaViewer,
  type PanoramaLoadErrorInfo,
  type PanoramaViewerHandle,
} from '../viewer/PanoramaViewer';

const SPLASH_FADE_MS = 350;
/** Extra splash hold for loader UX testing — only when `?splashHold=1` */
const DEV_SPLASH_HOLD_MS = 2000;

export function TourPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [urlSearchParams] = useSearchParams();
  const searchParams = useAppSearchParams();
  const { tourOrScene, tourId } = useParams<{
    tourOrScene?: string;
    tourId?: string;
    sceneId?: string;
  }>();

  const showClientIntro = useMemo(
    () =>
      needsClientIntroPick(location.pathname, tourOrScene, tourId, {
        embed: searchParams.embed,
        intro: searchParams.intro,
      }),
    [
      location.pathname,
      searchParams.embed,
      searchParams.intro,
      tourId,
      tourOrScene,
    ],
  );

  useEffect(() => {
    if (showClientIntro || !isRootPathWithoutTour(location.pathname)) {
      return;
    }
    if (tourOrScene || tourId) {
      return;
    }

    const ids = listTourIds();
    if (ids.length === 1 && searchParams.intro !== true) {
      const onlyTour = loadTour(ids[0]!);
      navigate(
        buildTourLocation(
          onlyTour.id,
          onlyTour.firstScene,
          onlyTour.firstScene,
          urlSearchParams,
        ),
        { replace: true },
      );
      return;
    }

    if (searchParams.embed || searchParams.intro === false) {
      const defaultTour = loadTour(DEFAULT_TOUR_ID);
      navigate(
        buildTourLocation(
          defaultTour.id,
          defaultTour.firstScene,
          defaultTour.firstScene,
          urlSearchParams,
        ),
        { replace: true },
      );
    }
  }, [
    location.pathname,
    navigate,
    searchParams.embed,
    searchParams.intro,
    showClientIntro,
    tourId,
    tourOrScene,
    urlSearchParams,
  ]);

  if (showClientIntro) {
    return <ClientIntroPicker searchParams={urlSearchParams} />;
  }

  return <TourExperience />;
}

function TourExperience() {
  const searchParams = useAppSearchParams();
  const [urlSearchParams] = useSearchParams();
  const {
    tourOrScene,
    tourId,
    sceneId: sceneParam,
  } = useParams<{ tourOrScene?: string; tourId?: string; sceneId?: string }>();

  const route = useMemo(
    () => resolveTourRoute(tourOrScene ?? tourId, sceneParam),
    [sceneParam, tourId, tourOrScene],
  );

  const tour = useMemo(() => loadTour(route.tourId), [route.tourId]);
  const productFullName = useMemo(() => getTourProductFullName(tour), [tour]);
  const knowledge = useMemo(() => loadKnowledge(route.tourId), [route.tourId]);
  const scenes = useMemo(() => getSceneList(tour), [tour]);
  const tourRootRef = useRef<HTMLDivElement>(null);

  useClientTheme(tour);
  useClientFavicon(tour);
  useClientFont(tour, tourRootRef);

  useEffect(() => {
    document.title = productFullName;
  }, [productFullName]);

  const initialScene = useMemo(
    () => resolveSceneId(route.tourId, route.sceneId),
    [route.sceneId, route.tourId],
  );

  const landingTargetView = useMemo(() => {
    const noHotspotId = urlSearchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY);
    if (!noHotspotId) return undefined;
    const loc = findNamingHotspotInTour(tour, noHotspotId);
    if (!loc || loc.sceneId !== initialScene) return undefined;
    return resolveSceneLandingView(tour, initialScene, noHotspotId);
  }, [initialScene, tour, urlSearchParams]);

  const viewerRef = useRef<PanoramaViewerHandle>(null);
  const viewerAreaRef = useRef<HTMLDivElement>(null);
  const pendingNamingSelectionRef = useRef<{
    sceneId: string;
    hotspotId: string;
  } | null>(null);
  const [activePopup, setActivePopup] = useState<PopupContent | null>(null);
  const [activeNamingHotspotId, setActiveNamingHotspotId] = useState<
    string | null
  >(null);
  const [devClickCoords, setDevClickCoords] = useState<ClickCoords | null>(
    null,
  );
  const [devViewCoords, setDevViewCoords] = useState<ViewPosition | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadBarVisible, setLoadBarVisible] = useState(true);
  const [splashPhase, setSplashPhase] = useState<'active' | 'exit' | 'done'>(
    'active',
  );
  const hideBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitiallyLoadedRef = useRef(false);

  useEffect(() => {
    hasInitiallyLoadedRef.current = false;
    setSplashPhase('active');
    if (!searchParams.errorTest) {
      setPanoramaError(null);
    }
    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
      hideSplashTimerRef.current = null;
    }
  }, [tour.id, searchParams.errorTest]);

  const { controlsVisible, toggleControlsVisible } = useViewerControlsVisible();
  const [viewerOrientation, setViewerOrientation] =
    useState<ViewerOrientation | null>(null);
  const [panoramaError, setPanoramaError] =
    useState<PanoramaLoadErrorInfo | null>(null);

  const handleLoadStart = useCallback(() => {
    if (hideBarTimerRef.current) {
      clearTimeout(hideBarTimerRef.current);
      hideBarTimerRef.current = null;
    }
    setLoadBarVisible(true);
    setLoadProgress(0);
  }, []);

  const handleLoadProgress = useCallback((progress: number) => {
    setLoadBarVisible(true);
    setLoadProgress(progress);
  }, []);

  const handleLoadComplete = useCallback(() => {
    const finishSplash = () => {
      setSplashPhase('exit');
      hideSplashTimerRef.current = setTimeout(() => {
        setSplashPhase('done');
      }, SPLASH_FADE_MS);
    };

    if (hasInitiallyLoadedRef.current) {
      setLoadProgress(100);
      hideBarTimerRef.current = setTimeout(() => {
        setLoadBarVisible(false);
        setLoadProgress(0);
      }, 280);
      return;
    }

    hasInitiallyLoadedRef.current = true;
    setLoadProgress(100);
    setLoadBarVisible(false);

    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
    }

    if (searchParams.splashHold) {
      hideSplashTimerRef.current = setTimeout(finishSplash, DEV_SPLASH_HOLD_MS);
    } else {
      finishSplash();
    }
  }, [searchParams.splashHold]);

  const {
    currentSceneId,
    isTransitioning,
    setIsTransitioning,
    onSceneChange,
    syncSceneFromRoute,
  } = useTourState(initialScene);

  const [transitionTargetSceneId, setTransitionTargetSceneId] = useState<
    string | null
  >(null);

  const prepareSceneNavigate = useCallback(
    (sceneId: string) => {
      if (sceneId !== currentSceneId) {
        setTransitionTargetSceneId(sceneId);
      }
    },
    [currentSceneId],
  );

  const { showBack, showForward, goBack, goForward } = useHistoryNavControls();

  const { syncSceneToUrl } = useTourRouteSync({
    tour,
    currentSceneId,
    isTransitioning,
    viewerRef,
    syncSceneFromRoute,
    prepareSceneNavigate,
    pendingNamingSelectionRef,
  });

  const {
    openNamingOpportunity,
    syncNamingOpportunityToUrl,
    clearNamingOpportunityFromUrl,
  } = useNamingOpportunityUrlSync({
    tour,
    currentSceneId,
    isTransitioning,
    splashDone: splashPhase === 'done',
    viewerRef,
    pendingNamingSelectionRef,
    setActiveNamingHotspotId,
  });

  const handleSceneChange = useCallback(
    (sceneId: string) => {
      onSceneChange(sceneId);
    },
    [onSceneChange],
  );

  const assistant = useTourAssistant(knowledge, currentSceneId);

  const handleSelectNamingOpportunity = useCallback(
    (sceneId: string, hotspotId: string) => {
      const scene = tour.scenes[sceneId];
      const hotspot = scene?.hotspots.find((item) => item.id === hotspotId);
      if (!hotspot?.popup?.namingOpportunity) return;

      openNamingOpportunity(sceneId, hotspotId);
    },
    [openNamingOpportunity, tour.scenes],
  );

  const handleNavigate = useCallback(
    async (sceneId: string, targetView?: ViewPosition) => {
      const pendingNaming = pendingNamingSelectionRef.current;
      const navigatingToPendingNaming =
        pendingNaming !== null && pendingNaming.sceneId === sceneId;

      if (!navigatingToPendingNaming) {
        pendingNamingSelectionRef.current = null;
        setActiveNamingHotspotId(null);
        viewerRef.current?.clearActiveInfoHotspot();
      }

      const scene = tour.scenes[sceneId];
      if (!scene || sceneId === currentSceneId) return;

      prepareSceneNavigate(sceneId);
      handleLoadStart();

      if (!navigatingToPendingNaming) {
        syncSceneToUrl(sceneId, { clearNamingOpportunity: true });
      }

      await viewerRef.current?.navigateToScene(
        sceneId,
        targetView ?? scene.defaultView,
      );
    },
    [
      currentSceneId,
      handleLoadStart,
      prepareSceneNavigate,
      syncSceneToUrl,
      tour.scenes,
    ],
  );

  const handleDismissModalPopups = useCallback(() => {
    pendingNamingSelectionRef.current = null;
    setActivePopup(null);
    setActiveNamingHotspotId(null);
    clearNamingOpportunityFromUrl();
    viewerRef.current?.clearActiveInfoHotspot();
  }, [clearNamingOpportunityFromUrl]);

  const handleActiveInfoHotspotChange = useCallback(
    (hotspotId: string | null) => {
      if (hotspotId !== null) {
        pendingNamingSelectionRef.current = null;
        setActiveNamingHotspotId(hotspotId);

        const scene = tour.scenes[currentSceneId];
        const hotspot = scene?.hotspots.find((item) => item.id === hotspotId);
        if (hotspot?.popup?.namingOpportunity) {
          syncNamingOpportunityToUrl(hotspotId, currentSceneId);
        } else {
          clearNamingOpportunityFromUrl();
        }
        return;
      }

      if (pendingNamingSelectionRef.current) {
        return;
      }

      setActiveNamingHotspotId(null);
      clearNamingOpportunityFromUrl();
    },
    [
      clearNamingOpportunityFromUrl,
      currentSceneId,
      syncNamingOpportunityToUrl,
      tour.scenes,
    ],
  );

  const handleBreadcrumbNavigate = useCallback(
    async (sceneId: string) => {
      if (sceneId === currentSceneId) return;

      pendingNamingSelectionRef.current = null;
      setActiveNamingHotspotId(null);
      viewerRef.current?.clearActiveInfoHotspot();

      prepareSceneNavigate(sceneId);
      handleLoadStart();
      syncSceneToUrl(sceneId, { clearNamingOpportunity: true });

      const scene = tour.scenes[sceneId];
      if (!scene) return;

      await viewerRef.current?.navigateToScene(sceneId, scene.defaultView);
    },
    [
      currentSceneId,
      handleLoadStart,
      prepareSceneNavigate,
      syncSceneToUrl,
      tour.scenes,
    ],
  );

  const handleTransitionStart = useCallback(() => setIsTransitioning(true), []);
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
    setTransitionTargetSceneId(null);
  }, []);

  const loadErrorSceneId = panoramaError?.sceneId ?? currentSceneId;
  const showLoadError = panoramaError !== null || searchParams.errorTest;

  const handlePanoramaError = useCallback(
    (info: PanoramaLoadErrorInfo) => {
      setPanoramaError(info);
      setIsTransitioning(false);
      setTransitionTargetSceneId(null);
    },
    [setIsTransitioning],
  );

  const handlePanoramaRecovered = useCallback(() => {
    if (searchParams.errorTest) return;
    setPanoramaError(null);
  }, [searchParams.errorTest]);

  const handleRetryPanorama = useCallback(async () => {
    const sceneId = panoramaError?.sceneId ?? currentSceneId;
    const ok = await viewerRef.current?.retryScene(sceneId);
    if (!ok && !searchParams.errorTest) return;
    if (!searchParams.errorTest) {
      setPanoramaError(null);
    }
  }, [currentSceneId, panoramaError?.sceneId, searchParams.errorTest]);

  const handlePanoramaGoHome = useCallback(async () => {
    const scene = tour.scenes[tour.firstScene];
    if (!scene) return;
    setPanoramaError(null);
    prepareSceneNavigate(tour.firstScene);
    syncSceneToUrl(tour.firstScene, { clearNamingOpportunity: true });
    await viewerRef.current?.navigateToScene(
      tour.firstScene,
      scene.defaultView,
    );
  }, [prepareSceneNavigate, syncSceneToUrl, tour.firstScene, tour.scenes]);

  const handleViewUpdate = useCallback((view: ViewerOrientation) => {
    setViewerOrientation(view);
  }, []);

  return (
    <div ref={tourRootRef} className='app tour-page'>
      <div ref={viewerAreaRef} className='viewer-area viewer-area--fullscreen'>
        <PanoramaViewer
          key={tour.id}
          ref={viewerRef}
          tour={tour}
          initialSceneId={initialScene}
          fullscreenRootRef={viewerAreaRef}
          controlsVisible={controlsVisible}
          skipLanding={searchParams.skipLanding}
          landingTargetView={landingTargetView}
          splashDone={splashPhase !== 'active'}
          disabled={isTransitioning}
          suppressKeyboard={assistant.isOpen}
          onSceneChange={handleSceneChange}
          onInfoHotspot={setActivePopup}
          onActiveInfoHotspotChange={handleActiveInfoHotspotChange}
          onDismissModalPopups={handleDismissModalPopups}
          onNavigateToScene={handleNavigate}
          onTransitionStart={handleTransitionStart}
          onTransitionEnd={handleTransitionEnd}
          onDevClick={searchParams.dev ? setDevClickCoords : undefined}
          onDevViewUpdate={searchParams.dev ? setDevViewCoords : undefined}
          onViewUpdate={tour.floorPlan ? handleViewUpdate : undefined}
          onLoadStart={handleLoadStart}
          onLoadProgress={handleLoadProgress}
          onLoadComplete={handleLoadComplete}
          onPanoramaError={handlePanoramaError}
          onPanoramaRecovered={handlePanoramaRecovered}
        />

        {showLoadError && (
          <PanoramaLoadError
            sceneTitle={tour.scenes[loadErrorSceneId]?.title}
            canGoHome={currentSceneId !== tour.firstScene}
            onRetry={handleRetryPanorama}
            onGoHome={handlePanoramaGoHome}
          />
        )}

        {searchParams.clientSelector && (
          <ClientSelector
            currentTourId={tour.id}
            currentSceneId={currentSceneId}
            disabled={isTransitioning}
          />
        )}

        {tour.floorPlan && (
          <FloorPlanMinimap
            floorPlan={tour.floorPlan}
            tour={tour}
            currentSceneId={currentSceneId}
            view={viewerOrientation}
            disabled={isTransitioning}
            onSelectScene={handleNavigate}
          />
        )}

        <TourNavFloat
          scenes={scenes}
          tourId={tour.id}
          currentSceneId={currentSceneId}
          firstSceneId={tour.firstScene}
          tourTitle={productFullName}
          organization={tour.organization}
          clientLogo={tour.branding?.logo}
          logoAlt={tour.branding?.logoAlt}
          websiteUrl={getTourWebsite(tour)}
          disabled={isTransitioning}
          breadcrumbHidden={transitionTargetSceneId !== null}
          showHistoryBack={showBack && currentSceneId !== tour.firstScene}
          showHistoryForward={showForward}
          onHistoryBack={goBack}
          onHistoryForward={goForward}
          controlsVisible={controlsVisible}
          onControlsToggle={toggleControlsVisible}
          onSelectScene={handleNavigate}
          onSelectNamingOpportunity={handleSelectNamingOpportunity}
          onBreadcrumbNavigate={handleBreadcrumbNavigate}
          activeNamingHotspotId={activeNamingHotspotId}
        />

        {splashPhase !== 'done' && (
          <TourLoadSplash
            exiting={splashPhase === 'exit'}
            logo={tour.branding?.logo}
            logoAlt={tour.branding?.logoAlt}
            productName={productFullName}
          />
        )}

        <LoadProgressBar progress={loadProgress} visible={loadBarVisible} />

        <AiAssistant
          tour={tour}
          assistant={assistant}
          chatTest={searchParams.chatTest}
        />

        {searchParams.dev && (
          <DevViewPanel
            scene={{
              id: currentSceneId,
              title: tour.scenes[currentSceneId]?.title,
              clientId: tour.clientId ?? tour.id,
              tourId: tour.id,
            }}
            view={devViewCoords}
            clickCoords={devClickCoords}
            aboveMinimap={Boolean(tour.floorPlan)}
          />
        )}
      </div>

      <InfoPopup
        popup={activePopup}
        tour={tour}
        tourTitle={productFullName}
        sceneId={currentSceneId}
        namingHotspotId={activeNamingHotspotId}
        onClose={() => {
          pendingNamingSelectionRef.current = null;
          setActivePopup(null);
          setActiveNamingHotspotId(null);
          clearNamingOpportunityFromUrl();
          viewerRef.current?.clearActiveInfoHotspot();
        }}
      />
    </div>
  );
}
