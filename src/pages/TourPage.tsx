import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AiAssistant } from '../components/ai/AiAssistant';
import { ClientSelector } from '../components/ClientSelector';
import { DevViewPanel } from '../components/DevViewPanel';
import { InfoPopup } from '../components/InfoPopup';
import { LoadProgressBar } from '../components/LoadProgressBar';
import { PanoramaLoadError } from '../components/PanoramaLoadError';
import { TourLoadSplash } from '../components/TourLoadSplash';
import { TourNavFloat } from '../components/TourNavFloat';
import {
  getSceneList,
  getTourWebsite,
  loadKnowledge,
  loadTour,
} from '../data/loadTour';
import { useAppSearchParams } from '../hooks/useAppSearchParams';
import { useTourAssistant } from '../hooks/useTourAssistant';
import { useTourRouteSync } from '../hooks/useTourRouteSync';
import { useTourState } from '../hooks/useTourState';
import { useClientTheme } from '../hooks/useClientTheme';
import type { PopupContent, ViewPosition } from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import { resolveSceneId, resolveTourRoute } from '../utils/tourPaths';
import {
  PanoramaViewer,
  type PanoramaLoadErrorInfo,
  type PanoramaViewerHandle,
} from '../viewer/PanoramaViewer';

const SPLASH_FADE_MS = 350;
/** Extra splash hold for loader UX testing — only when `?dev=1` */
const DEV_SPLASH_HOLD_MS = 2000;

export function TourPage() {
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

  const tour = useMemo(() => loadTour(route.tourId), [route.tourId]);
  const knowledge = useMemo(() => loadKnowledge(route.tourId), [route.tourId]);
  const scenes = useMemo(() => getSceneList(tour), [tour]);

  useClientTheme(tour);

  const initialScene = useMemo(
    () => resolveSceneId(route.tourId, route.sceneId),
    [route.sceneId, route.tourId],
  );

  const viewerRef = useRef<PanoramaViewerHandle>(null);
  const [activePopup, setActivePopup] = useState<PopupContent | null>(null);
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

  const [controlsVisible, setControlsVisible] = useState(false);
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

    if (searchParams.dev) {
      hideSplashTimerRef.current = setTimeout(finishSplash, DEV_SPLASH_HOLD_MS);
    } else {
      finishSplash();
    }
  }, [searchParams.dev]);

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

  const { syncSceneToUrl } = useTourRouteSync({
    tour,
    currentSceneId,
    isTransitioning,
    viewerRef,
    syncSceneFromRoute,
    prepareSceneNavigate,
  });

  const handleSceneChange = useCallback(
    (sceneId: string) => {
      onSceneChange(sceneId);
      syncSceneToUrl(sceneId);
    },
    [onSceneChange, syncSceneToUrl],
  );

  const assistant = useTourAssistant(knowledge, currentSceneId);

  const handleNavigate = useCallback(
    async (sceneId: string, targetView?: ViewPosition) => {
      const scene = tour.scenes[sceneId];
      if (!scene || sceneId === currentSceneId) return;

      prepareSceneNavigate(sceneId);
      handleLoadStart();
      syncSceneToUrl(sceneId);

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

  const handleBreadcrumbNavigate = useCallback(
    async (sceneId: string) => {
      if (sceneId === currentSceneId) return;
      prepareSceneNavigate(sceneId);
      handleLoadStart();
      syncSceneToUrl(sceneId);
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
    syncSceneToUrl(tour.firstScene);
    await viewerRef.current?.navigateToScene(
      tour.firstScene,
      scene.defaultView,
    );
  }, [prepareSceneNavigate, syncSceneToUrl, tour.firstScene, tour.scenes]);

  return (
    <div className='app'>
      <div className='viewer-area viewer-area--fullscreen'>
        <PanoramaViewer
          key={tour.id}
          ref={viewerRef}
          tour={tour}
          initialSceneId={initialScene}
          controlsVisible={controlsVisible}
          devMode={searchParams.dev}
          splashDone={splashPhase !== 'active'}
          disabled={isTransitioning}
          suppressKeyboard={assistant.isOpen}
          onSceneChange={handleSceneChange}
          onInfoHotspot={setActivePopup}
          onNavigateToScene={handleNavigate}
          onTransitionStart={handleTransitionStart}
          onTransitionEnd={handleTransitionEnd}
          onDevClick={setDevClickCoords}
          onDevViewUpdate={setDevViewCoords}
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

        <ClientSelector
          currentTourId={tour.id}
          currentSceneId={currentSceneId}
          disabled={isTransitioning}
        />

        <TourNavFloat
          scenes={scenes}
          currentSceneId={currentSceneId}
          firstSceneId={tour.firstScene}
          tourTitle={tour.title}
          clientLogo={tour.branding?.logo}
          logoAlt={tour.branding?.logoAlt}
          websiteUrl={getTourWebsite(tour)}
          disabled={isTransitioning}
          breadcrumbHidden={transitionTargetSceneId !== null}
          controlsVisible={controlsVisible}
          onControlsToggle={() => setControlsVisible((visible) => !visible)}
          onSelectScene={handleNavigate}
          onBreadcrumbNavigate={handleBreadcrumbNavigate}
        />

        {splashPhase !== 'done' && (
          <TourLoadSplash exiting={splashPhase === 'exit'} />
        )}

        <LoadProgressBar
          progress={loadProgress}
          visible={loadBarVisible || isTransitioning}
        />

        <AiAssistant assistant={assistant} chatTest={searchParams.chatTest} />

        {searchParams.dev && (
          <DevViewPanel
            scene={{
              id: currentSceneId,
              title: tour.scenes[currentSceneId]?.title,
              clientId: tour.id,
            }}
            view={devViewCoords}
            clickCoords={devClickCoords}
          />
        )}
      </div>

      <InfoPopup
        popup={activePopup}
        onClose={() => {
          setActivePopup(null);
          viewerRef.current?.clearActiveInfoHotspot();
        }}
      />
    </div>
  );
}
