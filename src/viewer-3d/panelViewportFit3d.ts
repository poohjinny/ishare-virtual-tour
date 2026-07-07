import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import type { Vector3 as Vector3Type } from 'three';
import type { ViewPosition } from '../types/tour';

const VIEWPORT_MARGIN_PX = 16;
const BREADCRUMB_GAP_PX = 12;
/** Small visual gap below measured breadcrumb bottom — not a framing fudge factor. */
const TOP_SAFETY_PX = 12;
const MIN_SHIFT_PX = 4;
const MAX_MEASURE_ATTEMPTS = 24;
const PANEL_ENTER_ANIM_MS = 220;
const MAX_PROBE_PASSES = 8;
const TOP_FIT_TOLERANCE_PX = 3;

export interface PanelScreenRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function waitAnimationFrames(count: number): Promise<void> {
  if (count <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    const step = () => {
      count -= 1;
      if (count <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function resolvePanelMeasureElement(panelRoot: HTMLElement): HTMLElement {
  return (
    panelRoot.querySelector('.tour-glass-panel--anchored') ??
    panelRoot.querySelector('.tour-glass-panel') ??
    panelRoot
  );
}

/** Bottom inset — matches tour chrome gutter. */
export function measureViewerBottomInsetPx(container: HTMLElement): number {
  const tourPage = container.closest('.tour-page');
  if (!tourPage) return VIEWPORT_MARGIN_PX;
  const style = getComputedStyle(tourPage);
  const raw = style.getPropertyValue('--tour-chrome-inset-bottom').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ?
      parsed + VIEWPORT_MARGIN_PX
    : VIEWPORT_MARGIN_PX;
}

/** Top inset below breadcrumb row (Tour location nav). */
export function measureViewerTopInsetPx(container: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  const tourPage = container.closest('.tour-page');
  const breadcrumb = tourPage?.querySelector('nav[aria-label="Tour location"]');
  if (breadcrumb instanceof HTMLElement) {
    const bottom =
      breadcrumb.getBoundingClientRect().bottom - containerRect.top;
    return Math.max(
      VIEWPORT_MARGIN_PX,
      bottom + BREADCRUMB_GAP_PX + TOP_SAFETY_PX,
    );
  }

  const style = tourPage ? getComputedStyle(tourPage) : null;
  const insetTop = Number.parseFloat(
    style?.getPropertyValue('--tour-chrome-inset-top') ?? '',
  );
  const breadcrumbHeight = Number.parseFloat(
    style?.getPropertyValue('--tour-chrome-breadcrumb-row-height') ?? '',
  );
  if (Number.isFinite(insetTop) && Number.isFinite(breadcrumbHeight)) {
    return insetTop + breadcrumbHeight + BREADCRUMB_GAP_PX + TOP_SAFETY_PX;
  }

  return 80;
}

/** Header top edge in container coordinates — primary fit target. */
export function measurePanelHeaderTopPx(
  container: HTMLElement,
  panelRoot: HTMLElement,
): number {
  const containerRect = container.getBoundingClientRect();
  const header =
    panelRoot.querySelector('.tour-glass-panel__header') ??
    panelRoot.querySelector('.tour-glass-panel__shell') ??
    resolvePanelMeasureElement(panelRoot);
  return header.getBoundingClientRect().top - containerRect.top;
}

export function measureAnchoredPanelScreenRect(
  container: HTMLElement,
  panelRoot: HTMLElement,
): PanelScreenRect {
  const containerRect = container.getBoundingClientRect();
  const panelRect =
    resolvePanelMeasureElement(panelRoot).getBoundingClientRect();
  const headerTop = measurePanelHeaderTopPx(container, panelRoot);

  return {
    left: panelRect.left - containerRect.left,
    top: headerTop,
    right: panelRect.right - containerRect.left,
    bottom: panelRect.bottom - containerRect.top,
  };
}

/**
 * Ray-based pitch correction so `panelTopPx` aligns with `targetTopPx`.
 * Positive return value increases pitch (look up) and moves the panel down on screen.
 */
export function computeVerticalPitchCorrectionDeg(
  camera: PerspectiveCamera,
  container: HTMLElement,
  panelTopPx: number,
  targetTopPx: number,
  panelCenterXPx = container.clientWidth / 2,
): number {
  if (panelTopPx >= targetTopPx - 2) return 0;

  const vh = container.clientHeight;
  const vw = container.clientWidth;
  if (vh <= 0 || vw <= 0) return 0;

  const camPos = camera.position;
  const ndcX = (panelCenterXPx / vw) * 2 - 1;
  const ndcPanel = new Vector3(ndcX, -(panelTopPx / vh) * 2 + 1, 0.5);
  const ndcTarget = new Vector3(ndcX, -(targetTopPx / vh) * 2 + 1, 0.5);

  const dirPanel = ndcPanel.clone().unproject(camera).sub(camPos).normalize();
  const dirTarget = ndcTarget.clone().unproject(camera).sub(camPos).normalize();

  const pitchPanel = Math.asin(clamp(dirPanel.y, -1, 1));
  const pitchTarget = Math.asin(clamp(dirTarget.y, -1, 1));

  return ((pitchPanel - pitchTarget) * 180) / Math.PI;
}

/**
 * Vertical screen-space shift (px) so the panel fits below breadcrumb.
 * Positive shiftY moves the panel down on screen (via pitch orbit).
 */
export function computePanelVerticalFitShiftPx(
  container: HTMLElement,
  rect: PanelScreenRect,
  topInsetPx = measureViewerTopInsetPx(container),
  bottomInsetPx = measureViewerBottomInsetPx(container),
): number {
  const vh = container.clientHeight;
  const panelHeight = rect.bottom - rect.top;

  if (panelHeight <= vh - topInsetPx - bottomInsetPx) {
    if (rect.top < topInsetPx) return topInsetPx - rect.top;
    if (rect.bottom > vh - bottomInsetPx) {
      return vh - bottomInsetPx - rect.bottom;
    }
    return 0;
  }

  if (rect.top < topInsetPx) return topInsetPx - rect.top;
  return 0;
}

export function computePanelVerticalFitView(
  camera: PerspectiveCamera,
  container: HTMLElement,
  currentView: ViewPosition,
  rect: PanelScreenRect,
  topInsetPx = measureViewerTopInsetPx(container),
  bottomInsetPx = measureViewerBottomInsetPx(container),
): ViewPosition | null {
  let pitchDeg = computeVerticalPitchCorrectionDeg(
    camera,
    container,
    rect.top,
    topInsetPx,
    (rect.left + rect.right) / 2,
  );

  if (Math.abs(pitchDeg) < 0.15) {
    const shiftY = computePanelVerticalFitShiftPx(
      container,
      rect,
      topInsetPx,
      bottomInsetPx,
    );
    if (Math.abs(shiftY) < MIN_SHIFT_PX) return null;
    pitchDeg = (shiftY / container.clientHeight) * camera.fov;
  }

  if (Math.abs(pitchDeg) < 0.15) return null;

  return {
    ...currentView,
    pitch: +clamp(currentView.pitch + pitchDeg, -89, 89).toFixed(2),
  };
}

export async function waitForPanelEnterAnimation(
  panelRoot: HTMLElement,
): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const shell = panelRoot.querySelector('.tour-glass-panel__shell--enter');
  if (!(shell instanceof HTMLElement)) return;

  await new Promise<void>((resolve) => {
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

export async function waitForAnchoredPanelLayout(
  getPanelRoot: () => HTMLElement | null | undefined,
): Promise<HTMLElement | null> {
  for (let attempt = 0; attempt < MAX_MEASURE_ATTEMPTS; attempt += 1) {
    const panelRoot = getPanelRoot();
    if (panelRoot && panelRoot.offsetHeight > 0) {
      const header = panelRoot.querySelector('.tour-glass-panel__header');
      if (header instanceof HTMLElement && header.offsetHeight > 0) {
        return panelRoot;
      }
      if (!panelRoot.querySelector('.tour-glass-panel__header')) {
        return panelRoot;
      }
    }
    await waitAnimationFrames(1);
  }
  return null;
}

export interface ResolvePanelFramingView3dOptions {
  container: HTMLElement;
  camera: PerspectiveCamera;
  panelRoot: HTMLElement;
  baseView: ViewPosition;
  applyView: (view: ViewPosition) => void;
  restoreCamera: (camPos: Vector3Type, target: Vector3Type) => void;
  readCameraPose: () => { camPos: Vector3Type; target: Vector3Type };
  renderLabels: () => void;
  readView: () => ViewPosition;
}

/**
 * Probe panel placement at `baseView` (no animation), then return one combined view
 * so framing runs in a single camera transition.
 */
export function resolvePanelFramingView3d(
  options: ResolvePanelFramingView3dOptions,
): ViewPosition {
  const { camPos, target } = options.readCameraPose();

  options.applyView(options.baseView);
  options.renderLabels();

  const topInset = measureViewerTopInsetPx(options.container);
  const bottomInset = measureViewerBottomInsetPx(options.container);

  let framingView = options.baseView;

  for (let pass = 0; pass < MAX_PROBE_PASSES; pass += 1) {
    const rect = measureAnchoredPanelScreenRect(
      options.container,
      options.panelRoot,
    );

    if (rect.top >= topInset - TOP_FIT_TOLERANCE_PX) break;

    const nextView = computePanelVerticalFitView(
      options.camera,
      options.container,
      options.readView(),
      rect,
      topInset,
      bottomInset,
    );
    if (!nextView) break;

    const prevPitch = options.readView().pitch;
    if (Math.abs(nextView.pitch - prevPitch) < 0.05) break;

    options.applyView(nextView);
    options.renderLabels();
    framingView = nextView;
  }

  options.restoreCamera(camPos, target);

  return framingView;
}
