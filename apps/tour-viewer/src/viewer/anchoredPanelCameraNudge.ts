import type { Viewer } from '@photo-sphere-viewer/core';

import { ANCHORED_PANEL_GAP_PX } from '../viewer-shared/anchoredPanelGap';
import {
  ANCHORED_PANEL_LAYOUT_MEASURE_ATTEMPTS,
  ANCHORED_PANEL_VIEWPORT_MARGIN_PX,
  type PanelScreenRect,
} from '../viewer-shared/anchoredPanelLayout';
import {
  ANCHORED_PANEL_CLIP_NUDGE_MAX_SHIFT_DEG,
  ANCHORED_PANEL_REVEAL_MAX_SHIFT_DEG,
  absoluteYawDeltaDeg,
  applyAnchoredPanelClipNudgeShiftsDeg,
  computeAnchoredPanelClipNudgeShiftsDeg,
  measureAnchoredPanelScreenRect,
  perspectiveFocalLengthPx,
  resolveAnchoredPanelClipInsets,
  resolveAnchoredPanelNudgeDurationMs,
} from '../viewer-shared/anchoredPanelClipNudge';

const MAX_MEASURE_ATTEMPTS = ANCHORED_PANEL_LAYOUT_MEASURE_ATTEMPTS;

/**
 * Frames a present-but-off-view panel is allowed before we frame the camera.
 * Off-view signals: offsetHeight 0 (PSV display:none), or missing
 * `psv-marker--visible` (anchored panels force display:block and stay
 * visibility:hidden until PSV marks them in-frustum). Markup is static so
 * layout lands in ~1 frame; a few frames of either signal means off-view.
 */
const OFF_VIEW_GRACE_FRAMES = 4;

/** Cap per-axis camera correction so oversized panels never warp the view. */
const MAX_NUDGE_SHIFT_DEG = ANCHORED_PANEL_CLIP_NUDGE_MAX_SHIFT_DEG;

/**
 * Off-view reveal may need a larger single step than a clip nudge (host can sit
 * well outside the frustum). Still a "scroll into view" delta, not a re-center.
 */
const MAX_REVEAL_SHIFT_DEG = ANCHORED_PANEL_REVEAL_MAX_SHIFT_DEG;

/** Hotspot (panel host) spherical position in degrees. */
export interface AnchoredPanelNudgeAnchor {
  yawDeg: number;
  pitchDeg: number;
}

export interface PanelCameraNudgeSettled {
  /** True when a camera nudge animation ran before this callback. */
  nudged: boolean;
}

export interface SchedulePanelCameraNudgeOptions {
  /**
   * Runs when the camera has settled (nudge finished, or none needed).
   * Mount heavy hero media here — not during enter + nudge.
   */
  afterSettled?: (result: PanelCameraNudgeSettled) => void;
  /**
   * Fallback when the panel is off-view: PSV either keeps markers
   * `display:none` (offsetHeight 0) or omits `psv-marker--visible`. Anchored
   * panels override the former with `display:block !important` and use
   * `visibility:hidden` until `--visible`, so height alone is not enough.
   * Clip-nudge cannot measure a hidden marker; called after a short grace so
   * the caller can scroll the camera just far enough to reveal the panel
   * (same feel as clip-nudge — not a full re-center). Returns true when moved.
   */
  onPanelOffView?: () => boolean | Promise<boolean>;
}

