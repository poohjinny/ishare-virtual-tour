import type { Viewer } from '@photo-sphere-viewer/core';

const NUDGE_DURATION_MS = 600;
const MAX_MEASURE_ATTEMPTS = 36;
const PANEL_ENTER_ANIM_MS = 220;

/** Skip nudge when panel center is already near viewport center. */
const MIN_CENTER_OFFSET_PX = 12;

export interface PanelScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
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

/**
 * Camera correction to move the panel bbox center toward the viewport center.
 */
export function computePanelCenterCorrection(
  viewer: Viewer,
  rect: PanelScreenRect,
): { yawDeg: number; pitchDeg: number } | null {
  const vw = viewer.container.clientWidth;
  const vh = viewer.container.clientHeight;
  if (vw <= 0 || vh <= 0) return null;

  const panelCenterX = (rect.left + rect.right) / 2;
  const panelCenterY = (rect.top + rect.bottom) / 2;
  const shiftX = vw / 2 - panelCenterX;
  const shiftY = vh / 2 - panelCenterY;

  if (
    Math.abs(shiftX) < MIN_CENTER_OFFSET_PX &&
    Math.abs(shiftY) < MIN_CENTER_OFFSET_PX
  ) {
    return null;
  }

  const vFov = viewer.dataHelper.zoomLevelToFov(viewer.getZoomLevel());
  const hFov = viewer.dataHelper.vFovToHFov(vFov);

  const yawDeg = (-shiftX / vw) * hFov;
  const pitchDeg = (shiftY / vh) * vFov;

  if (Math.abs(yawDeg) < 0.25 && Math.abs(pitchDeg) < 0.25) return null;

  return { yawDeg, pitchDeg };
}

export async function nudgeCameraForClippedPanel(
  viewer: Viewer,
  panelEl: HTMLElement,
): Promise<boolean> {
  if (prefersReducedMotion()) return false;

  const correction = computePanelCenterCorrection(
    viewer,
    measurePanelScreenRect(viewer, panelEl),
  );
  if (!correction) return false;

  const position = viewer.getPosition();
  const currentYaw = (position.yaw * 180) / Math.PI;
  const currentPitch = (position.pitch * 180) / Math.PI;

  const targetYaw = currentYaw + correction.yawDeg;
  const targetPitch = clamp(currentPitch + correction.pitchDeg, -89, 89);

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
    computePanelCenterCorrection(
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

    if (!willNudgeCameraForPanel(viewer, panelEl)) {
      options?.afterSettled?.({ nudged: false });
      return;
    }

    void waitForPanelEnterShell(panelEl).then(async () => {
      await nudgeCameraForClippedPanel(viewer, panelEl);
      options?.afterSettled?.({ nudged: true });
    });
  };

  requestAnimationFrame(() => requestAnimationFrame(tryNudge));
}
