import type { Viewer } from '@photo-sphere-viewer/core';

const NUDGE_DURATION_MS = 600;
const MAX_MEASURE_ATTEMPTS = 36;
const PANEL_ENTER_ANIM_MS = 160;

/** Extra clearance below breadcrumb chrome (px). */
const TOP_BREADCRUMB_BUFFER_PX = 10;

/** Fallback insets when overlay elements are not in the DOM. */
const FALLBACK_INSETS = { top: 88, left: 24, right: 24, bottom: 24 } as const;

export interface PanelScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PanelSafeInsets {
  top: number;
  left: number;
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
      if (event.animationName !== 'tour-glass-panel-in') return;
      finish();
    };

    shell.addEventListener('animationend', onEnd);
    window.setTimeout(finish, PANEL_ENTER_ANIM_MS);
  });
}

function elementLeftInset(
  el: Element | null,
  containerRect: DOMRect,
  fallback: number,
): number {
  if (!(el instanceof HTMLElement)) return fallback;
  return el.getBoundingClientRect().left - containerRect.left;
}

function elementTopInsetFromBottom(
  el: Element | null,
  containerRect: DOMRect,
): number | null {
  if (!(el instanceof HTMLElement)) return null;
  const rect = el.getBoundingClientRect();
  if (rect.height <= 0) return null;
  return containerRect.bottom - rect.top;
}

/**
 * Safe viewport insets for anchored panels, aligned with tour chrome:
 * - top: breadcrumb bottom + buffer (or client selector when breadcrumb hidden)
 * - left: client selector / floor plan minimap left edge
 * - right: tour action dock left edge
 * - bottom: tallest bottom overlay (minimap or AI stack)
 */
export function measurePanelSafeInsets(viewer: Viewer): PanelSafeInsets {
  const containerRect = viewer.container.getBoundingClientRect();

  const clientSelector = document.querySelector('.client-selector');
  const minimap = document.querySelector('.floor-plan-minimap');
  const navActionsDock = document.querySelector('.tour-nav-actions__dock');
  const navActions = document.querySelector('.tour-nav-actions');
  const breadcrumb = document.querySelector('.tour-nav-breadcrumb');
  const breadcrumbRow = document.querySelector('.tour-nav-breadcrumb__row');
  const aiStack = document.querySelector('.ai-assistant-stack');

  const leftCandidates = [
    elementLeftInset(clientSelector, containerRect, FALLBACK_INSETS.left),
    elementLeftInset(minimap, containerRect, FALLBACK_INSETS.left),
  ];
  const left = Math.min(...leftCandidates);

  let top = FALLBACK_INSETS.top;
  const breadcrumbHidden = breadcrumbRow?.classList.contains(
    'tour-nav-breadcrumb__row--hidden',
  );

  if (breadcrumb instanceof HTMLElement && !breadcrumbHidden) {
    const breadcrumbBottom = breadcrumb.getBoundingClientRect().bottom;
    top = breadcrumbBottom - containerRect.top + TOP_BREADCRUMB_BUFFER_PX;
  } else if (clientSelector instanceof HTMLElement) {
    const selectorBottom = clientSelector.getBoundingClientRect().bottom;
    top = selectorBottom - containerRect.top + TOP_BREADCRUMB_BUFFER_PX;
  }

  let right = FALLBACK_INSETS.right;
  const rightAnchor = navActionsDock ?? navActions;
  if (rightAnchor instanceof HTMLElement) {
    right = containerRect.right - rightAnchor.getBoundingClientRect().left;
  }

  let bottom: number = FALLBACK_INSETS.bottom;
  for (const el of [minimap, aiStack]) {
    const inset = elementTopInsetFromBottom(el, containerRect);
    if (inset !== null) bottom = Math.max(bottom, inset);
  }

  return {
    top: Math.max(0, top),
    left: Math.max(0, left),
    right: Math.max(0, right),
    bottom: Math.max(0, bottom),
  };
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

function isPanelClipped(
  rect: PanelScreenRect,
  vw: number,
  vh: number,
  insets: PanelSafeInsets,
): boolean {
  return (
    rect.left < insets.left ||
    rect.top < insets.top ||
    rect.right > vw - insets.right ||
    rect.bottom > vh - insets.bottom
  );
}

/**
 * Minimum camera correction so clipped edges fit inside safe insets.
 * Only adjusts yaw when horizontally clipped and pitch when vertically clipped.
 */
export function computePanelClipCorrection(
  viewer: Viewer,
  rect: PanelScreenRect,
  insets: PanelSafeInsets = measurePanelSafeInsets(viewer),
): { yawDeg: number; pitchDeg: number } | null {
  const vw = viewer.container.clientWidth;
  const vh = viewer.container.clientHeight;
  if (vw <= 0 || vh <= 0) return null;

  if (!isPanelClipped(rect, vw, vh, insets)) return null;

  const clippedLeft = rect.left < insets.left;
  const clippedRight = rect.right > vw - insets.right;
  const clippedTop = rect.top < insets.top;
  const clippedBottom = rect.bottom > vh - insets.bottom;

  let shiftX = 0;
  let shiftY = 0;

  if (clippedLeft && !clippedRight) {
    shiftX = insets.left - rect.left;
  } else if (clippedRight && !clippedLeft) {
    shiftX = vw - insets.right - rect.right;
  }

  if (clippedTop && !clippedBottom) {
    shiftY = insets.top - rect.top;
  } else if (clippedBottom && !clippedTop) {
    shiftY = vh - insets.bottom - rect.bottom;
  }

  if (Math.abs(shiftX) < 0.5 && Math.abs(shiftY) < 0.5) return null;

  const vFov = viewer.dataHelper.zoomLevelToFov(viewer.getZoomLevel());
  const hFov = viewer.dataHelper.vFovToHFov(vFov);

  const yawDeg = Math.abs(shiftX) >= 0.5 ? (-shiftX / vw) * hFov : 0;
  const pitchDeg = Math.abs(shiftY) >= 0.5 ? (shiftY / vh) * vFov : 0;

  if (Math.abs(yawDeg) < 0.25 && Math.abs(pitchDeg) < 0.25) return null;

  return { yawDeg, pitchDeg };
}

export async function nudgeCameraForClippedPanel(
  viewer: Viewer,
  panelEl: HTMLElement,
): Promise<boolean> {
  if (prefersReducedMotion()) return false;

  const correction = computePanelClipCorrection(
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
    computePanelClipCorrection(
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
