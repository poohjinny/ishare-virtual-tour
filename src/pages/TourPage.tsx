import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
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
import { DevToolsHost } from '../components/DevTools';
import { DevDevicePreviewFrame } from '../components/DevDevicePreviewFrame';
import { DevEmbedPreviewFrame } from '../components/DevEmbedPreviewFrame';
import {
  devToolsPresentationRootClassName,
  devToolsTourStageClassName,
} from '../components/devViewPanelVariants';
import {
  bumpDevDevicePreviewReload,
  useDevPanelPrefs,
} from '../utils/devPanelPrefs';
import { InfoPopup } from '../components/InfoPopup';
import { LoadProgressBar } from '../components/LoadProgressBar';
import { ViewerLoadError } from '../components/ViewerLoadError';
import { TourNotFound } from '../components/TourNotFound';
import {
  TourLoadSplash,
  getTourLoadSplashFadeMs,
} from '../components/TourLoadSplash';
import { TourNavFloat } from '../components/TourNavFloat';
import type { TourNavDockActions } from '../components/TourNavFloat';
import { TourViewerControlsToggleFab } from '../components/TourViewerControlsToggleFab';
import { EnterVrButton } from '../components/EnterVrButton';
import { TourFirstVisitHint } from '../components/TourFirstVisitHint';
import { PanoramaXrSession } from '../viewer-xr/PanoramaXrSession';
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
} from '../viewer-shared/immersiveBackgroundPlayback';
import { useTourFirstVisitHint } from '../hooks/useTourFirstVisitHint';
import { useTourEmbedMessaging } from '../hooks/useTourEmbedMessaging';
import { useTourFullscreen } from '../hooks/useTourFullscreen';
import type {
  ChatGuideCtaKind,
  PopupContent,
  Tour,
  ViewPosition,
} from '../types/tour';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  clearDevTourBridge,
  getDevTourBridge,
  publishDevTourBridge,
  type DevHotspotMovePosition,
} from '../utils/devTourBridge';
import {
  parseDevDeviceFrameLocationMessage,
  postDevDeviceFrameLocation,
  toParentHrefFromDeviceFrameLocation,
} from '../utils/devDeviceFrameSync';
import { devFetchTour, type DevTourMutateOptions } from '../utils/devTourApi';
import { setDevTourCache } from '../services/devTourCache';
import {
  normalizeTourAssets,
  bustSceneThumbnailUrls,
} from '../services/normalizeTourAssets';
import {
  resolveTourRoute,
  resolveSceneId,
  buildTourLocation,
  needsClientIntroPick,
  isRootPathWithoutTour,
  NAMING_OPPORTUNITY_SEARCH_KEY,
  resolveNamingOpportunityFromSearch,
} from '../utils/tourPaths';
import { DEV_SHELL_TOUR_ID } from '../constants/devPanel';
import type { TourPanelStack } from '../hooks/useTourPanelStack';
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
import type { TourViewerHandle } from '../viewer-shared/viewerHandle';
import type { ViewerLoadErrorInfo } from '../viewer-shared/viewerHandle';
import { resolveNamingOpportunityView } from '../viewer-shared/namingOpportunityView';

const PanoramaViewer = lazy(() =>
  import('../viewer/PanoramaViewer').then((m) => ({
    default: m.PanoramaViewer,
  })),
);
const ThreeDViewer = lazy(() => import('../viewer-3d/ThreeDViewer'));
import { resetLandingTransitionState } from '../viewer-shared/landingTransitionState';
import { resolveTourSceneOpenGraph } from '../utils/tourOpenGraph';

/** Fallback if transitionend does not fire (e.g. reduced motion). */
const SPLASH_UNMOUNT_FALLBACK_PADDING_MS = 150;
/** Extra splash hold for loader UX testing — only when `?splashHold=1` */
const DEV_SPLASH_HOLD_MS = 2000;

