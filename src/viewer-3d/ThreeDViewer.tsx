/**
 * Three.js 3D walkthrough viewer — GLTF scene with first-person camera.
 *
 * Implements TourViewerHandle so TourPage can drive it identically to PSV.
 * Lazy-loaded via React.lazy() — only included in bundle when viewerType='model3d'.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/addons/renderers/CSS2DRenderer.js';

import type {
  Tour,
  ViewPosition,
  PopupContent,
  Hotspot,
  NavPreviewContent,
} from '../types/tour';
import { isWorldPosition } from '../types/tour';
import type { PlayTourPhase } from '../hooks/usePlayTour';
import { buildHotspotMarkerHtml } from '../viewer-shared/buildMarkers';
import { attachHotspotInfoPulseScaleSync } from '../viewer-shared/hotspotInfoPulse';
import {
  findHotspotInTour,
  resolveModel3dNamingTargetView,
} from '../utils/findTourHotspot';
import {
  resolveHotspotHostScene,
  resolveNamingPopup,
} from '../utils/namingSceneInherit';
import { resolveTourSceneModelUrl } from '../utils/resolveTourModelUrl';
import { resolveSceneHotspots } from '../utils/resolveSceneHotspots';
import { VIEWER_MARKER_AUDIENCE } from '../utils/sceneVisibility';
import { parseModel3dSceneTransitionDurationMs } from '../utils/tourTransition';
import type {
  TourViewerHandle,
  ViewerLoadErrorInfo,
} from '../viewer-shared/viewerHandle';

export type { ViewerLoadErrorInfo } from '../viewer-shared/viewerHandle';
import type { ImmersiveBackgroundController } from '../viewer-shared/immersiveBackgroundController';
import {
  buildAnchoredNavPreviewHtml,
  buildAnchoredPopupHtml,
  initPopupVideoPlayers,
} from '../components/tourGlassPanelHtml';
import { buildNavPreview, navPreviewCanNavigate } from '../utils/navPreview';
import {
  bindNavPreviewNamingAccordion,
  setNavPreviewNamingPanelHandlers,
} from '../viewer-shared/navPreviewNamingAccordion';
import { animateNavPreviewTotal } from '../viewer-shared/navPreviewTotalCount';
import {
  destroyNavPreviewMiniViewer,
  dismissNavPreviewHero,
  isNavPreviewMiniViewerEnabled,
  mountNavPreviewImageHero,
  mountNavPreviewMiniViewer,
  mountNavPreviewVideoHero,
  prepareNavPreviewHeroLayout,
} from '../viewer-shared/navPreviewMiniViewer';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  hasLandingTransitionPlayed,
  markLandingTransitionPlayed,
} from '../viewer-shared/landingTransitionState';
import {
  createHotspotEnterController,
  HOTSPOT_ENTER_3D,
  type HotspotEnterController,
} from '../viewer-shared/hotspotEnterAnimation';
import {
  collectFloorRaycastTargets,
  createFloorCursorRing,
  isFinePointerDevice,
  isPointerOverHotspotUi,
  isViewerOverlayUiTarget,
  resolveFloorClickPoint,
} from './floorCursorRing';
import {
  SKETCHFAB_ORBIT_DAMPING,
  SKETCHFAB_PAN_SPEED,
  SKETCHFAB_ROTATE_SPEED,
  SKETCHFAB_ZOOM_SPEED,
} from './sketchfabNavigation';
import {
  applyAdaptiveOrbitSpeeds,
  measureModelNavigationScale,
  resolveAdaptiveWalkSpeed,
  FOCUS_CLICK_EYE_HEIGHT,
  resolveFocusClickMovePose,
  tightenOrbitPivotIfOversized,
  type ModelNavigationScale,
} from './adaptiveOrbitNavigation';
import {
  attachSmoothOrbitZoom,
  ORBIT_ZOOM_BUTTON_DELTA_Y,
  orbitDistanceToZoomLevel,
  zoomLevelToOrbitDistance,
  type SmoothOrbitZoomHandle,
} from './smoothOrbitZoom';
import {
  enhanceModelLightingResponse,
  enableModelShadowCasting,
} from './enhanceModelLighting';
import { createModelContactShadow } from './modelContactShadow';
import {
  createModelGroundSurface,
  placeModelStudioLights,
} from './modelGroundSurface';
import {
  getModel3dDebugLights,
  subscribeModel3dDebugLights,
} from './model3dDebugLights';
import { applyModel3dStudioLightLook } from './model3dStudioLightLook';
import {
  computeHeroLandingAnim,
  heroLandingStartPose,
  tickSphericalLandingAnim,
  type LandingCameraPose,
  type SphericalLandingAnim,
} from './landingCamera';
import {
  tickDualTargetCameraAnim,
  type DualTargetCameraAnim,
} from './dualTargetCameraAnim';
import { computeModelOrbitCenter } from './modelOrbitCenter';
import {
  setDevFocusedHotspot3d,
  setDevMovingHotspot3d,
} from '../viewer-shared/devHotspotFocus';
import {
  diffHotspotMarkers,
  hotspotMarkerDiffHasChanges,
} from '../viewer-shared/hotspotMarkerDiff';
import {
  HOTSPOT_CAMERA_TRANSITION_TIMING,
  RECENTER_CAMERA_TRANSITION_TIMING,
  SCENE_CAMERA_TRANSITION_TIMING,
  resolveCameraTransitionDurationMs,
  resolveCameraViewTransitionDurationMs,
  type CameraTransitionDurationOptions,
} from './cameraTransitionDuration';
import { attachViewerDragCursors } from './viewerDragCursors';
import {
  resolvePanelFramingView3d,
  waitForAnchoredPanelLayout,
  waitForPanelEnterAnimation,
} from './panelViewportFit3d';
import { ANCHORED_PANEL_EXIT_MS } from '../viewer-shared/anchoredPanelLayout';
import {
  absoluteYawDeltaDeg,
  resolveAnchoredPanelNudgeDurationMs,
} from '../viewer-shared/anchoredPanelClipNudge';
import { runAnchoredPanelOpenReveal } from '../viewer-shared/anchoredPanelOpenReveal';
import { ThreeDViewerControls } from './ThreeDViewerControls';
import { cn } from '../lib/cn';
import { VIEWER_CONTROLS_VISIBLE_DEFAULT } from '../utils/viewerControlsPreference';
import { enterImmersiveVr, exitImmersiveVr } from '../viewer-xr/webxrSession';

export interface ThreeDViewerProps {
  tour: Tour;
  initialSceneId: string;
  disabled?: boolean;
  /** Browser fullscreen active — icon + label state from TourPage. */
  fullscreenActive?: boolean;
  onFullscreenToggle?: () => void;
  /** Desktop — when false, hide the bottom control pill (FAB lives on TourPage). */
  controlsVisible?: boolean;
  /** Tour JSON has immersive bed — show ambience control. */
  immersiveNavbarAvailable?: boolean;
  /** Guided Play Tour control — hidden when tour has no valid `playTour`. */
  playTourEnabled?: boolean;
  playTourPhase?: PlayTourPhase;
  onPlayTourToggle?: () => void;
  /** `?dev=1` — allow nav hotspots to internal scenes. */
  devMode?: boolean;
  /** WebXR presenting state for TourPage chrome (hide Explore / Ask Guide). */
  onXrPresentingChange?: (presenting: boolean) => void;
  onSceneChange: (sceneId: string) => void;
  onInfoHotspot: (popup: PopupContent) => void;
  onNavigateToScene?: (sceneId: string, targetView?: ViewPosition) => void;
  onTransitionStart: () => void;
  onTransitionEnd: () => void;
  onLoadStart?: () => void;
  onLoadProgress?: (progress: number) => void;
  onLoadComplete?: () => void;
  onInitialTourReveal?: () => void;
  /** Skip landing camera animation — start at scene defaultView. */
  skipLanding?: boolean;
  /** True once splash may exit — gates first-load camera motion (matches PSV). */
  splashDone?: boolean;
  /** Fires when the landing fly-in begins (triggers splash fade). */
  onLandingStart?: () => void;
  onDevClick?: (coords: ClickCoords) => void;
  /**
   * When true (dev hotspot create / relocate armed), canvas clicks capture
   * world coords and skip floor click-to-move.
   */
  devHotspotPlacementCapture?: boolean;
  /** Manage → Move — hotspot id armed for drag-drop reposition. */
  devHotspotMoveId?: string | null;
  /** Fired on drag drop with the new world position. */
  onDevHotspotMoved?: (position: { x: number; y: number; z: number }) => void;
  onDevViewUpdate?: (view: ViewPosition) => void;
  onActiveInfoHotspotChange?: (hotspotId: string | null) => void;
  onAnchoredPanelVisibilityChange?: (visible: boolean) => void;
  immersiveBackgroundController?: ImmersiveBackgroundController | null;
  onViewerLoadError?: (info: ViewerLoadErrorInfo) => void;
  onViewerLoadRecovered?: () => void;
}

const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_HEIGHT = 1.6;
const FOCUS_CLICK_MOVE_DURATION_MS = 600;
const PANEL_EXIT_MS = ANCHORED_PANEL_EXIT_MS;

type SceneTransitionTiming = number | CameraTransitionDurationOptions;

function resolveHotspotPanelView(
  tour: Tour,
  hotspot: Hotspot,
): ViewPosition | null {
  if (hotspot.targetView) return hotspot.targetView;
  if (hotspot.popup?.namingOpportunity) {
    return (
      resolveModel3dNamingTargetView(tour, hotspot, hotspot.sceneId) ?? null
    );
  }
  return null;
}

// -- Landing: bbox hero → defaultView (see landingCamera.ts) -----------------

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function syncOrbitControls(
  _camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): void {
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = true;
}

function disposeModelRoot(root: THREE.Object3D): void {
  root.removeFromParent();
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      const materials =
        Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => mat?.dispose());
    }
  });
}

function isModelInScene(
  modelRoot: THREE.Object3D | null,
  scene3d: THREE.Scene,
): boolean {
  return modelRoot !== null && modelRoot.parent === scene3d;
}

function clearHotspotMarkersFromScene(
  scene3d: THREE.Scene,
  groupRef: { current: THREE.Group | null },
): void {
  const stale: THREE.Object3D[] = [];
  scene3d.traverse((obj) => {
    if (obj.name === 'hotspot-markers') stale.push(obj);
  });
  for (const obj of stale) {
    obj.traverse((child) => {
      if (child instanceof CSS2DObject) {
        child.element.remove();
      }
    });
    obj.removeFromParent();
  }
  groupRef.current = null;
}

const ORBIT_MIN_DISTANCE_FALLBACK = 0.5;
/** Floor when model / view do not need more range. */
const ORBIT_MAX_DISTANCE_BASE = 500;

