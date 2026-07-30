import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { AiAssistant } from '../components/ai/AiAssistant';
import { isAskGuideEnabled } from '../constants/branding';
import { ClientIntroPicker } from '../components/ClientIntroPicker';
import { DEV_NOT_FOUND_SAMPLE_TOUR_ID } from '../constants/devUrlFlags';
import { DevTools } from '../components/DevTools';
import { InfoPopup } from '../components/InfoPopup';
import { LoadProgressBar } from '../components/LoadProgressBar';
import { ViewerLoadError } from '../components/ViewerLoadError';
import { TourNotFound } from '../components/TourNotFound';
import {
  TourLoadSplash,
  getTourLoadSplashFadeMs,
} from '../components/TourLoadSplash';
import { TourNavFloat } from '../components/TourNavFloat';
import { TourViewerControlsToggleFab } from '../components/TourViewerControlsToggleFab';
import { TourFirstVisitHint } from '../components/TourFirstVisitHint';
import { usePlayTour } from '../hooks/usePlayTour';
import {
  loadTour,
  listPublicTourIds,
  listTourIds,
  tryLoadTour,
  DEFAULT_TOUR_ID,
} from '../data/loadTour';
import { getTourWebsite, resolveTourClient } from '../utils/resolveTourClient';
import { resolveExploreDirectoryLead } from '../utils/resolveExploreDirectoryLead';
import { resolveTourBranding } from '../utils/resolveTourBranding';
import { getTourProductFullName } from '../utils/tourProductName';
import {
  listExploreScenes,
  resolveRoutableSceneId,
  isSceneRoutable,
} from '../utils/sceneVisibility';
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
import {
  ensureImmersiveBackgroundPlaying,
  ensureImmersiveBackgroundPaused,
  toggleImmersiveBackgroundPlayback,
} from '../viewer/immersiveBackgroundNavbarButton';
import { useTourFirstVisitHint } from '../hooks/useTourFirstVisitHint';
import { useTourEmbedMessaging } from '../hooks/useTourEmbedMessaging';
import { useTourFullscreen } from '../hooks/useTourFullscreen';
import type { PopupContent, Tour, ViewPosition } from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import { devFetchTour, type DevTourMutateOptions } from '../utils/devTourApi';
import { setDevTourCache } from '../services/devTourCache';
import {
  normalizeTourAssets,
  bustSceneThumbnailUrls,
} from '../services/normalizeTourAssets';
import {
  resolveTourRoute,
  buildTourLocation,
  needsClientIntroPick,
  isRootPathWithoutTour,
  NAMING_OPPORTUNITY_SEARCH_KEY,
  resolveNamingOpportunityFromSearch,
} from '../utils/tourPaths';
import { resolveSceneLandingView } from '../utils/tourDirectory';
import {
  findHotspotInTour,
  findNamingHotspotInTour,
} from '../utils/findTourHotspot';
import {
  isNamingHotspot,
  resolveNamingPopup,
} from '../utils/namingSceneInherit';
import { stripNamingOpportunitySuffix } from '../data/namingOpportunityStatus';
import { useHistoryNavControls } from '../hooks/useHistoryNavControls';
import { useViewerControlsVisible } from '../hooks/useViewerControlsVisible';
import type { TourViewerHandle } from '../viewer/viewerHandle';
import type { ViewerLoadErrorInfo } from '../viewer/viewerHandle';
import { resolveNamingOpportunityView } from '../viewer/pendingNamingInfoHotspot';