/** Preview-mode bridge when no live TourExperience panel stack is sticky yet. */
const DEV_PREVIEW_PANEL_STACK_NOOP: TourPanelStack = {
  openPanel: () => undefined,
  closePanel: () => undefined,
  closeTopPanel: () => false,
  registerPanel: () => () => undefined,
};

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

  const showingClientIntro =
    showClientIntro ||
    (isRootPathWithoutTour(location.pathname) &&
      !tourOrScene &&
      !tourId &&
      listTourIds().length === 0);

  useEffect(() => {
    if (!searchParams.dev) {
      clearDevTourBridge();
      return;
    }
    // Intro has no open tour — drop sticky bridge so Dev doesn't keep a client.
    if (showingClientIntro) clearDevTourBridge();
  }, [searchParams.dev, showingClientIntro]);

  const presentationRootRef = useRef<HTMLDivElement>(null);
  const { theme: devPanelTheme, deviceMode, deviceEmbed } = useDevPanelPrefs();
  // Only nested iframes are "device frames". A stale `deviceFrame=1` on the top
  // window would hide DevTools / the device toolbar — treat top as never framed.
  const inNestedDeviceFrame =
    searchParams.deviceFrame &&
    typeof window !== 'undefined' &&
    window.self !== window.top;
  const showDevicePreview =
    searchParams.dev &&
    !inNestedDeviceFrame &&
    typeof window !== 'undefined' &&
    window.self === window.top &&
    deviceMode;

  // Device / Embed preview unmounts TourExperience — keep Dev panel tour/scene
  // in sync with the route (and the preview iframe) via a route-based bridge.
  useLayoutEffect(() => {
    if (!showDevicePreview) return;
    if (route.routeError !== 'none' || !route.tourId) return;
    if (route.tourId === DEV_SHELL_TOUR_ID) return;

    const previewTour = tryLoadTour(route.tourId);
    if (!previewTour) return;

    const sceneId = resolveSceneId(route.tourId, route.sceneId);
    const prev = getDevTourBridge();
    const sceneOptions = Object.values(previewTour.scenes).map((scene) => ({
      id: scene.id,
      title: scene.title,
    }));

    const republishFromDisk = async () => {
      const fresh = tryLoadTour(previewTour.id);
      if (!fresh) return;
      const nextSceneId = resolveSceneId(fresh.id, route.sceneId);
      publishDevTourBridge({
        tour: fresh,
        scene: {
          id: nextSceneId,
          title: fresh.scenes[nextSceneId]?.title,
          clientId: fresh.clientId ?? fresh.id,
          tourId: fresh.id,
        },
        currentSceneId: nextSceneId,
        sceneOptions: Object.values(fresh.scenes).map((scene) => ({
          id: scene.id,
          title: scene.title,
        })),
        view: null,
        clickCoords: null,
        activeNamingHotspotId: null,
        panelStack:
          getDevTourBridge()?.panelStack ?? DEV_PREVIEW_PANEL_STACK_NOOP,
        onTourMutated: republishFromDisk,
        captureSceneThumbnail: async () => null,
        getCurrentView: () => null,
        animateToView: () => undefined,
        focusHotspot: () => undefined,
        syncLayoutSize: () => undefined,
      });
      bumpDevDevicePreviewReload();
    };

    publishDevTourBridge({
      tour: previewTour,
      scene: {
        id: sceneId,
        title: previewTour.scenes[sceneId]?.title,
        clientId: previewTour.clientId ?? previewTour.id,
        tourId: previewTour.id,
      },
      currentSceneId: sceneId,
      sceneOptions,
      view: null,
      clickCoords: null,
      activeNamingHotspotId: null,
      panelStack: prev?.panelStack ?? DEV_PREVIEW_PANEL_STACK_NOOP,
      onTourMutated: republishFromDisk,
      captureSceneThumbnail: async () => null,
      getCurrentView: () => null,
      animateToView: () => undefined,
      focusHotspot: () => undefined,
      syncLayoutSize: () => undefined,
    });
  }, [route.routeError, route.sceneId, route.tourId, showDevicePreview]);

  // Strip iframe-only preview flags from the top window (scene sync / paste
  // used to leak `deviceFrame`; Embed preview could leave `embed=1` after exit).
  useEffect(() => {
    if (
      !searchParams.deviceFrame &&
      !searchParams.deviceTouch &&
      !searchParams.embed
    ) {
      return;
    }
    if (typeof window === 'undefined' || window.self !== window.top) return;

    const next = new URLSearchParams(urlSearchParams);
    next.delete('deviceFrame');
    next.delete('deviceTouch');
    next.delete('embed');
    const search = next.toString();
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
        hash: location.hash,
      },
      { replace: true },
    );
  }, [
    location.hash,
    location.pathname,
    navigate,
    searchParams.deviceFrame,
    searchParams.deviceTouch,
    searchParams.embed,
    urlSearchParams,
  ]);

  // Nested device/embed iframe — tell the parent so Dev Tools stays on the same tour.
  useEffect(() => {
    if (!inNestedDeviceFrame) return;
    postDevDeviceFrameLocation({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [inNestedDeviceFrame, location.hash, location.pathname, location.search]);

  // Preview host — mirror in-frame intro/tour/scene navigations into the top URL
  // so DevViewPanel tour switch + route bridge stay in sync.
  useEffect(() => {
    if (!showDevicePreview) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = parseDevDeviceFrameLocationMessage(event.data);
      if (!message) return;

      const next = toParentHrefFromDeviceFrameLocation(message);
      const current = `${location.pathname}${location.search}${location.hash}`;
      if (next === current) return;
      navigate(next, { replace: true });
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
    showDevicePreview,
  ]);

  let main: ReactNode;
  if (searchParams.notFoundTest) {
    const requestedTourId =
      route.routeError === 'unknown_tour' && route.requestedTourId ?
        route.requestedTourId
      : DEV_NOT_FOUND_SAMPLE_TOUR_ID;

    main = (
      <TourNotFound
        requestedTourId={requestedTourId}
        searchParams={urlSearchParams}
      />
    );
  } else if (showingClientIntro) {
    main = <ClientIntroPicker searchParams={urlSearchParams} />;
  } else if (
    route.routeError === 'unknown_tour' &&
    route.requestedTourId &&
    !searchParams.dev
  ) {
    main = (
      <TourNotFound
        requestedTourId={route.requestedTourId}
        searchParams={urlSearchParams}
      />
    );
  } else {
    main = (
      <TourExperience
        presentationRootRef={
          searchParams.dev && !inNestedDeviceFrame ?
            presentationRootRef
          : undefined
        }
      />
    );
  }

  // Nested device iframe — tour only (no DevTools / nested preview).
  if (inNestedDeviceFrame) return main;

  if (!searchParams.dev) return main;

  return (
    <div
      ref={presentationRootRef}
      data-dev-theme={devPanelTheme}
      className={devToolsPresentationRootClassName}
    >
      <div className={devToolsTourStageClassName}>
        {showDevicePreview ?
          // Unmount live viewer while previewing — avoids dual PSV/WebGL +
          // resize thrash. Dev bridge stays sticky from the last publish.
          deviceEmbed ?
            <DevEmbedPreviewFrame />
          : <DevDevicePreviewFrame />
        : <div className='h-full min-h-0 w-full [&>*]:h-full [&>*]:min-h-0 [&>*]:w-full'>
            {main}
          </div>
        }
      </div>
      <DevToolsHost presentationRootRef={presentationRootRef} />
    </div>
  );
}

type TourExperienceProps = {
  presentationRootRef?: RefObject<HTMLElement | null>;
};

function TourExperience({ presentationRootRef }: TourExperienceProps) {
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
  /** Previous tour while ?dev=1 fetches the next — avoids viewer splash flash. */
  const heldDevTourRef = useRef<Tour | null>(null);

  useEffect(() => {
    setDevThumbnailVersion(0);
  }, [route.tourId]);

  // Mark loading before paint so the first frame can still hold the previous tour.
  useLayoutEffect(() => {
    if (!searchParams.dev) return;
    setDevTourBootstrapStatus('loading');
  }, [route.tourId, searchParams.dev]);

  useEffect(() => {
    if (!searchParams.dev) return;

    let cancelled = false;
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
    if (!base || base.id !== route.tourId) return null;
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

  const holdPreviousDevTour =
    Boolean(searchParams.dev) &&
    !resolvedTour &&
    devTourBootstrapStatus !== 'error';

  const tour =
    resolvedTour ?? (holdPreviousDevTour ? heldDevTourRef.current : null);
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
  const panoramaXrHostRef = useRef<HTMLDivElement>(null);
  const panoramaXrSessionRef = useRef<PanoramaXrSession | null>(null);
  const [xrActive, setXrActive] = useState(false);
  const fullscreenRootRef = presentationRootRef ?? viewerAreaRef;
  const { active: viewerFullscreen, toggle: toggleViewerFullscreen } =
    useTourFullscreen(fullscreenRootRef);
  const pendingNamingSelectionRef = useRef<{
    sceneId: string;
    hotspotId: string;
  } | null>(null);
  const [activePopup, setActivePopup] = useState<PopupContent | null>(null);
  const [activeNamingHotspotId, setActiveNamingHotspotId] = useState<
    string | null
  >(null);
  const [activeNavPreview, setActiveNavPreview] = useState<{
    hotspotId: string;
    targetSceneId: string;
    title: string;
  } | null>(null);
  const [namingOpportunityBusy, setNamingOpportunityBusy] = useState(false);
  const [chromeDockOpen, setChromeDockOpen] = useState(false);
  const [devClickCoords, setDevClickCoords] = useState<ClickCoords | null>(
    null,
  );
  const [devHotspotPlacementCapture, setDevHotspotPlacementCapture] =
    useState(false);
  const [devHotspotMoveId, setDevHotspotMoveId] = useState<string | null>(null);
  const hotspotMoveCommitRef = useRef<
    ((position: DevHotspotMovePosition) => Promise<void>) | null
  >(null);
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
  const { isMobile } = useTourChromeLayout();
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

  /** Loaded tour that matches the route — used as the tour-switch boundary. */
  const activeTourId = tour && tour.id === route.tourId ? tour.id : null;

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

  // TourPage stays mounted across tours — reset viewer-scoped UI at the boundary.
  useEffect(() => {
    if (!activeTourId) return;

    pauseForManualNav();
    syncSceneFromRoute(initialScene);
    transitioningRef.current = false;
    playTourSuppressRouteNavRef.current = false;
    setIsTransitioning(false);
    pendingNamingSelectionRef.current = null;
    setActivePopup(null);
    setActiveNamingHotspotId(null);
    setActiveNavPreview(null);
    setNamingOpportunityBusy(false);
    setChromeDockOpen(false);
    setDevClickCoords(null);
    setDevViewCoords(null);
    setDevHotspotPlacementCapture(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeTourId
  }, [activeTourId]);

  const openGraphMeta = useMemo(() => {
    if (!tour) return null;

    return resolveTourSceneOpenGraph({
      tour,
      tourTitle: tour.title,
      sceneId: currentSceneId,
      namingHotspotId: activeNamingHotspotId,
      logoPath: tourBranding?.logo,
    });
  }, [activeNamingHotspotId, currentSceneId, tour, tourBranding?.logo]);

  useTourOpenGraph(openGraphMeta);

  const handleDevHotspotPlacementCaptureChange = useCallback(
    (active: boolean) => {
      setDevHotspotPlacementCapture(active);
      if (!active) setDevClickCoords(null);
    },
    [],
  );

  const handleDevHotspotMoveIdChange = useCallback(
    (hotspotId: string | null) => {
      setDevHotspotMoveId(hotspotId);
      if (!hotspotId) setDevClickCoords(null);
    },
    [],
  );

  const registerHotspotMoveCommit = useCallback(
    (handler: ((position: DevHotspotMovePosition) => Promise<void>) | null) => {
      hotspotMoveCommitRef.current = handler;
    },
    [],
  );

  const handleDevHotspotMoved = useCallback(
    (position: DevHotspotMovePosition) => {
      void hotspotMoveCommitRef.current?.(position);
    },
    [],
  );

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

      const requestedSceneId =
        options?.keepCurrentScene ? currentSceneId : (
          (options?.navigateToScene ??
          (fresh.scenes[currentSceneId] ? currentSceneId : fresh.firstScene))
        );
      const targetSceneId =
        fresh.scenes[requestedSceneId] ? requestedSceneId : fresh.firstScene;
      const currentMissing = !fresh.scenes[currentSceneId];

      const shouldNavigate =
        !options?.keepCurrentScene && targetSceneId !== currentSceneId;

      await viewerRef.current?.applyTourUpdate(bustedFresh, {
        fallbackSceneId: targetSceneId,
      });

      if (shouldNavigate) {
        const targetView = fresh.scenes[targetSceneId]?.defaultView;
        syncSceneToUrl(targetSceneId, { clearNamingOpportunity: true });
        // Panorama applyTourUpdate already setNodes to fallback when the open
        // scene was deleted — skip a second hop (avoids Overview flash).
        // model3d applyTourUpdate no-ops when missing, so it still needs navigate.
        if (!currentMissing || fresh.viewerType === 'model3d') {
          await viewerRef.current?.navigateToScene(targetSceneId, targetView);
        }
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
    if (activeNamingHotspotId) {
      const found = findHotspotInTour(bootstrapTour, activeNamingHotspotId);
      if (!found?.hotspot || !isNamingHotspot(found.hotspot)) {
        return undefined;
      }

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
    }

    if (activeNavPreview) {
      return {
        navPreviewHotspotId: activeNavPreview.hotspotId,
        navPreviewTargetSceneId: activeNavPreview.targetSceneId,
        navPreviewTitle: activeNavPreview.title,
      };
    }

    return undefined;
  }, [activeNamingHotspotId, activeNavPreview, bootstrapTour, currentSceneId]);

  const assistant = useTourAssistant(
    bootstrapTour,
    currentSceneId,
    assistantLiveContext,
    { guideMock: searchParams.guideMock },
  );
  const showAskGuide = isAskGuideEnabled(
    searchParams.askGuide,
    tour?.askGuideEnabled === true,
  );
  const panelStack = useTourPanelStack();
  const navDockActionsRef = useRef<TourNavDockActions | null>(null);

  const handleGuideChromeAction = useCallback(
    (kind: ChatGuideCtaKind) => {
      if (kind === 'open-help') {
        navDockActionsRef.current?.openHelp();
        return;
      }
      if (kind === 'open-explore') {
        navDockActionsRef.current?.openExplore();
        return;
      }
      if (kind === 'open-ask-guide') {
        assistant.open();
      }
    },
    [assistant.open],
  );

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

  // Play Tour owns the scene — close Ask Guide so it doesn’t cover the slideshow.
  useEffect(() => {
    if (!showAskGuide) return;
    if (playTourPhase !== 'playing') return;
    assistant.close();
  }, [assistant.close, playTourPhase, showAskGuide]);

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

  const handleNavPreviewChange = useCallback(
    (
      preview: {
        hotspotId: string;
        targetSceneId: string;
        title: string;
      } | null,
    ) => {
      setActiveNavPreview(preview);
      if (!preview || !showAskGuide) return;
      assistant.noteNavPreviewOpened(
        preview.targetSceneId,
        preview.title,
        preview.hotspotId,
      );
    },
    [assistant.noteNavPreviewOpened, showAskGuide],
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

  useTourViewerShortcuts(fullscreenRootRef, {
    disabled: isTransitioning,
    onRecenter: handleRecenterToDefaultView,
    onToggleBackgroundMusic:
      immersiveBackgroundController ? handleToggleBackgroundMusic : undefined,
    onToggleToolbar:
      !searchParams.embed && !isMobile ? toggleControlsVisible : undefined,
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

      const xrSession = panoramaXrSessionRef.current;
      if (xrSession && tour) {
        try {
          await xrSession.setTourScene(tour, sceneId);
        } catch {
          // Keep flat viewer navigation even if XR texture reload fails.
        }
      }
    },
    [
      bootstrapTour.scenes,
      currentSceneId,
      pauseForManualNav,
      sceneAudience,
      syncSceneToUrl,
      tour,
    ],
  );

  const handleEnterVr = useCallback(async () => {
    if (!tour || xrActive) return;

    if (bootstrapTour.viewerType === 'model3d') {
      await viewerRef.current?.enterImmersiveVr?.();
      return;
    }

    // Lay out the XR host before constructing the GL canvas / requestSession.
    setXrActive(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const host = panoramaXrHostRef.current;
    if (!host || host.clientWidth < 2 || host.clientHeight < 2) {
      setXrActive(false);
      return;
    }

    const session = new PanoramaXrSession({
      container: host,
      tour,
      sceneId: currentSceneId,
      onNavigate: (targetSceneId) => {
        void handleNavigate(targetSceneId);
      },
      onSessionEnd: () => {
        panoramaXrSessionRef.current = null;
        setXrActive(false);
      },
    });
    panoramaXrSessionRef.current = session;
    try {
      await session.start();
    } catch {
      panoramaXrSessionRef.current = null;
      setXrActive(false);
      session.dispose();
    }
  }, [
    bootstrapTour.viewerType,
    currentSceneId,
    handleNavigate,
    tour,
    xrActive,
  ]);

  const handleExitVr = useCallback(async () => {
    if (bootstrapTour.viewerType === 'model3d') {
      await viewerRef.current?.exitImmersiveVr?.();
      return;
    }
    const session = panoramaXrSessionRef.current;
    if (!session) {
      setXrActive(false);
      return;
    }
    await session.end();
  }, [bootstrapTour.viewerType]);

  const handleXrPresentingChange = useCallback((presenting: boolean) => {
    setXrActive(presenting);
  }, []);

  useEffect(() => {
    return () => {
      panoramaXrSessionRef.current?.dispose();
      panoramaXrSessionRef.current = null;
    };
  }, []);

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

  const tourReady = Boolean(
    tour && bootstrapTour.id !== BOOTSTRAP_TOUR_PLACEHOLDER.id,
  );

  // Publish live tour handles to the Dev shell (sibling of splash / NotFound).
  useLayoutEffect(() => {
    if (!searchParams.dev) {
      clearDevTourBridge();
      return;
    }
    if (!tour) {
      // Keep the last bridge sticky across intro / loading so Dev stays usable.
      return;
    }

    publishDevTourBridge({
      tour,
      scene: {
        id: currentSceneId,
        title: tour.scenes[currentSceneId]?.title,
        clientId: tour.clientId ?? tour.id,
        tourId: tour.id,
      },
      currentSceneId,
      sceneOptions: devSceneOptions,
      view: devViewCoords,
      clickCoords: devClickCoords,
      activeNamingHotspotId,
      panelStack,
      onTourMutated: handleDevTourMutated,
      captureSceneThumbnail: () =>
        viewerRef.current?.captureSceneThumbnail() ?? Promise.resolve(null),
      getCurrentView: () => viewerRef.current?.getCurrentView() ?? null,
      animateToView: (view) => viewerRef.current?.animateToView(view),
      focusHotspot: (hotspotId, options) =>
        viewerRef.current?.focusHotspot(hotspotId, options),
      syncLayoutSize: () => viewerRef.current?.syncLayoutSize(),
      openNamingOpportunity,
      onHotspotPlacementCaptureChange: handleDevHotspotPlacementCaptureChange,
      onHotspotMoveIdChange: handleDevHotspotMoveIdChange,
      registerHotspotMoveCommit,
    });
  }, [
    activeNamingHotspotId,
    currentSceneId,
    devClickCoords,
    devSceneOptions,
    devViewCoords,
    handleDevHotspotMoveIdChange,
    handleDevHotspotPlacementCaptureChange,
    handleDevTourMutated,
    openNamingOpportunity,
    panelStack,
    registerHotspotMoveCommit,
    devTourBootstrapStatus,
    searchParams.dev,
    tour,
  ]);

  const nestedUnderDevChrome = Boolean(presentationRootRef);
  let tourPageClassName = 'app tour-page';
  if (searchParams.embed) {
    tourPageClassName =
      nestedUnderDevChrome ?
        'app tour-page tour-page--embed h-full'
      : 'app tour-page tour-page--embed';
  } else if (!tourReady) {
    tourPageClassName =
      nestedUnderDevChrome ?
        'app tour-page flex h-full min-h-0 items-center justify-center bg-page'
      : 'app tour-page flex min-h-full items-center justify-center bg-page';
  } else if (nestedUnderDevChrome) {
    tourPageClassName = 'app tour-page h-full min-h-0';
  }

  return (
    <div ref={tourRootRef} className={tourPageClassName}>
      <div ref={viewerAreaRef} className='viewer-area viewer-area--fullscreen'>
        {tourReady && tour ?
          <>
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
                  devHotspotPlacementCapture={devHotspotPlacementCapture}
                  devHotspotMoveId={searchParams.dev ? devHotspotMoveId : null}
                  onDevHotspotMoved={
                    searchParams.dev ? handleDevHotspotMoved : undefined
                  }
                  onDevViewUpdate={
                    searchParams.dev ? setDevViewCoords : undefined
                  }
                  onLoadStart={handleLoadStart}
                  onLoadProgress={handleLoadProgress}
                  onLoadComplete={handleLoadComplete}
                  onLandingStart={handleLandingStart}
                  onInitialTourReveal={onInitialTourReveal}
                  onViewerLoadError={handleViewerLoadError}
                  onViewerLoadRecovered={handleViewerLoadRecovered}
                  onXrPresentingChange={handleXrPresentingChange}
                />
              : <PanoramaViewer
                  key={tour.id}
                  ref={viewerRef}
                  tour={viewerTour}
                  initialSceneId={initialScene}
                  fullscreenRootRef={fullscreenRootRef}
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
                  onNavPreviewChange={handleNavPreviewChange}
                  onNavigateToScene={handleNavigate}
                  onTransitionStart={handleTransitionStart}
                  onTransitionEnd={handleTransitionEnd}
                  onDevClick={searchParams.dev ? setDevClickCoords : undefined}
                  devHotspotMoveId={searchParams.dev ? devHotspotMoveId : null}
                  onDevHotspotMoved={
                    searchParams.dev ? handleDevHotspotMoved : undefined
                  }
                  onDevViewUpdate={
                    searchParams.dev ? setDevViewCoords : undefined
                  }
                  onLoadStart={handleLoadStart}
                  onLoadProgress={handleLoadProgress}
                  onLoadComplete={handleLoadComplete}
                  onLandingStart={handleLandingStart}
                  onInitialTourReveal={onInitialTourReveal}
                  onFirstPanoramaInteract={onFirstPanoramaInteract}
                  onViewerLoadError={handleViewerLoadError}
                  onViewerLoadRecovered={handleViewerLoadRecovered}
                  onNamingOpportunityBusyChange={setNamingOpportunityBusy}
                  onOpenSharePanel={
                    searchParams.embed ? undefined : (
                      () => navDockActionsRef.current?.openShare()
                    )
                  }
                />
              }
            </Suspense>

            <div
              ref={panoramaXrHostRef}
              className={
                xrActive && bootstrapTour.viewerType !== 'model3d' ?
                  'panorama-xr-host panorama-xr-host--active'
                : 'panorama-xr-host'
              }
              aria-hidden={!xrActive}
            />

            {!xrActive && !isMobile && !searchParams.embed ?
              <TourViewerControlsToggleFab
                collapsed={!viewerControlsVisible}
                onToggle={toggleControlsVisible}
              />
            : null}

            <EnterVrButton
              embed={searchParams.embed}
              ready={tourReady && splashPhase === 'done'}
              xrActive={xrActive}
              disabled={isTransitioning}
              onEnterVr={handleEnterVr}
              onExitVr={handleExitVr}
            />

            {!xrActive && showLoadError && (
              <ViewerLoadError
                sceneTitle={tour.scenes[loadErrorSceneId]?.title}
                canGoHome={currentSceneId !== tour.firstScene}
                onRetry={handleRetryLoad}
                onGoHome={handleLoadErrorGoHome}
              />
            )}

            {!xrActive ?
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
                facilityTitle={tour.title}
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
                showImmersiveAmbience={Boolean(
                  bootstrapTour.immersiveBackground,
                )}
                showAskGuide={showAskGuide}
                panelStack={panelStack}
                dockActionsRef={navDockActionsRef}
                onOpenAskGuide={showAskGuide ? assistant.open : undefined}
                onDismissAnchoredPanels={() =>
                  viewerRef.current?.closeAnchoredPanels()
                }
                onChromeDockOpenChange={setChromeDockOpen}
              />
            : null}

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

            {!xrActive ?
              <TourFirstVisitHint visible={hintVisible} />
            : null}

            {!xrActive && showAskGuide ?
              <AiAssistant
                assistant={assistant}
                guideUiTest={searchParams.guideUiTest}
                guideMock={searchParams.guideMock}
                currentSceneId={currentSceneId}
                firstSceneId={tour.firstScene}
                splashDone={splashPhase === 'done'}
                namingHotspotId={activeNamingHotspotId}
                namingName={assistantLiveContext?.namingName}
                navPreviewHotspotId={activeNavPreview?.hotspotId}
                navPreviewTitle={activeNavPreview?.title}
                chromeDockOpen={chromeDockOpen}
                playTourActive={playTourPhase === 'playing'}
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
                onChromeAction={handleGuideChromeAction}
              />
            : null}
          </>
        : searchParams.dev && devTourBootstrapStatus === 'loading' ?
          <TourLoadSplash embed={searchParams.embed} />
        : <TourNotFound
            requestedTourId={route.requestedTourId ?? route.tourId}
            searchParams={urlSearchParams}
          />
        }
      </div>

      {tourReady && tour && !xrActive ?
        <InfoPopup
          popup={activePopup}
          tour={tour}
          sceneId={currentSceneId}
          namingHotspotId={activeNamingHotspotId}
          embed={searchParams.embed}
          onClose={closeInfoPopup}
          onVisitScene={handleNavigate}
          onOpenSharePanel={
            searchParams.embed ? undefined : (
              () => navDockActionsRef.current?.openShare()
            )
          }
        />
      : null}
    </div>
  );
}
