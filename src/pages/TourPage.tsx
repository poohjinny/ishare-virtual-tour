import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { AiAssistant } from '../components/ai/AiAssistant';
import { ClientIntroPicker } from '../components/ClientIntroPicker';
import { DEV_NOT_FOUND_SAMPLE_TOUR_ID } from '../constants/devUrlFlags';
import { DevTools } from '../components/DevTools';
import { InfoPopup } from '../components/InfoPopup';
import { LoadProgressBar } from '../components/LoadProgressBar';
import { PanoramaLoadError } from '../components/PanoramaLoadError';
import { TourNotFound } from '../components/TourNotFound';
import {
  TourLoadSplash,
  TOUR_LOAD_SPLASH_FADE_MS,
} from '../components/TourLoadSplash';
import { FloorPlanMinimap } from '../components/FloorPlanMinimap';
import { TourNavFloat } from '../components/TourNavFloat';
import { TourFirstVisitHint } from '../components/TourFirstVisitHint';
import {
  getSceneList,
  getTourWebsite,
  loadKnowledge,
  loadTour,
  listPublicTourIds,
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
import { useImmersiveBackground } from '../hooks/useImmersiveBackground';
import { useTourFirstVisitHint } from '../hooks/useTourFirstVisitHint';
import type {
  PopupContent,
  Tour,
  TourKnowledge,
  ViewPosition,
  ViewerOrientation,
} from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  devFetchKnowledge,
  devFetchTour,
  type DevTourMutateOptions,
} from '../utils/devTourApi';
import { setDevTourCache } from '../services/devTourCache';
import { normalizeTourAssets } from '../services/normalizeTourAssets';
import {
  resolveSceneId,
  resolveTourRoute,
  buildTourLocation,
  needsClientIntroPick,
  isRootPathWithoutTour,
  NAMING_OPPORTUNITY_SEARCH_KEY,
  resolveNamingOpportunityFromSearch,
} from '../utils/tourPaths';
import { resolveSceneLandingView } from '../utils/tourDirectory';
import { useHistoryNavControls } from '../hooks/useHistoryNavControls';
import { useViewerControlsVisible } from '../hooks/useViewerControlsVisible';
import {
  PanoramaViewer,
  type PanoramaLoadErrorInfo,
  type PanoramaViewerHandle,
} from '../viewer/PanoramaViewer';
import { resetLandingTransitionState } from '../viewer/landingTransition';

/** Fallback if transitionend does not fire (e.g. reduced motion). */
const SPLASH_UNMOUNT_FALLBACK_MS = TOUR_LOAD_SPLASH_FADE_MS + 150;
/** Extra splash hold for loader UX testing — only when `?splashHold=1` */
const DEV_SPLASH_HOLD_MS = 2000;

