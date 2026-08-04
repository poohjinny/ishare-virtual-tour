/**
 * Shared anchored-panel clip-nudge math (PSV + model3d).
 * Overflow → yaw/pitch shifts only — not a re-center on the hotspot.
 * Each viewer applies the resulting orientation with its own camera API.
 */

import {
  ANCHORED_PANEL_VIEWPORT_MARGIN_PX,
  measureAnchoredPanelBottomInsetPx,
  measureAnchoredPanelTopInsetPx,
  type PanelScreenRect,
} from './anchoredPanelLayout';

/** Cap per-axis correction so oversized panels never warp the view. */
export const ANCHORED_PANEL_CLIP_NUDGE_MAX_SHIFT_DEG = 60;

/**
 * Off-view reveal may need a larger single step than a clip nudge.
 * Still a scroll-into-view delta, not a full re-center.
 */
export const ANCHORED_PANEL_REVEAL_MAX_SHIFT_DEG = 120;

const FIT_TOLERANCE_PX = 3;

export interface AnchoredPanelClipInsets {
  topPx: number;
  bottomPx: number;
  sidePx: number;
}

export function resolveAnchoredPanelClipInsets(
  container: HTMLElement,
): AnchoredPanelClipInsets {
  return {
    topPx: measureAnchoredPanelTopInsetPx(container),
    bottomPx: measureAnchoredPanelBottomInsetPx(container),
    sidePx: ANCHORED_PANEL_VIEWPORT_MARGIN_PX,
  };
}