/** True when PSV has not marked the marker in-frustum (or it has no layout). */
function isPanelMarkerOffView(panelEl: HTMLElement): boolean {
  return (
    panelEl.offsetHeight <= 0 ||
    !panelEl.classList.contains('psv-marker--visible')
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

async function stopActiveViewerAnimation(viewer: Viewer): Promise<void> {
  const anim = (
    viewer as Viewer & { animation?: { resolved: boolean; cancelled: boolean } }
  ).animation;
  if (anim && !anim.resolved && !anim.cancelled) {
    await viewer.stopAnimation();
  }
}

/** Shared orientation move used by clip-nudge and off-view reveal. */
async function animateCameraOrientation(
  viewer: Viewer,
  targetYawDeg: number,
  targetPitchDeg: number,
): Promise<void> {
  if (prefersReducedMotion()) {
    viewer.rotate({ yaw: `${targetYawDeg}deg`, pitch: `${targetPitchDeg}deg` });
    return;
  }

  const position = viewer.getPosition();
  const yawDelta = absoluteYawDeltaDeg(radToDeg(position.yaw), targetYawDeg);
  const pitchDelta = Math.abs(targetPitchDeg - radToDeg(position.pitch));
  // Combined travel — yaw usually dominates; keep pitch from being ignored.
  const travelDeg = Math.hypot(yawDelta, pitchDelta);
  const durationMs = resolveAnchoredPanelNudgeDurationMs(travelDeg);

  try {
    await stopActiveViewerAnimation(viewer);
    const animation = viewer.animate({
      yaw: `${targetYawDeg}deg`,
      pitch: `${targetPitchDeg}deg`,
      speed: durationMs,
      easing: 'outCubic',
    });
    if (animation) await animation;
    else {
      viewer.rotate({
        yaw: `${targetYawDeg}deg`,
        pitch: `${targetPitchDeg}deg`,
      });
    }
  } catch {
    viewer.rotate({ yaw: `${targetYawDeg}deg`, pitch: `${targetPitchDeg}deg` });
  }
}

export function measurePanelScreenRect(
  viewer: Viewer,
  panelEl: HTMLElement,
): PanelScreenRect {
  return measureAnchoredPanelScreenRect(viewer.container, panelEl);
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Normalize a yaw delta to the shortest rotation in [-180, 180]. */
function normalizeYawDeltaDeg(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

function panelFitCameraPitchDeg(
  viewer: Viewer,
  anchorPitchDeg: number,
  panelHeightPx: number,
  psvZoom: number,
): number | null {
  const vh = viewer.container.clientHeight;
  if (vh <= 0) return null;

  const focalPx = perspectiveFocalLengthPx(
    viewer.dataHelper.zoomLevelToFov(psvZoom),
    vh,
  );
  if (!(focalPx > 0)) return null;

  const maxDropPx = Math.max(
    0,
    (vh - 2 * ANCHORED_PANEL_VIEWPORT_MARGIN_PX) / 2,
  );
  const hotspotDropPx = Math.min(
    (panelHeightPx + ANCHORED_PANEL_GAP_PX) / 2,
    maxDropPx,
  );
  const cameraPitchDeg =
    anchorPitchDeg + radToDeg(Math.atan(hotspotDropPx / focalPx));

  return clamp(cameraPitchDeg, -89, 89);
}

/**
 * Absolute target camera orientation (deg) that shifts a clipped anchored panel
 * just far enough to clear the viewport edge plus a small margin — a minimal
 * "scroll into view" nudge, not a re-center. The view stays close to where the
 * user clicked; only clipped axes move. Returns null when nothing is clipped.
 *
 * Shifts are overflow-sized (small), so the local linear px→angle scale at the
 * center column is accurate and avoids the yaw blow-up a full re-center hit near
 * the poles.
 */
export function computeAnchoredPanelNudgeTarget(
  viewer: Viewer,
  rect: PanelScreenRect,
  options?: { maxShiftDeg?: number },
): { yawDeg: number; pitchDeg: number } | null {
  const vw = viewer.container.clientWidth;
  const vh = viewer.container.clientHeight;
  if (vw <= 0 || vh <= 0) return null;

  const focalPx = perspectiveFocalLengthPx(
    viewer.dataHelper.zoomLevelToFov(viewer.getZoomLevel()),
    vh,
  );
  if (!(focalPx > 0)) return null;

  const shifts = computeAnchoredPanelClipNudgeShiftsDeg({
    viewportWidth: vw,
    viewportHeight: vh,
    focalPx,
    rect,
    insets: resolveAnchoredPanelClipInsets(viewer.container),
    maxShiftDeg: options?.maxShiftDeg ?? MAX_NUDGE_SHIFT_DEG,
  });
  if (!shifts) return null;

  const pos = viewer.getPosition();
  const next = applyAnchoredPanelClipNudgeShiftsDeg(
    { yaw: radToDeg(pos.yaw), pitch: radToDeg(pos.pitch) },
    shifts,
  );
  return { yawDeg: next.yaw, pitchDeg: next.pitch };
}

/**
 * Estimated screen rect for an anchored panel above its host, from spherical
 * projection (works when the marker is off-view / visibility:hidden).
 */
function estimateAnchoredPanelScreenRect(
  viewer: Viewer,
  anchor: AnchoredPanelNudgeAnchor,
  panelSize: { width: number; height: number },
): PanelScreenRect | null {
  const point = viewer.dataHelper.sphericalCoordsToViewerCoords({
    yaw: degToRad(anchor.yawDeg),
    pitch: degToRad(anchor.pitchDeg),
  });
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;

  const halfW = panelSize.width / 2;
  const bottom = point.y - ANCHORED_PANEL_GAP_PX;
  return {
    left: point.x - halfW,
    right: point.x + halfW,
    top: bottom - panelSize.height,
    bottom,
  };
}

/**
 * Minimal camera target that scrolls an off-view panel just into the safe area —
 * same overflow math as clip-nudge, using a projected panel estimate. Prefer this
 * over a full re-center (`computeAnchoredPanelFramedView`) when the panel opens
 * from the user's current view.
 */
export function computeAnchoredPanelRevealTarget(
  viewer: Viewer,
  anchor: AnchoredPanelNudgeAnchor,
  panelSize: { width: number; height: number },
): { yawDeg: number; pitchDeg: number } | null {
  const rect = estimateAnchoredPanelScreenRect(viewer, anchor, panelSize);
  if (!rect) return null;
  return computeAnchoredPanelNudgeTarget(viewer, rect, {
    maxShiftDeg: MAX_REVEAL_SHIFT_DEG,
  });
}

/**
 * Absolute camera orientation (deg) that frames an anchored panel of the given
 * rendered height above its hotspot — computed ahead of render so the entry
 * animation can land pre-framed in one move (no follow-up nudge).
 */
export function computeAnchoredPanelFramedView(
  viewer: Viewer,
  anchor: AnchoredPanelNudgeAnchor,
  panelHeightPx: number,
  psvZoom: number,
): { yawDeg: number; pitchDeg: number } | null {
  const pitchDeg = panelFitCameraPitchDeg(
    viewer,
    anchor.pitchDeg,
    panelHeightPx,
    psvZoom,
  );
  if (pitchDeg === null) return null;

  return { yawDeg: anchor.yawDeg, pitchDeg };
}

/**
 * Frame the camera on an anchored panel's host using the analytic framed view —
 * no DOM measurement needed, so it works even when the panel is off-view and
 * PSV has not rendered it. Rotates yaw to the host and pitch to seat the panel
 * above it. Returns true when a camera move was issued.
 *
 * Prefer {@link revealCameraForOffViewPanel} when opening a panel from the
 * user's current view — framed view is a full re-center (e.g. NO deep-links).
 */
export async function frameCameraForAnchoredPanel(
  viewer: Viewer,
  anchor: AnchoredPanelNudgeAnchor,
  panelHeightPx: number,
): Promise<boolean> {
  const framed = computeAnchoredPanelFramedView(
    viewer,
    anchor,
    panelHeightPx,
    viewer.getZoomLevel(),
  );
  if (!framed) return false;

  const position = viewer.getPosition();
  const currentYaw = radToDeg(position.yaw);
  const targetYaw =
    currentYaw + normalizeYawDeltaDeg(framed.yawDeg - currentYaw);
  const targetPitch = framed.pitchDeg;

  await animateCameraOrientation(viewer, targetYaw, targetPitch);
  return true;
}

/**
 * Capped step toward the host when projection-based reveal has nothing to do
 * (e.g. behind-camera coords) but the marker is still off-view.
 */
function computeAnchoredPanelHostStepTarget(
  viewer: Viewer,
  anchor: AnchoredPanelNudgeAnchor,
  panelHeightPx: number,
): { yawDeg: number; pitchDeg: number } | null {
  const position = viewer.getPosition();
  const currentYaw = radToDeg(position.yaw);
  const currentPitch = radToDeg(position.pitch);

  const yawDelta = clamp(
    normalizeYawDeltaDeg(anchor.yawDeg - currentYaw),
    -MAX_REVEAL_SHIFT_DEG,
    MAX_REVEAL_SHIFT_DEG,
  );
  const idealPitch =
    panelFitCameraPitchDeg(
      viewer,
      anchor.pitchDeg,
      panelHeightPx,
      viewer.getZoomLevel(),
    ) ?? anchor.pitchDeg;
  const pitchDelta = clamp(
    idealPitch - currentPitch,
    -MAX_REVEAL_SHIFT_DEG,
    MAX_REVEAL_SHIFT_DEG,
  );

  if (Math.abs(yawDelta) < 0.25 && Math.abs(pitchDelta) < 0.25) return null;

  return {
    yawDeg: currentYaw + yawDelta,
    pitchDeg: clamp(currentPitch + pitchDelta, -89, 89),
  };
}

/**
 * Bring an off-view anchored panel into the safe viewport with the same minimal
 * scroll-into-view math and animation as clip-nudge (not a full re-center).
 * Once visible, applies a follow-up clip nudge when the measured rect still
 * overflows. Returns true when any camera move was issued.
 */
export async function revealCameraForOffViewPanel(
  viewer: Viewer,
  anchor: AnchoredPanelNudgeAnchor,
  panelSize: { width: number; height: number },
  getPanelEl?: () => HTMLElement | null | undefined,
): Promise<boolean> {
  let moved = false;

  // Up to two reveal steps when the host sits far outside the frustum.
  for (let step = 0; step < 2; step++) {
    const panelEl = getPanelEl?.();
    if (panelEl && !isPanelMarkerOffView(panelEl)) break;

    const target =
      computeAnchoredPanelRevealTarget(viewer, anchor, panelSize) ??
      computeAnchoredPanelHostStepTarget(viewer, anchor, panelSize.height);
    if (!target) break;

    const position = viewer.getPosition();
    const currentYaw = radToDeg(position.yaw);
    const currentPitch = radToDeg(position.pitch);
    const yawDelta = normalizeYawDeltaDeg(target.yawDeg - currentYaw);
    const targetYaw = currentYaw + yawDelta;
    const targetPitch = target.pitchDeg;

    if (
      Math.abs(yawDelta) < 0.25 &&
      Math.abs(targetPitch - currentPitch) < 0.25
    ) {
      break;
    }

    await animateCameraOrientation(viewer, targetYaw, targetPitch);
    moved = true;
  }

  const panelEl = getPanelEl?.();
  if (panelEl && !isPanelMarkerOffView(panelEl)) {
    if (await nudgeCameraForClippedPanel(viewer, panelEl)) moved = true;
  }

  return moved;
}

export async function nudgeCameraForClippedPanel(
  viewer: Viewer,
  panelEl: HTMLElement,
): Promise<boolean> {
  if (prefersReducedMotion()) return false;

  const target = computeAnchoredPanelNudgeTarget(
    viewer,
    measurePanelScreenRect(viewer, panelEl),
  );
  if (!target) return false;

  const position = viewer.getPosition();
  const currentYaw = radToDeg(position.yaw);
  const currentPitch = radToDeg(position.pitch);

  const yawDelta = normalizeYawDeltaDeg(target.yawDeg - currentYaw);
  const targetYaw = currentYaw + yawDelta;
  const targetPitch = target.pitchDeg;

  if (
    Math.abs(yawDelta) < 0.25 &&
    Math.abs(targetPitch - currentPitch) < 0.25
  ) {
    return false;
  }

  await animateCameraOrientation(viewer, targetYaw, targetPitch);
  return true;
}

export function willNudgeCameraForPanel(
  viewer: Viewer,
  panelEl: HTMLElement,
): boolean {
  if (prefersReducedMotion()) return false;
  return (
    computeAnchoredPanelNudgeTarget(
      viewer,
      measurePanelScreenRect(viewer, panelEl),
    ) !== null
  );
}

export function scheduleNudgeCameraForClippedPanel(
  viewer: Viewer,
  getPanelEl: () => HTMLElement | null | undefined,
  options?: SchedulePanelCameraNudgeOptions,
): void {
  let attempts = 0;
  let offViewFrames = 0;

  const runOffViewFallback = () => {
    if (options?.onPanelOffView) {
      // Anchor is outside the frustum — frame analytically (no DOM measure).
      void Promise.resolve(options.onPanelOffView()).then((framed) => {
        options?.afterSettled?.({ nudged: Boolean(framed) });
      });
    } else {
      options?.afterSettled?.({ nudged: false });
    }
  };

  const tryNudge = () => {
    const panelEl = getPanelEl();

    if (!panelEl) {
      if (attempts++ < MAX_MEASURE_ATTEMPTS) requestAnimationFrame(tryNudge);
      else options?.afterSettled?.({ nudged: false });
      return;
    }

    if (isPanelMarkerOffView(panelEl)) {
      // Markup is static; a few frames of off-view means frustum miss, not a
      // slow mount. Frame quickly instead of waiting out the measure budget.
      if (offViewFrames++ >= OFF_VIEW_GRACE_FRAMES) {
        runOffViewFallback();
      } else if (attempts++ < MAX_MEASURE_ATTEMPTS) {
        requestAnimationFrame(tryNudge);
      } else {
        runOffViewFallback();
      }
      return;
    }

    if (!willNudgeCameraForPanel(viewer, panelEl)) {
      options?.afterSettled?.({ nudged: false });
      return;
    }

    // Panel enter (CSS) and camera nudge run together — feels like one reveal.
    // Hero / WebGL still waits on afterSettled so it doesn’t fight either motion.
    void nudgeCameraForClippedPanel(viewer, panelEl).then((nudged) => {
      options?.afterSettled?.({ nudged });
    });
  };

  requestAnimationFrame(() => requestAnimationFrame(tryNudge));
}
