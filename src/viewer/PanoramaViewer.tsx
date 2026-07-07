import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Viewer, type NavbarCustomButton } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';

import type {
  Hotspot,
  PopupContent,
  Tour,
  ViewPosition,
  ViewerOrientation,
} from '../types/tour';
import { buildNavPreview, navPreviewCanNavigate } from '../utils/navPreview';
import { resolveTourSceneTransitionEffect } from '../utils/tourTransition';
import {
  buildVirtualTourNodePatch,
  buildVirtualTourNodes,
} from './buildTourNodes';
import {
  buildAbsoluteShareUrl,
  buildShareMessage,
} from '../utils/buildShareUrl';
import {
  TOUR_SHARE_LOCATION_LABEL,
  TOUR_SHARE_OPPORTUNITY_ARIA,
  TOUR_SHARE_OPPORTUNITY_LABEL,
} from '../constants/tourShare';
import { applyShareButtonFeedback, shareTourView } from '../utils/shareTour';
import { mountPopupVideoPlayer } from '../utils/popupVideo';
import { releaseAllTourMedia } from '../utils/tourMediaCoordinator';
import type { ClickCoords } from '../utils/devHotspotLogger';
import { logHotspotClick, toViewPosition } from '../utils/devHotspotLogger';
import {
  fromPsvZoom,
  PSV_MAX_FOV,
  PSV_MIN_FOV,
  toPsvZoom,
} from '../utils/psvZoom';
import { VIEWER_CONTROLS_VISIBLE_DEFAULT } from '../utils/viewerControlsPreference';
import { bindViewerPerfPause } from './viewerPerfPause';
import {
  closeAnchoredInfoPanel,
  getOpenAnchoredPanelHostId,
  isAnchoredPopup,
  syncInfoPanelPosition,
  toggleAnchoredInfoPanel,
} from './infoPanelMarker';
import {
  closeAnchoredNavPreviewPanel,
  getNavPanelNavigateTarget,
  syncNavPreviewPanelPosition,
  toggleAnchoredNavPreviewPanel,
} from './navPreviewPanelMarker';
import { setNavPreviewNamingPanelHandlers } from './navPreviewNamingAccordion';
import {
  type PendingNamingInfoTarget,
  animateViewerToView,
  isNamingHotspotInViewport,
  scheduleOpenPendingNamingInfoHotspot,
  resolveNamingOpportunityView,
  resolveSceneRecenterView,
} from './pendingNamingInfoHotspot';
import {
  setActiveInfoHotspot,
  setActiveInfoHotspotChangeListener,
} from './infoHotspotActive';
import { setAnchoredPanelVisibilityListener } from './anchoredPanelVisibility';
import { navigateToScene, preloadOtherScenes } from './transition';
import { bindVirtualTourLifecycleGuard } from './virtualTourLifecycle';
import { createRecenterViewNavbarButton } from './recenterViewNavbarButton';
import {
  bindTourFullscreenNavbarButton,
  createTourFullscreenNavbarButton,
} from './tourFullscreenNavbarButton';
import {
  createTourToolbarToggleNavbarButton,
  syncTourToolbarToggleNavbarButton,
  syncTourToolbarToggleNavbarButtonVisibility,
} from './tourToolbarToggleNavbarButton';
import {
  bindImmersiveBackgroundNavbarButton,
  createImmersiveBackgroundNavbarButton,
  syncImmersiveBackgroundNavbarButtonVisibility,
} from './immersiveBackgroundNavbarButton';
import type { ImmersiveBackgroundController } from './immersiveBackgroundController';
import { patchZoomSliderSmoothZoom } from './patchZoomSlider';
import {
  bindPsvNavbarChromeControls,
  primePsvDesktopTouchSupport,
  syncPsvNavbarChromeControls,
} from './syncPsvNavbarDesktopControls';
import {
  LANDING_ZOOM_OUT,
  hasLandingTransitionPlayed,
  markLandingTransitionPlayed,
  pickRandomLandingView,
  playLandingTransition,
} from './landingTransition';
import { createHotspotEnterController } from './hotspotEnterAnimation';
import { upgradePsvNavbarTooltips } from './upgradePsvNavbarTooltips';
import { bindPanoramaKeyboardControl } from './panoramaKeyboardControl';

function toPsvPosition(view: ViewPosition) {
  return { yaw: deg(view.yaw), pitch: deg(view.pitch) };
}

/** Drag release coast (0–1). Higher = softer, longer deceleration. PSV default: 0.8 */
const MOVE_INERTIA = 0.92;

import type { TourViewerHandle, ViewerLoadErrorInfo } from './viewerHandle';

export type { ViewerLoadErrorInfo, TourViewerHandle } from './viewerHandle';

/**
 * PSV-specific viewer handle — extends the generic contract with
 * `hidePsvPanel` (kept for backwards compat; maps to `hideOverlayPanel`).
 */
export interface PanoramaViewerHandle extends TourViewerHandle {
  /** Close any open PSV panel (legacy overflow menu — kept for panel stack). */
  hidePsvPanel: () => void;
}