const PanoramaViewer = lazy(() =>
  import('../viewer/PanoramaViewer').then((m) => ({
    default: m.PanoramaViewer,
  })),
);
const ThreeDViewer = lazy(() => import('../viewer-3d/ThreeDViewer'));
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
  /** Keeps DevTools mounted across ?dev=1 tour switches while the next tour loads. */
  const heldDevTourRef = useRef<Tour | null>(null);

  useEffect(() => {
    // Keep the previous snapshot until the matching tour arrives so the shell
    // can hold UI. Resolution below ignores mismatched snapshot ids.
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

  const resolvedTour = useMemo(() => {
    const matchedSnapshot =
      devTourSnapshot && devTourSnapshot.id === route.tourId ?
        devTourSnapshot
      : null;
    const base = matchedSnapshot ?? staticTour;
    if (!base) return null;
    if (searchParams.dev && devThumbnailVersion > 0) {
      return bustSceneThumbnailUrls(base, devThumbnailVersion);
    }
    return base;
  }, [
    devThumbnailVersion,
    devTourSnapshot,
    route.tourId,
    searchParams.dev,
    staticTour,
  ]);

  if (resolvedTour) {
    heldDevTourRef.current = resolvedTour;
  }

  const awaitingDevTour =
    searchParams.dev &&
    devTourBootstrapStatus === 'loading' &&
    (!resolvedTour || resolvedTour.id !== route.tourId);

  /** Prefer the route tour; while switching under ?dev=1, keep the last one. */
  const tour =
    resolvedTour ?? (awaitingDevTour ? heldDevTourRef.current : null);
  const bootstrapTour = useMemo(
    (): Tour =>
      tour ??
      staticTour ??
      tryLoadTour(route.tourId) ??
      tryLoadTour(DEFAULT_TOUR_ID) ??
      BOOTSTRAP_TOUR_PLACEHOLDER,
    [route.tourId, staticTour, tour],
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
  const scenes = useMemo(() => (tour ? listExploreScenes(tour) : []), [tour]);
  const devSceneOptions = useMemo(
    () =>
      tour ?
        Object.values(tour.scenes).map((scene) => ({
          id: scene.id,
          title: scene.title,
        }))
      : [],
    [tour],
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

  const sceneAudience = useMemo(
    () => ({ dev: Boolean(searchParams.dev) }),
    [searchParams.dev],
  );

  const initialScene = useMemo(() => {
    if (tour) {
      return resolveRoutableSceneId(tour, route.sceneId, sceneAudience);
    }
    return route.sceneId ?? bootstrapTour.firstScene;
  }, [bootstrapTour.firstScene, route.sceneId, sceneAudience, tour]);

  const landingNamingHotspotId = useMemo(() => {
    if (!tour) return null;
    const noSearchValue = urlSearchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY);
    if (!noSearchValue) return null;
    const resolved = resolveNamingOpportunityFromSearch(
      tour,
      noSearchValue,
      sceneAudience,
    );
    if (!resolved || resolved.sceneId !== initialScene) return null;
    return resolved.hotspotId;
  }, [initialScene, sceneAudience, tour, urlSearchParams]);

  const landingTargetView = useMemo(() => {
    if (!tour || !landingNamingHotspotId) return undefined;
    return resolveSceneLandingView(tour, initialScene, landingNamingHotspotId);
  }, [initialScene, landingNamingHotspotId, tour]);

  const viewerRef = useRef<TourViewerHandle>(null);
  const viewerAreaRef = useRef<HTMLDivElement>(null);
  const { active: viewerFullscreen, toggle: toggleViewerFullscreen } =
    useTourFullscreen(viewerAreaRef);
  const pendingNamingSelectionRef = useRef<{
    sceneId: string;
    hotspotId: string;
  } | null>(null);
  const [activePopup, setActivePopup] = useState<PopupContent | null>(null);
  const [activeNamingHotspotId, setActiveNamingHotspotId] = useState<
    string | null
  >(null);
  const [namingOpportunityBusy, setNamingOpportunityBusy] = useState(false);
  const [chromeDockOpen, setChromeDockOpen] = useState(false);
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
  const pendingLoadsRef = useRef(0);

  useEffect(() => {
    hasInitiallyLoadedRef.current = false;
    pendingLoadsRef.current = 0;
    setLoadProgress(0);
    setLoadBarVisible(true);
    setSplashPhase('active');
    setSplashRevealReady(false);
    setSplashOverlayFade(false);
    resetLandingTransitionState();
    if (!searchParams.loadErrorTest) {
      setViewerLoadError(null);
    }
    if (hideBarTimerRef.current) {
      clearTimeout(hideBarTimerRef.current);
      hideBarTimerRef.current = null;
    }
    if (hideSplashTimerRef.current) {
      clearTimeout(hideSplashTimerRef.current);
      hideSplashTimerRef.current = null;
    }
  }, [route.tourId, searchParams.loadErrorTest, searchParams.skipLanding]);

  const { controlsVisible, toggleControlsVisible } = useViewerControlsVisible();
  const viewerControlsVisible = searchParams.embed ? true : controlsVisible;
  const { isDesktop } = useTourChromeLayout();
  const { hintVisible, onInitialTourReveal, onFirstPanoramaInteract } =
    useTourFirstVisitHint({
      embed: searchParams.embed,
      dev: searchParams.dev,
      firstVisitHint: searchParams.firstVisitHint,
    });
  const [viewerLoadError, setViewerLoadError] =
    useState<ViewerLoadErrorInfo | null>(null);

  const handleLoadStart = useCallback(() => {
    pendingLoadsRef.current += 1;
    if (hideBarTimerRef.current) {
      clearTimeout(hideBarTimerRef.current);
      hideBarTimerRef.current = null;
    }
    setLoadBarVisible(true);
    setLoadProgress(0);
    setDevViewCoords(null);
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
    pendingLoadsRef.current = Math.max(0, pendingLoadsRef.current - 1);
    if (pendingLoadsRef.current > 0) return;

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
  }, [
    searchParams.embed,
    searchParams.skipLanding,
    searchParams.splashHold,
    bootstrapTour.viewerType,
  ]);

  const {
    currentSceneId,
    isTransitioning,
    setIsTransitioning,
    onSceneChange,
    syncSceneFromRoute,
  } = useTourState(initialScene);

  const transitioningRef = useRef(false);
  const playTourSuppressRouteNavRef = useRef(false);

  const { showBack, showForward, goBack, goForward } = useHistoryNavControls();

  const { syncSceneToUrl } = useTourRouteSync({
    tour: bootstrapTour,
    currentSceneId,
    isTransitioning,
    transitioningRef,
    suppressViewerNavRef: playTourSuppressRouteNavRef,
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
    audience: sceneAudience,
    viewerRef,
    pendingNamingSelectionRef,
    setActiveNamingHotspotId,
  });

  const prepareForPlayNav = useCallback(() => {
    pendingNamingSelectionRef.current = null;
    setActiveNamingHotspotId(null);
    clearNamingOpportunityFromUrl();
    viewerRef.current?.clearActiveInfoHotspot();
    viewerRef.current?.closeAnchoredPanels();
  }, [clearNamingOpportunityFromUrl]);

  const handlePlayTourStart = useCallback(() => {
    if (!immersiveBackgroundController) return;
    ensureImmersiveBackgroundPlaying(immersiveBackgroundController);
  }, [immersiveBackgroundController]);

  const handlePlayTourPause = useCallback(() => {
    if (!immersiveBackgroundController) return;
    ensureImmersiveBackgroundPaused(immersiveBackgroundController);
  }, [immersiveBackgroundController]);

  const {
    enabled: playTourEnabled,
    phase: playTourPhase,
    toggle: togglePlayTour,
    pauseForManualNav,
  } = usePlayTour({
    tour:
      bootstrapTour.id === BOOTSTRAP_TOUR_PLACEHOLDER.id ? null : bootstrapTour,
    currentSceneId,
    viewerRef,
    suppressRouteViewerNavRef: playTourSuppressRouteNavRef,
    onPlayStart: handlePlayTourStart,
    onPlayPause: handlePlayTourPause,
    prepareForPlayNav,
    syncSceneToUrl,
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
      const nextMediaVersion = devThumbnailVersion + 1;
      const bustedFresh = bustSceneThumbnailUrls(fresh, nextMediaVersion, {
        bustPanorama: options?.bustPanorama,
      });
      setDevTourSnapshot(fresh);
      setDevTourCache(fresh);
      setDevThumbnailVersion(nextMediaVersion);

      const targetSceneId =
        options?.keepCurrentScene ? currentSceneId : (
          (options?.navigateToScene ??
          (fresh.scenes[currentSceneId] ? currentSceneId : fresh.firstScene))
        );

      const shouldNavigate =
        !options?.keepCurrentScene && targetSceneId !== currentSceneId;

      await viewerRef.current?.applyTourUpdate(bustedFresh);

      if (shouldNavigate) {
        const targetView = fresh.scenes[targetSceneId]?.defaultView;
        syncSceneToUrl(targetSceneId, { clearNamingOpportunity: true });
        await viewerRef.current?.navigateToScene(targetSceneId, targetView);
      }
    },
    [currentSceneId, devThumbnailVersion, route.tourId, syncSceneToUrl],
  );

  const handleSceneChange = useCallback(
    (sceneId: string) => {
      onSceneChange(sceneId);
    },
    [onSceneChange],
  );

  const assistantLiveContext = useMemo(() => {
    if (!activeNamingHotspotId) return undefined;
    const found = findHotspotInTour(bootstrapTour, activeNamingHotspotId);
    if (!found?.hotspot || !isNamingHotspot(found.hotspot)) return undefined;

    const sceneId = found.sceneId ?? currentSceneId;
    const scene = bootstrapTour.scenes[sceneId];
    const namingName =
      scene ?
        stripNamingOpportunitySuffix(
          resolveNamingPopup(bootstrapTour, found.hotspot, scene)
            ?.namingOpportunity?.name ?? '',
        ) || undefined
      : undefined;

    return { namingHotspotId: activeNamingHotspotId, namingName };
  }, [activeNamingHotspotId, bootstrapTour, currentSceneId]);

  const assistant = useTourAssistant(
    bootstrapTour,
    currentSceneId,
    assistantLiveContext,
  );
  const showAskGuide = isAskGuideEnabled(searchParams.askGuide);
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
    if (!showAskGuide) return;
    return panelStack.registerPanel('ai-chat', assistant.close);
  }, [assistant.close, panelStack, showAskGuide]);

  useEffect(() => {
    if (!showAskGuide) return;
    if (assistant.isOpen) panelStack.openPanel('ai-chat');
    else panelStack.closePanel('ai-chat');
  }, [assistant.isOpen, panelStack, showAskGuide]);

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

  // "Visit" on the current place — clear any open NO and reset to the bare
  // scene default (unlike the recenter shortcut, which keeps an active NO).
  const handleVisitCurrentScene = useCallback(() => {
    pauseForManualNav();
    pendingNamingSelectionRef.current = null;
    setActiveNamingHotspotId(null);
    clearNamingOpportunityFromUrl();
    viewerRef.current?.recenterToDefaultView({ forceDefault: true });
  }, [
    clearNamingOpportunityFromUrl,
    pauseForManualNav,
    pendingNamingSelectionRef,
  ]);

  const handleToggleBackgroundMusic = useCallback(() => {
    if (!immersiveBackgroundController) return;
    toggleImmersiveBackgroundPlayback(immersiveBackgroundController);
  }, [immersiveBackgroundController]);

  useTourEscapeClose(panelStack, { disabled: isTransitioning });

  // Close in-scene anchored panels when focus moves to tour chrome outside the
  // viewer (breadcrumb, explore dock, etc.). PanoramaViewer handles
  // dismiss inside the viewer area.
  useEffect(() => {
    const dismissAnchoredPanelsOnChromePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (viewerAreaRef.current?.contains(target)) return;
      if (target.closest('[data-nav-panel="true"], [data-info-panel="true"]')) {
        return;
      }
      if (
        target.closest('.hotspot-nav, .hotspot-info, .hotspot-general-info')
      ) {
        return;
      }

      viewerRef.current?.closeAnchoredPanels();
    };

    document.addEventListener(
      'pointerdown',
      dismissAnchoredPanelsOnChromePointerDown,
    );
    return () =>
      document.removeEventListener(
        'pointerdown',
        dismissAnchoredPanelsOnChromePointerDown,
      );
  }, []);

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
      pauseForManualNav();
      const found = findNamingHotspotInTour(bootstrapTour, hotspotId);
      if (!found) return;

      const targetSceneId = found.sceneId ?? sceneId;
      if (targetSceneId !== currentSceneId) {
        assistant.suppressNextLocationNote();
      }
      openNamingOpportunity(targetSceneId, hotspotId);
    },
    [
      assistant.suppressNextLocationNote,
      bootstrapTour,
      currentSceneId,
      openNamingOpportunity,
      pauseForManualNav,
    ],
  );

  /** Explore naming Visit — aim at the hotspot without opening the panel. */
  const handleVisitNamingPlace = useCallback(
    async (sceneId: string, hotspotId: string) => {
      pauseForManualNav();
      const found = findNamingHotspotInTour(bootstrapTour, hotspotId);
      const targetSceneId = found?.sceneId ?? sceneId;
      const scene = bootstrapTour.scenes[targetSceneId];
      if (!scene) return;

      if (assistant.isOpen && targetSceneId !== currentSceneId) {
        assistant.prepareNavNote({ kind: 'scene' });
      }

      pendingNamingSelectionRef.current = null;
      setActiveNamingHotspotId(null);
      clearNamingOpportunityFromUrl();
      viewerRef.current?.clearActiveInfoHotspot();
      viewerRef.current?.closeAnchoredPanels();

      const view =
        resolveNamingOpportunityView(bootstrapTour, targetSceneId, hotspotId) ??
        scene.defaultView;

      if (targetSceneId === currentSceneId) {
        void viewerRef.current?.animateToView(view);
        return;
      }

      syncSceneToUrl(targetSceneId, { clearNamingOpportunity: true });
      await viewerRef.current?.navigateToScene(targetSceneId, view);
    },
    [
      assistant.isOpen,
      assistant.prepareNavNote,
      bootstrapTour,
      clearNamingOpportunityFromUrl,
      currentSceneId,
      pauseForManualNav,
      syncSceneToUrl,
    ],
  );

  const handleNavigate = useCallback(
    async (sceneId: string, targetView?: ViewPosition) => {
      pauseForManualNav();
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
      if (!isSceneRoutable(scene, sceneAudience)) return;

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
      pauseForManualNav,
      sceneAudience,
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

        const found = findHotspotInTour(bootstrapTour, hotspotId);
        if (found?.hotspot && isNamingHotspot(found.hotspot)) {
          const sceneId = found.sceneId ?? currentSceneId;
          const scene = bootstrapTour.scenes[sceneId];
          const namingName =
            scene ?
              stripNamingOpportunitySuffix(
                resolveNamingPopup(bootstrapTour, found.hotspot, scene)
                  ?.namingOpportunity?.name ?? '',
              ) || undefined
            : undefined;
          assistant.noteNamingOpened(sceneId, namingName, hotspotId);
          syncNamingOpportunityToUrl(hotspotId, sceneId);
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
      assistant.noteNamingOpened,
      bootstrapTour,
      clearNamingOpportunityFromUrl,
      currentSceneId,
      syncNamingOpportunityToUrl,
    ],
  );

  const handleBreadcrumbNavigate = useCallback(
    async (sceneId: string) => {
      if (sceneId === currentSceneId) return;

      pauseForManualNav();
      pendingNamingSelectionRef.current = null;
      setActiveNamingHotspotId(null);
      viewerRef.current?.clearActiveInfoHotspot();

      syncSceneToUrl(sceneId, { clearNamingOpportunity: true });

      const scene = bootstrapTour.scenes[sceneId];
      if (!scene) return;

      await viewerRef.current?.navigateToScene(sceneId, scene.defaultView);
    },
    [bootstrapTour.scenes, currentSceneId, pauseForManualNav, syncSceneToUrl],
  );

  const handleHistoryBack = useCallback(() => {
    pauseForManualNav();
    goBack();
  }, [goBack, pauseForManualNav]);

  const handleHistoryForward = useCallback(() => {
    pauseForManualNav();
    goForward();
  }, [goForward, pauseForManualNav]);

  const handleTransitionStart = useCallback(() => {
    transitioningRef.current = true;
    setIsTransitioning(true);
  }, []);
  const handleTransitionEnd = useCallback(() => {
    transitioningRef.current = false;
    setIsTransitioning(false);
  }, []);

  const loadErrorSceneId = viewerLoadError?.sceneId ?? currentSceneId;
  const showLoadError = viewerLoadError !== null || searchParams.loadErrorTest;

  const handleViewerLoadError = useCallback(
    (info: ViewerLoadErrorInfo) => {
      setViewerLoadError(info);
      transitioningRef.current = false;
      setIsTransitioning(false);
    },
    [setIsTransitioning],
  );

  const handleViewerLoadRecovered = useCallback(() => {
    if (searchParams.loadErrorTest) return;
    setViewerLoadError(null);
  }, [searchParams.loadErrorTest]);

  const handleRetryLoad = useCallback(async () => {
    const sceneId = viewerLoadError?.sceneId ?? currentSceneId;
    const ok = await viewerRef.current?.retryScene(sceneId);
    if (!ok && !searchParams.loadErrorTest) return;
    if (!searchParams.loadErrorTest) {
      setViewerLoadError(null);
    }
  }, [currentSceneId, viewerLoadError?.sceneId, searchParams.loadErrorTest]);

  const handleLoadErrorGoHome = useCallback(async () => {
    const scene = bootstrapTour.scenes[bootstrapTour.firstScene];
    if (!scene) return;
    pauseForManualNav();
    setViewerLoadError(null);
    syncSceneToUrl(bootstrapTour.firstScene, { clearNamingOpportunity: true });
    await viewerRef.current?.navigateToScene(
      bootstrapTour.firstScene,
      scene.defaultView,
    );
  }, [
    bootstrapTour.firstScene,
    bootstrapTour.scenes,
    pauseForManualNav,
    syncSceneToUrl,
  ]);

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
        <Suspense fallback={null}>
          {bootstrapTour.viewerType === 'model3d' ?
            <ThreeDViewer
              key={tour.id}
              ref={viewerRef}
              tour={viewerTour}
              initialSceneId={initialScene}
              devMode={searchParams.dev}
              fullscreenActive={viewerFullscreen}
              onFullscreenToggle={toggleViewerFullscreen}
              controlsVisible={viewerControlsVisible}
              immersiveNavbarAvailable={Boolean(
                bootstrapTour.immersiveBackground,
              )}
              playTourEnabled={playTourEnabled}
              playTourPhase={playTourPhase}
              onPlayTourToggle={togglePlayTour}
              skipLanding={searchParams.skipLanding}
              splashDone={splashRevealReady}
              immersiveBackgroundController={immersiveBackgroundController}
              disabled={isTransitioning}
              onSceneChange={handleSceneChange}
              onInfoHotspot={setActivePopup}
              onActiveInfoHotspotChange={handleActiveInfoHotspotChange}
              onAnchoredPanelVisibilityChange={
                handleAnchoredPanelVisibilityChange
              }
              onNavigateToScene={handleNavigate}
              onTransitionStart={handleTransitionStart}
              onTransitionEnd={handleTransitionEnd}
              onDevClick={searchParams.dev ? setDevClickCoords : undefined}
              onDevViewUpdate={searchParams.dev ? setDevViewCoords : undefined}
              onLoadStart={handleLoadStart}
              onLoadProgress={handleLoadProgress}
              onLoadComplete={handleLoadComplete}
              onLandingStart={handleLandingStart}
              onInitialTourReveal={onInitialTourReveal}
              onViewerLoadError={handleViewerLoadError}
              onViewerLoadRecovered={handleViewerLoadRecovered}
            />
          : <PanoramaViewer
              key={tour.id}
              ref={viewerRef}
              tour={viewerTour}
              initialSceneId={initialScene}
              fullscreenRootRef={viewerAreaRef}
              controlsVisible={viewerControlsVisible}
              devMode={searchParams.dev}
              skipLanding={searchParams.skipLanding}
              landingTargetView={landingTargetView}
              landingNamingHotspotId={landingNamingHotspotId}
              splashDone={splashRevealReady}
              immersiveBackgroundController={immersiveBackgroundController}
              immersiveNavbarAvailable={Boolean(
                bootstrapTour.immersiveBackground,
              )}
              playTourEnabled={playTourEnabled}
              playTourPhase={playTourPhase}
              onPlayTourToggle={togglePlayTour}
              activeNamingHotspotId={activeNamingHotspotId}
              embed={searchParams.embed}
              disabled={isTransitioning}
              onSceneChange={handleSceneChange}
              onInfoHotspot={setActivePopup}
              onActiveInfoHotspotChange={handleActiveInfoHotspotChange}
              onDismissModalPopups={handleDismissModalPopups}
              onAnchoredPanelVisibilityChange={
                handleAnchoredPanelVisibilityChange
              }
              onNavigateToScene={handleNavigate}
              onTransitionStart={handleTransitionStart}
              onTransitionEnd={handleTransitionEnd}
              onDevClick={searchParams.dev ? setDevClickCoords : undefined}
              onDevViewUpdate={searchParams.dev ? setDevViewCoords : undefined}
              onLoadStart={handleLoadStart}
              onLoadProgress={handleLoadProgress}
              onLoadComplete={handleLoadComplete}
              onLandingStart={handleLandingStart}
              onInitialTourReveal={onInitialTourReveal}
              onFirstPanoramaInteract={onFirstPanoramaInteract}
              onViewerLoadError={handleViewerLoadError}
              onViewerLoadRecovered={handleViewerLoadRecovered}
              onNamingOpportunityBusyChange={setNamingOpportunityBusy}
            />
          }
        </Suspense>

        {isDesktop && !searchParams.embed ?
          <TourViewerControlsToggleFab
            collapsed={!viewerControlsVisible}
            onToggle={toggleControlsVisible}
          />
        : null}

        {showLoadError && (
          <ViewerLoadError
            sceneTitle={tour.scenes[loadErrorSceneId]?.title}
            canGoHome={currentSceneId !== tour.firstScene}
            onRetry={handleRetryLoad}
            onGoHome={handleLoadErrorGoHome}
          />
        )}

        <TourNavFloat
          scenes={scenes}
          tourId={tour.id}
          tourHotspots={tour.hotspots}
          tourViewerType={tour.viewerType}
          namingOpportunities={tour.namingOpportunities}
          currentSceneId={currentSceneId}
          firstSceneId={tour.firstScene}
          sceneOrder={tour.sceneOrder}
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
          onHistoryBack={handleHistoryBack}
          onHistoryForward={handleHistoryForward}
          onSelectScene={handleNavigate}
          onSelectNamingOpportunity={handleSelectNamingOpportunity}
          onVisitNamingPlace={handleVisitNamingPlace}
          onBreadcrumbNavigate={handleBreadcrumbNavigate}
          onRecenterCurrentScene={handleVisitCurrentScene}
          onAskAboutScene={
            showAskGuide ? assistant.openAndAskAboutScene : undefined
          }
          onAskAboutNaming={
            showAskGuide ? assistant.openAndAskAboutNaming : undefined
          }
          onTogglePlaceOverview={() =>
            viewerRef.current?.togglePlaceOverview() ?? false
          }
          activeNamingHotspotId={activeNamingHotspotId}
          embed={searchParams.embed}
          showPlayTour={playTourEnabled}
          showImmersiveAmbience={Boolean(bootstrapTour.immersiveBackground)}
          panelStack={panelStack}
          onDismissAnchoredPanels={() =>
            viewerRef.current?.closeAnchoredPanels()
          }
          onChromeDockOpenChange={setChromeDockOpen}
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

        {showAskGuide ?
          <AiAssistant
            assistant={assistant}
            guideUiTest={searchParams.guideUiTest}
            guideMock={searchParams.guideMock}
            currentSceneId={currentSceneId}
            firstSceneId={tour.firstScene}
            splashDone={splashPhase === 'done'}
            namingHotspotId={activeNamingHotspotId}
            namingName={assistantLiveContext?.namingName}
            chromeDockOpen={chromeDockOpen}
            client={resolveTourClient(tour)}
            clientLogo={tourBranding?.logo}
            logoAlt={tourBranding?.logoAlt}
            onNavigateScene={(sceneId) => {
              if (sceneId === currentSceneId) {
                handleVisitCurrentScene();
                return;
              }
              if (assistant.isOpen) {
                assistant.prepareNavNote({ kind: 'scene' });
              }
              void handleNavigate(sceneId);
            }}
            onSelectNaming={handleSelectNamingOpportunity}
          />
        : null}

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
            captureSceneThumbnail={() =>
              viewerRef.current?.captureSceneThumbnail() ??
              Promise.resolve(null)
            }
            getCurrentView={() => viewerRef.current?.getCurrentView() ?? null}
            focusHotspot={(hotspotId, options) =>
              viewerRef.current?.focusHotspot(hotspotId, options)
            }
            openNamingOpportunity={openNamingOpportunity}
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
        onVisitScene={handleNavigate}
      />
    </div>
  );
}