export function TourPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [urlSearchParams] = useSearchParams();
  const searchParams = useAppSearchParams();
  const {
    tourOrScene,
    tourId,
    sceneId: sceneParam,
  } = useParams<{ tourOrScene?: string; tourId?: string; sceneId?: string }>();

  const route = useMemo(
    () => resolveTourRoute(tourOrScene ?? tourId, sceneParam),
    [sceneParam, tourId, tourOrScene],
  );

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

    const ids = listPublicTourIds();
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

  if (searchParams.notFoundTest) {
    const requestedTourId =
      route.routeError === 'unknown_tour' && route.requestedTourId ?
        route.requestedTourId
      : DEV_NOT_FOUND_SAMPLE_TOUR_ID;

    return (
      <TourNotFound
        requestedTourId={requestedTourId}
        searchParams={urlSearchParams}
      />
    );
  }

  if (showClientIntro) {
    return <ClientIntroPicker searchParams={urlSearchParams} />;
  }

  if (
    route.routeError === 'unknown_tour' &&
    route.requestedTourId &&
    !searchParams.dev
  ) {
    return (
      <TourNotFound
        requestedTourId={route.requestedTourId}
        searchParams={urlSearchParams}
      />
    );
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

  const staticTour = useMemo(() => {
    try {
      return loadTour(route.tourId);
    } catch {
      return null;
    }
  }, [route.tourId]);
  const [devTourSnapshot, setDevTourSnapshot] = useState<Tour | null>(null);
  const [devTourBootstrapStatus, setDevTourBootstrapStatus] = useState<
    'idle' | 'loading' | 'error'
  >('idle');
  const staticKnowledge = useMemo(() => {
    try {
      return loadKnowledge(route.tourId);
    } catch {
      return null;
    }
  }, [route.tourId]);
  const [devKnowledgeSnapshot, setDevKnowledgeSnapshot] =
    useState<TourKnowledge | null>(null);

  useEffect(() => {
    setDevTourSnapshot(null);
    setDevKnowledgeSnapshot(null);
    setDevTourBootstrapStatus('idle');
  }, [route.tourId]);

  useEffect(() => {
    if (staticTour || devTourSnapshot || !searchParams.dev) return;

    setDevTourBootstrapStatus('loading');
    void devFetchTour(route.tourId)
      .then((freshTour) => {
        const normalized = normalizeTourAssets(freshTour);
        setDevTourSnapshot(normalized);
        setDevTourCache(normalized);
        setDevTourBootstrapStatus('idle');
      })
      .catch(() => {
        setDevTourBootstrapStatus('error');
      });
  }, [devTourSnapshot, route.tourId, searchParams.dev, staticTour]);

  useEffect(() => {
    if (staticKnowledge || devKnowledgeSnapshot || !searchParams.dev) return;
    if (!devTourSnapshot && !staticTour) return;

    void devFetchKnowledge(route.tourId)
      .then(({ knowledge }) => {
        setDevKnowledgeSnapshot(knowledge);
      })
      .catch(() => {
        /* knowledge may not exist yet */
      });
  }, [
    devKnowledgeSnapshot,
    devTourSnapshot,
    route.tourId,
    searchParams.dev,
    staticKnowledge,
    staticTour,
  ]);

  const tour = devTourSnapshot ?? staticTour;
  const knowledge = devKnowledgeSnapshot ?? staticKnowledge;
  const bootstrapTour = tour ?? loadTour(DEFAULT_TOUR_ID);
  const bootstrapKnowledge = knowledge ?? loadKnowledge(DEFAULT_TOUR_ID);
  const productFullName = useMemo(
    () => (tour ? getTourProductFullName(tour) : ''),
    [tour],
  );
  const scenes = useMemo(() => (tour ? getSceneList(tour) : []), [tour]);
  const devSceneOptions = useMemo(
    () => scenes.map((scene) => ({ id: scene.id, title: scene.title })),
    [scenes],
  );
  const tourRootRef = useRef<HTMLDivElement>(null);

  useClientTheme(bootstrapTour);
  useClientFavicon(bootstrapTour);
  useClientFont(bootstrapTour, tourRootRef);
  const immersiveBackgroundController = useImmersiveBackground(bootstrapTour);

  useEffect(() => {
    document.title = productFullName;
  }, [productFullName]);

  const initialScene = useMemo(() => {
    if (tour) {
      return resolveSceneId(route.tourId, route.sceneId);
    }
    return route.sceneId ?? bootstrapTour.firstScene;
  }, [bootstrapTour.firstScene, route.sceneId, route.tourId, tour]);

  const landingTargetView = useMemo(() => {
    if (!tour) return undefined;
    const noSearchValue = urlSearchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY);
    if (!noSearchValue) return undefined;
    const resolved = resolveNamingOpportunityFromSearch(tour, noSearchValue);
    if (!resolved || resolved.sceneId !== initialScene) return undefined;
    return resolveSceneLandingView(tour, initialScene, resolved.hotspotId);
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
  const [splashRevealReady, setSplashRevealReady] = useState(false);
  const [splashOverlayFade, setSplashOverlayFade] = useState(false);
  const hideBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitiallyLoadedRef = useRef(false);

  useEffect(() => {
    hasInitiallyLoadedRef.current = false;
    setSplashPhase('active');
    setSplashRevealReady(false);
    setSplashOverlayFade(false);
    resetLandingTransitionState();
    if (!searchParams.panoramaErrorTest) {
      setPanoramaError(null);
    }
    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
      hideSplashTimerRef.current = null;
    }
  }, [route.tourId, searchParams.panoramaErrorTest, searchParams.skipLanding]);

  const { controlsVisible, toggleControlsVisible } = useViewerControlsVisible();
  const { hintVisible, onInitialTourReveal, onFirstPanoramaInteract } =
    useTourFirstVisitHint({
      embed: searchParams.embed,
      dev: searchParams.dev,
      firstVisitHint: searchParams.firstVisitHint,
    });
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

  const handleLandingStart = useCallback(() => {
    setSplashOverlayFade(true);
  }, []);

  const handleSplashExitComplete = useCallback(() => {
    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
      hideSplashTimerRef.current = null;
    }
    setSplashPhase('done');
  }, []);

  const handleLoadComplete = useCallback(() => {
    const finishSplash = () => {
      setSplashPhase('exit');
      setSplashRevealReady(true);
      hideSplashTimerRef.current = setTimeout(() => {
        setSplashPhase((phase) => (phase === 'exit' ? 'done' : phase));
      }, SPLASH_UNMOUNT_FALLBACK_MS);

      if (searchParams.skipLanding) {
        requestAnimationFrame(() => setSplashOverlayFade(true));
      }
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
  }, [searchParams.skipLanding, searchParams.splashHold]);

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
    tour: bootstrapTour,
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
    tour: bootstrapTour,
    currentSceneId,
    isTransitioning,
    splashDone: splashPhase === 'done',
    viewerRef,
    pendingNamingSelectionRef,
    setActiveNamingHotspotId,
  });

  const handleDevTourMutated = useCallback(
    async (options?: DevTourMutateOptions) => {
      const fresh = normalizeTourAssets(await devFetchTour(route.tourId));
      setDevTourSnapshot(fresh);
      setDevTourCache(fresh);

      const targetSceneId =
        options?.navigateToScene ??
        (fresh.scenes[currentSceneId] ? currentSceneId : fresh.firstScene);

      if (targetSceneId !== currentSceneId) {
        syncSceneToUrl(targetSceneId, { clearNamingOpportunity: true });
        prepareSceneNavigate(targetSceneId);
      }

      await viewerRef.current?.applyTourUpdate(fresh);

      if (targetSceneId !== currentSceneId) {
        await viewerRef.current?.navigateToScene(targetSceneId);
      }

      if (options?.refreshKnowledge) {
        const { knowledge: freshKnowledge } = await devFetchKnowledge(
          route.tourId,
        );
        setDevKnowledgeSnapshot(freshKnowledge);
      }
    },
    [currentSceneId, prepareSceneNavigate, route.tourId, syncSceneToUrl],
  );

  const handleSceneChange = useCallback(
    (sceneId: string) => {
      onSceneChange(sceneId);
    },
    [onSceneChange],
  );

  const assistant = useTourAssistant(bootstrapKnowledge, currentSceneId);

  const handleSelectNamingOpportunity = useCallback(
    (sceneId: string, hotspotId: string) => {
      const scene = bootstrapTour.scenes[sceneId];
      const hotspot = scene?.hotspots.find((item) => item.id === hotspotId);
      if (!hotspot?.popup?.namingOpportunity) return;

      openNamingOpportunity(sceneId, hotspotId);
    },
    [bootstrapTour.scenes, openNamingOpportunity],
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

      const scene = bootstrapTour.scenes[sceneId];
      if (!scene || sceneId === currentSceneId) return;

      prepareSceneNavigate(sceneId);

      if (!navigatingToPendingNaming) {
        syncSceneToUrl(sceneId, { clearNamingOpportunity: true });
      }

      await viewerRef.current?.navigateToScene(
        sceneId,
        targetView ?? scene.defaultView,
      );
    },
    [
      bootstrapTour.scenes,
      currentSceneId,
      prepareSceneNavigate,
      syncSceneToUrl,
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

        const scene = bootstrapTour.scenes[currentSceneId];
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
      bootstrapTour.scenes,
      clearNamingOpportunityFromUrl,
      currentSceneId,
      syncNamingOpportunityToUrl,
    ],
  );

  const handleBreadcrumbNavigate = useCallback(
    async (sceneId: string) => {
      if (sceneId === currentSceneId) return;

      pendingNamingSelectionRef.current = null;
      setActiveNamingHotspotId(null);
      viewerRef.current?.clearActiveInfoHotspot();

      prepareSceneNavigate(sceneId);
      syncSceneToUrl(sceneId, { clearNamingOpportunity: true });

      const scene = bootstrapTour.scenes[sceneId];
      if (!scene) return;

      await viewerRef.current?.navigateToScene(sceneId, scene.defaultView);
    },
    [
      bootstrapTour.scenes,
      currentSceneId,
      prepareSceneNavigate,
      syncSceneToUrl,
    ],
  );

  const handleTransitionStart = useCallback(() => setIsTransitioning(true), []);
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
    setTransitionTargetSceneId(null);
  }, []);

  const loadErrorSceneId = panoramaError?.sceneId ?? currentSceneId;
  const showLoadError =
    panoramaError !== null || searchParams.panoramaErrorTest;

  const handlePanoramaError = useCallback(
    (info: PanoramaLoadErrorInfo) => {
      setPanoramaError(info);
      setIsTransitioning(false);
      setTransitionTargetSceneId(null);
    },
    [setIsTransitioning],
  );

  const handlePanoramaRecovered = useCallback(() => {
    if (searchParams.panoramaErrorTest) return;
    setPanoramaError(null);
  }, [searchParams.panoramaErrorTest]);

  const handleRetryPanorama = useCallback(async () => {
    const sceneId = panoramaError?.sceneId ?? currentSceneId;
    const ok = await viewerRef.current?.retryScene(sceneId);
    if (!ok && !searchParams.panoramaErrorTest) return;
    if (!searchParams.panoramaErrorTest) {
      setPanoramaError(null);
    }
  }, [currentSceneId, panoramaError?.sceneId, searchParams.panoramaErrorTest]);

  const handlePanoramaGoHome = useCallback(async () => {
    const scene = bootstrapTour.scenes[bootstrapTour.firstScene];
    if (!scene) return;
    setPanoramaError(null);
    prepareSceneNavigate(bootstrapTour.firstScene);
    syncSceneToUrl(bootstrapTour.firstScene, { clearNamingOpportunity: true });
    await viewerRef.current?.navigateToScene(
      bootstrapTour.firstScene,
      scene.defaultView,
    );
  }, [
    bootstrapTour.firstScene,
    bootstrapTour.scenes,
    prepareSceneNavigate,
    syncSceneToUrl,
  ]);

  const handleViewUpdate = useCallback((view: ViewerOrientation) => {
    setViewerOrientation(view);
  }, []);

  if (!tour) {
    if (devTourBootstrapStatus === 'loading') {
      return null;
    }

    return (
      <TourNotFound
        requestedTourId={route.requestedTourId ?? route.tourId}
        searchParams={urlSearchParams}
      />
    );
  }

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
          splashDone={splashRevealReady}
          immersiveBackgroundController={immersiveBackgroundController}
          activeNamingHotspotId={activeNamingHotspotId}
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
          onLandingStart={handleLandingStart}
          onInitialTourReveal={onInitialTourReveal}
          onFirstPanoramaInteract={onFirstPanoramaInteract}
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
            fadeOverlay={splashOverlayFade}
            onExitComplete={handleSplashExitComplete}
            logo={tour.branding?.logo}
            logoAlt={tour.branding?.logoAlt}
            productName={productFullName}
          />
        )}

        <LoadProgressBar progress={loadProgress} visible={loadBarVisible} />

        <TourFirstVisitHint visible={hintVisible} />

        <AiAssistant
          tour={tour}
          assistant={assistant}
          chatTest={searchParams.chatTest}
        />

        {searchParams.dev && (
          <DevTools
            tour={tour}
            onTourMutated={handleDevTourMutated}
            scene={{
              id: currentSceneId,
              title: tour.scenes[currentSceneId]?.title,
              clientId: tour.clientId ?? tour.id,
              tourId: tour.id,
            }}
            currentSceneId={currentSceneId}
            sceneOptions={devSceneOptions}
            view={devViewCoords}
            clickCoords={devClickCoords}
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
