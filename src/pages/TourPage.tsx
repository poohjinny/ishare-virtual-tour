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
  getTourLoadSplashFadeMs,
} from '../components/TourLoadSplash';
import { FloorPlanMinimap } from '../components/FloorPlanMinimap';
import { TourNavFloat } from '../components/TourNavFloat';
import { TourFirstVisitHint } from '../components/TourFirstVisitHint';
import {
  getSceneList,
  loadKnowledge,
  loadTour,
  listPublicTourIds,
  listTourIds,
  tryLoadKnowledge,
  tryLoadTour,
  DEFAULT_TOUR_ID,
} from '../data/loadTour';
import { getTourWebsite, resolveTourClient } from '../utils/resolveTourClient';
import { resolveExploreDirectoryLead } from '../utils/resolveExploreDirectoryLead';
import { resolveTourBranding } from '../utils/resolveTourBranding';
import { getTourProductFullName } from '../utils/tourProductName';
import { useAppSearchParams } from '../hooks/useAppSearchParams';
import { useTourAssistant } from '../hooks/useTourAssistant';
import { useTourEscapeClose } from '../hooks/useTourEscapeClose';
import { useTourPanelStack } from '../hooks/useTourPanelStack';
import { useTourChromeLayout } from '../hooks/useTourChromeLayout';
import { useTourViewerShortcuts } from '../hooks/useTourViewerShortcuts';
import { useTourRouteSync } from '../hooks/useTourRouteSync';
import { useNamingOpportunityUrlSync } from '../hooks/useNamingOpportunityUrlSync';
import { useTourState } from '../hooks/useTourState';
import { useClientTheme } from '../hooks/useClientTheme';
import { useClientFavicon } from '../hooks/useClientFavicon';
import { useClientFont } from '../hooks/useClientFont';
import { useImmersiveBackground } from '../hooks/useImmersiveBackground';
import { useTourOpenGraph } from '../hooks/useTourOpenGraph';
import { toggleImmersiveBackgroundPlayback } from '../viewer/immersiveBackgroundNavbarButton';
import { useTourFirstVisitHint } from '../hooks/useTourFirstVisitHint';
import { useTourEmbedMessaging } from '../hooks/useTourEmbedMessaging';
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
import {
  normalizeTourAssets,
  bustSceneThumbnailUrls,
} from '../services/normalizeTourAssets';
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
import { resolveTourSceneOpenGraph } from '../utils/tourOpenGraph';

/** Fallback if transitionend does not fire (e.g. reduced motion). */
const SPLASH_UNMOUNT_FALLBACK_PADDING_MS = 150;
/** Extra splash hold for loader UX testing — only when `?splashHold=1` */
const DEV_SPLASH_HOLD_MS = 2000;

/** Satisfies hooks before a real tour is resolved — never rendered as the experience. */
const BOOTSTRAP_TOUR_PLACEHOLDER: Tour = {
  id: '__bootstrap__',
  title: '',
  firstScene: '',
  scenes: {},
};

