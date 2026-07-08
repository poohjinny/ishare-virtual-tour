import type { Tour, ViewPosition } from '../types/tour';

/** Scene load error — shared across viewer implementations. */
export interface ViewerLoadErrorInfo {
  sceneId?: string;
  /** Panorama URL or GLTF model URL that failed. */
  panorama?: string;
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
  ) => Promise<boolean>;
  retryScene: (sceneId?: string) => Promise<boolean>;
  clearActiveInfoHotspot: () => void;
  /** Close any open overlay panel (PSV panel, 3D overlay, etc.). */
  hideOverlayPanel: () => void;
  /** Close anchored info / nav preview panels on the scene. */
  closeAnchoredPanels: () => void;
  goToNamingOpportunity: (sceneId: string, hotspotId: string) => boolean;
  /**
   * Animate to the scene default view (navbar recenter button). Normally frames
   * an open naming opportunity if one is active; pass `forceDefault` to ignore
   * it and go to the bare scene default (used when "Visiting" the current place).
   */
  recenterToDefaultView: (options?: { forceDefault?: boolean }) => void;
  /** Dev — apply fresh tour JSON without remounting the viewer. */
  applyTourUpdate: (tour: Tour) => Promise<void>;
  /** Dev — capture current WebGL frame for 3D scene thumbnail bake (panorama: null). */
  captureSceneThumbnail: () => Promise<Blob | null>;
  /** Dev — read the live camera/view (avoids stale React state when saving defaultView). */
  getCurrentView: () => ViewPosition | null;
}
