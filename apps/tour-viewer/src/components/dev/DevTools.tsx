import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { DevViewPanel } from './DevViewPanel';
import { useTourPanelStack } from '../../hooks/useTourPanelStack';
import { isTypingTarget } from '../../utils/isTypingTarget';
import {
  useDevTourBridge,
  type DevTourBridgeSnapshot,
} from '../../utils/devTourBridge';
import { DEV_SHELL_TOUR_ID } from '../../constants/devPanel';
import {
  getDevPanelPrefs,
  setDevPanelOpen,
  useDevPanelDeviceMode,
  useDevPanelLayout,
  useDevPanelOpen,
  useDevPanelTheme,
} from '../../utils/devPanelPrefs';
import type { Tour } from '../../types/tour';
import {
  DEV_TOOLS_DRAWER_WIDTH,
  DEV_TOOLS_PUSH_RAIL_VAR,
  devFabVariants,
  devToolsFabAnchorClassName,
  devToolsPanelHostVariants,
} from './devViewPanelVariants';

const EMPTY_SHELL_TOUR: Tour = {
  id: DEV_SHELL_TOUR_ID,
  title: '',
  firstScene: '',
  scenes: {},
};

/** Host open/layout motion duration — keep in sync with components-layer.css. */
const DEV_PANEL_MOTION_MS = 240;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function buildShellBridge(
  panelStack: DevTourBridgeSnapshot['panelStack'],
): DevTourBridgeSnapshot {
  return {
    tour: EMPTY_SHELL_TOUR,
    scene: {
      id: '',
      title: undefined,
      clientId: '',
      tourId: DEV_SHELL_TOUR_ID,
    },
    currentSceneId: '',
    sceneOptions: [],
    view: null,
    clickCoords: null,
    activeNamingHotspotId: null,
    panelStack,
    captureSceneThumbnail: async () => null,
    getCurrentView: () => null,
    animateToView: () => undefined,
    focusHotspot: () => undefined,
    syncLayoutSize: () => undefined,
  };
}

type DevToolsHostProps = { presentationRootRef: RefObject<HTMLElement | null> };

/** Always mounted under `?dev=1` — works with or without a live tour bridge. */
export function DevToolsHost({ presentationRootRef }: DevToolsHostProps) {
  const bridge = useDevTourBridge();
  const localPanelStack = useTourPanelStack();
  const deviceMode = useDevPanelDeviceMode();
  const shell = useMemo(
    () => buildShellBridge(localPanelStack),
    [localPanelStack],
  );
  const snapshot = bridge ?? shell;
  // Preview unmounts TourExperience — use the host stack so Escape / register
  // still work. Live tours keep the experience stack for dock mutex.
  const panelStack =
    deviceMode ? localPanelStack : (bridge?.panelStack ?? localPanelStack);

  return (
    <DevTools
      {...snapshot}
      panelStack={panelStack}
      presentationRootRef={presentationRootRef}
    />
  );
}

