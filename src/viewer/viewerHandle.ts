import type { Tour, ViewPosition } from '../types/tour';

/** Scene load error — shared across viewer implementations. */
export interface ViewerLoadErrorInfo {
  sceneId?: string;
  /** Panorama URL or GLTF model URL that failed. */
  panorama?: string;
}

export interface NavigateToSceneOptions {
  /**
   * Skip TourPage load-progress chrome (Play Tour hops — texture should
   * already be warm from `preloadScene`).
   */
  quiet?: boolean;
  /**
   * Keep the live camera moving into the fade (Play Tour). Omits rotateTo /
   * zoomTo so PSV does not `stopAll()` before the transition.
   */
  seamless?: boolean;
}

/**
 * Renderer-agnostic viewer handle — the imperative contract between
 * TourPage (orchestrator) and any viewer implementation (PSV, Three.js, etc.).
 *
 * Each viewer exports a React `forwardRef` component that implements this
 * interface via `useImperativeHandle`.
 */
export interface TourViewerHandle {
  navigateToScene: (
    sceneId: string,
    targetView?: ViewPosition,
    options?: NavigateToSceneOptions,
  ) => Promise<boolean>;
  /**
   * Warm the destination panorama/model in the background (Play Tour dwell).
   * Safe to call fire-and-forget; no-ops when unsupported.
   */
  preloadScene: (sceneId: string) => Promise<void>;
  retryScene: (sceneId?: string) => Promise<boolean>;
  clearActiveInfoHotspot: () => void;
  /** Close any open overlay panel (PSV panel, 3D overlay, etc.). */
  hideOverlayPanel: () => void;
  /** Close anchored info / nav preview panels on the scene. */
  closeAnchoredPanels: () => void;
  goToNamingOpportunity: (sceneId: string, hotspotId: string) => boolean;
  /**
   * Toggle the auto place-overview info pin on the current scene.
   * @returns false when no place-overview pin exists (caller may fall back).
   */
  togglePlaceOverview: () => boolean;
  /**
   * Animate to the scene default view (navbar recenter button). Normally frames
   * an open naming opportunity if one is active; pass `forceDefault` to ignore
   * it and go to the bare scene default (used when "Visiting" the current place).
   */
  recenterToDefaultView: (options?: { forceDefault?: boolean }) => void;
  /** Animate the live camera to a view on the current scene (no scene change). */
  animateToView: (
    view: ViewPosition,
    options?: { durationMs?: number; continueMotion?: boolean },
  ) => Promise<void>;
  /** Cancel an in-flight camera animate (Play Tour dwell drift, naming frame). */
  stopViewAnimation: () => void | Promise<void>;
  /** Dev — apply fresh tour JSON without remounting the viewer. */
  applyTourUpdate: (tour: Tour) => Promise<void>;
  /** Dev — capture current WebGL frame for 3D scene thumbnail bake (panorama: null). */
  captureSceneThumbnail: () => Promise<Blob | null>;
  /** Dev — read the live camera/view (avoids stale React state when saving defaultView). */
  getCurrentView: () => ViewPosition | null;
  /**
   * Dev Manage — highlight a hotspot marker; optionally animate the camera to it.
   * Pass `null` to clear the highlight. Default `animate: true`.
   */
  focusHotspot: (
    hotspotId: string | null,
    options?: { animate?: boolean },
  ) => void;
}