function computeOrbitDistanceLimits(
  modelRoot: THREE.Object3D | null,
  camera: THREE.PerspectiveCamera,
): {
  minDistance: number;
  maxDistance: number;
  scale: ModelNavigationScale | null;
} {
  if (!modelRoot) {
    return {
      minDistance: ORBIT_MIN_DISTANCE_FALLBACK,
      maxDistance: ORBIT_MAX_DISTANCE_BASE,
      scale: null,
    };
  }

  const scale = measureModelNavigationScale(
    modelRoot,
    camera,
    ORBIT_MAX_DISTANCE_BASE,
  );
  return {
    minDistance: scale.minDistance,
    maxDistance: scale.maxDistance,
    scale,
  };
}

function applyOrbitDistanceLimits(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  modelRoot: THREE.Object3D | null,
): ModelNavigationScale | null {
  const { minDistance, maxDistance, scale } = computeOrbitDistanceLimits(
    modelRoot,
    camera,
  );
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;

  const far = Math.max(CAMERA_FAR, maxDistance * 4);
  if (Math.abs(camera.far - far) > 0.5) {
    camera.far = far;
    camera.updateProjectionMatrix();
  }

  return scale;
}

function computeViewCameraState(
  view: ViewPosition,
  modelRoot: THREE.Object3D | null,
  controls: OrbitControls,
): { camPos: THREE.Vector3; target: THREE.Vector3 } {
  const yawRad = THREE.MathUtils.degToRad(view.yaw);
  const pitchRad = THREE.MathUtils.degToRad(view.pitch);
  const dist = view.zoom || 2;

  let target: THREE.Vector3;
  if (view.target) {
    target = new THREE.Vector3(view.target.x, view.target.y, view.target.z);
  } else if (modelRoot) {
    target = computeModelOrbitCenter(modelRoot);
  } else {
    target = controls.target.clone();
  }

  const lookDir = new THREE.Vector3(
    Math.sin(yawRad) * Math.cos(pitchRad),
    Math.sin(pitchRad),
    Math.cos(yawRad) * Math.cos(pitchRad),
  ).normalize();

  const camPos = target.clone().addScaledVector(lookDir, -dist);
  return { camPos, target };
}

function applyViewToCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  view: ViewPosition,
  modelRoot: THREE.Object3D | null,
): void {
  const { camPos, target } = computeViewCameraState(view, modelRoot, controls);
  camera.position.copy(camPos);
  camera.lookAt(target);
  controls.target.copy(target);
  syncOrbitControls(camera, controls);
}

function readCameraViewPosition(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): ViewPosition {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z));
  const pitch = THREE.MathUtils.radToDeg(Math.asin(dir.y));
  const dist = camera.position.distanceTo(controls.target);
  const t = controls.target;
  return {
    yaw: +yaw.toFixed(1),
    pitch: +pitch.toFixed(1),
    zoom: +dist.toFixed(2),
    target: { x: +t.x.toFixed(2), y: +t.y.toFixed(2), z: +t.z.toFixed(2) },
  };
}

function syncDevViewFromCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  onDevViewUpdate?: (view: ViewPosition) => void,
): void {
  onDevViewUpdate?.(readCameraViewPosition(camera, controls));
}

interface SceneTransitionAnimState extends DualTargetCameraAnim {
  resolve: () => void;
}

interface LoadSceneOptions {
  animateCamera?: boolean;
  /** Keep the current camera when reloading the same scene (e.g. dev hotspot edits). */
  preserveCamera?: boolean;
}