function DevTools({
  tour,
  onTourMutated,
  scene,
  currentSceneId,
  sceneOptions,
  captureSceneThumbnail,
  getCurrentView,
  animateToView,
  focusHotspot,
  syncLayoutSize,
  activeNamingHotspotId = null,
  openNamingOpportunity,
  onHotspotPlacementCaptureChange,
  onHotspotMoveIdChange,
  registerHotspotMoveCommit,
  panelStack,
  presentationRootRef,
}: DevTourBridgeSnapshot & {
  presentationRootRef: RefObject<HTMLElement | null>;
}) {
  const layout = useDevPanelLayout();
  const theme = useDevPanelTheme();
  const panelOpen = useDevPanelOpen();
  const [layoutEnter, setLayoutEnter] = useState(false);
  const [pushRailReady, setPushRailReady] = useState(
    () => layout === 'push' && panelOpen,
  );
  const prevLayoutRef = useRef(layout);
  const skipLayoutEnterRef = useRef(true);
  const bootPushRailRef = useRef(true);
  const syncLayoutSizeRef = useRef(syncLayoutSize);
  syncLayoutSizeRef.current = syncLayoutSize;
  /** Push rail waits for panel motion so underpaint does not flash mid-fade. */
  const pushRailOpen = layout === 'push' && panelOpen && pushRailReady;

  useEffect(() => {
    return panelStack.registerPanel('dev-panel', () => {
      setDevPanelOpen(false);
    });
  }, [panelStack]);

  useEffect(() => {
    if (panelOpen) panelStack.openPanel('dev-panel');
    else panelStack.closePanel('dev-panel');
  }, [panelOpen, panelStack]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Backquote') return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      setDevPanelOpen(!getDevPanelPrefs().panelOpen);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /** Push: snap stage width, sync WebGL/PSV in the same layout pass. */
  useLayoutEffect(() => {
    const root = presentationRootRef.current;
    if (!root) return;

    root.style.setProperty(
      DEV_TOOLS_PUSH_RAIL_VAR,
      pushRailOpen ? DEV_TOOLS_DRAWER_WIDTH : '0px',
    );
    void root.offsetWidth;
    syncLayoutSizeRef.current();
  }, [presentationRootRef, pushRailOpen]);

  useEffect(() => {
    return () => {
      presentationRootRef.current?.style.removeProperty(
        DEV_TOOLS_PUSH_RAIL_VAR,
      );
    };
  }, [presentationRootRef]);

  /**
   * Open / switch-to-push: animate panel first (over the stage), then commit
   * the rail. Close / leave-push: drop the rail immediately.
   */
  useLayoutEffect(() => {
    if (layout !== 'push' || !panelOpen) {
      setPushRailReady(false);
      return;
    }

    if (bootPushRailRef.current) {
      bootPushRailRef.current = false;
      setPushRailReady(true);
      return;
    }

    if (prefersReducedMotion()) {
      setPushRailReady(true);
      return;
    }

    setPushRailReady(false);
    const fallbackId = window.setTimeout(() => {
      setPushRailReady(true);
    }, DEV_PANEL_MOTION_MS);
    return () => window.clearTimeout(fallbackId);
  }, [layout, panelOpen]);

  /** Layout mode change — short panel-only enter. */
  useLayoutEffect(() => {
    if (skipLayoutEnterRef.current) {
      skipLayoutEnterRef.current = false;
      prevLayoutRef.current = layout;
      return;
    }
    if (prevLayoutRef.current === layout) return;
    prevLayoutRef.current = layout;
    if (!panelOpen) return;
    setLayoutEnter(true);
  }, [layout, panelOpen]);

  const commitPushRailIfNeeded = () => {
    if (layout === 'push' && panelOpen) setPushRailReady(true);
  };

  return (
    <>
      {/* Keep mounted so tab / draft state survives close, layout, and scene nav. */}
      <div
        className={devToolsPanelHostVariants({ layout })}
        data-open={panelOpen ? 'true' : 'false'}
        data-dev-layout={layout}
        data-dev-theme={theme}
        data-layout-enter={layoutEnter ? '1' : undefined}
        aria-hidden={!panelOpen}
        aria-label='Dev panel'
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          if (
            event.propertyName !== 'opacity' &&
            event.propertyName !== 'transform'
          ) {
            return;
          }
          commitPushRailIfNeeded();
        }}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.animationName === 'dev-tools-panel-layout-enter') {
            setLayoutEnter(false);
          }
          commitPushRailIfNeeded();
        }}
      >
        <DevViewPanel
          id='dev-view-panel'
          tour={tour}
          onTourMutated={onTourMutated}
          scene={scene}
          currentSceneId={currentSceneId}
          sceneOptions={sceneOptions}
          captureSceneThumbnail={captureSceneThumbnail}
          getCurrentView={getCurrentView}
          animateToView={animateToView}
          focusHotspot={focusHotspot}
          activeNamingHotspotId={activeNamingHotspotId}
          openNamingOpportunity={openNamingOpportunity}
          onHotspotPlacementCaptureChange={onHotspotPlacementCaptureChange}
          onHotspotMoveIdChange={onHotspotMoveIdChange}
          registerHotspotMoveCommit={registerHotspotMoveCommit}
          onClose={() => setDevPanelOpen(false)}
          panelOpen={panelOpen}
        />
      </div>

      {!panelOpen ?
        <div className={devToolsFabAnchorClassName}>
          <button
            type='button'
            className={devFabVariants({ open: false })}
            aria-expanded={false}
            aria-controls='dev-view-panel'
            aria-label='Show dev panel (`)'
            onClick={() => setDevPanelOpen(true)}
          >
            Dev
          </button>
        </div>
      : null}
    </>
  );
}
