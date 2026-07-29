import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';

import { getTourFullscreenBlockHint } from '../utils/tourEmbedFullscreen';
import { TOUR_FULLSCREEN_BUTTON_HTML } from './tourNavbarMaterialSymbol';

export const TOUR_FULLSCREEN_NAVBAR_BUTTON_ID = 'tour-fullscreen';

interface NavbarButtonWithContainer {
  container: HTMLElement;
}

type DocumentWithVendorFullscreen = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
};

function getDocumentFullscreenElement(): Element | null {
  const doc = document as DocumentWithVendorFullscreen;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    null
  );
}

/** True when `target` is the active Fullscreen API element. */
export function isTourElementFullscreen(target: HTMLElement | null): boolean {
  if (!target) return false;

  const fs = getDocumentFullscreenElement();
  if (fs === target) return true;

  if (typeof target.matches !== 'function') return false;

  try {
    return (
      target.matches(':fullscreen') ||
      target.matches(':-webkit-full-screen') ||
      target.matches(':-moz-full-screen')
    );
  } catch {
    return false;
  }
}

/**
 * F11 / browser-chrome fullscreen is not the Fullscreen API
 * (`document.fullscreenElement` stays null). Approximate via viewport fill
 * and `display-mode: fullscreen` when present.
 */
export function isBrowserChromeFullscreen(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (getDocumentFullscreenElement()) return false;

  try {
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  } catch {
    /* ignore */
  }

  const slack = 2;
  return (
    window.innerWidth >= screen.width - slack &&
    window.innerHeight >= screen.height - slack
  );
}

/** UI active — Fullscreen API and/or native F11-style browser fullscreen. */
export function isTourPresentationFullscreen(
  target: HTMLElement | null,
): boolean {
  if (isTourElementFullscreen(target)) return true;

  const fs = getDocumentFullscreenElement();
  if (fs === document.documentElement || fs === document.body) return true;

  return isBrowserChromeFullscreen();
}

function resolveFullscreenButtonEl(container: HTMLElement): HTMLElement {
  if (container.classList.contains('psv-fullscreen-button')) {
    return container;
  }
  const nested = container.querySelector('.psv-fullscreen-button');
  return nested instanceof HTMLElement ? nested : container;
}

function applyFullscreenButtonState(
  container: HTMLElement,
  active: boolean,
  chromeOnly = false,
): void {
  const button = resolveFullscreenButtonEl(container);
  button.classList.toggle('psv-fullscreen-button--active', active);
  const label =
    active ?
      chromeOnly ? 'Exit fullscreen (press F11)'
      : 'Exit fullscreen'
    : 'Fullscreen';
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
}

function requestElementFullscreen(target: HTMLElement): void {
  const blockHint = getTourFullscreenBlockHint();
  if (blockHint) {
    console.warn(`[tour fullscreen] ${blockHint}`);
    return;
  }

  if (target.requestFullscreen) {
    void target.requestFullscreen().catch((error: unknown) => {
      console.warn('[tour fullscreen] requestFullscreen failed', error);
    });
    return;
  }

  const webkitTarget = target as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  try {
    webkitTarget.webkitRequestFullscreen?.();
  } catch (error: unknown) {
    console.warn('[tour fullscreen] webkitRequestFullscreen failed', error);
  }
}

function exitElementFullscreen(): void {
  const doc = document as DocumentWithVendorFullscreen;
  if (document.exitFullscreen) {
    void document.exitFullscreen().catch((error: unknown) => {
      console.warn('[tour fullscreen] exitFullscreen failed', error);
    });
    return;
  }

  try {
    doc.webkitExitFullscreen?.();
  } catch (error: unknown) {
    console.warn('[tour fullscreen] webkitExitFullscreen failed', error);
  }

  try {
    doc.mozCancelFullScreen?.();
  } catch {
    /* ignore */
  }
}

export function toggleTourFullscreen(target: HTMLElement | null): void {
  if (!target) return;

  // Fullscreen API session — always exit via API.
  if (getDocumentFullscreenElement()) {
    exitElementFullscreen();
    return;
  }

  // Native F11 only — JS cannot exit; F11 key handler lets the browser leave.
  if (isBrowserChromeFullscreen()) {
    return;
  }

  requestElementFullscreen(target);
}

/**
 * Prefer our Fullscreen API over native F11 so the control button can enter
 * and exit. When already in native F11, do not preventDefault — the browser
 * must handle leaving.
 */
export function handleTourFullscreenHotkey(
  event: KeyboardEvent,
  target: HTMLElement | null,
): void {
  if (event.key !== 'F11' && event.key.toLowerCase() !== 'f') return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const isF11 = event.key === 'F11';
  const apiFs = Boolean(getDocumentFullscreenElement());
  const chromeFs = isBrowserChromeFullscreen();

  if (isF11 && chromeFs && !apiFs) {
    // Leaving native F11 — must not preventDefault or the user gets stuck.
    return;
  }

  event.preventDefault();
  toggleTourFullscreen(target);
}

function schedulePresentationSync(sync: () => void): void {
  sync();
  window.setTimeout(sync, 50);
  window.setTimeout(sync, 200);
  window.setTimeout(sync, 500);
}

function bindFullscreenApiSync(sync: () => void): () => void {
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  document.addEventListener('mozfullscreenchange', sync);
  window.addEventListener('resize', sync);

  let displayModeMql: MediaQueryList | null = null;
  const onDisplayModeChange = () => sync();
  try {
    displayModeMql = window.matchMedia('(display-mode: fullscreen)');
    displayModeMql.addEventListener('change', onDisplayModeChange);
  } catch {
    displayModeMql = null;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'F11') return;
    schedulePresentationSync(sync);
  };
  window.addEventListener('keydown', onKeyDown);

  sync();

  return () => {
    document.removeEventListener('fullscreenchange', sync);
    document.removeEventListener('webkitfullscreenchange', sync);
    document.removeEventListener('mozfullscreenchange', sync);
    window.removeEventListener('resize', sync);
    window.removeEventListener('keydown', onKeyDown);
    displayModeMql?.removeEventListener('change', onDisplayModeChange);
  };
}

export function createTourFullscreenNavbarButton(
  getFullscreenRoot: () => HTMLElement | null,
): NavbarCustomButton {
  return {
    id: TOUR_FULLSCREEN_NAVBAR_BUTTON_ID,
    title: getTourFullscreenBlockHint() ?? 'Fullscreen',
    className: 'psv-fullscreen-button',
    content: TOUR_FULLSCREEN_BUTTON_HTML,
    collapsable: false,
    onClick() {
      toggleTourFullscreen(getFullscreenRoot());
    },
  };
}

export function bindTourFullscreenNavbarButton(
  viewer: Viewer,
  getFullscreenRoot: () => HTMLElement | null,
): () => void {
  const sync = () => {
    const target = getFullscreenRoot();
    const button = viewer.navbar.getButton(
      TOUR_FULLSCREEN_NAVBAR_BUTTON_ID,
      false,
    ) as NavbarButtonWithContainer | undefined;

    if (!target || !button) return;

    const apiFs = Boolean(getDocumentFullscreenElement());
    const chromeOnly = !apiFs && isBrowserChromeFullscreen();
    applyFullscreenButtonState(
      button.container,
      isTourPresentationFullscreen(target),
      chromeOnly,
    );
  };

  return bindFullscreenApiSync(sync);
}

export function bindPresentationFullscreenSync(sync: () => void): () => void {
  return bindFullscreenApiSync(sync);
}
