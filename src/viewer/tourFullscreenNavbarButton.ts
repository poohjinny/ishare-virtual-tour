import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';

export const TOUR_FULLSCREEN_NAVBAR_BUTTON_ID = 'tour-fullscreen';

const FULLSCREEN_IN_ICON = `<svg class="psv-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M100 40H87.1V18.8h-21V6H100zM100 93.2H66V80.3h21.1v-21H100zM34 93.2H0v-34h12.9v21.1h21zM12.9 40H0V6h34v12.9H12.8z"/></svg>`;

const FULLSCREEN_OUT_ICON = `<svg class="psv-button-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M66 7h13v21h21v13H66zM66 60.3h34v12.9H79v21H66zM0 60.3h34v34H21V73.1H0zM21 7h13v34H0V28h21z"/></svg>`;

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
  if (target.requestFullscreen) {
    void target.requestFullscreen();
    return;
  }

  const webkitTarget = target as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  webkitTarget.webkitRequestFullscreen?.();
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
    title: 'Fullscreen',
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