interface PanoramaViewerProps {
  tour: Tour;
  initialSceneId: string;
  /** Root element for browser fullscreen — keeps tour overlays visible. */
  fullscreenRootRef?: RefObject<HTMLElement | null>;
  controlsVisible?: boolean;
  /** Desktop — collapse/expand PSV toolbar from the bottom pill toggle. */
  onControlsToggle?: () => void;
  /** Skip landing zoom — start at scene `defaultView` (`?skipLanding=1`). */
  skipLanding?: boolean;
  /** Override landing end pose (e.g. `?no=` on the initial scene). */
  landingTargetView?: ViewPosition;
  /** True once landing may start (splash exit) — gates first-load camera motion. */
  splashDone?: boolean;
  /** Tour-scoped controller — owned by TourPage so scene nav does not reset audio. */
  immersiveBackgroundController?: ImmersiveBackgroundController | null;
  /** Tour JSON has immersive bed — navbar slot stays mounted for embed dev toggles. */
  immersiveNavbarAvailable?: boolean;
  /** Desktop toolbar collapse control — hidden in embed mode. */
  toolbarToggleAvailable?: boolean;
  /** Open naming-opportunity panel on the current scene (for default-view recenter). */
  activeNamingHotspotId?: string | null;
  /** `?embed=1` — hide glass-panel share controls (FAB Share is already hidden). */
  embed?: boolean;
  disabled?: boolean;
  suppressKeyboard?: boolean;
  onSceneChange: (sceneId: string) => void;
  onInfoHotspot: (popup: PopupContent) => void;
  /** Fires when an info hotspot becomes active on the panorama (or clears). */
  onActiveInfoHotspotChange?: (hotspotId: string | null) => void;
  /** Close modal info popup when an anchored panel opens on the panorama. */
  onDismissModalPopups?: () => void;
  /** Anchored hotspot panel on the panorama opened or closed. */
  onAnchoredPanelVisibilityChange?: (visible: boolean) => void;
  /** Scene nav from panorama hotspots — same path as location menu (TourPage handleNavigate). */
  onNavigateToScene?: (sceneId: string, targetView?: ViewPosition) => void;
  onTransitionStart: () => void;
  onTransitionEnd: () => void;
  onDevClick?: (coords: ClickCoords) => void;
  onDevViewUpdate?: (view: ViewPosition) => void;
  onViewUpdate?: (view: ViewerOrientation) => void;
  onLoadStart?: () => void;
  onLoadProgress?: (progress: number) => void;
  onLoadComplete?: () => void;
  /** Fires when the first-load landing camera animation begins. */
  onLandingStart?: () => void;
  /** Fires once when splash + landing (or skip) finish and the tour is ready to explore. */
  onInitialTourReveal?: () => void;
  /** Fires once on the first panorama drag or hotspot tap (first-visit hint dismiss). */
  onFirstPanoramaInteract?: () => void;
  onViewerLoadError?: (info: ViewerLoadErrorInfo) => void;
  onViewerLoadRecovered?: () => void;
  /** True while a naming-opportunity go (animate / navigate / open panel) is in flight. */
  onNamingOpportunityBusyChange?: (busy: boolean) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('input, textarea, select, [contenteditable="true"]');
}