const ThreeDViewer = forwardRef<TourViewerHandle, ThreeDViewerProps>(
  function ThreeDViewer(
    {
      tour,
      initialSceneId,
      disabled,
      onSceneChange,
      onInfoHotspot,
      onNavigateToScene,
      onTransitionStart,
      onTransitionEnd,
      onLoadStart,
      onLoadProgress,
      onLoadComplete,
      onInitialTourReveal,
      skipLanding = false,
      splashDone = false,
      onLandingStart,
      onDevClick,
      devHotspotPlacementCapture = false,
      devHotspotMoveId = null,
      onDevHotspotMoved,
      onDevViewUpdate,
      onActiveInfoHotspotChange,
      onAnchoredPanelVisibilityChange,
      immersiveBackgroundController,
      onViewerLoadError,
      onViewerLoadRecovered,
      fullscreenActive,
      onFullscreenToggle,
      controlsVisible = VIEWER_CONTROLS_VISIBLE_DEFAULT,
      immersiveNavbarAvailable = false,
      playTourEnabled = false,
      playTourPhase = 'idle',
      onPlayTourToggle,
      onXrPresentingChange,
      // Authoring chrome; unlisted/internal markers show as ghosts when true.
      devMode: _devMode = false,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const labelRendererRef = useRef<CSS2DRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const smoothOrbitZoomRef = useRef<SmoothOrbitZoomHandle | null>(null);
    const xrSessionRef = useRef<XRSession | null>(null);
    const xrPresentingRef = useRef(false);
    const onXrPresentingChangeRef = useRef(onXrPresentingChange);
    onXrPresentingChangeRef.current = onXrPresentingChange;
    const currentSceneIdRef = useRef(initialSceneId);
    const transitioningRef = useRef(false);
    const tourRef = useRef(tour);
    const hotspotGroupRef = useRef<THREE.Group | null>(null);
    /** Mount one CSS2D hotspot into a group (set by buildHotspotMarkers). */
    const mountHotspotRef = useRef<
      ((hotspot: Hotspot, group: THREE.Group) => void) | null
    >(null);
    /** Last Dev Manage focus target — reapplied after surgical remount. */
    const focusedHotspotIdRef = useRef<string | null>(null);
    const landingAnimRef = useRef<SphericalLandingAnim | null>(null);
    const sceneTransitionAnimRef = useRef<SceneTransitionAnimState | null>(
      null,
    );
    const panelPanAnimRef = useRef<SceneTransitionAnimState | null>(null);
    const openPanelCloseRef = useRef<(() => void) | null>(null);
    const activePanelHotspotIdRef = useRef<string | null>(null);
    const pendingNamingRef = useRef<{
      sceneId: string;
      hotspotId: string;
    } | null>(null);
    const hotspotPanelActionsRef = useRef(
      new Map<string, { open: () => void; isOpen: () => boolean }>(),
    );
    const hotspotEnterRef = useRef<HotspotEnterController | null>(null);
    const modelLoadedRef = useRef(false);
    const loadedModelUrlRef = useRef<string | null>(null);
    const modelRootRef = useRef<THREE.Object3D | null>(null);
    const modelNavScaleRef = useRef<ModelNavigationScale | null>(null);
    const contactShadowRef = useRef<ReturnType<
      typeof createModelContactShadow
    > | null>(null);
    const groundSurfaceRef = useRef<ReturnType<
      typeof createModelGroundSurface
    > | null>(null);
    const studioLightsRef = useRef<{
      key: THREE.DirectionalLight;
      fill: THREE.DirectionalLight;
      rim: THREE.DirectionalLight;
    } | null>(null);
    const lightHelpersRef = useRef<THREE.DirectionalLightHelper[]>([]);
    /** Pull oversized orbit target in after camera moves settle (landing, explore, …). */
    const settleOrbitPivotRef = useRef<(() => void) | null>(null);
    const loadGenerationRef = useRef(0);
    const landingStartedRef = useRef(false);
    const initialRevealNotifiedRef = useRef(false);
    const tryStartLandingRef = useRef<(() => void) | null>(null);
    const skipLandingRef = useRef(skipLanding);
    skipLandingRef.current = skipLanding;
    const splashDoneRef = useRef(splashDone);
    splashDoneRef.current = splashDone;
    const onLandingStartRef = useRef(onLandingStart);
    onLandingStartRef.current = onLandingStart;
    const onInitialTourRevealRef = useRef(onInitialTourReveal);
    onInitialTourRevealRef.current = onInitialTourReveal;
    const [ready, setReady] = useState(false);
    const [toolbarZoomLevel, setToolbarZoomLevel] = useState(0.5);

    const syncToolbarZoomLevel = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;
      setToolbarZoomLevel(
        orbitDistanceToZoomLevel(
          camera.position.distanceTo(controls.target),
          controls.minDistance,
          controls.maxDistance,
        ),
      );
    }, []);
    const syncToolbarZoomLevelRef = useRef(syncToolbarZoomLevel);
    const syncLayoutSizeRef = useRef(() => {});
    syncToolbarZoomLevelRef.current = syncToolbarZoomLevel;

    const handleRecenter = useCallback(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const sceneId = currentSceneIdRef.current;
      const sceneData = tourRef.current.scenes[sceneId];
      if (!sceneData) return;

      let view: ViewPosition = sceneData.defaultView;
      const activeId = activePanelHotspotIdRef.current;
      if (activeId) {
        const found = findHotspotInTour(tourRef.current, activeId);
        if (found) {
          const panelView = resolveHotspotPanelView(
            tourRef.current,
            found.hotspot,
          );
          if (panelView) view = panelView;
        }
      }

      void waitForSceneTransition(
        camera,
        controls,
        view,
        modelRootRef.current,
        RECENTER_CAMERA_TRANSITION_TIMING,
      ).then(() => {
        syncDevViewFromCamera(camera, controls, onDevViewUpdateRef.current);
        syncToolbarZoomLevel();
      });
    }, [syncToolbarZoomLevel]);

    const handleZoomIn = useCallback(() => {
      // Same impulse + friction coast as one wheel notch (zoom in = negative deltaY).
      smoothOrbitZoomRef.current?.impulse(-ORBIT_ZOOM_BUTTON_DELTA_Y);
    }, []);

    const handleZoomOut = useCallback(() => {
      smoothOrbitZoomRef.current?.impulse(ORBIT_ZOOM_BUTTON_DELTA_Y);
    }, []);

    const handleZoomLevelChange = useCallback((level: number) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;
      const distance = zoomLevelToOrbitDistance(
        level,
        controls.minDistance,
        controls.maxDistance,
      );
      // Handle tracks scrub; camera snaps to the mapped orbit distance.
      setToolbarZoomLevel(level);
      smoothOrbitZoomRef.current?.setDistance(distance);
    }, []);

    tourRef.current = tour;

    const onNavigateRef = useRef(onNavigateToScene);
    onNavigateRef.current = onNavigateToScene;
    const onInfoRef = useRef(onInfoHotspot);
    onInfoRef.current = onInfoHotspot;
    const onDevClickRef = useRef(onDevClick);
    onDevClickRef.current = onDevClick;
    const devHotspotPlacementCaptureRef = useRef(devHotspotPlacementCapture);
    devHotspotPlacementCaptureRef.current = devHotspotPlacementCapture;
    const devHotspotMoveIdRef = useRef(devHotspotMoveId);
    devHotspotMoveIdRef.current = devHotspotMoveId;
    const onDevHotspotMovedRef = useRef(onDevHotspotMoved);
    onDevHotspotMovedRef.current = onDevHotspotMoved;
    /** True while Manage → Move is dragging a CSS2D hotspot. */
    const hotspotMoveDragRef = useRef(false);
    const onDevViewUpdateRef = useRef(onDevViewUpdate);
    onDevViewUpdateRef.current = onDevViewUpdate;
    const onActiveInfoHotspotChangeRef = useRef(onActiveInfoHotspotChange);
    onActiveInfoHotspotChangeRef.current = onActiveInfoHotspotChange;
    const onAnchoredPanelVisibilityChangeRef = useRef(
      onAnchoredPanelVisibilityChange,
    );
    onAnchoredPanelVisibilityChangeRef.current =
      onAnchoredPanelVisibilityChange;
    const onLoadStartRef = useRef(onLoadStart);
    onLoadStartRef.current = onLoadStart;
    const onLoadProgressRef = useRef(onLoadProgress);
    onLoadProgressRef.current = onLoadProgress;
    const onLoadCompleteRef = useRef(onLoadComplete);
    onLoadCompleteRef.current = onLoadComplete;
    const onViewerLoadErrorRef = useRef(onViewerLoadError);
    onViewerLoadErrorRef.current = onViewerLoadError;
    const onViewerLoadRecoveredRef = useRef(onViewerLoadRecovered);
    onViewerLoadRecoveredRef.current = onViewerLoadRecovered;

    const reportLoadError = useCallback(
      (sceneId: string, modelUrl: string, loadId: number) => {
        if (loadId !== loadGenerationRef.current) return;
        onViewerLoadErrorRef.current?.({ sceneId, panorama: modelUrl });
      },
      [],
    );

    const closeAllAnchoredPanels = useCallback(() => {
      openPanelCloseRef.current?.();
      openPanelCloseRef.current = null;
      activePanelHotspotIdRef.current = null;
    }, []);

    const openNamingHotspotById = useCallback((hotspotId: string) => {
      const actions = hotspotPanelActionsRef.current.get(hotspotId);
      if (!actions || actions.isOpen()) return;
      actions.open();
    }, []);

    const tryOpenPendingNamingHotspot = useCallback(
      (sceneId: string) => {
        const pending = pendingNamingRef.current;
        if (!pending || pending.sceneId !== sceneId) return;
        pendingNamingRef.current = null;
        requestAnimationFrame(() => {
          openNamingHotspotById(pending.hotspotId);
        });
      },
      [openNamingHotspotById],
    );

    const panCameraToHotspot = useCallback(
      (worldPoint: THREE.Vector3): Promise<void> => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return Promise.resolve();

        if (panelPanAnimRef.current) {
          panelPanAnimRef.current.resolve();
          panelPanAnimRef.current = null;
        }

        const startTarget = controls.target.clone();
        const startCamPos = camera.position.clone();
        const offset = startCamPos.clone().sub(startTarget);
        const endTarget = worldPoint.clone();
        const endCamPos = endTarget.clone().add(offset);

        if (prefersReducedMotion()) {
          controls.target.copy(endTarget);
          camera.position.copy(endCamPos);
          camera.lookAt(endTarget);
          syncOrbitControls(camera, controls);
          settleOrbitPivotRef.current?.();
          syncDevViewFromCamera(camera, controls, onDevViewUpdateRef.current);
          return Promise.resolve();
        }

        const durationMs = resolveCameraTransitionDurationMs(
          startCamPos,
          startTarget,
          endCamPos,
          endTarget,
          HOTSPOT_CAMERA_TRANSITION_TIMING,
        );

        return new Promise((resolve) => {
          panelPanAnimRef.current = {
            startCamPos,
            endCamPos,
            startTarget,
            endTarget,
            t0: performance.now(),
            durationMs,
            resolve: () => {
              settleOrbitPivotRef.current?.();
              syncDevViewFromCamera(
                camera,
                controls,
                onDevViewUpdateRef.current,
              );
              resolve();
            },
          };
        });
      },
      [],
    );

    const waitForSceneTransition = useCallback(
      (
        camera: THREE.PerspectiveCamera,
        controls: OrbitControls,
        view: ViewPosition,
        modelRoot: THREE.Object3D | null,
        timing: SceneTransitionTiming = HOTSPOT_CAMERA_TRANSITION_TIMING,
        options?: { settlePivot?: boolean },
      ): Promise<void> => {
        // Panel clip-nudge passes settlePivot:false — pulling target would re-clip.
        const settlePivot = options?.settlePivot !== false;
        const finish = (done: () => void) => {
          if (settlePivot) settleOrbitPivotRef.current?.();
          syncToolbarZoomLevelRef.current();
          done();
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          applyViewToCamera(camera, controls, view, modelRoot);
          return new Promise((resolve) => {
            finish(resolve);
          });
        }

        const { camPos, target } = computeViewCameraState(
          view,
          modelRoot,
          controls,
        );
        const durationMs =
          typeof timing === 'number' ? timing : (
            resolveCameraViewTransitionDurationMs(
              camera,
              controls,
              camPos,
              target,
              timing,
            )
          );

        return new Promise((resolve) => {
          const previous = sceneTransitionAnimRef.current;
          if (previous) {
            sceneTransitionAnimRef.current = null;
            previous.resolve();
          }

          sceneTransitionAnimRef.current = {
            startCamPos: camera.position.clone(),
            endCamPos: camPos,
            startTarget: controls.target.clone(),
            endTarget: target,
            t0: performance.now(),
            durationMs,
            resolve: () => finish(resolve),
          };
        });
      },
      [],
    );

    const goToNamingOpportunity = useCallback(
      (sceneId: string, hotspotId: string): boolean => {
        const tour = tourRef.current;
        const found = findHotspotInTour(tour, hotspotId);
        if (!found?.hotspot.popup?.namingOpportunity) return false;

        const targetSceneId = found.hotspot.sceneId ?? found.sceneId ?? sceneId;
        const sceneData = tour.scenes[targetSceneId];
        const targetView = found.hotspot.targetView ?? sceneData?.defaultView;
        if (!targetView) return false;
        const current = currentSceneIdRef.current;
        const actions = hotspotPanelActionsRef.current.get(hotspotId);

        if (current === targetSceneId) {
          if (actions?.isOpen()) return true;

          closeAllAnchoredPanels();

          const camera = cameraRef.current;
          const controls = controlsRef.current;
          if (!camera || !controls) return false;

          void waitForSceneTransition(
            camera,
            controls,
            targetView,
            modelRootRef.current,
            HOTSPOT_CAMERA_TRANSITION_TIMING,
          ).then(() => {
            openNamingHotspotById(hotspotId);
          });
          return true;
        }

        pendingNamingRef.current = { sceneId: targetSceneId, hotspotId };
        onNavigateRef.current?.(targetSceneId, targetView);
        return true;
      },
      [closeAllAnchoredPanels, openNamingHotspotById, waitForSceneTransition],
    );

    const goToNamingOpportunityRef = useRef(goToNamingOpportunity);
    goToNamingOpportunityRef.current = goToNamingOpportunity;

    useEffect(() => {
      setNavPreviewNamingPanelHandlers({
        onGoToNaming: (infoHotspotId) => {
          const found = findHotspotInTour(tourRef.current, infoHotspotId);
          const sceneId =
            found?.hotspot.sceneId ??
            found?.sceneId ??
            currentSceneIdRef.current;
          goToNamingOpportunityRef.current(sceneId, infoHotspotId);
        },
      });
      return () => setNavPreviewNamingPanelHandlers(null);
    }, []);

    const buildHotspotMarkers = useCallback(
      (hotspots: Hotspot[], scene3d: THREE.Scene) => {
        openPanelCloseRef.current = null;
        activePanelHotspotIdRef.current = null;
        hotspotPanelActionsRef.current.clear();
        clearHotspotMarkersFromScene(scene3d, hotspotGroupRef);

        const group = new THREE.Group();
        group.name = 'hotspot-markers';

        const mountOne = (hs: Hotspot, targetGroup: THREE.Group) => {
          if (!isWorldPosition(hs.position)) return;
          const worldPos = hs.position;

          const wrap = document.createElement('div');
          wrap.className = 'hotspot-3d-wrap';
          wrap.dataset.hotspotId = hs.id;
          // Same pill/chip HTML as panorama markers (buildMarkers).
          wrap.innerHTML = buildHotspotMarkerHtml(hs, tourRef.current);

          const btn = wrap.querySelector('button');
          if (!btn) return;
          let panelOpen = false;
          let panelEl: HTMLElement | null = null;
          let panelUnbind: (() => void) | null = null;
          const navPreviewHeroId = `3d-nav-${hs.id}`;

          const closeThisPanel = () => {
            panelUnbind?.();
            panelUnbind = null;

            if (!panelEl) {
              destroyNavPreviewMiniViewer(navPreviewHeroId);
              panelOpen = false;
              if (activePanelHotspotIdRef.current === hs.id) {
                activePanelHotspotIdRef.current = null;
              }
              if (openPanelCloseRef.current === closeThisPanel) {
                openPanelCloseRef.current = null;
              }
              return;
            }

            if (openPanelCloseRef.current === closeThisPanel) {
              openPanelCloseRef.current = null;
            }
            if (activePanelHotspotIdRef.current === hs.id) {
              activePanelHotspotIdRef.current = null;
            }

            const closingEl = panelEl;
            panelEl = null;
            panelOpen = false;
            wrap.classList.remove('hotspot-3d-wrap--panel-open');

            // Match 2D: exit scales the article; keep hero WebGL until remove.
            const article = closingEl.querySelector(
              '.tour-glass-panel--anchored',
            );
            if (article instanceof HTMLElement) {
              article.classList.remove('tour-glass-panel--anchored-enter');
              article.classList.add('tour-glass-panel--anchored-exit');
              window.setTimeout(() => {
                destroyNavPreviewMiniViewer(navPreviewHeroId);
                closingEl.remove();
              }, PANEL_EXIT_MS);
            } else {
              destroyNavPreviewMiniViewer(navPreviewHeroId);
              closingEl.remove();
            }
            onActiveInfoHotspotChangeRef.current?.(null);
            onAnchoredPanelVisibilityChangeRef.current?.(false);
          };

          const openAnchoredHtml = (
            panelHtml: string,
            bindPanel: (el: HTMLElement) => (() => void) | void,
            afterFramed?: (el: HTMLElement) => void,
          ) => {
            if (activePanelHotspotIdRef.current === hs.id && panelOpen) {
              closeThisPanel();
              return;
            }

            if (
              openPanelCloseRef.current &&
              openPanelCloseRef.current !== closeThisPanel
            ) {
              openPanelCloseRef.current();
            }

            const el = document.createElement('div');
            el.className = 'hotspot-3d-anchored-panel';
            el.innerHTML = panelHtml;
            panelEl = el;
            panelOpen = true;
            openPanelCloseRef.current = closeThisPanel;
            activePanelHotspotIdRef.current = hs.id;
            wrap.classList.add('hotspot-3d-wrap--panel-open');
            wrap.appendChild(el);

            panelUnbind = bindPanel(el) ?? null;

            requestAnimationFrame(() => {
              const camera = cameraRef.current;
              const controls = controlsRef.current;
              const container = containerRef.current;
              const scene3dInner = sceneRef.current;
              const labelRenderer = labelRendererRef.current;
              if (!camera || !controls || !container) return;

              void (async () => {
                const probeFramingView = (
                  baseView: ViewPosition,
                ): ViewPosition => {
                  if (!scene3dInner || !labelRenderer) return baseView;

                  return resolvePanelFramingView3d({
                    container,
                    camera,
                    panelRoot: el,
                    baseView,
                    applyView: (view) =>
                      applyViewToCamera(
                        camera,
                        controls,
                        view,
                        modelRootRef.current,
                      ),
                    restoreCamera: (camPos, target) => {
                      camera.position.copy(camPos);
                      controls.target.copy(target);
                      camera.lookAt(target);
                      syncOrbitControls(camera, controls);
                    },
                    readCameraPose: () => ({
                      camPos: camera.position.clone(),
                      target: controls.target.clone(),
                    }),
                    renderLabels: () =>
                      labelRenderer.render(scene3dInner, camera),
                    readView: () => readCameraViewPosition(camera, controls),
                  });
                };

                // Match 2D: enter CSS starts at append — wait for it in parallel
                // with layout+nudge. Do NOT await layout before waitEnter (that
                // missed animationend and stacked a second 220ms timeout).
                await runAnchoredPanelOpenReveal({
                  waitEnter: () => waitForPanelEnterAnimation(el),
                  runNudge: async () => {
                    await waitForAnchoredPanelLayout(() => panelEl);
                    if (!panelEl) return;
                    // Reserve hero height before measure — panel grows upward.
                    prepareNavPreviewHeroLayout(panelEl);

                    const currentView = readCameraViewPosition(
                      camera,
                      controls,
                    );
                    const framingView = probeFramingView(currentView);
                    const travelDeg = Math.hypot(
                      absoluteYawDeltaDeg(currentView.yaw, framingView.yaw),
                      Math.abs(framingView.pitch - currentView.pitch),
                    );
                    if (travelDeg > 0.2) {
                      await waitForSceneTransition(
                        camera,
                        controls,
                        framingView,
                        modelRootRef.current,
                        {
                          durationMs:
                            resolveAnchoredPanelNudgeDurationMs(travelDeg),
                        },
                        { settlePivot: false },
                      );
                    }
                  },
                  onSettled: () => {
                    if (panelEl) afterFramed?.(panelEl);
                  },
                });
                if (!panelEl) return;

                syncDevViewFromCamera(
                  camera,
                  controls,
                  onDevViewUpdateRef.current,
                );
              })();
            });
            onActiveInfoHotspotChangeRef.current?.(hs.id);
            onAnchoredPanelVisibilityChangeRef.current?.(true);
          };

          const openInfoPanel = (popup: PopupContent) => {
            openAnchoredHtml(
              buildAnchoredPopupHtml(popup, hs.id, { tour: tourRef.current }),
              (el) => {
                el.addEventListener('click', (ev) => {
                  const clicked = ev.target as HTMLElement;
                  if (clicked.closest('[data-info-panel-close]')) {
                    openPanelCloseRef.current?.();
                    return;
                  }
                  const visitEl = clicked.closest(
                    '[data-visit-scene]',
                  ) as HTMLElement | null;
                  if (visitEl?.dataset.visitScene) {
                    openPanelCloseRef.current?.();
                    onNavigateRef.current?.(visitEl.dataset.visitScene);
                  }
                });
              },
              (el) => {
                // Same as 2D: heavy hero waits until enter ∥ nudge settle.
                if (el.querySelector('.anchored-panel__hero--video')) {
                  mountNavPreviewVideoHero(el);
                } else if (el.querySelector('.anchored-panel__hero--image')) {
                  mountNavPreviewImageHero(el);
                }
                initPopupVideoPlayers(el);
              },
            );
          };

          const openNavPreviewPanel = (preview: NavPreviewContent) => {
            openAnchoredHtml(
              buildAnchoredNavPreviewHtml(preview, hs.id),
              (el) => {
                el.addEventListener('click', (ev) => {
                  const clicked = ev.target as HTMLElement;
                  if (clicked.closest('[data-nav-panel-close]')) {
                    openPanelCloseRef.current?.();
                    return;
                  }
                  if (clicked.closest('[data-nav-panel-go]')) {
                    openPanelCloseRef.current?.();
                    if (preview.canNavigate) {
                      onNavigateRef.current?.(
                        preview.targetSceneId,
                        preview.targetView,
                      );
                    }
                  }
                });

                const unbindAccordion = bindNavPreviewNamingAccordion(el);
                return unbindAccordion;
              },
              (el) => {
                // Mount hero after enter ∥ nudge — same order as panorama.
                animateNavPreviewTotal(el);
                if (preview.videoUrl?.trim()) {
                  mountNavPreviewVideoHero(el);
                } else if (isNavPreviewMiniViewerEnabled()) {
                  mountNavPreviewMiniViewer(navPreviewHeroId, el, preview);
                } else {
                  dismissNavPreviewHero(el);
                }
                if (preview.bodyVideoUrl?.trim()) {
                  initPopupVideoPlayers(el);
                }
              },
            );
          };

          const resolveInfoPopup = (): PopupContent | undefined => {
            const tour = tourRef.current;
            const hostScene = resolveHotspotHostScene(
              tour,
              hs,
              tour.scenes[currentSceneIdRef.current],
            );
            return resolveNamingPopup(tour, hs, hostScene) ?? hs.popup;
          };

          if (hs.type === 'info' && hs.popup) {
            hotspotPanelActionsRef.current.set(hs.id, {
              open: () => {
                const popup = resolveInfoPopup();
                if (popup) openInfoPanel(popup);
              },
              isOpen: () => panelOpen,
            });
          }

          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Move mode — drag handles reposition; don't open panels.
            if (devHotspotMoveIdRef.current === hs.id) return;

            if (hs.type === 'nav' && hs.targetScene) {
              const currentSceneId = currentSceneIdRef.current;
              const targetView =
                tourRef.current.scenes[hs.targetScene]?.defaultView;

              if (hs.instant) {
                if (navPreviewCanNavigate(hs, currentSceneId)) {
                  onNavigateRef.current?.(hs.targetScene, targetView);
                }
                return;
              }

              const preview = buildNavPreview(
                hs,
                tourRef.current,
                currentSceneId,
              );
              if (preview) {
                openNavPreviewPanel(preview);
                return;
              }

              if (navPreviewCanNavigate(hs, currentSceneId)) {
                onNavigateRef.current?.(hs.targetScene, targetView);
              }
              return;
            }

            if (hs.type === 'info' && hs.popup) {
              const popup = resolveInfoPopup();
              if (popup) openInfoPanel(popup);
            }
          });

          const label = new CSS2DObject(wrap);
          label.position.set(worldPos.x, worldPos.y, worldPos.z);
          // Anchor bottom-center on the world point so opening a panel above does not re-center the pill.
          label.center.set(0.5, 1);
          label.name = `hotspot-${hs.id}`;
          targetGroup.add(label);
        };

        mountHotspotRef.current = mountOne;

        for (const hs of hotspots) {
          mountOne(hs, group);
        }

        scene3d.add(group);
        hotspotGroupRef.current = group;
      },
      [panCameraToHotspot, waitForSceneTransition],
    );

    const loadScene = useCallback(
      async (
        sceneId: string,
        viewOverride?: ViewPosition,
        options?: LoadSceneOptions,
      ): Promise<boolean> => {
        const scene3d = sceneRef.current;
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!scene3d || !camera || !controls) return false;

        const sceneData = tourRef.current.scenes[sceneId];
        if (!sceneData) return false;

        const modelUrl = resolveTourSceneModelUrl(tourRef.current, sceneData);
        const loadId = ++loadGenerationRef.current;
        if (!modelUrl) {
          reportLoadError(sceneId, '', loadId);
          return false;
        }

        const view = viewOverride ?? sceneData.defaultView;
        const reuseModel =
          loadedModelUrlRef.current === modelUrl &&
          isModelInScene(modelRootRef.current, scene3d);
        const preserveCamera = options?.preserveCamera === true && reuseModel;

        let progressArmed = false;
        const finishProgress = () => {
          if (!progressArmed) return;
          progressArmed = false;
          onLoadCompleteRef.current?.();
        };

        const abortLoad = (orphanModel?: THREE.Object3D) => {
          if (orphanModel) disposeModelRoot(orphanModel);
          finishProgress();
          return false;
        };

        if (!reuseModel) {
          progressArmed = true;
          onLoadStartRef.current?.();

          try {
            const MANIFEST_PCT = 10;

            const gltf = await new Promise<
              import('three/addons/loaders/GLTFLoader.js').GLTF
            >((resolve, reject) => {
              const manager = new THREE.LoadingManager();
              let manifestDone = false;

              manager.onProgress = (_url, loaded, total) => {
                if (total <= 0) return;
                if (!manifestDone) {
                  manifestDone = true;
                  onLoadProgressRef.current?.(MANIFEST_PCT);
                  return;
                }
                const remaining = total - 1;
                const done = loaded - 1;
                if (remaining > 0) {
                  const pct =
                    MANIFEST_PCT + (done / remaining) * (100 - MANIFEST_PCT);
                  onLoadProgressRef.current?.(pct);
                }
              };

              manager.onError = (url) => {
                console.error('[ThreeDViewer] Failed to load resource:', url);
              };

              const loader = new GLTFLoader(manager);
              loader.setMeshoptDecoder(MeshoptDecoder);

              const dracoLoader = new DRACOLoader();
              dracoLoader.setDecoderPath(
                'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
              );
              loader.setDRACOLoader(dracoLoader);

              loader.load(
                modelUrl,
                resolve,
                (xhr) => {
                  if (xhr.total > 0 && !manifestDone) {
                    onLoadProgressRef.current?.(
                      (xhr.loaded / xhr.total) * MANIFEST_PCT,
                    );
                  }
                },
                reject,
              );
            });

            if (loadId !== loadGenerationRef.current) {
              return abortLoad(gltf.scene);
            }

            if (modelRootRef.current) {
              disposeModelRoot(modelRootRef.current);
              modelRootRef.current = null;
              modelNavScaleRef.current = null;
            }

            scene3d.add(gltf.scene);
            loadedModelUrlRef.current = modelUrl;
            modelRootRef.current = gltf.scene;
            enhanceModelLightingResponse(gltf.scene);
            enableModelShadowCasting(gltf.scene);
            contactShadowRef.current?.updateFromModel(gltf.scene);
            contactShadowRef.current?.setVisible(
              getModel3dDebugLights().contactShadow,
            );
            groundSurfaceRef.current?.updateFromModel(gltf.scene);
            groundSurfaceRef.current?.setVisible(
              getModel3dDebugLights().groundSurface,
            );
            if (studioLightsRef.current) {
              placeModelStudioLights(studioLightsRef.current, gltf.scene);
            }
            modelNavScaleRef.current = applyOrbitDistanceLimits(
              camera,
              controls,
              gltf.scene,
            );
            syncToolbarZoomLevelRef.current();
          } catch (err) {
            if (loadId !== loadGenerationRef.current) return abortLoad();
            const hint =
              err instanceof SyntaxError ?
                ' (server returned HTML — check that the GLB exists under assets/ and run npm run sync-assets)'
              : '';
            console.error(
              `[ThreeDViewer] Failed to load model: ${sceneId}`,
              `${modelUrl}${hint}`,
              err,
            );
            reportLoadError(sceneId, modelUrl, loadId);
            finishProgress();
            return false;
          }
        }

        if (loadId !== loadGenerationRef.current) return abortLoad();

        // Zoom min/max are fixed when the model first loads — don't recompute
        // on every scene hop (same GLB) or the zoom bar mapping drifts.
        if (!modelNavScaleRef.current && modelRootRef.current) {
          modelNavScaleRef.current = applyOrbitDistanceLimits(
            camera,
            controls,
            modelRootRef.current,
          );
          syncToolbarZoomLevelRef.current();
        }

        try {
          const previousSceneId = currentSceneIdRef.current;
          const shouldAnimateCamera =
            options?.animateCamera === true &&
            (sceneId !== previousSceneId || viewOverride !== undefined);

          if (shouldAnimateCamera) {
            hotspotEnterRef.current?.hold();
            closeAllAnchoredPanels();
            clearHotspotMarkersFromScene(scene3d, hotspotGroupRef);

            currentSceneIdRef.current = sceneId;
            onSceneChange(sceneId);

            await waitForSceneTransition(
              camera,
              controls,
              view,
              modelRootRef.current,
              {
                ...SCENE_CAMERA_TRANSITION_TIMING,
                maxMs: parseModel3dSceneTransitionDurationMs(tourRef.current),
              },
            );

            if (loadId !== loadGenerationRef.current) {
              hotspotEnterRef.current?.release();
              return abortLoad();
            }

            buildHotspotMarkers(
              resolveSceneHotspots(
                tourRef.current,
                sceneData,
                _devMode ? { dev: true } : VIEWER_MARKER_AUDIENCE,
              ),
              scene3d,
            );
            if (loadId !== loadGenerationRef.current) {
              clearHotspotMarkersFromScene(scene3d, hotspotGroupRef);
              hotspotEnterRef.current?.release();
              return abortLoad();
            }

            syncDevViewFromCamera(camera, controls, onDevViewUpdateRef.current);
            hotspotEnterRef.current?.schedule();
            tryOpenPendingNamingHotspot(sceneId);
          } else {
            buildHotspotMarkers(
              resolveSceneHotspots(
                tourRef.current,
                sceneData,
                _devMode ? { dev: true } : VIEWER_MARKER_AUDIENCE,
              ),
              scene3d,
            );
            if (loadId !== loadGenerationRef.current) {
              clearHotspotMarkersFromScene(scene3d, hotspotGroupRef);
              return abortLoad();
            }

            if (!preserveCamera) {
              applyViewToCamera(camera, controls, view, modelRootRef.current);
              settleOrbitPivotRef.current?.();
              syncDevViewFromCamera(
                camera,
                controls,
                onDevViewUpdateRef.current,
              );
            }
            currentSceneIdRef.current = sceneId;
            onSceneChange(sceneId);
            tryOpenPendingNamingHotspot(sceneId);
          }

          finishProgress();
          onViewerLoadRecoveredRef.current?.();
          syncToolbarZoomLevelRef.current();
          return true;
        } catch (err) {
          if (loadId !== loadGenerationRef.current) return abortLoad();
          console.error('[ThreeDViewer] Failed to apply scene:', sceneId, err);
          reportLoadError(sceneId, modelUrl, loadId);
          hotspotEnterRef.current?.release();
          finishProgress();
          return false;
        }
      },
      [
        onSceneChange,
        buildHotspotMarkers,
        waitForSceneTransition,
        closeAllAnchoredPanels,
        tryOpenPendingNamingHotspot,
        reportLoadError,
      ],
    );

    useImperativeHandle(ref, () => ({
      navigateToScene: async (sceneId, targetView, _options) => {
        if (transitioningRef.current || !sceneRef.current) return false;
        if (sceneId === currentSceneIdRef.current && !targetView) return false;

        transitioningRef.current = true;
        onTransitionStart();

        try {
          const ok = await loadScene(sceneId, targetView, {
            animateCamera: true,
          });
          return ok;
        } finally {
          transitioningRef.current = false;
          onTransitionEnd();
        }
      },
      preloadScene: async (_sceneId) => {
        /* 3D model prefetch not wired yet — Play Tour still hops via loadScene. */
      },
      retryScene: async (sceneId) => {
        const target = sceneId ?? currentSceneIdRef.current;
        onViewerLoadRecoveredRef.current?.();
        if (modelRootRef.current) {
          disposeModelRoot(modelRootRef.current);
          modelRootRef.current = null;
          modelNavScaleRef.current = null;
        }
        loadedModelUrlRef.current = null;
        return loadScene(target);
      },
      clearActiveInfoHotspot: () => {
        closeAllAnchoredPanels();
        onActiveInfoHotspotChangeRef.current?.(null);
        onAnchoredPanelVisibilityChangeRef.current?.(false);
      },
      hideOverlayPanel: () => {
        // no-op for now
      },
      closeAnchoredPanels: () => {
        closeAllAnchoredPanels();
      },
      goToNamingOpportunity,
      togglePlaceOverview: () => false,
      recenterToDefaultView: (_options?: { forceDefault?: boolean }) => {
        handleRecenter();
      },
      animateToView: async (view, options) => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls || transitioningRef.current) return;
        const timing =
          options?.durationMs !== undefined ?
            options.durationMs
          : HOTSPOT_CAMERA_TRANSITION_TIMING;
        await waitForSceneTransition(
          camera,
          controls,
          view,
          modelRootRef.current,
          timing,
        );
      },
      stopViewAnimation: () => {
        const previous = sceneTransitionAnimRef.current;
        if (!previous) return;
        sceneTransitionAnimRef.current = null;
        previous.resolve();
      },
      focusHotspot: (hotspotId, _options) => {
        focusedHotspotIdRef.current = hotspotId;
        setDevFocusedHotspot3d(containerRef.current, hotspotId);
        if (!hotspotId) return;

        const tour = tourRef.current;
        const found = findHotspotInTour(tour, hotspotId);
        if (!found) return;

        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        // Dev Manage: frame the pin — never open the visitor panel from focus.
        // Always ease the camera (hover used to pass animate:false and snap).
        const targetView = resolveHotspotPanelView(tour, found.hotspot);

        if (targetView) {
          void waitForSceneTransition(
            camera,
            controls,
            targetView,
            modelRootRef.current,
            HOTSPOT_CAMERA_TRANSITION_TIMING,
          );
          return;
        }

        if (!isWorldPosition(found.hotspot.position)) return;
        const { x, y, z } = found.hotspot.position;
        void panCameraToHotspot(new THREE.Vector3(x, y, z));
      },
      captureSceneThumbnail: async () => {
        const renderer = rendererRef.current;
        const scene3d = sceneRef.current;
        const camera = cameraRef.current;
        if (!renderer || !scene3d || !camera) return null;

        renderer.render(scene3d, camera);

        return new Promise<Blob | null>((resolve) => {
          renderer.domElement.toBlob((blob) => resolve(blob), 'image/png');
        });
      },
      getCurrentView: () => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return null;
        return readCameraViewPosition(camera, controls);
      },
      applyTourUpdate: async (newTour, _options) => {
        const sceneId = currentSceneIdRef.current;
        const prevTour = tourRef.current;
        const prevScene = prevTour.scenes[sceneId];
        const prevModel =
          prevScene ? resolveTourSceneModelUrl(prevTour, prevScene) : null;
        const sceneCountBefore = Object.keys(prevTour.scenes).length;

        tourRef.current = newTour;

        const nextScene = newTour.scenes[sceneId];
        if (!nextScene) {
          // Open scene was removed — TourPage navigates via navigateToScene.
          return;
        }

        const nextModel = resolveTourSceneModelUrl(newTour, nextScene);
        if (nextModel !== prevModel) {
          loadedModelUrlRef.current = null;
          if (modelRootRef.current) {
            disposeModelRoot(modelRootRef.current);
            modelRootRef.current = null;
            modelNavScaleRef.current = null;
          }
        }

        const sceneCountAfter = Object.keys(newTour.scenes).length;
        const onlyAddedScenes =
          sceneCountAfter > sceneCountBefore &&
          nextModel === prevModel &&
          loadedModelUrlRef.current === nextModel &&
          modelRootRef.current;

        if (onlyAddedScenes) {
          return;
        }

        const audience = _devMode ? { dev: true } : VIEWER_MARKER_AUDIENCE;
        const canSurgicalPatch =
          nextModel === prevModel &&
          loadedModelUrlRef.current === nextModel &&
          Boolean(modelRootRef.current) &&
          Boolean(hotspotGroupRef.current) &&
          Boolean(mountHotspotRef.current) &&
          Boolean(sceneRef.current);

        if (canSurgicalPatch && prevScene) {
          const prevList = resolveSceneHotspots(prevTour, prevScene, audience);
          const nextList = resolveSceneHotspots(newTour, nextScene, audience);
          const diff = diffHotspotMarkers(
            prevList,
            nextList,
            prevTour,
            newTour,
            prevScene,
            nextScene,
          );

          if (!hotspotMarkerDiffHasChanges(diff)) {
            return;
          }

          const group = hotspotGroupRef.current!;
          const mountOne = mountHotspotRef.current!;

          const removeOne = (hotspotId: string) => {
            if (activePanelHotspotIdRef.current === hotspotId) {
              openPanelCloseRef.current?.();
            }
            hotspotPanelActionsRef.current.delete(hotspotId);
            const label = group.getObjectByName(`hotspot-${hotspotId}`);
            if (label instanceof CSS2DObject) {
              label.element.remove();
              label.removeFromParent();
            }
          };

          for (const removed of diff.removed) {
            removeOne(removed.id);
          }

          for (const { next, positionOnly } of diff.updated) {
            if (positionOnly && isWorldPosition(next.position)) {
              const label = group.getObjectByName(`hotspot-${next.id}`);
              if (label instanceof CSS2DObject) {
                label.position.set(
                  next.position.x,
                  next.position.y,
                  next.position.z,
                );
                continue;
              }
            }

            const wasOpen =
              activePanelHotspotIdRef.current === next.id &&
              Boolean(hotspotPanelActionsRef.current.get(next.id)?.isOpen());
            removeOne(next.id);
            mountOne(next, group);
            if (wasOpen) {
              hotspotPanelActionsRef.current.get(next.id)?.open();
            }
          }

          for (const added of diff.added) {
            mountOne(added, group);
          }

          setDevFocusedHotspot3d(
            containerRef.current,
            focusedHotspotIdRef.current,
          );
          setDevMovingHotspot3d(
            containerRef.current,
            devHotspotMoveIdRef.current,
          );
          return;
        }

        await loadScene(sceneId, undefined, { preserveCamera: true });
      },
      syncLayoutSize: () => {
        syncLayoutSizeRef.current();
      },
      enterImmersiveVr: async () => {
        const renderer = rendererRef.current;
        if (!renderer || xrPresentingRef.current) return;
        const session = await enterImmersiveVr(renderer);
        xrSessionRef.current = session;
        xrPresentingRef.current = true;
        const controls = controlsRef.current;
        if (controls) controls.enabled = false;
        onXrPresentingChangeRef.current?.(true);
        const onEnd = () => {
          session.removeEventListener('end', onEnd);
          xrSessionRef.current = null;
          xrPresentingRef.current = false;
          if (controlsRef.current) controlsRef.current.enabled = true;
          onXrPresentingChangeRef.current?.(false);
        };
        session.addEventListener('end', onEnd);
      },
      exitImmersiveVr: async () => {
        await exitImmersiveVr(xrSessionRef.current);
        xrSessionRef.current = null;
        xrPresentingRef.current = false;
        if (controlsRef.current) controlsRef.current.enabled = true;
        onXrPresentingChangeRef.current?.(false);
      },
    }));

    useEffect(() => {
      if (splashDone) tryStartLandingRef.current?.();
    }, [splashDone]);

    // Initialize Three.js scene
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let disposed = false;
      loadGenerationRef.current += 1;
      modelLoadedRef.current = false;
      loadedModelUrlRef.current = null;
      modelRootRef.current = null;
      modelNavScaleRef.current = null;
      landingStartedRef.current = false;
      initialRevealNotifiedRef.current = false;
      landingAnimRef.current = null;

      const hotspotEnter = createHotspotEnterController(
        () => containerRef.current,
        HOTSPOT_ENTER_3D,
      );
      hotspotEnterRef.current = hotspotEnter;
      // Hold before markers mount — splash/landing can re-render; phase is data-attr.
      hotspotEnter.hold();

      const tryNotifyInitialTourReveal = () => {
        if (initialRevealNotifiedRef.current) return;
        initialRevealNotifiedRef.current = true;
        onInitialTourRevealRef.current?.();
      };

      const finishLanding = (
        camera: THREE.PerspectiveCamera,
        controls: OrbitControls,
        endCamPos: THREE.Vector3,
        endTarget: THREE.Vector3,
      ) => {
        camera.position.copy(endCamPos);
        camera.lookAt(endTarget);
        controls.target.copy(endTarget);
        syncOrbitControls(camera, controls);
        settleOrbitPivotRef.current?.();
        landingAnimRef.current = null;
        tryNotifyInitialTourReveal();
        syncDevViewFromCamera(camera, controls, onDevViewUpdateRef.current);
        syncToolbarZoomLevelRef.current();
        hotspotEnter.schedule();
      };

      const tryStartLanding = () => {
        if (disposed) return;
        if (!modelLoadedRef.current || !splashDoneRef.current) return;

        const tourId = tourRef.current.id;
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        if (
          skipLandingRef.current ||
          landingStartedRef.current ||
          hasLandingTransitionPlayed(tourId)
        ) {
          tryNotifyInitialTourReveal();
          if (skipLandingRef.current || hasLandingTransitionPlayed(tourId)) {
            hotspotEnter.schedule();
          }
          return;
        }

        landingStartedRef.current = true;
        markLandingTransitionPlayed(tourId);
        hotspotEnter.hold();
        onLandingStartRef.current?.();

        const modelRoot = modelRootRef.current;
        const endPose: LandingCameraPose = {
          camPos: camera.position.clone(),
          target: controls.target.clone(),
        };

        if (prefersReducedMotion() || !modelRoot) {
          finishLanding(camera, controls, endPose.camPos, endPose.target);
          return;
        }

        const landing = computeHeroLandingAnim(modelRoot, camera, endPose);
        landing.t0 = performance.now();

        const startPose = heroLandingStartPose(landing);
        camera.position.copy(startPose.camPos);
        controls.target.copy(startPose.target);
        camera.lookAt(startPose.target);

        landingAnimRef.current = landing;
      };

      tryStartLandingRef.current = tryStartLanding;

      // -- WebGL renderer -------------------------------------------------------
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // High exposure + ACES bleaches warm keys toward white — keep contrast.
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.xr.enabled = true;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // -- CSS2D label renderer -------------------------------------------------
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(container.clientWidth, container.clientHeight);
      labelRenderer.domElement.className = 'viewer-3d-label-overlay';
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.left = '0';
      labelRenderer.domElement.style.pointerEvents = 'none';
      container.appendChild(labelRenderer.domElement);
      labelRendererRef.current = labelRenderer;
      const detachHotspotPulseScaleSync = attachHotspotInfoPulseScaleSync(
        labelRenderer.domElement,
      );

      const scene = new THREE.Scene();
      sceneRef.current = scene;
      // Keep background null — ACES lifts scene.background Color toward mid-gray.
      scene.background = null;
      renderer.setClearColor(0x000000, 1);

      // -- Environment map for PBR reflections (studio-like fill) ----------------
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      const envScene = new THREE.Scene();
      // Cool dark cavity — daylight reflections without warm bounce wash.
      const envGeo = new THREE.SphereGeometry(1, 32, 16);
      const envMat = new THREE.MeshBasicMaterial({
        color: 0x0c1018,
        side: THREE.BackSide,
      });
      envScene.add(new THREE.Mesh(envGeo, envMat));

      const envKey = new THREE.PointLight(0xd0e0f5, 90, 8);
      envKey.position.set(2.4, 2.6, 1.4);
      envScene.add(envKey);
      const envFill = new THREE.PointLight(0x4a5c7a, 14, 8);
      envFill.position.set(-2.6, 0.8, -1.6);
      envScene.add(envFill);
      const envRim = new THREE.PointLight(0xb4c8e4, 40, 8);
      envRim.position.set(0.4, 1.8, -2.8);
      envScene.add(envRim);
      const envBounce = new THREE.PointLight(0x6a7c98, 10, 6);
      envBounce.position.set(0, -1.6, 0.4);
      envScene.add(envBounce);

      const envRT = pmremGenerator.fromScene(envScene, 0.04);
      scene.environment = envRT.texture;
      pmremGenerator.dispose();
      envGeo.dispose();
      envMat.dispose();

      const camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        container.clientWidth / container.clientHeight,
        CAMERA_NEAR,
        CAMERA_FAR,
      );
      camera.position.set(0, CAMERA_HEIGHT, 0);
      cameraRef.current = camera;

      // Key / fill / rim — color + intensity from Dev “Model3d lights” sliders.
      // No AmbientLight — env map + fill already lift the shadow side.
      // Positions are overwritten by placeModelStudioLights (fixed directions).
      const keyLight = new THREE.DirectionalLight(0xffffff, 1);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.03;
      scene.add(keyLight);
      scene.add(keyLight.target);

      const fillLight = new THREE.DirectionalLight(0xffffff, 1);
      scene.add(fillLight);
      scene.add(fillLight.target);

      const rimLight = new THREE.DirectionalLight(0xffffff, 1);
      scene.add(rimLight);
      scene.add(rimLight.target);

      const studioLights = { key: keyLight, fill: fillLight, rim: rimLight };
      studioLightsRef.current = studioLights;
      applyModel3dStudioLightLook(studioLights, getModel3dDebugLights());

      const groundSurface = createModelGroundSurface();
      scene.add(groundSurface.root);
      groundSurfaceRef.current = groundSurface;

      const contactShadow = createModelContactShadow();
      scene.add(contactShadow.root);
      contactShadowRef.current = contactShadow;

      // Helper size is world units — placeModelStudioLights sets final poses.
      const keyHelper = new THREE.DirectionalLightHelper(keyLight, 2, 0xd0e0f5);
      const fillHelper = new THREE.DirectionalLightHelper(
        fillLight,
        1.5,
        0x6a7aaa,
      );
      const rimHelper = new THREE.DirectionalLightHelper(rimLight, 2, 0xb4c8e4);
      for (const helper of [keyHelper, fillHelper, rimHelper]) {
        helper.visible = false;
        scene.add(helper);
      }
      lightHelpersRef.current = [keyHelper, fillHelper, rimHelper];

      const applyDebugLights = () => {
        const debugLights = getModel3dDebugLights();
        applyModel3dStudioLightLook(studioLights, debugLights);
        keyLight.visible = debugLights.directional;
        fillLight.visible = debugLights.directional;
        rimLight.visible = debugLights.rim;
        contactShadowRef.current?.setVisible(debugLights.contactShadow);
        groundSurfaceRef.current?.setVisible(debugLights.groundSurface);
        keyHelper.visible = debugLights.lightHelpers && debugLights.directional;
        fillHelper.visible =
          debugLights.lightHelpers && debugLights.directional;
        rimHelper.visible = debugLights.lightHelpers && debugLights.rim;
        if (debugLights.lightHelpers) {
          keyHelper.update();
          fillHelper.update();
          rimHelper.update();
        }
      };
      applyDebugLights();
      const unsubscribeDebugLights =
        subscribeModel3dDebugLights(applyDebugLights);

      // Orbit controls — Sketchfab-style: LMB orbit, RMB pan, wheel zoom
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = SKETCHFAB_ORBIT_DAMPING;
      controls.rotateSpeed = SKETCHFAB_ROTATE_SPEED;
      controls.panSpeed = SKETCHFAB_PAN_SPEED;
      controls.zoomSpeed = SKETCHFAB_ZOOM_SPEED;
      controls.enablePan = true;
      controls.enableZoom = false;
      controls.zoomToCursor = true;
      controls.screenSpacePanning = true;
      controls.minDistance = ORBIT_MIN_DISTANCE_FALLBACK;
      controls.maxDistance = ORBIT_MAX_DISTANCE_BASE;
      controls.maxPolarAngle = Math.PI * 0.98;
      controls.target.set(0, CAMERA_HEIGHT, -2);
      controlsRef.current = controls;

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let focusClickAnim: {
        start: THREE.Vector3;
        end: THREE.Vector3;
        startTarget: THREE.Vector3;
        endTarget: THREE.Vector3;
        t0: number;
      } | null = null;
      let suppressClickAfterOrbit = false;

      // -- Keyboard orbit (arrows) + walk (WASD) --------------------------------
      const keysDown = new Set<string>();
      const moveDir = new THREE.Vector3();
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const orbitOffset = new THREE.Vector3();
      const orbitSpherical = new THREE.Spherical();
      let prevTime = performance.now();

      const isTypingTarget = (el: EventTarget | null): boolean => {
        if (!el || !(el instanceof HTMLElement)) return false;
        const tag = el.tagName;
        return (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          el.isContentEditable
        );
      };

      const ORBIT_KEY_CODES = new Set([
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ]);
      const WALK_KEY_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
      const ORBIT_KEY_SPEED = 1.25;

      const onKeyDown = (e: KeyboardEvent) => {
        if (isTypingTarget(e.target)) return;
        if (ORBIT_KEY_CODES.has(e.code) || WALK_KEY_CODES.has(e.code)) {
          e.preventDefault();
        }
        keysDown.add(e.code);
      };
      const onKeyUp = (e: KeyboardEvent) => {
        keysDown.delete(e.code);
      };
      const onWindowBlur = () => {
        keysDown.clear();
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onWindowBlur);

      const floorCursorRing = createFloorCursorRing(scene);
      const floorRingEnabled = isFinePointerDevice() && !prefersReducedMotion();
      let isOrbiting = false;
      let orbitInteractionActive = false;

      const hideFloorCursorRing = () => {
        floorCursorRing.hide();
      };

      const isCameraMovementLocked = (): boolean =>
        landingAnimRef.current !== null ||
        sceneTransitionAnimRef.current !== null ||
        panelPanAnimRef.current !== null ||
        focusClickAnim !== null;

      const startFocusMove = (hit: THREE.Vector3) => {
        const startTarget = controls.target.clone();
        const startCam = camera.position.clone();
        const scale = modelNavScaleRef.current;
        const currentDist = startCam.distanceTo(startTarget);

        let endCam: THREE.Vector3;
        let endTarget: THREE.Vector3;
        if (scale) {
          ({ endCam, endTarget } = resolveFocusClickMovePose(
            startCam,
            hit,
            currentDist,
            scale,
            CAMERA_HEIGHT,
          ));
        } else {
          // Fallback: horizontal approach + destination-floor eye height.
          const eyeY = hit.y + FOCUS_CLICK_EYE_HEIGHT;
          const toHit = new THREE.Vector3(
            hit.x - startCam.x,
            0,
            hit.z - startCam.z,
          );
          const horiz = toHit.length();
          const standOff = THREE.MathUtils.clamp(
            currentDist * 0.55,
            controls.minDistance,
            controls.maxDistance,
          );
          endTarget = new THREE.Vector3(hit.x, eyeY, hit.z);
          endCam =
            horiz < 1e-4 ?
              new THREE.Vector3(startCam.x, eyeY, startCam.z)
            : new THREE.Vector3(
                hit.x - (toHit.x / horiz) * Math.min(standOff, horiz * 0.45),
                eyeY,
                hit.z - (toHit.z / horiz) * Math.min(standOff, horiz * 0.45),
              );
        }

        focusClickAnim = {
          start: startCam,
          end: endCam,
          startTarget,
          endTarget,
          t0: performance.now(),
        };
        hideFloorCursorRing();
      };

      const syncOrbitPivotToNearbySurface = () => {
        const scale = modelNavScaleRef.current;
        if (!scale) return;
        // At overview max zoom-out, leave the far pivot alone — tightening here
        // collapses distance right after the wheel hits maxDistance.
        const orbitDist = camera.position.distanceTo(controls.target);
        if (
          controls.maxDistance > 0 &&
          orbitDist >= controls.maxDistance * 0.9
        ) {
          return;
        }
        if (
          tightenOrbitPivotIfOversized(
            camera,
            controls,
            scale,
            modelRootRef.current,
            raycaster,
          )
        ) {
          syncOrbitControls(camera, controls);
        }
      };
      settleOrbitPivotRef.current = syncOrbitPivotToNearbySurface;

      const onOrbitStart = () => {
        isOrbiting = true;
        orbitInteractionActive = true;
        suppressClickAfterOrbit = false;
        hideFloorCursorRing();
        // Pull a stale far pivot in before the drag lever-arm kicks in.
        syncOrbitPivotToNearbySurface();
      };

      const onOrbitChange = () => {
        if (orbitInteractionActive) suppressClickAfterOrbit = true;
      };

      const onOrbitEnd = () => {
        isOrbiting = false;
        orbitInteractionActive = false;
      };

      controls.addEventListener('start', onOrbitStart);
      controls.addEventListener('change', onOrbitChange);
      controls.addEventListener('end', onOrbitEnd);

      // -- Click: dismiss panel, floor focus move + optional dev coords --------
      const onCanvasClick = (e: MouseEvent) => {
        if (isCameraMovementLocked()) return;
        if (isViewerOverlayUiTarget(e.target)) return;
        if (isPointerOverHotspotUi(e.clientX, e.clientY)) return;
        if (suppressClickAfterOrbit) {
          suppressClickAfterOrbit = false;
          return;
        }

        // Model / empty space — same as PSV panorama background dismiss.
        openPanelCloseRef.current?.();

        const rect = container.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const walkTargets = collectFloorRaycastTargets(modelRootRef.current);
        if (walkTargets.length === 0) return;

        // Dev create/relocate armed — capture any surface, don't steal the click for move.
        if (devHotspotPlacementCaptureRef.current && onDevClickRef.current) {
          raycaster.setFromCamera(pointer, camera);
          const anyHit = raycaster.intersectObjects(walkTargets, true)[0];
          if (anyHit) {
            const p = anyHit.point;
            onDevClickRef.current({
              x: +p.x.toFixed(2),
              y: +p.y.toFixed(2),
              z: +p.z.toFixed(2),
            });
          }
          return;
        }

        const floorPoint = resolveFloorClickPoint(
          raycaster,
          pointer,
          camera,
          walkTargets,
        );
        if (floorPoint) startFocusMove(floorPoint);
      };
      container.addEventListener('click', onCanvasClick);

      // -- Report current view (yaw/pitch) to dev panel on orbit change ----------
      let viewReportTimer: ReturnType<typeof setTimeout> | null = null;
      const reportView = () => {
        syncDevViewFromCamera(camera, controls, onDevViewUpdateRef.current);
        // While the slider eases, React already owns the handle position —
        // remapping from the mid-lerp camera distance jumps the dot.
        if (!smoothOrbitZoomRef.current?.isSliderChasing()) {
          syncToolbarZoomLevelRef.current();
        }
      };
      const onControlsChange = () => {
        if (viewReportTimer) clearTimeout(viewReportTimer);
        viewReportTimer = setTimeout(reportView, 100);
      };
      controls.addEventListener('change', onControlsChange);

      const smoothOrbitZoom = attachSmoothOrbitZoom(
        renderer.domElement,
        camera,
        controls,
        {
          shouldIgnoreWheel: (event) => {
            if (landingAnimRef.current) return true;
            if (sceneTransitionAnimRef.current) return true;
            if (panelPanAnimRef.current) return true;
            if (focusClickAnim) return true;
            if (isViewerOverlayUiTarget(event.target)) return true;
            return isPointerOverHotspotUi(event.clientX, event.clientY);
          },
          onDistanceSettled: () => {
            syncOrbitPivotToNearbySurface();
            reportView();
          },
          onDistanceChange: () => {
            syncToolbarZoomLevelRef.current();
          },
        },
      );
      smoothOrbitZoomRef.current = smoothOrbitZoom;

      const updateFloorCursorRing = (clientX: number, clientY: number) => {
        if (!floorRingEnabled || isOrbiting || isCameraMovementLocked()) {
          hideFloorCursorRing();
          return;
        }
        if (isPointerOverHotspotUi(clientX, clientY)) {
          hideFloorCursorRing();
          return;
        }

        const rect = container.getBoundingClientRect();
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          hideFloorCursorRing();
          return;
        }

        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        floorCursorRing.updateFromRaycast(
          raycaster,
          pointer,
          camera,
          collectFloorRaycastTargets(modelRootRef.current),
        );
      };

      const onPointerMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        updateFloorCursorRing(e.clientX, e.clientY);
      };

      const onPointerLeave = () => {
        hideFloorCursorRing();
      };

      if (floorRingEnabled) {
        container.addEventListener('pointermove', onPointerMove, true);
        container.addEventListener('pointerleave', onPointerLeave);
      }

      const viewerDragCursors = attachViewerDragCursors(
        container,
        renderer.domElement,
        controls,
        {
          shouldIgnore: () => isCameraMovementLocked(),
          isOverHotspotUi: isPointerOverHotspotUi,
        },
      );

      // -- Render loop --------------------------------------------------------
      const animate = () => {
        const now = performance.now();
        const dt = Math.min((now - prevTime) / 1000, 0.1);
        prevTime = now;
        let zoomWasBusyThisFrame = false;

        // Landing camera fly-in (highest priority — blocks all other movement)
        const landingAnim = landingAnimRef.current;
        if (landingAnim) {
          if (tickSphericalLandingAnim(landingAnim, now, camera, controls)) {
            finishLanding(
              camera,
              controls,
              landingAnim.endCamPos,
              landingAnim.endTarget,
            );
          }
        } else if (sceneTransitionAnimRef.current) {
          const anim = sceneTransitionAnimRef.current;
          if (tickDualTargetCameraAnim(anim, now, camera, controls)) {
            const resolve = anim.resolve;
            sceneTransitionAnimRef.current = null;
            resolve();
          }
        } else if (panelPanAnimRef.current) {
          const anim = panelPanAnimRef.current;
          if (tickDualTargetCameraAnim(anim, now, camera, controls)) {
            const resolve = anim.resolve;
            panelPanAnimRef.current = null;
            resolve();
          }
        } else if (focusClickAnim) {
          const elapsed = now - focusClickAnim.t0;
          const raw = Math.min(elapsed / FOCUS_CLICK_MOVE_DURATION_MS, 1);
          const t = raw * raw * (3 - 2 * raw);

          camera.position.lerpVectors(
            focusClickAnim.start,
            focusClickAnim.end,
            t,
          );
          controls.target.lerpVectors(
            focusClickAnim.startTarget,
            focusClickAnim.endTarget,
            t,
          );
          camera.lookAt(controls.target);

          if (raw >= 1) {
            camera.position.copy(focusClickAnim.end);
            controls.target.copy(focusClickAnim.endTarget);
            camera.lookAt(focusClickAnim.endTarget);
            // Match landing/scene transitions — without this, the next damped
            // controls.update() reconciles a stale spherical offset and jumps.
            syncOrbitControls(camera, controls);
            focusClickAnim = null;
          }
        } else if (!xrPresentingRef.current) {
          let orbitChanged = false;
          orbitOffset.copy(camera.position).sub(controls.target);
          orbitSpherical.setFromVector3(orbitOffset);

          if (keysDown.has('ArrowLeft')) {
            orbitSpherical.theta -= ORBIT_KEY_SPEED * dt;
            orbitChanged = true;
          }
          if (keysDown.has('ArrowRight')) {
            orbitSpherical.theta += ORBIT_KEY_SPEED * dt;
            orbitChanged = true;
          }
          if (keysDown.has('ArrowUp')) {
            orbitSpherical.phi = Math.max(
              controls.minPolarAngle + 0.01,
              orbitSpherical.phi - ORBIT_KEY_SPEED * dt,
            );
            orbitChanged = true;
          }
          if (keysDown.has('ArrowDown')) {
            orbitSpherical.phi = Math.min(
              controls.maxPolarAngle - 0.01,
              orbitSpherical.phi + ORBIT_KEY_SPEED * dt,
            );
            orbitChanged = true;
          }

          if (orbitChanged) {
            orbitOffset.setFromSpherical(orbitSpherical);
            camera.position.copy(controls.target).add(orbitOffset);
          }

          forward
            .subVectors(controls.target, camera.position)
            .setY(0)
            .normalize();
          right.crossVectors(forward, camera.up).normalize();

          moveDir.set(0, 0, 0);
          if (keysDown.has('KeyW')) moveDir.add(forward);
          if (keysDown.has('KeyS')) moveDir.sub(forward);
          if (keysDown.has('KeyA')) moveDir.sub(right);
          if (keysDown.has('KeyD')) moveDir.add(right);

          if (moveDir.lengthSq() > 0) {
            const scale = modelNavScaleRef.current;
            const orbitDist = camera.position.distanceTo(controls.target);
            // Walk pace ≈ model radius (nav contract) — not canvas size / lever arm.
            const walkSpeed =
              scale ?
                resolveAdaptiveWalkSpeed(orbitDist, scale)
              : Math.max(orbitDist * 0.35, 1.5);
            moveDir.normalize().multiplyScalar(walkSpeed * dt);
            camera.position.add(moveDir);
            controls.target.add(moveDir);
          }
        }

        controls.enabled =
          !xrPresentingRef.current &&
          !(
            landingAnimRef.current ||
            sceneTransitionAnimRef.current ||
            panelPanAnimRef.current ||
            focusClickAnim ||
            hotspotMoveDragRef.current
          );

        if (
          !xrPresentingRef.current &&
          !landingAnimRef.current &&
          !sceneTransitionAnimRef.current &&
          !panelPanAnimRef.current &&
          !focusClickAnim
        ) {
          const navScale = modelNavScaleRef.current;
          if (navScale) {
            applyAdaptiveOrbitSpeeds(camera, controls, navScale);
          }
          // Capture before tick — final coast frame zeroes velocity inside tick.
          zoomWasBusyThisFrame = smoothOrbitZoom.isBusy();
          smoothOrbitZoom.tick(dt, camera, controls);
          const zoomBusy = smoothOrbitZoom.isBusy();
          // Pivot tighten changes orbit distance — never during wheel/slider dolly
          // or the zoom bar remaps from a stale pre-pivot distance.
          if (!isOrbiting && !zoomBusy) {
            syncOrbitPivotToNearbySurface();
          }
        } else {
          smoothOrbitZoom.resetTarget();
        }

        if (
          !xrPresentingRef.current &&
          !landingAnimRef.current &&
          !sceneTransitionAnimRef.current &&
          !panelPanAnimRef.current &&
          !focusClickAnim
        ) {
          controls.update();
          // After damping: camera distance is final for this frame.
          if (
            (zoomWasBusyThisFrame || smoothOrbitZoom.isBusy()) &&
            !smoothOrbitZoom.isSliderChasing()
          ) {
            syncToolbarZoomLevelRef.current();
          }
        }

        if (getModel3dDebugLights().lightHelpers) {
          for (const helper of lightHelpersRef.current) {
            if (helper.visible) helper.update();
          }
        }

        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      };
      // setAnimationLoop is required for WebXR; also drives flat Orbit view.
      renderer.setAnimationLoop(animate);

      // Resize handler
      const onResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
      };
      syncLayoutSizeRef.current = onResize;
      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);

      // Canvas is live — TourLoadSplash + LoadProgressBar handle loading UX.
      setReady(true);

      void loadScene(initialSceneId).then((ok) => {
        if (disposed || !ok) return;
        modelLoadedRef.current = true;
        tryStartLanding();
      });

      return () => {
        disposed = true;
        unsubscribeDebugLights();
        loadGenerationRef.current += 1;
        landingAnimRef.current = null;
        if (sceneTransitionAnimRef.current) {
          sceneTransitionAnimRef.current.resolve();
          sceneTransitionAnimRef.current = null;
        }
        if (panelPanAnimRef.current) {
          panelPanAnimRef.current.resolve();
          panelPanAnimRef.current = null;
        }
        openPanelCloseRef.current = null;
        activePanelHotspotIdRef.current = null;
        tryStartLandingRef.current = null;
        settleOrbitPivotRef.current = null;
        loadedModelUrlRef.current = null;
        contactShadowRef.current?.dispose();
        contactShadowRef.current = null;
        groundSurfaceRef.current?.dispose();
        groundSurfaceRef.current = null;
        for (const helper of lightHelpersRef.current) {
          helper.removeFromParent();
          helper.dispose();
        }
        lightHelpersRef.current = [];
        studioLightsRef.current = null;
        detachHotspotPulseScaleSync();
        if (modelRootRef.current) {
          disposeModelRoot(modelRootRef.current);
          modelRootRef.current = null;
          modelNavScaleRef.current = null;
        }
        if (sceneRef.current) {
          clearHotspotMarkersFromScene(sceneRef.current, hotspotGroupRef);
        }
        hotspotEnterRef.current = null;
        hotspotEnter.destroy();
        renderer.setAnimationLoop(null);
        void exitImmersiveVr(xrSessionRef.current);
        xrSessionRef.current = null;
        xrPresentingRef.current = false;
        syncLayoutSizeRef.current = () => {};
        resizeObserver.disconnect();
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onWindowBlur);
        container.removeEventListener('click', onCanvasClick);
        controls.removeEventListener('start', onOrbitStart);
        controls.removeEventListener('change', onOrbitChange);
        controls.removeEventListener('end', onOrbitEnd);
        if (floorRingEnabled) {
          container.removeEventListener('pointermove', onPointerMove, true);
          container.removeEventListener('pointerleave', onPointerLeave);
        }
        floorCursorRing.dispose();
        viewerDragCursors.dispose();
        smoothOrbitZoom.dispose();
        smoothOrbitZoomRef.current = null;
        controls.removeEventListener('change', onControlsChange);
        if (viewReportTimer) clearTimeout(viewReportTimer);
        controls.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        if (container.contains(labelRenderer.domElement)) {
          container.removeChild(labelRenderer.domElement);
        }
        rendererRef.current = null;
        labelRendererRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        controlsRef.current = null;
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Manage → Move: drag the focused CSS2D hotspot; save on pointerup.
    useEffect(() => {
      if (!devHotspotMoveId) return;

      const container = containerRef.current;
      if (!container) return;

      setDevMovingHotspot3d(container, devHotspotMoveId);

      const MOVE_EPS = 0.01;
      const pointer = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      let dragging = false;
      let start = { x: 0, y: 0, z: 0 };
      let last = { x: 0, y: 0, z: 0 };

      const findLabel = (hotspotId: string): CSS2DObject | null => {
        const group = hotspotGroupRef.current;
        if (!group) return null;
        const obj = group.getObjectByName(`hotspot-${hotspotId}`);
        return obj instanceof CSS2DObject ? obj : null;
      };

      const raycastPoint = (clientX: number, clientY: number) => {
        const camera = cameraRef.current;
        if (!camera) return null;
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        const targets = collectFloorRaycastTargets(modelRootRef.current);
        if (targets.length === 0) return null;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(targets, true)[0];
        return hit?.point ?? null;
      };

      const applyLivePosition = (point: THREE.Vector3) => {
        const moveId = devHotspotMoveIdRef.current;
        if (!moveId) return;
        last = {
          x: +point.x.toFixed(2),
          y: +point.y.toFixed(2),
          z: +point.z.toFixed(2),
        };
        const label = findLabel(moveId);
        label?.position.set(point.x, point.y, point.z);
        onDevClickRef.current?.(last);
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        const moveId = devHotspotMoveIdRef.current;
        if (!moveId) return;
        const target = e.target;
        if (!(target instanceof Element)) return;
        const wrap = target.closest('.hotspot-3d-wrap');
        if (!(wrap instanceof HTMLElement)) return;
        if (wrap.dataset.hotspotId !== moveId) return;

        e.preventDefault();
        e.stopPropagation();

        const point = raycastPoint(e.clientX, e.clientY);
        if (!point) return;

        dragging = true;
        hotspotMoveDragRef.current = true;
        start = {
          x: +point.x.toFixed(2),
          y: +point.y.toFixed(2),
          z: +point.z.toFixed(2),
        };
        last = { ...start };

        wrap
          .querySelector('.hotspot-nav, .hotspot-info, .hotspot-general-info')
          ?.classList.add('hotspot--dev-dragging');

        applyLivePosition(point);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        e.preventDefault();
        const point = raycastPoint(e.clientX, e.clientY);
        if (!point) return;
        applyLivePosition(point);
      };

      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        hotspotMoveDragRef.current = false;

        const moveId = devHotspotMoveIdRef.current;
        if (moveId) {
          container
            .querySelectorAll('.hotspot--dev-dragging')
            .forEach((el) => el.classList.remove('hotspot--dev-dragging'));
        }

        const moved =
          Math.abs(last.x - start.x) > MOVE_EPS ||
          Math.abs(last.y - start.y) > MOVE_EPS ||
          Math.abs(last.z - start.z) > MOVE_EPS;
        if (!moved) return;

        onDevHotspotMovedRef.current?.(last);
      };

      container.addEventListener('pointerdown', onPointerDown, true);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);

      return () => {
        if (dragging) hotspotMoveDragRef.current = false;
        setDevMovingHotspot3d(container, null);
        container.removeEventListener('pointerdown', onPointerDown, true);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
      };
    }, [devHotspotMoveId]);

    return (
      <div
        ref={containerRef}
        className={cn(
          'viewer-3d-container',
          !controlsVisible && 'viewer-3d-container--controls-collapsed',
        )}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
        }}
        aria-label='3D virtual tour viewer'
        role='application'
      >
        {ready ?
          <ThreeDViewerControls
            immersiveAvailable={immersiveNavbarAvailable}
            immersiveController={immersiveBackgroundController}
            playTourEnabled={playTourEnabled}
            playTourPhase={playTourPhase}
            onPlayTourToggle={onPlayTourToggle}
            onRecenter={handleRecenter}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            zoomLevel={toolbarZoomLevel}
            onZoomLevelChange={handleZoomLevelChange}
            fullscreenActive={fullscreenActive}
            onFullscreenToggle={onFullscreenToggle}
            disabled={disabled}
          />
        : null}
      </div>
    );
  },
);

export default ThreeDViewer;
