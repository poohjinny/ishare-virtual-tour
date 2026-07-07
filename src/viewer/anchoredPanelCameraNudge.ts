import type { Viewer } from '@photo-sphere-viewer/core';

import { ANCHORED_PANEL_GAP_PX } from './anchoredPanelPosition';

const NUDGE_DURATION_MS = 600;
const MAX_MEASURE_ATTEMPTS = 36;
const PANEL_ENTER_ANIM_MS = 220;

/** Treat the panel as clipped when it comes within this margin of an edge. */
const EDGE_MARGIN_PX = 8;

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

function waitForPanelEnterShell(panelEl: HTMLElement): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();

  const shell = panelEl.querySelector('.tour-glass-panel__shell--enter');
  if (!(shell instanceof HTMLElement)) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      shell.removeEventListener('animationend', onEnd);
      resolve();
    };

    const onEnd = (event: AnimationEvent) => {
      if (event.target !== shell) return;
      if (
        event.animationName !== 'tour-glass-panel-in' &&
        event.animationName !== 'tour-glass-panel-anchored-in'
      ) {
        return;
      }
      finish();
    };

    shell.addEventListener('animationend', onEnd);
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

function isPanelClipped(
  rect: PanelScreenRect,
  vw: number,
  vh: number,
): boolean {
  return (
    rect.top < EDGE_MARGIN_PX ||
    rect.left < EDGE_MARGIN_PX ||
    rect.right > vw - EDGE_MARGIN_PX ||
    rect.bottom > vh - EDGE_MARGIN_PX
  );
}

/**
 * Absolute target camera orientation (deg) to bring a clipped anchored panel
 * fully into view.
 *
 * The panel is rigidly anchored directly above its hotspot, so we aim the
 * camera at the hotspot's yaw (stable — no yaw blow-up near the poles) and tilt
 * up by the exact angle that drops the hotspot below center far enough for the
 * panel to sit on-screen. This uses the rectilinear center-column relation
 * (y = f·tan θ) instead of a linear pixel→angle approximation, which overshoots
 * at extreme pitch and sent the camera somewhere unexpected.
 */
export function computeAnchoredPanelNudgeTarget(
  viewer: Viewer,
  rect: PanelScreenRect,
  anchor: AnchoredPanelNudgeAnchor,
): { yawDeg: number; pitchDeg: number } | null {
  const vw = viewer.container.clientWidth;
  const vh = viewer.container.clientHeight;
  if (vw <= 0 || vh <= 0) return null;

  if (!isPanelClipped(rect, vw, vh)) return null;

  const vFov = degToRad(
    viewer.dataHelper.zoomLevelToFov(viewer.getZoomLevel()),
  );
  if (!(vFov > 0)) return null;
  const focalPx = vh / 2 / Math.tan(vFov / 2);
  if (!(focalPx > 0)) return null;

  // Drop the hotspot below center by half the (panel + gap) so the combo of
  // panel-above-hotspot lands centered.
  const panelHeight = rect.bottom - rect.top;
  const hotspotDropPx = (panelHeight + ANCHORED_PANEL_GAP_PX) / 2;

  const cameraPitchDeg =
    anchor.pitchDeg + radToDeg(Math.atan(hotspotDropPx / focalPx));

  return { yawDeg: anchor.yawDeg, pitchDeg: clamp(cameraPitchDeg, -89, 89) };
}

export async function nudgeCameraForClippedPanel(
  viewer: Viewer,
  panelEl: HTMLElement,
  anchor: AnchoredPanelNudgeAnchor,
): Promise<boolean> {
  if (prefersReducedMotion()) return false;

  const target = computeAnchoredPanelNudgeTarget(
    viewer,
    measurePanelScreenRect(viewer, panelEl),
    anchor,
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
  anchor: AnchoredPanelNudgeAnchor,
): boolean {
  if (prefersReducedMotion()) return false;
  return (
    computeAnchoredPanelNudgeTarget(
      viewer,
      measurePanelScreenRect(viewer, panelEl),
      anchor,
    ) !== null
  );
}

export function scheduleNudgeCameraForClippedPanel(
  viewer: Viewer,
  getPanelEl: () => HTMLElement | null | undefined,
  anchor: AnchoredPanelNudgeAnchor,
  options?: SchedulePanelCameraNudgeOptions,
): void {
  let attempts = 0;

  const tryNudge = () => {
    const panelEl = getPanelEl();
    if (!panelEl || panelEl.offsetHeight <= 0) {
      if (attempts++ < MAX_MEASURE_ATTEMPTS) {
        requestAnimationFrame(tryNudge);
      } else {
        options?.afterSettled?.({ nudged: false });
      }
      return;
    }

    if (!willNudgeCameraForPanel(viewer, panelEl, anchor)) {
      options?.afterSettled?.({ nudged: false });
      return;
    }

    void waitForPanelEnterShell(panelEl).then(async () => {
      await nudgeCameraForClippedPanel(viewer, panelEl, anchor);
      options?.afterSettled?.({ nudged: true });
    });
  };

  requestAnimationFrame(() => requestAnimationFrame(tryNudge));
}