function deg(value: number): string {
  return `${value}deg`;
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export const PanoramaViewer = forwardRef<
  TourViewerHandle,
  PanoramaViewerProps
>(function PanoramaViewer(
  {
    tour,
    initialSceneId,
    fullscreenRootRef,
    controlsVisible = VIEWER_CONTROLS_VISIBLE_DEFAULT,
    onControlsToggle,
    skipLanding = false,
    landingTargetView,
    splashDone = false,
    immersiveBackgroundController = null,
    immersiveNavbarAvailable = false,
    toolbarToggleAvailable = false,
    activeNamingHotspotId = null,
    embed = false,
    disabled = false,
    suppressKeyboard = false,
    onSceneChange,
    onInfoHotspot,
    onActiveInfoHotspotChange,
    onDismissModalPopups,
    onAnchoredPanelVisibilityChange,
    onNavigateToScene,
    onTransitionStart,
    onTransitionEnd,
    onDevClick,
    onDevViewUpdate,
    onViewUpdate,
    onLoadStart,
    onLoadProgress,
    onLoadComplete,
    onLandingStart,
    onInitialTourReveal,
    onFirstPanoramaInteract,
    onViewerLoadError,
    onViewerLoadRecovered,
    onNamingOpportunityBusyChange,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const virtualTourRef = useRef<VirtualTourPlugin | null>(null);
  const markersRef = useRef<MarkersPlugin | null>(null);
  const pendingSceneIdRef = useRef<string | null>(null);
  const pendingNamingInfoHotspotRef = useRef<PendingNamingInfoTarget | null>(
    null,
  );
  const goToNamingOpportunityRef = useRef<
    (sceneId: string, hotspotId: string) => boolean
  >(() => false);
  const namingOpportunityBusyRef = useRef(false);
  const deferredErrorRef = useRef<ViewerLoadErrorInfo | null>(null);
  const transitioningRef = useRef(false);
  /** Scene nav called onLoadStart — skip duplicate panorama-load start; balance on fail. */
  const navLoadProgressArmedRef = useRef(false);
  const disabledRef = useRef(disabled);
  const suppressKeyboardRef = useLatestRef(suppressKeyboard);
  const tourRef = useLatestRef(tour);
  const embedRef = useLatestRef(embed);
  const fullscreenRootRefLatest = useLatestRef(fullscreenRootRef);
  /** Fixed at mount — URL scene changes must not recreate the PSV viewer (causes black flash). */
  const initialSceneIdAtMount = useRef(initialSceneId);
  const landingTargetViewAtMount = useRef(landingTargetView);

  const keyboardControlRef = useRef<ReturnType<
    typeof bindPanoramaKeyboardControl
  > | null>(null);

  const syncKeyboardControl = () => {
    keyboardControlRef.current?.setEnabled(
      !suppressKeyboardRef.current &&
        !disabledRef.current &&
        !isTypingTarget(document.activeElement),
    );
  };

  disabledRef.current = disabled;

  const onSceneChangeRef = useLatestRef(onSceneChange);
  const onInfoHotspotRef = useLatestRef(onInfoHotspot);
  const onActiveInfoHotspotChangeRef = useLatestRef(onActiveInfoHotspotChange);
  const onDismissModalPopupsRef = useLatestRef(onDismissModalPopups);
  const onAnchoredPanelVisibilityChangeRef = useLatestRef(
    onAnchoredPanelVisibilityChange,
  );
  const onNavigateToSceneRef = useLatestRef(onNavigateToScene);
  const onTransitionStartRef = useLatestRef(onTransitionStart);
  const onTransitionEndRef = useLatestRef(onTransitionEnd);
  const onDevClickRef = useLatestRef(onDevClick);
  const onDevViewUpdateRef = useLatestRef(onDevViewUpdate);
  const onViewUpdateRef = useLatestRef(onViewUpdate);
  const onLoadStartRef = useLatestRef(onLoadStart);
  const onLoadProgressRef = useLatestRef(onLoadProgress);
  const onLoadCompleteRef = useLatestRef(onLoadComplete);
  const onLandingStartRef = useLatestRef(onLandingStart);
  const onInitialTourRevealRef = useLatestRef(onInitialTourReveal);
  const onFirstPanoramaInteractRef = useLatestRef(onFirstPanoramaInteract);
  const onViewerLoadErrorRef = useLatestRef(onViewerLoadError);
  const onViewerLoadRecoveredRef = useLatestRef(onViewerLoadRecovered);
  const onNamingOpportunityBusyChangeRef = useLatestRef(
    onNamingOpportunityBusyChange,
  );
  const splashDoneRef = useLatestRef(splashDone);
  const immersiveControllerRef = useLatestRef(immersiveBackgroundController);
  const immersiveNavbarAvailableRef = useLatestRef(immersiveNavbarAvailable);
  const toolbarToggleAvailableRef = useLatestRef(toolbarToggleAvailable);
  const activeNamingHotspotIdRef = useLatestRef(activeNamingHotspotId);
  const controlsVisibleRef = useRef(controlsVisible);
  controlsVisibleRef.current = controlsVisible;
  const onControlsToggleRef = useLatestRef(onControlsToggle);
  const initialLoadNotifiedRef = useRef(false);
  const tryStartLandingRef = useRef<(() => void) | null>(null);
  const hotspotEnterRef = useRef<ReturnType<
    typeof createHotspotEnterController
  > | null>(null);
  const reportViewerLoadErrorRef = useRef<(info: ViewerLoadErrorInfo) => void>(
    () => {},
  );
  /** Cleared before viewer.destroy() so in-flight VT node loads abort cleanly. */
  const viewerActiveRef = useRef(true);

  const releaseNamingOpportunityBusy = () => {
    if (!namingOpportunityBusyRef.current) return;
    namingOpportunityBusyRef.current = false;
    onNamingOpportunityBusyChangeRef.current?.(false);
  };

  const beginNamingOpportunityGo = () => {
    if (namingOpportunityBusyRef.current || transitioningRef.current) {
      return false;
    }
    namingOpportunityBusyRef.current = true;
    onNamingOpportunityBusyChangeRef.current?.(true);
    return true;
  };

  const finishNamingOpportunityGo = () => {
    pendingNamingInfoHotspotRef.current = null;
    releaseNamingOpportunityBusy();
  };

  const failPendingNamingInfoOpen = () => {
    if (transitioningRef.current) return;
    finishNamingOpportunityGo();
  };

  const schedulePendingNamingInfoOpenRef = useRef<() => void>(() => {});
  schedulePendingNamingInfoOpenRef.current = () => {
    const pending = pendingNamingInfoHotspotRef.current;
    const viewer = viewerRef.current;
    const markers = markersRef.current;
    const virtualTour = virtualTourRef.current;
    if (!pending || !viewer || !markers || !virtualTour) return;
    if (virtualTour.getCurrentNode()?.id !== pending.sceneId) return;

    scheduleOpenPendingNamingInfoHotspot(
      viewer,
      markers,
      () => virtualTour.getCurrentNode()?.id,
      tourRef.current,
      pending,
      (popup) => onInfoHotspotRef.current?.(popup),
      finishNamingOpportunityGo,
      failPendingNamingInfoOpen,
      embedRef.current,
    );
  };

  const endNavigation = (navOk: boolean) => {
    transitioningRef.current = false;
    onTransitionEndRef.current();

    const releaseFailedNavProgress = () => {
      if (!navLoadProgressArmedRef.current) return;
      navLoadProgressArmedRef.current = false;
      onLoadCompleteRef.current?.();
    };

    if (navOk) {
      hotspotEnterRef.current?.schedule();
      requestAnimationFrame(() => {
        schedulePendingNamingInfoOpenRef.current();
      });
    } else {
      hotspotEnterRef.current?.release();
    }

    const deferred = deferredErrorRef.current;
    deferredErrorRef.current = null;

    const targetId = deferred?.sceneId ?? pendingSceneIdRef.current;
    const currentId = virtualTourRef.current?.getCurrentNode()?.id;

    if (navOk || (targetId && currentId === targetId)) {
      pendingSceneIdRef.current = null;
      if (!navOk) {
        onViewerLoadRecoveredRef.current?.();
        releaseFailedNavProgress();
      }
      return;
    }

    pendingNamingInfoHotspotRef.current = null;
    releaseNamingOpportunityBusy();

    if (deferred) {
      viewerRef.current?.hideError();
      onViewerLoadErrorRef.current?.(deferred);
    }

    releaseFailedNavProgress();
  };

  useEffect(() => {
    if (splashDone) tryStartLandingRef.current?.();
  }, [splashDone]);

  useEffect(() => {
    setActiveInfoHotspotChangeListener((hotspotId) => {
      onActiveInfoHotspotChangeRef.current?.(hotspotId);
    });
    return () => setActiveInfoHotspotChangeListener(null);
  }, []);

  useEffect(() => {
    setAnchoredPanelVisibilityListener((open) => {
      onAnchoredPanelVisibilityChangeRef.current?.(open);
    });
    return () => setAnchoredPanelVisibilityListener(null);
  }, []);

  useEffect(() => {
    syncKeyboardControl();
  }, [suppressKeyboard, disabled]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer) return;

    const showImmersive = Boolean(immersiveBackgroundController);
    syncImmersiveBackgroundNavbarButtonVisibility(viewer, showImmersive);
    syncPsvNavbarChromeControls(viewer);
    if (!showImmersive || !immersiveBackgroundController) return;

    return bindImmersiveBackgroundNavbarButton(
      viewer,
      immersiveBackgroundController,
    );
  }, [immersiveBackgroundController, viewerReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer) return;

    const showToolbarToggle = Boolean(onControlsToggle);
    syncTourToolbarToggleNavbarButtonVisibility(viewer, showToolbarToggle);
    if (!showToolbarToggle) {
      syncPsvNavbarChromeControls(viewer);
      return;
    }

    syncTourToolbarToggleNavbarButton(viewer, !controlsVisible);
    syncPsvNavbarChromeControls(viewer);
  }, [controlsVisible, onControlsToggle, viewerReady]);

  useImperativeHandle(ref, () => ({
    navigateToScene: async (sceneId, targetView) => {
      const viewer = viewerRef.current;
      const virtualTour = virtualTourRef.current;
      if (
        !viewerActiveRef.current ||
        !viewer ||
        !virtualTour ||
        transitioningRef.current ||
        (disabledRef.current && !pendingNamingInfoHotspotRef.current)
      ) {
        return false;
      }

      pendingSceneIdRef.current = sceneId;
      deferredErrorRef.current = null;
      transitioningRef.current = true;
      hotspotEnterRef.current?.hold();
      navLoadProgressArmedRef.current = true;
      onLoadStartRef.current?.();
      onTransitionStartRef.current();

      let navOk = false;
      try {
        navOk = await navigateToScene(
          viewer,
          virtualTour,
          tourRef.current,
          sceneId,
          targetView,
          () => viewerActiveRef.current,
        );
        if (navOk) {
          onViewerLoadRecoveredRef.current?.();
        } else {
          finishNamingOpportunityGo();
        }
        return navOk;
      } finally {
        endNavigation(navOk);
      }
    },
    retryScene: async (sceneId) => {
      const viewer = viewerRef.current;
      const virtualTour = virtualTourRef.current;
      if (!viewerActiveRef.current || !viewer || !virtualTour) return false;

      const targetSceneId =
        sceneId ??
        pendingSceneIdRef.current ??
        virtualTour.getCurrentNode()?.id ??
        tourRef.current.firstScene;

      pendingSceneIdRef.current = targetSceneId;
      viewer.hideError();
      onViewerLoadRecoveredRef.current?.();

      try {
        const ok =
          (await virtualTour.setCurrentNode(targetSceneId, {
            forceUpdate: true,
          })) !== false;
        if (ok) {
          pendingSceneIdRef.current = null;
          onViewerLoadRecoveredRef.current?.();
        }
        return ok;
      } catch {
        reportViewerLoadErrorRef.current({ sceneId: targetSceneId });
        return false;
      }
    },
    clearActiveInfoHotspot: () => {
      const markers = markersRef.current;
      if (pendingNamingInfoHotspotRef.current) {
        if (markers) setActiveInfoHotspot(markers, null);
        return;
      }
      finishNamingOpportunityGo();
      if (!markers) return;
      setActiveInfoHotspot(markers, null);
    },
    hidePsvPanel: () => {
      viewerRef.current?.panel.hide();
    },
    hideOverlayPanel: () => {
      viewerRef.current?.panel.hide();
    },
    closeAnchoredPanels: () => {
      const markers = markersRef.current;
      if (!markers) return;

      closeAnchoredInfoPanel(markers, true);
      closeAnchoredNavPreviewPanel(markers, true);
      onAnchoredPanelVisibilityChangeRef.current?.(false);
    },
    goToNamingOpportunity: (sceneId, hotspotId) => {
      return goToNamingOpportunityRef.current(sceneId, hotspotId);
    },
    recenterToDefaultView: () => {
      const viewer = viewerRef.current;
      const virtualTour = virtualTourRef.current;
      if (
        !viewer ||
        !virtualTour ||
        disabledRef.current ||
        transitioningRef.current
      ) {
        return;
      }

      const sceneId = virtualTour.getCurrentNode()?.id;
      if (!sceneId) return;

      const view = resolveSceneRecenterView(
        tourRef.current,
        sceneId,
        markersRef.current,
        activeNamingHotspotIdRef.current,
      );
      if (!view) return;

      void animateViewerToView(viewer, view);
    },
    applyTourUpdate: async (nextTour) => {
      const virtualTour = virtualTourRef.current;
      if (!viewerActiveRef.current || !virtualTour) return;

      const previousTour = tourRef.current;
      const currentId =
        virtualTour.getCurrentNode()?.id ?? previousTour.firstScene;

      const nodeConfigs = buildVirtualTourNodes(nextTour);
      const prevSceneIds = new Set(Object.keys(previousTour.scenes));
      const hasStructuralSceneChange =
        nodeConfigs.some((node) => !prevSceneIds.has(node.id)) ||
        [...prevSceneIds].some((id) => !nextTour.scenes[id]);

      const nextScene = nextTour.scenes[currentId];
      if (!nextScene) {
        virtualTour.setNodes(nodeConfigs, nextTour.firstScene);
        onSceneChangeRef.current(nextTour.firstScene);
        hotspotEnterRef.current?.schedule();
        return;
      }

      // setNodes resets currentNode and re-navigates — skip for hotspot/metadata edits.
      if (hasStructuralSceneChange) {
        virtualTour.setNodes(nodeConfigs, currentId);
        hotspotEnterRef.current?.schedule();
        return;
      }

      let needsHotspotEnter = false;
      let reloadPromise: Promise<boolean> | undefined;

      for (const scene of Object.values(nextTour.scenes)) {
        const patch = buildVirtualTourNodePatch(
          previousTour.scenes[scene.id],
          scene,
        );
        if (!patch) continue;

        // updateNode with panorama reloads the texture; forceUpdate ensures same-node refresh in dev.
        if (patch.panorama && patch.id === currentId) {
          virtualTour.updateNode(patch);
          reloadPromise = virtualTour.setCurrentNode(patch.id, {
            forceUpdate: true,
            effect: resolveTourSceneTransitionEffect(nextTour),
          });
          needsHotspotEnter = true;
        } else {
          virtualTour.updateNode(patch);
          if (patch.markers && patch.id === currentId) {
            needsHotspotEnter = true;
          }
        }
      }

      if (reloadPromise) {
        await reloadPromise;
      }

      if (needsHotspotEnter) {
        hotspotEnterRef.current?.schedule();
      }
    },
    captureSceneThumbnail: async () => null,
    getCurrentView: () => {
      const viewer = viewerRef.current;
      if (!viewer) return null;
      const position = viewer.getPosition();
      const yaw = (position.yaw * 180) / Math.PI;
      const pitch = (position.pitch * 180) / Math.PI;
      const zoom = fromPsvZoom(viewer.getZoomLevel());
      return toViewPosition(yaw, pitch, zoom);
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    viewerActiveRef.current = true;
    let active = true;

    const hotspotEnter = createHotspotEnterController(
      () => containerRef.current,
    );
    hotspotEnterRef.current = hotspotEnter;
    hotspotEnter.hold();

    const sceneIdFromPanorama = (panorama?: string) => {
      if (!panorama) return undefined;
      return Object.values(tourRef.current.scenes).find(
        (scene) => scene.panorama === panorama,
      )?.id;
    };

    const isStaleLoadError = (info: ViewerLoadErrorInfo) => {
      const currentNodeId = virtualTour.getCurrentNode()?.id;
      if (!currentNodeId) return false;

      if (info.sceneId && currentNodeId === info.sceneId) {
        return true;
      }

      const currentPanorama = tourRef.current.scenes[currentNodeId]?.panorama;
      if (info.panorama && currentPanorama === info.panorama) {
        return true;
      }

      const errorSceneId =
        info.sceneId ??
        (info.panorama ? sceneIdFromPanorama(info.panorama) : undefined);

      if (errorSceneId && errorSceneId !== currentNodeId) {
        const pendingId = pendingSceneIdRef.current;
        if (pendingId && errorSceneId === pendingId) {
          return false;
        }
        return true;
      }

      return false;
    };

    const reportViewerLoadError = (info: ViewerLoadErrorInfo) => {
      if (!active) return;
      viewer.hideError();

      if (transitioningRef.current) {
        deferredErrorRef.current = info;
        return;
      }

      if (isStaleLoadError(info)) {
        return;
      }

      onViewerLoadErrorRef.current?.(info);
    };

    reportViewerLoadErrorRef.current = reportViewerLoadError;

    const tourData = tourRef.current;
    const startSceneId = initialSceneIdAtMount.current;

    const firstScene =
      tourData.scenes[startSceneId] ?? tourData.scenes[tourData.firstScene];
    const landingView =
      landingTargetViewAtMount.current ?? firstScene.defaultView;
    const randomStart = skipLanding ? landingView : pickRandomLandingView();
    let landingStarted = false;
    let landingSuppressLoadProgress = false;
    let viewerReady = false;

    const notifyInitialLoadComplete = () => {
      if (initialLoadNotifiedRef.current) return;
      initialLoadNotifiedRef.current = true;
      onLoadCompleteRef.current?.();
    };

    let initialTourRevealNotified = false;

    const tryNotifyInitialTourReveal = () => {
      if (initialTourRevealNotified) return;
      if (!initialLoadNotifiedRef.current) return;
      if (!splashDoneRef.current) return;
      if (transitioningRef.current) return;

      initialTourRevealNotified = true;
      onInitialTourRevealRef.current?.();
    };

    const recenterViewButton = createRecenterViewNavbarButton(
      () => {
        const sceneId = virtualTourRef.current?.getCurrentNode()?.id;
        if (!sceneId) return null;
        return resolveSceneRecenterView(
          tourRef.current,
          sceneId,
          markersRef.current,
          activeNamingHotspotIdRef.current,
        );
      },
      () => disabledRef.current || transitioningRef.current,
    );

    const fullscreenButton = createTourFullscreenNavbarButton(
      () => fullscreenRootRefLatest.current?.current ?? null,
    );

    const immersiveBgButton = createImmersiveBackgroundNavbarButton(
      () => immersiveControllerRef.current,
    );

    const navbarButtons: Array<string | NavbarCustomButton> = [
      'zoom',
      'move',
      recenterViewButton,
    ];
    if (immersiveNavbarAvailableRef.current) {
      navbarButtons.push(immersiveBgButton);
    }
    navbarButtons.push(fullscreenButton);
    if (toolbarToggleAvailableRef.current) {
      navbarButtons.push(
        createTourToolbarToggleNavbarButton(
          () => !controlsVisibleRef.current,
          () => onControlsToggleRef.current?.(),
        ),
      );
    }

    primePsvDesktopTouchSupport();

    const viewer = new Viewer({
      container: containerRef.current,
      minFov: PSV_MIN_FOV,
      maxFov: PSV_MAX_FOV,
      moveInertia: MOVE_INERTIA,
      canvasBackground: '#000000',
      rendererParameters: { alpha: false, antialias: true },
      navbar: navbarButtons,
      keyboard: false,
      plugins: [
        MarkersPlugin,
        [
          VirtualTourPlugin,
          {
            renderMode: '3d',
            // VT defaults: effect fade, speed 20rpm, rotation true — only hide loader
            transitionOptions: (_node: unknown, fromNode?: unknown) => {
              const effect = resolveTourSceneTransitionEffect(tourRef.current);
              return fromNode ?
                  { showLoader: false, effect, rotation: false }
                : {
                    showLoader: false,
                    speed: '0ms',
                    effect: 'none' as const,
                    rotation: false,
                    rotateTo: toPsvPosition(
                      skipLanding ? landingView : randomStart,
                    ),
                    zoomTo:
                      skipLanding ?
                        toPsvZoom(landingView.zoom)
                      : (randomStart.zoom ?? LANDING_ZOOM_OUT),
                  };
            },
          },
        ],
      ],
    });

    viewerRef.current = viewer;
    setViewerReady(true);
    upgradePsvNavbarTooltips(viewer);
    const unbindTourFullscreen = bindTourFullscreenNavbarButton(
      viewer,
      () => fullscreenRootRefLatest.current?.current ?? null,
    );
    patchZoomSliderSmoothZoom(viewer);
    const unbindDesktopNavbarControls = bindPsvNavbarChromeControls(viewer);
    const virtualTour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin);
    bindVirtualTourLifecycleGuard(virtualTour, () => viewerActiveRef.current);
    virtualTourRef.current = virtualTour;

    const tourNodes = buildVirtualTourNodes(tourData);
    const resolvedStartSceneId =
      tourData.scenes[startSceneId] ? startSceneId : tourData.firstScene;
    if (tourNodes.length > 0) {
      virtualTour.setNodes(tourNodes, resolvedStartSceneId);
    }

    const tryStartLanding = () => {
      const tourId = tourRef.current.id;
      if (
        skipLanding ||
        landingStarted ||
        hasLandingTransitionPlayed(tourId) ||
        !viewerReady ||
        !splashDoneRef.current
      ) {
        tryNotifyInitialTourReveal();
        if (
          viewerReady &&
          splashDoneRef.current &&
          initialLoadNotifiedRef.current &&
          (skipLanding || hasLandingTransitionPlayed(tourId))
        ) {
          hotspotEnter.schedule();
        }
        return;
      }
      landingStarted = true;
      markLandingTransitionPlayed(tourId);

      void (async () => {
        landingSuppressLoadProgress = true;
        transitioningRef.current = true;
        onTransitionStartRef.current();
        try {
          onLandingStartRef.current?.();
          await playLandingTransition(viewer, randomStart, landingView);
        } finally {
          landingSuppressLoadProgress = false;
          transitioningRef.current = false;
          onTransitionEndRef.current();
          tryNotifyInitialTourReveal();
          hotspotEnter.schedule();
        }
      })();
    };

    tryStartLandingRef.current = tryStartLanding;

    keyboardControlRef.current = bindPanoramaKeyboardControl(viewer, {
      isEnabled: () =>
        !suppressKeyboardRef.current &&
        !disabledRef.current &&
        !isTypingTarget(document.activeElement),
    });

    const onFocusChange = () => syncKeyboardControl();
    document.addEventListener('focusin', onFocusChange);
    document.addEventListener('focusout', onFocusChange);
    syncKeyboardControl();

    const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin)!;
    markersRef.current = markers;

    viewer.addEventListener('panorama-load', () => {
      if (landingSuppressLoadProgress) return;
      // navigateToScene already armed TourPage progress for scene transitions.
      if (transitioningRef.current) return;
      onLoadStartRef.current?.();
    });

    viewer.addEventListener('load-progress', (e) => {
      if (landingSuppressLoadProgress) return;
      onLoadProgressRef.current?.(e.progress);
    });

    viewer.addEventListener('panorama-error', (e) => {
      reportViewerLoadError({
        panorama: String(e.panorama),
        sceneId:
          pendingSceneIdRef.current ??
          sceneIdFromPanorama(String(e.panorama)) ??
          startSceneId,
      });
    });

    viewer.addEventListener('show-overlay', (e) => {
      if (e.overlayId !== 'error') return;
      reportViewerLoadError({
        sceneId: pendingSceneIdRef.current ?? startSceneId,
      });
    });

    viewer.addEventListener('panorama-loaded', () => {
      pendingSceneIdRef.current = null;

      if (pendingNamingInfoHotspotRef.current && !transitioningRef.current) {
        schedulePendingNamingInfoOpenRef.current();
      }

      if (!initialLoadNotifiedRef.current) {
        notifyInitialLoadComplete();
        const currentId = virtualTour.getCurrentNode()?.id ?? startSceneId;
        preloadOtherScenes(viewer, virtualTour, tourRef.current, currentId);
        if (skipLanding) {
          hotspotEnter.schedule();
          tryNotifyInitialTourReveal();
        }
        return;
      }

      onLoadCompleteRef.current?.();
      navLoadProgressArmedRef.current = false;
    });

    viewer.addEventListener('ready', () => {
      viewerReady = true;
      tryStartLanding();
    });

    const syncAnchoredPanelVisibility = () => {
      const open = markers
        .getMarkers()
        .some((marker) => marker.data?.infoPanel || marker.data?.navPanel);
      onAnchoredPanelVisibilityChangeRef.current?.(open);
    };

    virtualTour.addEventListener('node-changed', (e) => {
      hotspotEnter.hold();
      closeAnchoredInfoPanel(markers, false);
      closeAnchoredNavPreviewPanel(markers, false);
      onAnchoredPanelVisibilityChangeRef.current?.(false);
      onSceneChangeRef.current(e.node.id);
      deferredErrorRef.current = null;
      onViewerLoadRecoveredRef.current?.();
      preloadOtherScenes(viewer, virtualTour, tourRef.current, e.node.id);

      const pending = pendingNamingInfoHotspotRef.current;
      if (
        pending &&
        pending.sceneId === e.node.id &&
        !transitioningRef.current
      ) {
        schedulePendingNamingInfoOpenRef.current();
      }
    });

    goToNamingOpportunityRef.current = (sceneId, hotspotId) => {
      const targetView = resolveNamingOpportunityView(
        tourRef.current,
        sceneId,
        hotspotId,
      );
      if (!targetView) return false;

      const currentSceneId = virtualTour.getCurrentNode()?.id;
      const openHostId = getOpenAnchoredPanelHostId(markers);

      if (currentSceneId === sceneId && openHostId === hotspotId) {
        if (isNamingHotspotInViewport(viewer, markers, hotspotId, targetView)) {
          return true;
        }

        if (!beginNamingOpportunityGo()) return false;
        void animateViewerToView(viewer, targetView).finally(
          releaseNamingOpportunityBusy,
        );
        return true;
      }

      if (!beginNamingOpportunityGo()) return false;

      const pending: PendingNamingInfoTarget = { sceneId, hotspotId };
      pendingNamingInfoHotspotRef.current = pending;
      closeAnchoredNavPreviewPanel(markers, false);
      if (openHostId !== hotspotId) {
        closeAnchoredInfoPanel(markers, false);
        onAnchoredPanelVisibilityChangeRef.current?.(false);
      }

      const openPending = () => {
        schedulePendingNamingInfoOpenRef.current();
      };

      if (virtualTour.getCurrentNode()?.id === sceneId) {
        if (isNamingHotspotInViewport(viewer, markers, hotspotId, targetView)) {
          openPending();
          return true;
        }

        void animateViewerToView(viewer, targetView)
          .then(openPending)
          .catch(finishNamingOpportunityGo);
        return true;
      }

      onNavigateToSceneRef.current?.(sceneId, targetView);
      return true;
    };

    setNavPreviewNamingPanelHandlers({
      onGoToNaming: (infoHotspotId) => {
        const navTarget = getNavPanelNavigateTarget(markers);
        if (!navTarget) return;
        goToNamingOpportunityRef.current(navTarget.sceneId, infoHotspotId);
      },
    });

    const handlePanelPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const navPanel = target.closest('[data-nav-panel="true"]');
      if (navPanel) {
        if (target.closest('[data-nav-panel-close]')) {
          event.preventDefault();
          event.stopPropagation();
          closeAnchoredNavPreviewPanel(markers);
          onAnchoredPanelVisibilityChangeRef.current?.(false);
          return;
        }

        if (target.closest('[data-nav-panel-go]')) {
          event.preventDefault();
          event.stopPropagation();
          const navTarget = getNavPanelNavigateTarget(markers);
          closeAnchoredNavPreviewPanel(markers, false);
          if (navTarget?.canNavigate) {
            onNavigateToSceneRef.current?.(
              navTarget.sceneId,
              navTarget.targetView,
            );
          }
          return;
        }

        const shareButton = target.closest('[data-nav-panel-share]');
        if (shareButton instanceof HTMLButtonElement) {
          event.preventDefault();
          event.stopPropagation();

          const navTarget = getNavPanelNavigateTarget(markers);
          if (!navTarget?.tourId) return;

          const tour = tourRef.current;
          const sceneTitle =
            tour.scenes[navTarget.sceneId]?.title ?? navTarget.sceneId;
          const shareUrl = buildAbsoluteShareUrl({
            tourId: navTarget.tourId,
            sceneId: navTarget.sceneId,
            firstSceneId: tour.firstScene,
          });
          const message = buildShareMessage(tour.title, sceneTitle);

          void shareTourView({ shareUrl, message, preferNative: true }).then(
            (result) => {
              applyShareButtonFeedback(
                shareButton,
                result,
                TOUR_SHARE_LOCATION_LABEL,
              );
            },
          );
          return;
        }

        // Bubble phase — target already received the event; block panorama drag only.
        event.stopPropagation();
        return;
      }

      const panel = target.closest('[data-info-panel="true"]');
      if (!panel) return;

      if (target.closest('[data-info-panel-close]')) {
        event.preventDefault();
        closeAnchoredInfoPanel(markers);
        onAnchoredPanelVisibilityChangeRef.current?.(false);
        return;
      }

      const infoShareButton = target.closest('[data-info-panel-share]');
      if (infoShareButton instanceof HTMLButtonElement) {
        event.preventDefault();
        event.stopPropagation();

        const hotspotId = panel.getAttribute('data-info-panel-for');
        const tour = tourRef.current;
        const sceneId = virtualTour.getCurrentNode()?.id ?? tour.firstScene;
        const namingHotspotId =
          panel.hasAttribute('data-info-panel-naming') ? hotspotId : null;
        const sceneTitle = tour.scenes[sceneId]?.title ?? sceneId;
        const shareUrl = buildAbsoluteShareUrl({
          tourId: tour.id,
          sceneId,
          firstSceneId: tour.firstScene,
          namingHotspotId,
        });
        const message = buildShareMessage(tour.title, sceneTitle);

        void shareTourView({ shareUrl, message, preferNative: true }).then(
          (result) => {
            applyShareButtonFeedback(
              infoShareButton,
              result,
              namingHotspotId ?
                TOUR_SHARE_OPPORTUNITY_LABEL
              : TOUR_SHARE_LOCATION_LABEL,
              namingHotspotId ? TOUR_SHARE_OPPORTUNITY_ARIA : undefined,
            );
          },
        );
        return;
      }

      const videoPlayButton = target.closest('.tour-glass-panel__video-play');
      if (videoPlayButton instanceof HTMLButtonElement) {
        event.preventDefault();
        event.stopPropagation();
        const shell = videoPlayButton.closest(
          '.tour-glass-panel__video--preview',
        );
        if (shell instanceof HTMLElement) {
          mountPopupVideoPlayer(shell);
        }
        return;
      }

      const visitBtn = target.closest<HTMLElement>('[data-visit-scene]');
      if (visitBtn) {
        event.preventDefault();
        event.stopPropagation();
        const targetSceneId = visitBtn.getAttribute('data-visit-scene');
        if (targetSceneId) {
          closeAnchoredInfoPanel(markers, false);
          onNavigateToSceneRef.current?.(targetSceneId);
        }
        return;
      }

      event.stopPropagation();
    };

    const handlePanelWheel = (event: WheelEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        !target.closest('[data-info-panel="true"]') &&
        !target.closest('[data-nav-panel="true"]')
      ) {
        return;
      }
      event.stopPropagation();
    };

    const handlePanelTouchMove = (event: TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const body = target.closest('.tour-glass-panel__body');
      if (!body) return;
      if (body.scrollHeight > body.clientHeight + 1) {
        event.stopPropagation();
      }
    };

    containerRef.current.addEventListener(
      'pointerdown',
      handlePanelPointerDown,
    );
    containerRef.current.addEventListener('wheel', handlePanelWheel, {
      capture: true,
      passive: true,
    });
    containerRef.current.addEventListener('touchmove', handlePanelTouchMove, {
      capture: true,
      passive: true,
    });

    const handleMarkerSelect = (hotspot: Hotspot) => {
      try {
        if (transitioningRef.current || disabledRef.current) return;

        if (hotspot.type === 'info' && hotspot.popup) {
          closeAnchoredNavPreviewPanel(markers, false);
          if (isAnchoredPopup(hotspot.popup)) {
            onDismissModalPopupsRef.current?.();
            if (hotspot.popup.namingOpportunity) {
              const sceneId = virtualTour.getCurrentNode()?.id;
              if (!sceneId) return;

              if (getOpenAnchoredPanelHostId(markers) === hotspot.id) {
                pendingNamingInfoHotspotRef.current = null;
                closeAnchoredInfoPanel(markers, true);
                return;
              }

              goToNamingOpportunityRef.current(sceneId, hotspot.id);
              return;
            }
            setActiveInfoHotspot(markers, null);
            toggleAnchoredInfoPanel(
              viewer,
              markers,
              hotspot,
              tourRef.current,
              embedRef.current,
            );
            return;
          }
          closeAnchoredInfoPanel(markers, false);
          setActiveInfoHotspot(markers, hotspot.id);
          onInfoHotspotRef.current(hotspot.popup);
          return;
        }

        closeAnchoredInfoPanel(markers, false);
        setActiveInfoHotspot(markers, null);

        if (hotspot.type === 'nav' && hotspot.targetScene) {
          const currentSceneId =
            virtualTour.getCurrentNode()?.id ?? tourRef.current.firstScene;
          const targetView =
            hotspot.targetView ??
            tourRef.current.scenes[hotspot.targetScene]?.defaultView;

          if (hotspot.instant) {
            closeAnchoredNavPreviewPanel(markers, false);
            if (navPreviewCanNavigate(hotspot, currentSceneId)) {
              onNavigateToSceneRef.current?.(hotspot.targetScene, targetView);
            }
            return;
          }

          const preview = buildNavPreview(
            hotspot,
            tourRef.current,
            currentSceneId,
          );
          if (preview) {
            onDismissModalPopupsRef.current?.();
            setActiveInfoHotspot(markers, null);
            toggleAnchoredNavPreviewPanel(
              viewer,
              markers,
              hotspot,
              preview,
              tourRef.current.id,
              embedRef.current,
            );
            return;
          }

          closeAnchoredNavPreviewPanel(markers, false);
          if (navPreviewCanNavigate(hotspot, currentSceneId)) {
            onNavigateToSceneRef.current?.(hotspot.targetScene, targetView);
          }
        }
      } finally {
        syncAnchoredPanelVisibility();
      }
    };

    let firstPanoramaInteractNotified = false;
    const trackFirstPanoramaInteract = Boolean(
      onFirstPanoramaInteractRef.current,
    );

    const notifyFirstPanoramaInteract = () => {
      if (!trackFirstPanoramaInteract || firstPanoramaInteractNotified) return;
      firstPanoramaInteractNotified = true;
      onFirstPanoramaInteractRef.current?.();
    };

    const handleFirstInteractPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.psv-navbar')) return;
      if (target.closest('[data-info-panel="true"]')) return;
      if (target.closest('[data-nav-panel="true"]')) return;
      notifyFirstPanoramaInteract();
    };

    if (trackFirstPanoramaInteract) {
      viewer.container.addEventListener(
        'pointerdown',
        handleFirstInteractPointerDown,
      );
    }

    markers.addEventListener('select-marker', (e) => {
      notifyFirstPanoramaInteract();
      const hotspot = e.marker.data?.hotspot as Hotspot | undefined;
      if (hotspot) handleMarkerSelect(hotspot);
    });

    let devRaf = 0;
    const emitViewPosition = () => {
      if (!onDevViewUpdateRef.current && !onViewUpdateRef.current) return;
      cancelAnimationFrame(devRaf);
      devRaf = requestAnimationFrame(() => {
        const position = viewer.getPosition();
        const yaw = (position.yaw * 180) / Math.PI;
        const pitch = (position.pitch * 180) / Math.PI;
        const zoom = fromPsvZoom(viewer.getZoomLevel());
        const vFov = viewer.dataHelper.zoomLevelToFov(viewer.getZoomLevel());
        const hFov = viewer.dataHelper.vFovToHFov(vFov);

        onDevViewUpdateRef.current?.(toViewPosition(yaw, pitch, zoom));
        onViewUpdateRef.current?.({ yaw, pitch, zoom, hFov });
      });
    };

    // Run after markers-plugin renderMarkers (registered earlier on same event).
    const syncAnchoredPanelPositions = () => {
      syncNavPreviewPanelPosition(viewer, markers);
      syncInfoPanelPosition(viewer, markers);
    };

    viewer.addEventListener('render', syncAnchoredPanelPositions);

    const trackViewOrientation =
      Boolean(onDevViewUpdateRef.current) || Boolean(onViewUpdateRef.current);

    if (trackViewOrientation) {
      viewer.addEventListener('position-updated', emitViewPosition);
      viewer.addEventListener('zoom-updated', emitViewPosition);
      viewer.addEventListener('ready', emitViewPosition);
      viewer.addEventListener('panorama-loaded', emitViewPosition);
      virtualTour.addEventListener('node-changed', emitViewPosition);
    }

    viewer.addEventListener('click', (e) => {
      if (!onDevClickRef.current) return;

      const coords = {
        yaw: (e.data.yaw * 180) / Math.PI,
        pitch: (e.data.pitch * 180) / Math.PI,
      };
      const sceneId = virtualTour.getCurrentNode()?.id ?? startSceneId;
      logHotspotClick(coords, {
        id: sceneId,
        title: tourRef.current.scenes[sceneId]?.title,
        tourId: tourRef.current.id,
        clientId: tourRef.current.clientId ?? tourRef.current.id,
      });
      onDevClickRef.current(coords);
    });

    return () => {
      active = false;
      viewerActiveRef.current = false;
      deferredErrorRef.current = null;
      pendingNamingInfoHotspotRef.current = null;
      setNavPreviewNamingPanelHandlers(null);
      reportViewerLoadErrorRef.current = () => {};
      tryStartLandingRef.current = null;
      hotspotEnter.destroy();
      hotspotEnterRef.current = null;
      cancelAnimationFrame(devRaf);
      viewer.removeEventListener('render', syncAnchoredPanelPositions);
      viewer.container.removeEventListener(
        'pointerdown',
        handleFirstInteractPointerDown,
      );
      containerRef.current?.removeEventListener(
        'pointerdown',
        handlePanelPointerDown,
      );
      containerRef.current?.removeEventListener(
        'wheel',
        handlePanelWheel,
        true,
      );
      containerRef.current?.removeEventListener(
        'touchmove',
        handlePanelTouchMove,
        true,
      );
      document.removeEventListener('focusin', onFocusChange);
      document.removeEventListener('focusout', onFocusChange);
      keyboardControlRef.current?.destroy();
      keyboardControlRef.current = null;
      unbindTourFullscreen();
      unbindDesktopNavbarControls();
      releaseAllTourMedia();
      viewer.destroy();
      viewerRef.current = null;
      setViewerReady(false);
      virtualTourRef.current = null;
      markersRef.current = null;
    };
  }, [tour.id, skipLanding]);

  useEffect(() => {
    const scope = fullscreenRootRef?.current;
    if (!scope) return;

    return bindViewerPerfPause({ scope, getViewer: () => viewerRef.current });
  }, [fullscreenRootRef]);

  return (
    <div
      ref={containerRef}
      className={`viewer-container${controlsVisible ? '' : ' viewer-container--controls-collapsed'}`}
    />
  );
});
