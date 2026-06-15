import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefObject,
} from 'react';
import { CONSTANTS, Viewer } from '@photo-sphere-viewer/core';
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
import { buildNavPreview } from '../utils/navPreview';
import type { ClickCoords } from '../utils/devHotspotLogger';
import { logHotspotClick, toViewPosition } from '../utils/devHotspotLogger';
import { fromPsvZoom, toPsvZoom } from '../utils/psvZoom';
import { VIEWER_CONTROLS_VISIBLE_DEFAULT } from '../utils/viewerControlsPreference';
import { hotspotToMarkerConfig } from './buildMarkers';
import {
  closeAnchoredInfoPanel,
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
} from './pendingNamingInfoHotspot';
import {
  setActiveInfoHotspot,
  setActiveInfoHotspotChangeListener,
} from './infoHotspotActive';
import { navigateToScene, preloadOtherScenes } from './transition';
import { createRecenterViewNavbarButton } from './recenterViewNavbarButton';
import {
  bindTourFullscreenNavbarButton,
  createTourFullscreenNavbarButton,
} from './tourFullscreenNavbarButton';
import { patchZoomSliderSmoothZoom } from './patchZoomSlider';
import {
  LANDING_ZOOM_OUT,
  pickRandomLandingView,
  playLandingTransition,
} from './landingTransition';

function toPsvPosition(view: ViewPosition) {
  return { yaw: deg(view.yaw), pitch: deg(view.pitch) };
}

/** PSV FOV limits (°). Lower minFov = tighter zoom in; higher maxFov = wider zoom out. */
const MIN_FOV = 18;
const MAX_FOV = 105;
/** Drag release coast (0–1). Higher = softer, longer deceleration. PSV default: 0.8 */
const MOVE_INERTIA = 0.92;

export interface PanoramaLoadErrorInfo {
  sceneId?: string;
  panorama?: string;
}

export interface PanoramaViewerHandle {
  navigateToScene: (
    sceneId: string,
    targetView?: ViewPosition,
  ) => Promise<boolean>;
  retryScene: (sceneId?: string) => Promise<boolean>;
  clearActiveInfoHotspot: () => void;
  goToNamingOpportunity: (sceneId: string, hotspotId: string) => void;
}

interface PanoramaViewerProps {
  tour: Tour;
  initialSceneId: string;
  /** Root element for browser fullscreen — keeps tour overlays visible. */
  fullscreenRootRef?: RefObject<HTMLElement | null>;
  controlsVisible?: boolean;
  devMode?: boolean;
  /** True once first-load splash begins dismissing — gates landing transition. */
  splashDone?: boolean;
  disabled?: boolean;
  suppressKeyboard?: boolean;
  onSceneChange: (sceneId: string) => void;
  onInfoHotspot: (popup: PopupContent) => void;
  /** Fires when an info hotspot becomes active on the panorama (or clears). */
  onActiveInfoHotspotChange?: (hotspotId: string | null) => void;
  /** Close modal info popup when an anchored panel opens on the panorama. */
  onDismissModalPopups?: () => void;
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
  onPanoramaError?: (info: PanoramaLoadErrorInfo) => void;
  onPanoramaRecovered?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('input, textarea, select, [contenteditable="true"]');
}

function deg(value: number): string {
  return `${value}deg`;
}

