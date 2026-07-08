import type { Viewer } from '@photo-sphere-viewer/core';

import { ANCHORED_PANEL_GAP_PX } from './anchoredPanelPosition';
import { tourBreadcrumbSelector } from '../components/tourNavFloatVariants';

const NUDGE_DURATION_MS = 600;
const MAX_MEASURE_ATTEMPTS = 36;
const PANEL_ENTER_ANIM_MS = 220;

/**
 * Frames a present-but-zero-height panel is allowed before we treat it as
 * off-view (PSV hides off-view markers with display:none). The panel markup is
 * static so layout lands in ~1 frame; a few frames of zero height means hidden.
 */
const OFF_VIEW_GRACE_FRAMES = 4;

/** Breathing room a clipped panel is shifted to (generous, per side). */
const NUDGE_TARGET_MARGIN_PX = 24;

/** Cap per-axis camera correction so oversized panels never warp the view. */
const MAX_NUDGE_SHIFT_DEG = 60;

/** Extra gap kept below the floating breadcrumb so a nudged panel clears it. */
const BREADCRUMB_CLEARANCE_PX = 12;

export interface PanelScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

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
  /** Runs after panel is ready; heavy embeds should load here. Deferred until nudge finishes when `nudged`. */
  afterSettled?: (result: PanelCameraNudgeSettled) => void;
  /**
   * Fallback for when the panel never lays out because it is off-view: PSV keeps
   * off-view markers `display:none`, so at extreme pitch a panel whose spherical
   * anchor falls outside the frustum never renders (offsetHeight stays 0) and the
   * clip-nudge has nothing to measure. Called once the measure budget is spent so
   * the caller can frame the camera analytically to bring the panel into view.
   * Returns true when it moved the camera.
   */
  onPanelOffView?: () => boolean | Promise<boolean>;
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

/**
 * Resolves once the panel's entrance scale animation finishes — or immediately
 * under reduced-motion / when no entrance animation is present. Anchored panels
 * (nav preview + info) scale the article; dock panels scale the shell. Callers
 * gate heavy work (camera nudge, WebGL/video mount) on this so it never competes
 * with the entrance animation.
 */
export function waitForAnchoredPanelEnter(panelEl: HTMLElement): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();

  const enterEl =
    panelEl.querySelector('.tour-glass-panel--anchored-enter') ??
    panelEl.querySelector('.tour-glass-panel__shell--enter');
  if (!(enterEl instanceof HTMLElement)) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      enterEl.removeEventListener('animationend', onEnd);
      resolve();
    };

    const onEnd = (event: AnimationEvent) => {
      if (event.target !== enterEl) return;
      if (
        event.animationName !== 'tour-glass-panel-in' &&
        event.animationName !== 'tour-glass-panel-anchored-in'
      ) {
        return;
      }
      finish();
    };

    enterEl.addEventListener('animationend', onEnd);
    window.setTimeout(finish, PANEL_ENTER_ANIM_MS);
  });
}