/** Perspective focal length in px from vertical FOV (degrees). */
export function perspectiveFocalLengthPx(
  vFovDeg: number,
  viewportHeightPx: number,
): number {
  const vFovRad = (vFovDeg * Math.PI) / 180;
  if (!(vFovRad > 0) || viewportHeightPx <= 0) return 0;
  return viewportHeightPx / 2 / Math.tan(vFovRad / 2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Visual top edge of the anchored panel in container coordinates.
 * Prefer the host wrapper when present — enter CSS scales the article/shell
 * (`transform-origin: bottom center`), so measuring those mid-animation
 * underestimates height and under-nudges (panel ends flush with the viewport top).
 */
export function measureAnchoredPanelHeaderTopPx(
  container: HTMLElement,
  panelRoot: HTMLElement,
): number {
  return measureAnchoredPanelScreenRect(container, panelRoot).top;
}

/**
 * Panel screen rect in container coordinates.
 * Always prefer the non-enter-scaled host (`panelRoot` = PSV marker or
 * `.hotspot-3d-anchored-panel`) so clip-nudge matches final layout while the
 * entrance scale is still running.
 */
export function measureAnchoredPanelScreenRect(
  container: HTMLElement,
  panelRoot: HTMLElement,
): PanelScreenRect {
  const containerRect = container.getBoundingClientRect();

  // If callers pass the animated article itself, climb to a stable host when
  // possible; otherwise fall back to the article's layout parent / self.
  const layoutEl =
    (
      panelRoot.classList.contains('hotspot-3d-anchored-panel') ||
      panelRoot.classList.contains('psv-marker')
    ) ?
      panelRoot
    : (panelRoot.closest('.hotspot-3d-anchored-panel') ??
      panelRoot.closest('.psv-marker') ??
      panelRoot);

  const panelRect = layoutEl.getBoundingClientRect();
  return {
    left: panelRect.left - containerRect.left,
    top: panelRect.top - containerRect.top,
    right: panelRect.right - containerRect.left,
    bottom: panelRect.bottom - containerRect.top,
  };
}

export function anchoredPanelNeedsClipFit(
  container: HTMLElement,
  rect: PanelScreenRect,
  insets: AnchoredPanelClipInsets = resolveAnchoredPanelClipInsets(container),
): boolean {
  const vw = container.clientWidth;
  const vh = container.clientHeight;
  return (
    rect.top < insets.topPx - FIT_TOLERANCE_PX ||
    rect.bottom > vh - insets.bottomPx + FIT_TOLERANCE_PX ||
    rect.left < insets.sidePx - FIT_TOLERANCE_PX ||
    rect.right > vw - insets.sidePx + FIT_TOLERANCE_PX
  );
}

/**
 * Minimal yaw/pitch shifts (deg) that clear viewport chrome insets.
 * Positive pitchShift looks up (panel moves down on screen).
 * Positive yawShift turns right (panel moves left on screen) — same sign as PSV.
 */
export function computeAnchoredPanelClipNudgeShiftsDeg(options: {
  viewportWidth: number;
  viewportHeight: number;
  focalPx: number;
  rect: PanelScreenRect;
  insets: AnchoredPanelClipInsets;
  maxShiftDeg?: number;
}): { yawShiftDeg: number; pitchShiftDeg: number } | null {
  const {
    viewportWidth: vw,
    viewportHeight: vh,
    focalPx,
    rect,
    insets,
    maxShiftDeg = ANCHORED_PANEL_CLIP_NUDGE_MAX_SHIFT_DEG,
  } = options;

  if (vw <= 0 || vh <= 0 || !(focalPx > 0)) return null;

  const topOver = Math.max(0, insets.topPx - rect.top);
  const bottomOver = Math.max(0, rect.bottom - (vh - insets.bottomPx));
  const leftOver = Math.max(0, insets.sidePx - rect.left);
  const rightOver = Math.max(0, rect.right - (vw - insets.sidePx));

  if (topOver === 0 && bottomOver === 0 && leftOver === 0 && rightOver === 0) {
    return null;
  }

  // Panel taller than the safe area — bias toward showing the top (title/hero).
  const effectiveBottomOver = topOver > 0 && bottomOver > 0 ? 0 : bottomOver;

  const pitchShiftDeg = clamp(
    radToDeg((topOver - effectiveBottomOver) / focalPx),
    -maxShiftDeg,
    maxShiftDeg,
  );
  const yawShiftDeg = clamp(
    radToDeg((rightOver - leftOver) / focalPx),
    -maxShiftDeg,
    maxShiftDeg,
  );

  if (Math.abs(pitchShiftDeg) < 0.15 && Math.abs(yawShiftDeg) < 0.15) {
    return null;
  }

  return { yawShiftDeg, pitchShiftDeg };
}

/** Apply clip shifts to a yaw/pitch orientation (deg). */
export function applyAnchoredPanelClipNudgeShiftsDeg(
  current: { yaw: number; pitch: number },
  shifts: { yawShiftDeg: number; pitchShiftDeg: number },
): { yaw: number; pitch: number } {
  return {
    yaw: current.yaw + shifts.yawShiftDeg,
    pitch: clamp(current.pitch + shifts.pitchShiftDeg, -89, 89),
  };
}

/** Nominal nudge duration at ~REF_DEG of combined yaw/pitch travel. */
export const ANCHORED_PANEL_NUDGE_DURATION_MS = 600;
export const ANCHORED_PANEL_NUDGE_DURATION_MIN_MS = 500;
export const ANCHORED_PANEL_NUDGE_DURATION_MAX_MS = 1400;
export const ANCHORED_PANEL_NUDGE_DURATION_REF_DEG = 18;

/** Shortest yaw arc in degrees (absolute). */
export function absoluteYawDeltaDeg(fromDeg: number, toDeg: number): number {
  return Math.abs(((((toDeg - fromDeg + 180) % 360) + 360) % 360) - 180);
}

/**
 * Clip-nudge / reveal camera duration — same curve for PSV and model3d so
 * enter∥nudge feel matches across viewer types.
 */
export function resolveAnchoredPanelNudgeDurationMs(travelDeg: number): number {
  return Math.round(
    clamp(
      ANCHORED_PANEL_NUDGE_DURATION_MS *
        (travelDeg / ANCHORED_PANEL_NUDGE_DURATION_REF_DEG),
      ANCHORED_PANEL_NUDGE_DURATION_MIN_MS,
      ANCHORED_PANEL_NUDGE_DURATION_MAX_MS,
    ),
  );
}