function buildNodes(tour: Tour) {
  return Object.values(tour.scenes).map((scene) => ({
    id: scene.id,
    name: scene.title,
    panorama: scene.panorama,
    links: [],
    markers: scene.hotspots.map(hotspotToMarkerConfig),
  }));
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export const PanoramaViewer = forwardRef<
  PanoramaViewerHandle,
  PanoramaViewerProps
>(function PanoramaViewer(
  {
    tour,
    initialSceneId,
    fullscreenRootRef,
    controlsVisible = VIEWER_CONTROLS_VISIBLE_DEFAULT,
    devMode = false,
    splashDone = false,
    disabled = false,
    suppressKeyboard = false,
    onSceneChange,
    onInfoHotspot,
    onActiveInfoHotspotChange,
    onDismissModalPopups,
    onNavigateToScene,
    onTransitionStart,
    onTransitionEnd,
    onDevClick,
    onDevViewUpdate,
    onViewUpdate,
    onLoadStart,
    onLoadProgress,
    onLoadComplete,
    onPanoramaError,
    onPanoramaRecovered,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const virtualTourRef = useRef<VirtualTourPlugin | null>(null);
  const markersRef = useRef<MarkersPlugin | null>(null);
  const pendingSceneIdRef = useRef<string | null>(null);
  const pendingNamingInfoHotspotRef = useRef<PendingNamingInfoTarget | null>(
    null,
  );
  const goToNamingOpportunityRef = useRef<
    (sceneId: string, hotspotId: string) => void
  >(() => {});
  const deferredErrorRef = useRef<PanoramaLoadErrorInfo | null>(null);
  const transitioningRef = useRef(false);
  const disabledRef = useRef(disabled);
  const suppressKeyboardRef = useLatestRef(suppressKeyboard);
  const tourRef = useLatestRef(tour);
  const fullscreenRootRefLatest = useLatestRef(fullscreenRootRef);
  /** Fixed at mount — URL scene changes must not recreate the PSV viewer (causes black flash). */
  const initialSceneIdAtMount = useRef(initialSceneId);

  const syncKeyboardControl = (viewer: Viewer) => {
    if (
      suppressKeyboardRef.current ||
      disabledRef.current ||
      isTypingTarget(document.activeElement)
    ) {
      viewer.stopKeyboardControl();
    } else {
      viewer.startKeyboardControl();
    }
  };

  disabledRef.current = disabled;

  const onSceneChangeRef = useLatestRef(onSceneChange);
  const onInfoHotspotRef = useLatestRef(onInfoHotspot);
  const onActiveInfoHotspotChangeRef = useLatestRef(onActiveInfoHotspotChange);
  const onDismissModalPopupsRef = useLatestRef(onDismissModalPopups);
  const onNavigateToSceneRef = useLatestRef(onNavigateToScene);
  const onTransitionStartRef = useLatestRef(onTransitionStart);
  const onTransitionEndRef = useLatestRef(onTransitionEnd);
  const onDevClickRef = useLatestRef(onDevClick);
  const onDevViewUpdateRef = useLatestRef(onDevViewUpdate);
  const onViewUpdateRef = useLatestRef(onViewUpdate);
  const onLoadStartRef = useLatestRef(onLoadStart);
  const onLoadProgressRef = useLatestRef(onLoadProgress);
  const onLoadCompleteRef = useLatestRef(onLoadComplete);
  const onPanoramaErrorRef = useLatestRef(onPanoramaError);
  const onPanoramaRecoveredRef = useLatestRef(onPanoramaRecovered);
  const splashDoneRef = useLatestRef(splashDone);
  const tryStartLandingRef = useRef<(() => void) | null>(null);
  const reportPanoramaErrorRef = useRef<(info: PanoramaLoadErrorInfo) => void>(
    () => {},
  );

  const endNavigation = (navOk: boolean) => {
    transitioningRef.current = false;
    onTransitionEndRef.current();

    const deferred = deferredErrorRef.current;
    deferredErrorRef.current = null;

    const targetId = deferred?.sceneId ?? pendingSceneIdRef.current;
    const currentId = virtualTourRef.current?.getCurrentNode()?.id;

    if (navOk || (targetId && currentId === targetId)) {
      pendingSceneIdRef.current = null;
      if (!navOk) {
        onPanoramaRecoveredRef.current?.();
      }
      return;
    }

    pendingNamingInfoHotspotRef.current = null;

    if (deferred) {
      viewerRef.current?.hideError();
      onPanoramaErrorRef.current?.(deferred);
    }
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
    const viewer = viewerRef.current;
    if (viewer) syncKeyboardControl(viewer);
  }, [suppressKeyboard, disabled]);

  useImperativeHandle(ref, () => ({
    navigateToScene: async (sceneId, targetView) => {
      const viewer = viewerRef.current;
      const virtualTour = virtualTourRef.current;
      if (
        !viewer ||
        !virtualTour ||
        transitioningRef.current ||
        disabledRef.current
      ) {
        return false;
      }

      pendingSceneIdRef.current = sceneId;
      deferredErrorRef.current = null;
      transitioningRef.current = true;
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
        );
        if (navOk) {
          onPanoramaRecoveredRef.current?.();
        } else {
          pendingNamingInfoHotspotRef.current = null;
        }
        return navOk;
      } finally {
        endNavigation(navOk);
      }
    },
    retryScene: async (sceneId) => {
      const viewer = viewerRef.current;
      const virtualTour = virtualTourRef.current;
      if (!viewer || !virtualTour) return false;

      const targetSceneId =
        sceneId ??
        pendingSceneIdRef.current ??
        virtualTour.getCurrentNode()?.id ??
        tourRef.current.firstScene;

      pendingSceneIdRef.current = targetSceneId;
      viewer.hideError();
      onPanoramaRecoveredRef.current?.();

      try {
        const ok =
          (await virtualTour.setCurrentNode(targetSceneId, {
            forceUpdate: true,
          })) !== false;
        if (ok) {
          pendingSceneIdRef.current = null;
          onPanoramaRecoveredRef.current?.();
        }
        return ok;
      } catch {
        reportPanoramaErrorRef.current({ sceneId: targetSceneId });
        return false;
      }
    },
    clearActiveInfoHotspot: () => {
      if (!markersRef.current) return;
      setActiveInfoHotspot(markersRef.current, null);
    },
    goToNamingOpportunity: (sceneId, hotspotId) => {
      goToNamingOpportunityRef.current(sceneId, hotspotId);
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;

    const sceneIdFromPanorama = (panorama?: string) => {
      if (!panorama) return undefined;
      return Object.values(tourRef.current.scenes).find(
        (scene) => scene.panorama === panorama,
      )?.id;
    };

    const isStaleLoadError = (info: PanoramaLoadErrorInfo) => {
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

    const reportPanoramaError = (info: PanoramaLoadErrorInfo) => {
      if (!active) return;
      viewer.hideError();

      if (transitioningRef.current) {
        deferredErrorRef.current = info;
        return;
      }

      if (isStaleLoadError(info)) {
        return;
      }

      onPanoramaErrorRef.current?.(info);
    };

    reportPanoramaErrorRef.current = reportPanoramaError;

    const tourData = tourRef.current;
    const startSceneId = initialSceneIdAtMount.current;

    const firstScene =
      tourData.scenes[startSceneId] ?? tourData.scenes[tourData.firstScene];
    const initialView = firstScene.defaultView;
    const randomStart = devMode ? initialView : pickRandomLandingView();
    let landingStarted = false;
    let landingSuppressLoadProgress = false;
    let viewerReady = false;
    let initialLoadNotified = false;

    const notifyInitialLoadComplete = () => {
      if (initialLoadNotified) return;
      initialLoadNotified = true;
      onLoadCompleteRef.current?.();
    };

    const recenterViewButton = createRecenterViewNavbarButton(
      () => {
        const sceneId = virtualTourRef.current?.getCurrentNode()?.id;
        if (!sceneId) return null;
        return tourRef.current.scenes[sceneId]?.defaultView ?? null;
      },
      () => disabledRef.current || transitioningRef.current,
    );

    const fullscreenButton = createTourFullscreenNavbarButton(
      () => fullscreenRootRefLatest.current?.current ?? null,
    );

    const viewer = new Viewer({
      container: containerRef.current,
      minFov: MIN_FOV,
      maxFov: MAX_FOV,
      moveInertia: MOVE_INERTIA,
      canvasBackground: '#000000',
      rendererParameters: { alpha: false, antialias: true },
      navbar: ['zoom', 'move', recenterViewButton, fullscreenButton],
      keyboard: 'always',
      keyboardActions: {
        [CONSTANTS.KEY_CODES.ArrowUp]: CONSTANTS.ACTIONS.ROTATE_UP,
        [CONSTANTS.KEY_CODES.ArrowDown]: CONSTANTS.ACTIONS.ROTATE_DOWN,
        [CONSTANTS.KEY_CODES.ArrowRight]: CONSTANTS.ACTIONS.ROTATE_RIGHT,
        [CONSTANTS.KEY_CODES.ArrowLeft]: CONSTANTS.ACTIONS.ROTATE_LEFT,
        [CONSTANTS.KEY_CODES.PageUp]: CONSTANTS.ACTIONS.ZOOM_IN,
        [CONSTANTS.KEY_CODES.PageDown]: CONSTANTS.ACTIONS.ZOOM_OUT,
        [CONSTANTS.KEY_CODES.Plus]: CONSTANTS.ACTIONS.ZOOM_IN,
        'Shift+Plus': CONSTANTS.ACTIONS.ZOOM_IN,
        [CONSTANTS.KEY_CODES.Minus]: CONSTANTS.ACTIONS.ZOOM_OUT,
      },
      plugins: [
        MarkersPlugin,
        [
          VirtualTourPlugin,
          {
            renderMode: '3d',
            // VT defaults: effect fade, speed 20rpm, rotation true — only hide loader
            transitionOptions: (_node: unknown, fromNode?: unknown) =>
              fromNode ?
                { showLoader: false, effect: 'fade' as const, rotation: false }
              : {
                  showLoader: false,
                  speed: '0ms',
                  effect: 'none' as const,
                  rotation: false,
                  rotateTo: toPsvPosition(devMode ? initialView : randomStart),
                  zoomTo:
                    devMode ? toPsvZoom(initialView.zoom) : LANDING_ZOOM_OUT,
                },
            nodes: buildNodes(tourData),
            startNodeId: startSceneId,
          },
        ],
      ],
    });

    viewerRef.current = viewer;
    const unbindTourFullscreen = bindTourFullscreenNavbarButton(
      viewer,
      () => fullscreenRootRefLatest.current?.current ?? null,
    );
    patchZoomSliderSmoothZoom(viewer);
    const virtualTour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin);
    virtualTourRef.current = virtualTour;

    const tryStartLanding = () => {
      if (devMode || landingStarted || !viewerReady || !splashDoneRef.current) {
        return;
      }
      landingStarted = true;

      void (async () => {
        landingSuppressLoadProgress = true;
        transitioningRef.current = true;
        onTransitionStartRef.current();
        try {
          await playLandingTransition(viewer, randomStart, initialView);
        } finally {
          landingSuppressLoadProgress = false;
          transitioningRef.current = false;
          onTransitionEndRef.current();
        }
      })();
    };

    tryStartLandingRef.current = tryStartLanding;

    const onFocusChange = () => syncKeyboardControl(viewer);
    document.addEventListener('focusin', onFocusChange);
    document.addEventListener('focusout', onFocusChange);
    syncKeyboardControl(viewer);

    const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin)!;
    markersRef.current = markers;

    viewer.addEventListener('panorama-load', () => {
      if (landingSuppressLoadProgress) return;
      onLoadStartRef.current?.();
    });

    viewer.addEventListener('load-progress', (e) => {
      if (landingSuppressLoadProgress) return;
      onLoadProgressRef.current?.(e.progress);
    });

    viewer.addEventListener('panorama-error', (e) => {
      reportPanoramaError({
        panorama: String(e.panorama),
        sceneId:
          pendingSceneIdRef.current ??
          sceneIdFromPanorama(String(e.panorama)) ??
          startSceneId,
      });
    });

    viewer.addEventListener('show-overlay', (e) => {
      if (e.overlayId !== 'error') return;
      reportPanoramaError({
        sceneId: pendingSceneIdRef.current ?? startSceneId,
      });
    });

    viewer.addEventListener('panorama-loaded', () => {
      pendingSceneIdRef.current = null;

      if (pendingNamingInfoHotspotRef.current) {
        scheduleOpenPendingNamingInfoHotspot(
          viewer,
          markers,
          () => virtualTour.getCurrentNode()?.id,
          tourRef.current,
          pendingNamingInfoHotspotRef.current,
          (popup) => onInfoHotspotRef.current?.(popup),
          () => {
            pendingNamingInfoHotspotRef.current = null;
          },
        );
      }

      if (!initialLoadNotified) {
        notifyInitialLoadComplete();
        const currentId = virtualTour.getCurrentNode()?.id ?? startSceneId;
        preloadOtherScenes(viewer, virtualTour, tourRef.current, currentId);
        return;
      }

      onLoadCompleteRef.current?.();
    });

    viewer.addEventListener('ready', () => {
      viewerReady = true;
      tryStartLanding();
    });

    virtualTour.addEventListener('node-changed', (e) => {
      closeAnchoredInfoPanel(markers, false);
      closeAnchoredNavPreviewPanel(markers, false);
      onSceneChangeRef.current(e.node.id);
      deferredErrorRef.current = null;
      onPanoramaRecoveredRef.current?.();
      preloadOtherScenes(viewer, virtualTour, tourRef.current, e.node.id);

      const pending = pendingNamingInfoHotspotRef.current;
      if (pending && pending.sceneId === e.node.id) {
        scheduleOpenPendingNamingInfoHotspot(
          viewer,
          markers,
          () => virtualTour.getCurrentNode()?.id,
          tourRef.current,
          pending,
          (popup) => onInfoHotspotRef.current?.(popup),
          () => {
            pendingNamingInfoHotspotRef.current = null;
          },
        );
      }
    });

    goToNamingOpportunityRef.current = (sceneId, hotspotId) => {
      const targetView = resolveNamingOpportunityView(
        tourRef.current,
        sceneId,
        hotspotId,
      );
      if (!targetView) return;

      const pending: PendingNamingInfoTarget = { sceneId, hotspotId };
      pendingNamingInfoHotspotRef.current = pending;
      closeAnchoredNavPreviewPanel(markers, false);
      closeAnchoredInfoPanel(markers, false);

      const openPending = () => {
        scheduleOpenPendingNamingInfoHotspot(
          viewer,
          markers,
          () => virtualTour.getCurrentNode()?.id,
          tourRef.current,
          pending,
          (popup) => onInfoHotspotRef.current?.(popup),
          () => {
            pendingNamingInfoHotspotRef.current = null;
          },
        );
      };

      if (virtualTour.getCurrentNode()?.id === sceneId) {
        if (isNamingHotspotInViewport(viewer, markers, hotspotId, targetView)) {
          openPending();
          return;
        }

        void animateViewerToView(viewer, targetView).then(openPending);
        return;
      }

      onNavigateToSceneRef.current?.(sceneId, targetView);
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
          return;
        }

        if (target.closest('[data-nav-panel-go]')) {
          event.preventDefault();
          event.stopPropagation();
          const navTarget = getNavPanelNavigateTarget(markers);
          closeAnchoredNavPreviewPanel(markers, false);
          if (navTarget) {
            onNavigateToSceneRef.current?.(
              navTarget.sceneId,
              navTarget.targetView,
            );
          }
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
      if (transitioningRef.current || disabledRef.current) return;

      if (hotspot.type === 'info' && hotspot.popup) {
        closeAnchoredNavPreviewPanel(markers, false);
        if (isAnchoredPopup(hotspot.popup)) {
          onDismissModalPopupsRef.current?.();
          setActiveInfoHotspot(markers, null);
          toggleAnchoredInfoPanel(viewer, markers, hotspot, tourRef.current);
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
        const targetView =
          hotspot.targetView ??
          tourRef.current.scenes[hotspot.targetScene]?.defaultView;

        if (hotspot.instant) {
          closeAnchoredNavPreviewPanel(markers, false);
          onNavigateToSceneRef.current?.(hotspot.targetScene, targetView);
          return;
        }

        const preview = buildNavPreview(hotspot, tourRef.current);
        if (preview) {
          onDismissModalPopupsRef.current?.();
          setActiveInfoHotspot(markers, null);
          toggleAnchoredNavPreviewPanel(viewer, markers, hotspot, preview);
          return;
        }

        closeAnchoredNavPreviewPanel(markers, false);
        onNavigateToSceneRef.current?.(hotspot.targetScene, targetView);
      }
    };

    markers.addEventListener('select-marker', (e) => {
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

    const trackViewOrientation = devMode || Boolean(onViewUpdateRef.current);

    if (trackViewOrientation) {
      viewer.addEventListener('position-updated', emitViewPosition);
      viewer.addEventListener('zoom-updated', emitViewPosition);
      viewer.addEventListener('ready', emitViewPosition);
      viewer.addEventListener('panorama-loaded', emitViewPosition);
      virtualTour.addEventListener('node-changed', emitViewPosition);
    }

    if (devMode) {
      viewer.addEventListener('click', (e) => {
        const coords = {
          yaw: (e.data.yaw * 180) / Math.PI,
          pitch: (e.data.pitch * 180) / Math.PI,
        };
        const sceneId = virtualTour.getCurrentNode()?.id ?? startSceneId;
        logHotspotClick(coords, {
          id: sceneId,
          title: tourRef.current.scenes[sceneId]?.title,
          clientId: tourRef.current.id,
        });
        onDevClickRef.current?.(coords);
      });
    }

    return () => {
      active = false;
      deferredErrorRef.current = null;
      pendingNamingInfoHotspotRef.current = null;
      setNavPreviewNamingPanelHandlers(null);
      reportPanoramaErrorRef.current = () => {};
      tryStartLandingRef.current = null;
      cancelAnimationFrame(devRaf);
      viewer.removeEventListener('render', syncAnchoredPanelPositions);
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
      unbindTourFullscreen();
      viewer.destroy();
      viewerRef.current = null;
      virtualTourRef.current = null;
      markersRef.current = null;
    };
  }, [tour.id, devMode]);

  return (
    <div
      ref={containerRef}
      className={`viewer-container${controlsVisible ? '' : ' viewer-container--controls-hidden'}`}
    />
  );
});
