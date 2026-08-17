/**
 * Model3d anchored-panel viewport fit — applies shared clip-nudge math
 * (`anchoredPanelClipNudge`) via orbit yaw/pitch. Does not re-center on the
 * hotspot; probes from the caller's base view (normally the current camera).
 */

import type { PerspectiveCamera } from 'three';
import type { Vector3 as Vector3Type } from 'three';
import type { ViewPosition } from '../types/tour';
import {
  measureAnchoredPanelBottomInsetPx,
  measureAnchoredPanelTopInsetPx,
  type PanelScreenRect,
} from '../viewer-shared/anchoredPanelLayout';
import {
  ANCHORED_PANEL_CLIP_NUDGE_MAX_SHIFT_DEG,
  anchoredPanelNeedsClipFit,
  applyAnchoredPanelClipNudgeShiftsDeg,
  computeAnchoredPanelClipNudgeShiftsDeg,
  measureAnchoredPanelScreenRect,
  perspectiveFocalLengthPx,
  resolveAnchoredPanelClipInsets,
} from '../viewer-shared/anchoredPanelClipNudge';

export {
  waitForAnchoredPanelEnter as waitForPanelEnterAnimation,
  waitForAnchoredPanelLayout,
  type PanelScreenRect,
} from '../viewer-shared/anchoredPanelLayout';

export {
  measureAnchoredPanelHeaderTopPx as measurePanelHeaderTopPx,
  measureAnchoredPanelScreenRect,
} from '../viewer-shared/anchoredPanelClipNudge';

const MAX_PROBE_PASSES = 8;

/** @deprecated Prefer measureAnchoredPanelBottomInsetPx — kept for call sites. */
export function measureViewerBottomInsetPx(container: HTMLElement): number {
  return measureAnchoredPanelBottomInsetPx(container);
}

/** @deprecated Prefer measureAnchoredPanelTopInsetPx — kept for call sites. */
export function measureViewerTopInsetPx(container: HTMLElement): number {
  return measureAnchoredPanelTopInsetPx(container);
}

/**
 * Pitch + yaw view correction so the anchored panel clears chrome insets
 * (breadcrumb top, side/bottom margins) — same overflow math as PSV clip-nudge.
 */
export function computePanelFitView(
  camera: PerspectiveCamera,
  container: HTMLElement,
  currentView: ViewPosition,
  rect: PanelScreenRect,
  topInsetPx = measureAnchoredPanelTopInsetPx(container),
  bottomInsetPx = measureAnchoredPanelBottomInsetPx(container),
): ViewPosition | null {
  const vw = container.clientWidth;
  const vh = container.clientHeight;
  if (vw <= 0 || vh <= 0) return null;

  const focalPx = perspectiveFocalLengthPx(camera.fov, vh);
  if (!(focalPx > 0)) return null;

  const insets = {
    topPx: topInsetPx,
    bottomPx: bottomInsetPx,
    sidePx: resolveAnchoredPanelClipInsets(container).sidePx,
  };

  const shifts = computeAnchoredPanelClipNudgeShiftsDeg({
    viewportWidth: vw,
    viewportHeight: vh,
    focalPx,
    rect,
    insets,
    maxShiftDeg: ANCHORED_PANEL_CLIP_NUDGE_MAX_SHIFT_DEG,
  });
  if (!shifts) return null;

  const next = applyAnchoredPanelClipNudgeShiftsDeg(
    { yaw: currentView.yaw, pitch: currentView.pitch },
    shifts,
  );

  return {
    ...currentView,
    yaw: +next.yaw.toFixed(2),
    pitch: +next.pitch.toFixed(2),
  };
}

/** @deprecated Use computePanelFitView — kept for call sites during transition. */
export function computePanelVerticalFitView(
  camera: PerspectiveCamera,
  container: HTMLElement,
  currentView: ViewPosition,
  rect: PanelScreenRect,
  topInsetPx = measureAnchoredPanelTopInsetPx(container),
  bottomInsetPx = measureAnchoredPanelBottomInsetPx(container),
): ViewPosition | null {
  return computePanelFitView(
    camera,
    container,
    currentView,
    rect,
    topInsetPx,
    bottomInsetPx,
  );
}

export interface ResolvePanelFramingView3dOptions {
  container: HTMLElement;
  camera: PerspectiveCamera;
  panelRoot: HTMLElement;
  /** Probe starting orientation — use the *current* camera for clip-nudge. */
  baseView: ViewPosition;
  applyView: (view: ViewPosition) => void;
  restoreCamera: (camPos: Vector3Type, target: Vector3Type) => void;
  readCameraPose: () => { camPos: Vector3Type; target: Vector3Type };
  renderLabels: () => void;
  readView: () => ViewPosition;
}

/**
 * Probe panel placement at `baseView` (no animation), then return one combined view
 * so framing runs in a single camera transition (pitch + yaw clip-nudge only).
 */
export function resolvePanelFramingView3d(
  options: ResolvePanelFramingView3dOptions,
): ViewPosition {
  const { camPos, target } = options.readCameraPose();

  options.applyView(options.baseView);
  options.renderLabels();

  const insets = resolveAnchoredPanelClipInsets(options.container);
  let framingView = options.baseView;

  for (let pass = 0; pass < MAX_PROBE_PASSES; pass += 1) {
    const rect = measureAnchoredPanelScreenRect(
      options.container,
      options.panelRoot,
    );

    if (!anchoredPanelNeedsClipFit(options.container, rect, insets)) {
      break;
    }

    const nextView = computePanelFitView(
      options.camera,
      options.container,
      options.readView(),
      rect,
      insets.topPx,
      insets.bottomPx,
    );
    if (!nextView) break;

    const prev = options.readView();
    if (
      Math.abs(nextView.pitch - prev.pitch) < 0.05 &&
      Math.abs(nextView.yaw - prev.yaw) < 0.05
    ) {
      break;
    }

    options.applyView(nextView);
    options.renderLabels();
    framingView = nextView;
  }

  options.restoreCamera(camPos, target);

  return framingView;
}