const BOOTSTRAP_KNOWLEDGE_PLACEHOLDER: TourKnowledge = {
  id: '__bootstrap__',
  url: '',
  global: { facilityName: '', summary: '' },
  scenes: {},
};

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
      const onlyTour = tryLoadTour(ids[0]!);
      if (onlyTour) {
        navigate(
          buildTourLocation(
            onlyTour.id,
            onlyTour.firstScene,
            onlyTour.firstScene,
            urlSearchParams,
          ),
          { replace: true },
        );
      }
      return;
    }

    if (searchParams.embed || searchParams.intro === false) {
      const defaultTour = tryLoadTour(DEFAULT_TOUR_ID);
      if (defaultTour) {
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
    isRootPathWithoutTour(location.pathname) &&
    !tourOrScene &&
    !tourId &&
    listTourIds().length === 0
  ) {
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
  const [devThumbnailVersion, setDevThumbnailVersion] = useState(0);
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
    setDevThumbnailVersion(0);
  }, [route.tourId]);

  useEffect(() => {
    if (!searchParams.dev) return;

    let cancelled = false;
    setDevTourBootstrapStatus('loading');
    void devFetchTour(route.tourId)
      .then((freshTour) => {
        if (cancelled) return;
        const normalized = normalizeTourAssets(freshTour);
        setDevTourSnapshot(normalized);
        setDevTourCache(normalized);
        setDevTourBootstrapStatus('idle');
      })
      .catch(() => {
        if (cancelled) return;
        setDevTourBootstrapStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [route.tourId, searchParams.dev]);

  useEffect(() => {
    if (!searchParams.dev) return;

    let cancelled = false;
    void devFetchKnowledge(route.tourId)
      .then(({ knowledge }) => {
        if (cancelled) return;
        setDevKnowledgeSnapshot(knowledge);
      })
      .catch(() => {
        /* knowledge may not exist yet */
      });

    return () => {
      cancelled = true;
    };
  }, [route.tourId, searchParams.dev]);

  const tour = useMemo(() => {
    let base: Tour | null;
    if (searchParams.dev) {
      if (devTourSnapshot) base = devTourSnapshot;
      else base = staticTour;
    } else {
      base = devTourSnapshot ?? staticTour;
    }

    if (!base) return null;
    if (searchParams.dev && devThumbnailVersion > 0) {
      return bustSceneThumbnailUrls(base, devThumbnailVersion);
    }
    return base;
  }, [devThumbnailVersion, devTourSnapshot, searchParams.dev, staticTour]);
  const knowledge = devKnowledgeSnapshot ?? staticKnowledge;
  const bootstrapTour = useMemo(
    (): Tour =>
      tour ??
      staticTour ??
      tryLoadTour(route.tourId) ??
      tryLoadTour(DEFAULT_TOUR_ID) ??
      BOOTSTRAP_TOUR_PLACEHOLDER,
    [route.tourId, staticTour, tour],
  );
  const bootstrapKnowledge = useMemo(
    (): TourKnowledge =>
      knowledge ??
      staticKnowledge ??
      tryLoadKnowledge(route.tourId) ??
      tryLoadKnowledge(DEFAULT_TOUR_ID) ??
      BOOTSTRAP_KNOWLEDGE_PLACEHOLDER,
    [knowledge, route.tourId, staticKnowledge],
  );
  const productFullName = useMemo(
    () => (tour ? getTourProductFullName(tour) : ''),
    [tour],
  );
  const exploreLead = useMemo(
    () => (tour ? resolveExploreDirectoryLead(tour) : undefined),
    [tour],
  );
  const tourBranding = useMemo(
    () => resolveTourBranding(bootstrapTour),
    [bootstrapTour],
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
  const immersiveBackgroundController = useImmersiveBackground(
    bootstrapTour,
    searchParams.embed,
  );

  const viewerTour = useMemo((): Tour => {
    if (!searchParams.embed || !tour) return bootstrapTour;
    return { ...bootstrapTour, immersiveBackground: undefined };
  }, [bootstrapTour, searchParams.embed, tour]);

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
  const [namingOpportunityBusy, setNamingOpportunityBusy] = useState(false);
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
  const viewerControlsVisible = searchParams.embed ? true : controlsVisible;
  const { isDesktop } = useTourChromeLayout();
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
    const splashUnmountFallbackMs =
      getTourLoadSplashFadeMs(searchParams.embed) +
      SPLASH_UNMOUNT_FALLBACK_PADDING_MS;

    const finishSplash = () => {
      setSplashPhase('exit');
      setSplashRevealReady(true);
      hideSplashTimerRef.current = setTimeout(() => {
        setSplashPhase((phase) => (phase === 'exit' ? 'done' : phase));
      }, splashUnmountFallbackMs);

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
  }, [searchParams.embed, searchParams.skipLanding, searchParams.splashHold]);

  const {
    currentSceneId,
    isTransitioning,
    setIsTransitioning,
    onSceneChange,
    syncSceneFromRoute,
  } = useTourState(initialScene);

  const { showBack, showForward, goBack, goForward } = useHistoryNavControls();

  const { syncSceneToUrl } = useTourRouteSync({
    tour: bootstrapTour,
    currentSceneId,
    isTransitioning,
    viewerRef,
    syncSceneFromRoute,
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

  const openGraphMeta = useMemo(() => {
    if (!tour) return null;

    return resolveTourSceneOpenGraph({
      tour,
      tourTitle: productFullName,
      sceneId: currentSceneId,
      namingHotspotId: activeNamingHotspotId,
      logoPath: tourBranding?.logo,
    });
  }, [
    activeNamingHotspotId,
    currentSceneId,
    productFullName,
    tour,
    tourBranding?.logo,
  ]);

  useTourOpenGraph(openGraphMeta);

  const handleDevTourMutated = useCallback(
    async (options?: DevTourMutateOptions) => {
      const fresh = normalizeTourAssets(await devFetchTour(route.tourId));
      setDevTourSnapshot(fresh);
      setDevTourCache(fresh);
      setDevThumbnailVersion((version) => version + 1);

      const targetSceneId =
        options?.keepCurrentScene ? currentSceneId : (
          (options?.navigateToScene ??
          (fresh.scenes[currentSceneId] ? currentSceneId : fresh.firstScene))
        );

      if (!options?.keepCurrentScene && targetSceneId !== currentSceneId) {
        syncSceneToUrl(targetSceneId, { clearNamingOpportunity: true });
      }

      await viewerRef.current?.applyTourUpdate(fresh);

      if (!options?.keepCurrentScene && targetSceneId !== currentSceneId) {
        await viewerRef.current?.navigateToScene(targetSceneId);
      }

      if (options?.refreshKnowledge) {
        const { knowledge: freshKnowledge } = await devFetchKnowledge(
          route.tourId,
        );
        setDevKnowledgeSnapshot(freshKnowledge);
      }
    },
    [currentSceneId, route.tourId, syncSceneToUrl],
  );

  const handleSceneChange = useCallback(
    (sceneId: string) => {
      onSceneChange(sceneId);
    },
    [onSceneChange],
  );

  const assistant = useTourAssistant(bootstrapKnowledge, currentSceneId);
  const panelStack = useTourPanelStack();

  const closeInfoPopup = useCallback(() => {
    pendingNamingSelectionRef.current = null;
    setActivePopup(null);
    setActiveNamingHotspotId(null);
    clearNamingOpportunityFromUrl();
    viewerRef.current?.clearActiveInfoHotspot();
  }, [clearNamingOpportunityFromUrl]);

  useEffect(() => {
    return panelStack.registerPanel('info-popup', closeInfoPopup);
  }, [closeInfoPopup, panelStack]);

  useEffect(() => {
    if (activePopup) panelStack.openPanel('info-popup');
    else panelStack.closePanel('info-popup');
  }, [activePopup, panelStack]);

  useEffect(() => {
    return panelStack.registerPanel('ai-chat', assistant.close);
  }, [assistant.close, panelStack]);

  useEffect(() => {
    if (assistant.isOpen) panelStack.openPanel('ai-chat');
    else panelStack.closePanel('ai-chat');
  }, [assistant.isOpen, panelStack]);

  useTourEmbedMessaging({
    embed: searchParams.embed,
    tourId: tour?.id ?? route.tourId,
    sceneId: currentSceneId,
    ready: splashRevealReady,
    activeNamingHotspotId,
  });

  useEffect(() => {
    return panelStack.registerPanel('anchored-panel', () => {
      pendingNamingSelectionRef.current = null;
      setActiveNamingHotspotId(null);
      clearNamingOpportunityFromUrl();
      viewerRef.current?.closeAnchoredPanels();
    });
  }, [clearNamingOpportunityFromUrl, panelStack]);

  const handleAnchoredPanelVisibilityChange = useCallback(
    (visible: boolean) => {
      if (visible) panelStack.openPanel('anchored-panel');
      else panelStack.closePanel('anchored-panel');
    },
    [panelStack],
  );

  const handleRecenterToDefaultView = useCallback(() => {
    viewerRef.current?.recenterToDefaultView();
  }, []);

  const handleToggleBackgroundMusic = useCallback(() => {
    if (!immersiveBackgroundController) return;
    toggleImmersiveBackgroundPlayback(immersiveBackgroundController);
  }, [immersiveBackgroundController]);

  useTourEscapeClose(panelStack, { disabled: isTransitioning });
  useTourViewerShortcuts(viewerAreaRef, {
    disabled: isTransitioning,
    onRecenter: handleRecenterToDefaultView,
    onToggleBackgroundMusic:
      immersiveBackgroundController ? handleToggleBackgroundMusic : undefined,
    onToggleToolbar:
      !searchParams.embed && isDesktop ? toggleControlsVisible : undefined,
  });

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

      if (!navigatingToPendingNaming) {
        syncSceneToUrl(sceneId, { clearNamingOpportunity: true });
      }

      await viewerRef.current?.navigateToScene(
        sceneId,
        targetView ?? scene.defaultView,
      );
    },
    [bootstrapTour.scenes, currentSceneId, syncSceneToUrl],
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

      syncSceneToUrl(sceneId, { clearNamingOpportunity: true });

      const scene = bootstrapTour.scenes[sceneId];
      if (!scene) return;

      await viewerRef.current?.navigateToScene(sceneId, scene.defaultView);
    },
    [bootstrapTour.scenes, currentSceneId, syncSceneToUrl],
  );

  const handleTransitionStart = useCallback(() => setIsTransitioning(true), []);
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const loadErrorSceneId = panoramaError?.sceneId ?? currentSceneId;
  const showLoadError =
    panoramaError !== null || searchParams.panoramaErrorTest;

  const handlePanoramaError = useCallback(
    (info: PanoramaLoadErrorInfo) => {
      setPanoramaError(info);
      setIsTransitioning(false);
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
    syncSceneToUrl(bootstrapTour.firstScene, { clearNamingOpportunity: true });
    await viewerRef.current?.navigateToScene(
      bootstrapTour.firstScene,
      scene.defaultView,
    );
  }, [bootstrapTour.firstScene, bootstrapTour.scenes, syncSceneToUrl]);

  const handleViewUpdate = useCallback((view: ViewerOrientation) => {
    setViewerOrientation(view);
  }, []);

  if (!tour || bootstrapTour.id === BOOTSTRAP_TOUR_PLACEHOLDER.id) {
    if (searchParams.dev && devTourBootstrapStatus === 'loading') {
      return (
        <div className='app tour-page flex min-h-full items-center justify-center bg-page'>
          <TourLoadSplash embed={searchParams.embed} />
        </div>
      );
    }

    return (
      <TourNotFound
        requestedTourId={route.requestedTourId ?? route.tourId}
        searchParams={urlSearchParams}
      />
    );
  }

  return (
    <div
      ref={tourRootRef}
      className={
        searchParams.embed ? 'app tour-page tour-page--embed' : 'app tour-page'
      }
    >
      <div ref={viewerAreaRef} className='viewer-area viewer-area--fullscreen'>
        <PanoramaViewer
          key={tour.id}
          ref={viewerRef}
          tour={viewerTour}
          initialSceneId={initialScene}
          fullscreenRootRef={viewerAreaRef}
          controlsVisible={viewerControlsVisible}
          onControlsToggle={
            searchParams.embed ? undefined : toggleControlsVisible
          }
          skipLanding={searchParams.skipLanding}
          landingTargetView={landingTargetView}
          splashDone={splashRevealReady}
          immersiveBackgroundController={immersiveBackgroundController}
          immersiveNavbarAvailable={Boolean(bootstrapTour.immersiveBackground)}
          toolbarToggleAvailable={isDesktop}
          activeNamingHotspotId={activeNamingHotspotId}
          embed={searchParams.embed}
          disabled={isTransitioning}
          onSceneChange={handleSceneChange}
          onInfoHotspot={setActivePopup}
          onActiveInfoHotspotChange={handleActiveInfoHotspotChange}
          onDismissModalPopups={handleDismissModalPopups}
          onAnchoredPanelVisibilityChange={handleAnchoredPanelVisibilityChange}
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
          onNamingOpportunityBusyChange={setNamingOpportunityBusy}
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
          exploreLead={exploreLead}
          client={resolveTourClient(tour)}
          clientLogo={tourBranding?.logo}
          logoAlt={tourBranding?.logoAlt}
          websiteUrl={getTourWebsite(tour)}
          disabled={isTransitioning}
          namingOpportunityBusy={namingOpportunityBusy}
          showHistoryBack={showBack && currentSceneId !== tour.firstScene}
          showHistoryForward={showForward}
          onHistoryBack={goBack}
          onHistoryForward={goForward}
          onSelectScene={handleNavigate}
          onSelectNamingOpportunity={handleSelectNamingOpportunity}
          onBreadcrumbNavigate={handleBreadcrumbNavigate}
          activeNamingHotspotId={activeNamingHotspotId}
          embed={searchParams.embed}
          panelStack={panelStack}
        />

        {splashPhase !== 'done' && (
          <TourLoadSplash
            exiting={splashPhase === 'exit'}
            fadeOverlay={splashOverlayFade}
            embed={searchParams.embed}
            onExitComplete={handleSplashExitComplete}
            logo={tourBranding?.logo}
            logoAlt={tourBranding?.logoAlt}
            productName={productFullName}
          />
        )}

        <LoadProgressBar progress={loadProgress} visible={loadBarVisible} />

        <TourFirstVisitHint visible={hintVisible} />

        <AiAssistant assistant={assistant} chatTest={searchParams.chatTest} />

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
            panelStack={panelStack}
          />
        )}
      </div>

      <InfoPopup
        popup={activePopup}
        tour={tour}
        tourTitle={productFullName}
        sceneId={currentSceneId}
        namingHotspotId={activeNamingHotspotId}
        embed={searchParams.embed}
        onClose={closeInfoPopup}
      />
    </div>
  );
}
