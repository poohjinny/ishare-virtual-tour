import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';

import { getTourFullscreenBlockHint } from '../utils/tourEmbedFullscreen';

export const TOUR_FULLSCREEN_NAVBAR_BUTTON_ID = 'tour-fullscreen';

const FULLSCREEN_IN_ICON = `<svg class="psv-button-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M9 4H5a1 1 0 0 0-1 1v4M20 9V5a1 1 0 0 0-1-1h-4M15 20h4a1 1 0 0 0 1-1v-4M4 15v4a1 1 0 0 0 1 1h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const FULLSCREEN_OUT_ICON = `<svg class="psv-button-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M4 9V5a1 1 0 0 1 1-1h4M20 15v4a1 1 0 0 1-1 1h-4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface NavbarButtonWithContainer {
  container: HTMLElement;
  toggleActive: (active?: boolean) => void;
}

function isTargetFullscreen(target: HTMLElement | null): boolean {
  if (!target) return false;

  const webkitDocument = document as Document & {
    webkitFullscreenElement?: Element | null;
  };

  return (
    document.fullscreenElement === target ||
    webkitDocument.webkitFullscreenElement === target
  );
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

  if (isTargetFullscreen(target)) {
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
    content: FULLSCREEN_IN_ICON,
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

    if (!button || !target) return;

    const active = isTargetFullscreen(target);
    button.toggleActive(active);
    button.container.innerHTML =
      active ? FULLSCREEN_OUT_ICON : FULLSCREEN_IN_ICON;
  };

  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  sync();

  return () => {
    document.removeEventListener('fullscreenchange', sync);
    document.removeEventListener('webkitfullscreenchange', sync);
  };
}