export function measurePanelScreenRect(
  viewer: Viewer,
  panelEl: HTMLElement,
): PanelScreenRect {
  const containerRect = viewer.container.getBoundingClientRect();
  const panelRect = panelEl.getBoundingClientRect();

  return {
    left: panelRect.left - containerRect.left,
    top: panelRect.top - containerRect.top,
    right: panelRect.right - containerRect.left,
    bottom: panelRect.bottom - containerRect.top,
  };
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

/**
 * Top safe inset (px, in viewer-container space): the greater of the base margin
 * and the floating breadcrumb's bottom edge + clearance, so a nudged panel never
 * tucks under the breadcrumb. Falls back to the base margin when the breadcrumb
 * is absent/hidden.
 */
function resolveTopMarginPx(viewer: Viewer): number {
  if (typeof document === 'undefined') return NUDGE_TARGET_MARGIN_PX;

  const breadcrumb = document.querySelector(tourBreadcrumbSelector);
  if (!(breadcrumb instanceof HTMLElement) || breadcrumb.offsetHeight <= 0) {
    return NUDGE_TARGET_MARGIN_PX;
  }

  const containerTop = viewer.container.getBoundingClientRect().top;
  const breadcrumbBottom =
    breadcrumb.getBoundingClientRect().bottom -
    containerTop +
    BREADCRUMB_CLEARANCE_PX;

  return Math.max(NUDGE_TARGET_MARGIN_PX, breadcrumbBottom);
}

/**
 * Camera pitch (deg) that seats a panel of `panelHeightPx`, anchored directly
 * above its hotspot, centered on screen at the given PSV zoom.
 *
 * Drops the hotspot below center by half the (panel + gap) using the rectilinear
 * center-column relation (y = f·tan θ), not a linear pixel→angle approximation
 * which overshoots at extreme pitch. Returns null when the viewport/FOV is
 * degenerate.
 */
function panelFitCameraPitchDeg(
  viewer: Viewer,
  anchorPitchDeg: number,
  panelHeightPx: number,
  psvZoom: number,
): number | null {
  const vh = viewer.container.clientHeight;
  if (vh <= 0) return null;

  const vFov = degToRad(viewer.dataHelper.zoomLevelToFov(psvZoom));
  if (!(vFov > 0)) return null;
  const focalPx = vh / 2 / Math.tan(vFov / 2);
  if (!(focalPx > 0)) return null;

  const maxDropPx = Math.max(0, (vh - 2 * NUDGE_TARGET_MARGIN_PX) / 2);
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
): { yawDeg: number; pitchDeg: number } | null {
  const vw = viewer.container.clientWidth;
  const vh = viewer.container.clientHeight;
  if (vw <= 0 || vh <= 0) return null;

  const vFov = degToRad(
    viewer.dataHelper.zoomLevelToFov(viewer.getZoomLevel()),
  );
  if (!(vFov > 0)) return null;
  const focalPx = vh / 2 / Math.tan(vFov / 2);
  if (!(focalPx > 0)) return null;

  const m = NUDGE_TARGET_MARGIN_PX;
  // Top uses a breadcrumb-aware inset so the panel never tucks under it.
  const topMargin = resolveTopMarginPx(viewer);
  const topOver = Math.max(0, topMargin - rect.top);
  const bottomOver = Math.max(0, rect.bottom - (vh - m));
  const leftOver = Math.max(0, m - rect.left);
  const rightOver = Math.max(0, rect.right - (vw - m));

  if (topOver === 0 && bottomOver === 0 && leftOver === 0 && rightOver === 0) {
    return null;
  }

  // Panel taller than the safe area — bias toward showing the top (title/hero).
  const effectiveBottomOver = topOver > 0 && bottomOver > 0 ? 0 : bottomOver;

  // Push down/right to clear top/left; up/left to clear bottom/right.
  const pitchShiftDeg = clamp(
    radToDeg((topOver - effectiveBottomOver) / focalPx),
    -MAX_NUDGE_SHIFT_DEG,
    MAX_NUDGE_SHIFT_DEG,
  );
  const yawShiftDeg = clamp(
    radToDeg((rightOver - leftOver) / focalPx),
    -MAX_NUDGE_SHIFT_DEG,
    MAX_NUDGE_SHIFT_DEG,
  );

  const pos = viewer.getPosition();
  return {
    yawDeg: radToDeg(pos.yaw) + yawShiftDeg,
    pitchDeg: clamp(radToDeg(pos.pitch) + pitchShiftDeg, -89, 89),
  };
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

  if (prefersReducedMotion()) {
    viewer.rotate({ yaw: `${targetYaw}deg`, pitch: `${targetPitch}deg` });
    return true;
  }

  try {
    await stopActiveViewerAnimation(viewer);
    const animation = viewer.animate({
      yaw: `${targetYaw}deg`,
      pitch: `${targetPitch}deg`,
      speed: NUDGE_DURATION_MS,
      easing: 'outCubic',
    });
    if (animation) await animation;
    else viewer.rotate({ yaw: `${targetYaw}deg`, pitch: `${targetPitch}deg` });
  } catch {
    viewer.rotate({ yaw: `${targetYaw}deg`, pitch: `${targetPitch}deg` });
  }

  return true;
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

  try {
    await stopActiveViewerAnimation(viewer);
    const animation = viewer.animate({
      yaw: `${targetYaw}deg`,
      pitch: `${targetPitch}deg`,
      speed: NUDGE_DURATION_MS,
      easing: 'outCubic',
    });
    if (animation) await animation;
    else {
      viewer.rotate({ yaw: `${targetYaw}deg`, pitch: `${targetPitch}deg` });
    }
  } catch {
    viewer.rotate({ yaw: `${targetYaw}deg`, pitch: `${targetPitch}deg` });
  }

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
  let zeroHeightFrames = 0;

  const runOffViewFallback = () => {
    if (options?.onPanelOffView) {
      // Panel is present but PSV keeps it display:none — its anchor is off-view.
      // Frame the camera analytically to bring it in (no DOM measure needed).
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

    if (panelEl.offsetHeight <= 0) {
      // Element exists but has no layout box: the panel markup is static, so a
      // few frames of zero height means PSV is hiding it (off-view), not a slow
      // mount. Fall back to camera framing quickly instead of waiting out the
      // full measure budget (which felt like the panel never opened).
      if (zeroHeightFrames++ >= OFF_VIEW_GRACE_FRAMES) {
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

    void waitForAnchoredPanelEnter(panelEl).then(async () => {
      await nudgeCameraForClippedPanel(viewer, panelEl);
      options?.afterSettled?.({ nudged: true });
    });
  };

  requestAnimationFrame(() => requestAnimationFrame(tryNudge));
}
