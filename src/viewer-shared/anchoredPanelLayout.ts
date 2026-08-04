/**
 * Shared anchored-panel layout — insets, timing, DOM waits.
 * (BEM class names live in `components/anchoredPanelChrome.ts`.)
 * Clip-nudge overflow math: `anchoredPanelClipNudge.ts`.
 * Each viewer applies orientation with its own camera API.
 */

import { tourBreadcrumbSelector } from '../components/tourNavFloatVariants';

/** Breathing room a clipped panel is shifted to (per side). */
export const ANCHORED_PANEL_VIEWPORT_MARGIN_PX = 24;

/** Extra gap below the floating breadcrumb so a panel clears it. */
export const ANCHORED_PANEL_BREADCRUMB_CLEARANCE_PX = 12;

/** Entrance scale animation budget (matches CSS tour-glass-panel-in). */
export const ANCHORED_PANEL_ENTER_MS = 220;

/** Exit animation / remove delay for anchored panels. */
export const ANCHORED_PANEL_EXIT_MS = 200;

/** rAF attempts while waiting for panel layout before measure/fit. */
export const ANCHORED_PANEL_LAYOUT_MEASURE_ATTEMPTS = 36;

export interface PanelScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
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

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Top safe inset (px, in viewer-container space): the greater of the base margin
 * and the floating breadcrumb's bottom edge + clearance. Falls back to the base
 * margin when the breadcrumb is absent/hidden.
 */
export function measureAnchoredPanelTopInsetPx(container: HTMLElement): number {
  if (typeof document === 'undefined') {
    return ANCHORED_PANEL_VIEWPORT_MARGIN_PX;
  }

  const breadcrumb =
    container.closest('.tour-page')?.querySelector(tourBreadcrumbSelector) ??
    document.querySelector(tourBreadcrumbSelector);
  if (!(breadcrumb instanceof HTMLElement) || breadcrumb.offsetHeight <= 0) {
    return ANCHORED_PANEL_VIEWPORT_MARGIN_PX;
  }

  const containerTop = container.getBoundingClientRect().top;
  const breadcrumbBottom =
    breadcrumb.getBoundingClientRect().bottom -
    containerTop +
    ANCHORED_PANEL_BREADCRUMB_CLEARANCE_PX;

  return Math.max(ANCHORED_PANEL_VIEWPORT_MARGIN_PX, breadcrumbBottom);
}

/** Bottom / side safe inset — same base margin as panorama clip-nudge. */
export function measureAnchoredPanelBottomInsetPx(
  _container?: HTMLElement,
): number {
  return ANCHORED_PANEL_VIEWPORT_MARGIN_PX;
}

/**
 * Resolves once the panel's entrance scale animation finishes — or immediately
 * under reduced-motion / when no entrance animation is present.
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
    window.setTimeout(finish, ANCHORED_PANEL_ENTER_MS);
  });
}

/**
 * Wait until the anchored panel has measurable layout (header present when
 * the markup includes one).
 */
export async function waitForAnchoredPanelLayout(
  getPanelRoot: () => HTMLElement | null | undefined,
): Promise<HTMLElement | null> {
  for (
    let attempt = 0;
    attempt < ANCHORED_PANEL_LAYOUT_MEASURE_ATTEMPTS;
    attempt += 1
  ) {
    const panelRoot = getPanelRoot();
    if (panelRoot && panelRoot.offsetHeight > 0) {
      const header =
        panelRoot.querySelector('.tour-glass-panel__header') ??
        panelRoot.querySelector('.anchored-panel__header');
      if (header instanceof HTMLElement && header.offsetHeight > 0) {
        return panelRoot;
      }
      if (
        !panelRoot.querySelector('.tour-glass-panel__header') &&
        !panelRoot.querySelector('.anchored-panel__header')
      ) {
        return panelRoot;
      }
    }
    await waitAnimationFrames(1);
  }
  return null;
}
