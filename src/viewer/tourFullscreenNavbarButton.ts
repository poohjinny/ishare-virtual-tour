import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';

import { getTourFullscreenBlockHint } from '../utils/tourEmbedFullscreen';
import { TOUR_FULLSCREEN_BUTTON_HTML } from './tourNavbarMaterialSymbol';

export const TOUR_FULLSCREEN_NAVBAR_BUTTON_ID = 'tour-fullscreen';

interface NavbarButtonWithContainer {
  container: HTMLElement;
}

/** True when `target` is the active tour fullscreen element. */
export function isTourElementFullscreen(target: HTMLElement | null): boolean {
  if (!target) return false;

  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
  };

  const fs =
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement;

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
): void {
  const button = resolveFullscreenButtonEl(container);
  button.classList.toggle('psv-fullscreen-button--active', active);
  const label = active ? 'Exit fullscreen' : 'Fullscreen';
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
  if (document.exitFullscreen) {
    void document.exitFullscreen();
    return;
  }

  const webkitDocument = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
  };
  webkitDocument.webkitExitFullscreen?.();
}

export function toggleTourFullscreen(target: HTMLElement | null): void {
  if (!target) return;

  if (isTourElementFullscreen(target)) {
    exitElementFullscreen();
  } else {
    requestElementFullscreen(target);
  }
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

    if (!target) return;

    const active = isTourElementFullscreen(target);
    if (!button) return;

    applyFullscreenButtonState(button.container, active);
  };

  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  document.addEventListener('mozfullscreenchange', sync);
  sync();

  return () => {
    document.removeEventListener('fullscreenchange', sync);
    document.removeEventListener('webkitfullscreenchange', sync);
    document.removeEventListener('mozfullscreenchange', sync);
  };
}
