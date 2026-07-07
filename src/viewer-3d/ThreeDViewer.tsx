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

import type { Tour, ViewPosition, PopupContent, Hotspot } from '../types/tour';
import { isWorldPosition } from '../types/tour';
import { namingOpportunityStatusConfig } from '../data/namingOpportunityStatus';
import {
  buildNamingHotspotAriaLabel,
  buildNamingHotspotPillLabelHtml,
  escapeHtml,
} from '../viewer/buildMarkers';
import {
  findHotspotInTour,
  resolveModel3dNamingTargetView,
} from '../utils/findTourHotspot';
import { resolveTourSceneModelUrl } from '../utils/resolveTourModelUrl';
import { resolveSceneHotspots } from '../utils/resolveSceneHotspots';
import { parseModel3dSceneTransitionDurationMs } from '../utils/tourTransition';
import type {
  TourViewerHandle,
  ViewerLoadErrorInfo,
} from '../viewer/viewerHandle';

export type { ViewerLoadErrorInfo } from '../viewer/viewerHandle';
import type { ImmersiveBackgroundController } from '../viewer/immersiveBackgroundController';
import {
  buildAnchoredPopupHtml,
  initPopupVideoPlayers,
} from '../components/tourGlassPanelHtml';
import type { ClickCoords } from '../utils/devHotspotLogger';
import {
  hasLandingTransitionPlayed,
  markLandingTransitionPlayed,
} from '../viewer/landingTransition';
import {
  createHotspotEnterController,
  HOTSPOT_ENTER_3D,
  type HotspotEnterController,
} from '../viewer/hotspotEnterAnimation';
import {
  collectFloorRaycastTargets,
  createFloorCursorRing,
  isFinePointerDevice,
  isPointerOverHotspotUi,
  isViewerOverlayUiTarget,
} from './floorCursorRing';
import {
  SKETCHFAB_ORBIT_DAMPING,
  SKETCHFAB_PAN_SPEED,
  SKETCHFAB_ROTATE_SPEED,
  SKETCHFAB_ZOOM_SPEED,
} from './sketchfabNavigation';
import {
  attachSmoothOrbitZoom,
  type SmoothOrbitZoomHandle,
} from './smoothOrbitZoom';
import {
  createModelGradientBackdrop,
  MODEL_GRADIENT_BACKDROP_OUTER_COLOR,
  type ModelGradientBackdrop,
} from './modelGradientBackdrop';
import {
  computeHeroLandingAnim,
  computeLandingOrbitMaxDistance,
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
import { ThreeDViewerControls } from './ThreeDViewerControls';
import { orbitZoomButtonDeltaY } from './orbitZoomStep';
import { cn } from '../lib/cn';
import { VIEWER_CONTROLS_VISIBLE_DEFAULT } from '../utils/viewerControlsPreference';

export interface ThreeDViewerProps {
  tour: Tour;
  initialSceneId: string;
  disabled?: boolean;
  /** Browser fullscreen active — icon + label state from TourPage. */
  fullscreenActive?: boolean;
  onFullscreenToggle?: () => void;
  /** Desktop toolbar collapse — pill expanded when true. */
  controlsVisible?: boolean;
  onControlsToggle?: () => void;
  toolbarToggleAvailable?: boolean;
  /** Tour JSON has immersive bed — show ambience control. */
  immersiveNavbarAvailable?: boolean;
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
const WALK_SPEED = 8.0;
const FOCUS_CLICK_MOVE_DURATION_MS = 600;
const PANEL_EXIT_MS = 200;

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
  camera: THREE.PerspectiveCamera,
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

const ORBIT_MIN_DISTANCE = 0.5;
/** Floor when model / view do not need more range. */
const ORBIT_MAX_DISTANCE_BASE = 500;

function computeOrbitDistanceLimits(
  modelRoot: THREE.Object3D | null,
  camera: THREE.PerspectiveCamera,
  view?: ViewPosition,
): { minDistance: number; maxDistance: number } {
  return {
    minDistance: ORBIT_MIN_DISTANCE,
    maxDistance: computeLandingOrbitMaxDistance(
      modelRoot,
      camera,
      view,
      ORBIT_MAX_DISTANCE_BASE,
    ),
  };
}

function applyOrbitDistanceLimits(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  modelRoot: THREE.Object3D | null,
  view?: ViewPosition,
): void {
  const { minDistance, maxDistance } = computeOrbitDistanceLimits(
    modelRoot,
    camera,
    view,
  );
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;

  const far = Math.max(CAMERA_FAR, maxDistance * 4);
  if (Math.abs(camera.far - far) > 0.5) {
    camera.far = far;
    camera.updateProjectionMatrix();
  }
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
      onDevViewUpdate,
      onActiveInfoHotspotChange,
      onAnchoredPanelVisibilityChange,
      immersiveBackgroundController,
      onViewerLoadError,
      onViewerLoadRecovered,
      fullscreenActive,
      onFullscreenToggle,
      controlsVisible = VIEWER_CONTROLS_VISIBLE_DEFAULT,
      onControlsToggle,
      toolbarToggleAvailable = false,
      immersiveNavbarAvailable = false,
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
    const animFrameRef = useRef(0);
    const currentSceneIdRef = useRef(initialSceneId);
    const transitioningRef = useRef(false);
    const tourRef = useRef(tour);
    const hotspotGroupRef = useRef<THREE.Group | null>(null);
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
    const gradientBackdropRef = useRef<ModelGradientBackdrop | null>(null);
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
      });
    }, []);

    const handleZoomIn = useCallback(() => {
      smoothOrbitZoomRef.current?.impulse(orbitZoomButtonDeltaY('in'));
    }, []);

    const handleZoomOut = useCallback(() => {
      smoothOrbitZoomRef.current?.impulse(orbitZoomButtonDeltaY('out'));
    }, []);

    tourRef.current = tour;

    const onNavigateRef = useRef(onNavigateToScene);
    onNavigateRef.current = onNavigateToScene;
    const onInfoRef = useRef(onInfoHotspot);
    onInfoRef.current = onInfoHotspot;
    const onDevClickRef = useRef(onDevClick);
    onDevClickRef.current = onDevClick;
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
      ): Promise<void> => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          applyViewToCamera(camera, controls, view, modelRoot);
          return Promise.resolve();
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
            resolve,
          };
        });
      },
      [],
    );

    const buildHotspotMarkers = useCallback(
      (hotspots: Hotspot[], scene3d: THREE.Scene) => {
        openPanelCloseRef.current = null;
        activePanelHotspotIdRef.current = null;
        hotspotPanelActionsRef.current.clear();
        clearHotspotMarkersFromScene(scene3d, hotspotGroupRef);

        const group = new THREE.Group();
        group.name = 'hotspot-markers';

        for (const hs of hotspots) {
          if (!isWorldPosition(hs.position)) continue;
          const worldPos = hs.position;

          const wrap = document.createElement('div');
          wrap.className = 'hotspot-3d-wrap';
          wrap.dataset.hotspotId = hs.id;

          const variantClass =
            hs.navVariant === 'back' ? ' hotspot-nav--back'
            : hs.navVariant === 'hub' ? ' hotspot-nav--hub'
            : '';
          const ariaLabel = hs.label ?? hs.id;

          if (hs.type === 'nav') {
            wrap.innerHTML = `
              <button type="button" class="hotspot-nav${variantClass}"
                aria-label="${ariaLabel}">
                <span class="hotspot-nav__pill">
                  <span class="hotspot-nav__dot" aria-hidden="true"></span>
                  <span class="hotspot-nav__label">${ariaLabel}</span>
                </span>
              </button>`;
          } else {
            const naming = hs.popup?.namingOpportunity;
            const statusClosed =
              (
                naming &&
                namingOpportunityStatusConfig(naming.status).cssModifier ===
                  'closed'
              ) ?
                ' hotspot-info--status-closed'
              : '';
            const infoAriaLabel =
              naming ?
                buildNamingHotspotAriaLabel(hs)
              : (hs.popup?.title?.trim() ?? hs.label?.trim() ?? ariaLabel);
            wrap.innerHTML = `
              <button type="button" class="hotspot-info${statusClosed}"
                data-hotspot-type="info" data-hotspot-id="${hs.id}"
                aria-label="${escapeHtml(infoAriaLabel)}">
                <span class="hotspot-info__pulse" aria-hidden="true"></span>
                <span class="hotspot-info__pill">
                  <span class="hotspot-info__icon-wrap">
                    <svg class="hotspot-info__icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                    </svg>
                  </span>
                  <span class="hotspot-info__label">${buildNamingHotspotPillLabelHtml(hs)}</span>
                </span>
              </button>`;
          }

          const btn = wrap.querySelector('button')!;
          let panelOpen = false;
          let panelEl: HTMLElement | null = null;

          const closeThisPanel = () => {
            if (!panelEl) {
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

            const shell = closingEl.querySelector('.tour-glass-panel__shell');
            if (shell instanceof HTMLElement) {
              shell.classList.remove('tour-glass-panel__shell--enter');
              shell.classList.add('tour-glass-panel__shell--exit');
              window.setTimeout(() => {
                closingEl.remove();
              }, PANEL_EXIT_MS);
            } else {
              closingEl.remove();
            }
            onActiveInfoHotspotChangeRef.current?.(null);
            onAnchoredPanelVisibilityChangeRef.current?.(false);
          };

          const openAnchoredPanel = (popup: PopupContent) => {
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

            const panelHtml = buildAnchoredPopupHtml(popup, hs.id, {
              tour: tourRef.current,
            });
            const el = document.createElement('div');
            el.className = 'hotspot-3d-anchored-panel';
            el.innerHTML = panelHtml;
            panelEl = el;
            panelOpen = true;
            openPanelCloseRef.current = closeThisPanel;
            activePanelHotspotIdRef.current = hs.id;
            wrap.classList.add('hotspot-3d-wrap--panel-open');
            wrap.appendChild(el);

            el.addEventListener('click', (ev) => {
              const clicked = ev.target as HTMLElement;
              if (clicked.closest('[data-info-panel-close]')) closeThisPanel();
              const visitEl = clicked.closest(
                '[data-visit-scene]',
              ) as HTMLElement | null;
              if (visitEl?.dataset.visitScene) {
                closeThisPanel();
                onNavigateRef.current?.(visitEl.dataset.visitScene);
              }
            });

            requestAnimationFrame(() => {
              initPopupVideoPlayers(el);
              const camera = cameraRef.current;
              const controls = controlsRef.current;
              const container = containerRef.current;
              const scene3d = sceneRef.current;
              const labelRenderer = labelRendererRef.current;
              if (!camera || !controls || !container) return;

              void (async () => {
                await waitForAnchoredPanelLayout(() => panelEl);
                if (!panelEl) return;
                await waitForPanelEnterAnimation(panelEl);

                const probeFramingView = (
                  baseView: ViewPosition,
                ): ViewPosition => {
                  if (!scene3d || !labelRenderer) return baseView;

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
                    renderLabels: () => labelRenderer.render(scene3d, camera),
                    readView: () => readCameraViewPosition(camera, controls),
                  });
                };

                const panelView = resolveHotspotPanelView(tourRef.current, hs);
                if (panelView) {
                  const framingView = probeFramingView(panelView);
                  await waitForSceneTransition(
                    camera,
                    controls,
                    framingView,
                    modelRootRef.current,
                    HOTSPOT_CAMERA_TRANSITION_TIMING,
                  );
                } else {
                  const savedCam = camera.position.clone();
                  const savedTarget = controls.target.clone();
                  const offset = savedCam.clone().sub(savedTarget);
                  const endTarget = new THREE.Vector3(
                    worldPos.x,
                    worldPos.y,
                    worldPos.z,
                  );

                  camera.position.copy(endTarget.clone().add(offset));
                  controls.target.copy(endTarget);
                  camera.lookAt(endTarget);
                  syncOrbitControls(camera, controls);
                  const panBaseView = readCameraViewPosition(camera, controls);

                  camera.position.copy(savedCam);
                  controls.target.copy(savedTarget);
                  camera.lookAt(savedTarget);
                  syncOrbitControls(camera, controls);

                  const framingView = probeFramingView(panBaseView);
                  await waitForSceneTransition(
                    camera,
                    controls,
                    framingView,
                    modelRootRef.current,
                    HOTSPOT_CAMERA_TRANSITION_TIMING,
                  );
                }

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

          if (hs.type === 'info' && hs.popup) {
            hotspotPanelActionsRef.current.set(hs.id, {
              open: () => openAnchoredPanel(hs.popup!),
              isOpen: () => panelOpen,
            });
          }

          btn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (hs.type === 'nav' && hs.targetScene) {
              if (hs.instant) {
                onNavigateRef.current?.(hs.targetScene, hs.targetView);
                return;
              }
              const scene = tourRef.current.scenes[hs.targetScene];
              openAnchoredPanel({
                title: scene?.title ?? hs.label ?? hs.targetScene,
                body: scene?.description ?? '',
                visitScene: hs.targetScene,
              });
              return;
            }

            if (hs.type === 'info' && hs.popup) {
              openAnchoredPanel(hs.popup);
            }
          });

          const label = new CSS2DObject(wrap);
          label.position.set(worldPos.x, worldPos.y, worldPos.z);
          // Anchor bottom-center on the world point so opening a panel above does not re-center the pill.
          label.center.set(0.5, 1);
          label.name = `hotspot-${hs.id}`;
          group.add(label);
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
            }

            scene3d.add(gltf.scene);
            loadedModelUrlRef.current = modelUrl;
            modelRootRef.current = gltf.scene;
            gradientBackdropRef.current?.updateFromModel(gltf.scene);
            applyOrbitDistanceLimits(camera, controls, gltf.scene, view);
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

        if (modelRootRef.current) {
          gradientBackdropRef.current?.updateFromModel(modelRootRef.current);
        }

        applyOrbitDistanceLimits(camera, controls, modelRootRef.current, view);

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
              resolveSceneHotspots(tourRef.current, sceneData),
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
              resolveSceneHotspots(tourRef.current, sceneData),
              scene3d,
            );
            if (loadId !== loadGenerationRef.current) {
              clearHotspotMarkersFromScene(scene3d, hotspotGroupRef);
              return abortLoad();
            }

            if (!preserveCamera) {
              applyViewToCamera(camera, controls, view, modelRootRef.current);
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
      navigateToScene: async (sceneId, targetView) => {
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
      retryScene: async (sceneId) => {
        const target = sceneId ?? currentSceneIdRef.current;
        onViewerLoadRecoveredRef.current?.();
        if (modelRootRef.current) {
          disposeModelRoot(modelRootRef.current);
          modelRootRef.current = null;
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
      goToNamingOpportunity: (sceneId, hotspotId) => {
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
      recenterToDefaultView: () => {
        handleRecenter();
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
      applyTourUpdate: async (newTour) => {
        const sceneId = currentSceneIdRef.current;
        const prevTour = tourRef.current;
        const prevScene = prevTour.scenes[sceneId];
        const prevModel =
          prevScene ? resolveTourSceneModelUrl(prevTour, prevScene) : null;
        const sceneCountBefore = Object.keys(prevTour.scenes).length;

        tourRef.current = newTour;

        const nextScene = newTour.scenes[sceneId];
        if (!nextScene) {
          return;
        }

        const nextModel = resolveTourSceneModelUrl(newTour, nextScene);
        if (nextModel !== prevModel) {
          loadedModelUrlRef.current = null;
          if (modelRootRef.current) {
            disposeModelRoot(modelRootRef.current);
            modelRootRef.current = null;
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

        await loadScene(sceneId, undefined, { preserveCamera: true });
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
      landingStartedRef.current = false;
      initialRevealNotifiedRef.current = false;
      landingAnimRef.current = null;

      const hotspotEnter = createHotspotEnterController(
        () => containerRef.current,
        HOTSPOT_ENTER_3D,
      );
      hotspotEnterRef.current = hotspotEnter;

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
        landingAnimRef.current = null;
        tryNotifyInitialTourReveal();
        syncDevViewFromCamera(camera, controls, onDevViewUpdateRef.current);
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
      renderer.toneMappingExposure = 1.4;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = MODEL_GRADIENT_BACKDROP_OUTER_COLOR.clone();

      const gradientBackdrop = createModelGradientBackdrop();
      scene.add(gradientBackdrop.root);
      gradientBackdropRef.current = gradientBackdrop;

      // -- Environment map for reflections (neutral studio HDRI approximation) ----
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      const envScene = new THREE.Scene();
      const envGeo = new THREE.IcosahedronGeometry(1, 2);
      const envMat = new THREE.MeshBasicMaterial({
        color: 0x0a0a0a,
        side: THREE.BackSide,
      });
      envScene.add(new THREE.Mesh(envGeo, envMat));

      // Soft fill lights baked into the env map
      const envFill1 = new THREE.PointLight(0xddeeff, 40, 6);
      envFill1.position.set(1, 1.5, 1);
      envScene.add(envFill1);
      const envFill2 = new THREE.PointLight(0xffeedd, 20, 6);
      envFill2.position.set(-1.5, 0, -1);
      envScene.add(envFill2);
      const envFill3 = new THREE.PointLight(0xffffff, 10, 6);
      envFill3.position.set(0, -1, 1.5);
      envScene.add(envFill3);

      const envRT = pmremGenerator.fromScene(envScene, 0.04);
      scene.environment = envRT.texture;
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        container.clientWidth / container.clientHeight,
        CAMERA_NEAR,
        CAMERA_FAR,
      );
      camera.position.set(0, CAMERA_HEIGHT, 0);
      cameraRef.current = camera;

      // Lighting — subtle ambient + key/fill/rim for cinematic look
      const ambient = new THREE.AmbientLight(0xffffff, 0.15);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
      keyLight.position.set(5, 12, 7);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xddeeff, 0.4);
      fillLight.position.set(-6, 4, -3);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
      rimLight.position.set(0, 8, -10);
      scene.add(rimLight);

      // Orbit controls — Sketchfab-style: LMB orbit, RMB pan, wheel zoom
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = SKETCHFAB_ORBIT_DAMPING;
      controls.rotateSpeed = SKETCHFAB_ROTATE_SPEED;
      controls.panSpeed = SKETCHFAB_PAN_SPEED;
      controls.zoomSpeed = SKETCHFAB_ZOOM_SPEED;
      controls.enablePan = true;
      controls.enableZoom = false;
      controls.screenSpacePanning = true;
      controls.minDistance = ORBIT_MIN_DISTANCE;
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
        const offset = startCam.clone().sub(startTarget);
        const endTarget = hit.clone();
        const endDist = THREE.MathUtils.clamp(
          offset.length() * 0.55,
          controls.minDistance,
          controls.maxDistance,
        );
        const endCam = endTarget
          .clone()
          .add(offset.normalize().multiplyScalar(endDist));

        focusClickAnim = {
          start: startCam,
          end: endCam,
          startTarget,
          endTarget,
          t0: performance.now(),
        };
        hideFloorCursorRing();
      };

      const onOrbitStart = () => {
        isOrbiting = true;
        orbitInteractionActive = true;
        suppressClickAfterOrbit = false;
        hideFloorCursorRing();
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

      // -- Click: focus orbit target + dev world position ----------------------
      const onCanvasClick = (e: MouseEvent) => {
        if (isCameraMovementLocked()) return;
        if (isViewerOverlayUiTarget(e.target)) return;
        if (isPointerOverHotspotUi(e.clientX, e.clientY)) return;
        if (suppressClickAfterOrbit) {
          suppressClickAfterOrbit = false;
          return;
        }

        const rect = container.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(scene.children, true);
        if (hits.length === 0) return;

        const p = hits[0].point;
        const coords = {
          x: +p.x.toFixed(2),
          y: +p.y.toFixed(2),
          z: +p.z.toFixed(2),
        };
        if (onDevClickRef.current) {
          onDevClickRef.current(coords);
          return;
        }

        console.log('[3D click]', coords);
        startFocusMove(p);
      };
      container.addEventListener('click', onCanvasClick);

      // -- Report current view (yaw/pitch) to dev panel on orbit change ----------
      let viewReportTimer: ReturnType<typeof setTimeout> | null = null;
      const reportView = () => {
        syncDevViewFromCamera(camera, controls, onDevViewUpdateRef.current);
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
          onDistanceSettled: reportView,
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
        animFrameRef.current = requestAnimationFrame(animate);

        const now = performance.now();
        const dt = Math.min((now - prevTime) / 1000, 0.1);
        prevTime = now;

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

          if (raw >= 1) focusClickAnim = null;
        } else {
          let orbitChanged = false;
          orbitOffset.copy(camera.position).sub(controls.target);
          orbitSpherical.setFromVector3(orbitOffset);

          if (keysDown.has('ArrowLeft')) {
            orbitSpherical.theta += ORBIT_KEY_SPEED * dt;
            orbitChanged = true;
          }
          if (keysDown.has('ArrowRight')) {
            orbitSpherical.theta -= ORBIT_KEY_SPEED * dt;
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
            moveDir.normalize().multiplyScalar(WALK_SPEED * dt);
            camera.position.add(moveDir);
            controls.target.add(moveDir);
          }
        }

        controls.enabled = !(
          landingAnimRef.current ||
          sceneTransitionAnimRef.current ||
          panelPanAnimRef.current ||
          focusClickAnim
        );

        if (
          !landingAnimRef.current &&
          !sceneTransitionAnimRef.current &&
          !panelPanAnimRef.current &&
          !focusClickAnim
        ) {
          smoothOrbitZoom.tick(dt, camera, controls);
        } else {
          smoothOrbitZoom.resetTarget();
        }

        if (
          !landingAnimRef.current &&
          !sceneTransitionAnimRef.current &&
          !panelPanAnimRef.current &&
          !focusClickAnim
        ) {
          controls.update();
        }
        gradientBackdropRef.current?.updateCamera(camera.position);
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      };
      animate();

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
        loadedModelUrlRef.current = null;
        gradientBackdropRef.current?.dispose();
        gradientBackdropRef.current = null;
        if (modelRootRef.current) {
          disposeModelRoot(modelRootRef.current);
          modelRootRef.current = null;
        }
        if (sceneRef.current) {
          clearHotspotMarkersFromScene(sceneRef.current, hotspotGroupRef);
        }
        hotspotEnterRef.current = null;
        hotspotEnter.destroy();
        cancelAnimationFrame(animFrameRef.current);
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

    return (
      <div
        ref={containerRef}
        className={cn(
          'viewer-3d-container',
          toolbarToggleAvailable &&
            !controlsVisible &&
            'viewer-3d-container--controls-collapsed',
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
            collapsed={!controlsVisible}
            onToggleCollapsed={onControlsToggle}
            toolbarToggleAvailable={toolbarToggleAvailable}
            immersiveAvailable={immersiveNavbarAvailable}
            immersiveController={immersiveBackgroundController}
            onRecenter={handleRecenter}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
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
