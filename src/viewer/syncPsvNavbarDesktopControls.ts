import type { Viewer } from '@photo-sphere-viewer/core';
import { resolveTourChromeModeFromMatchMedia } from '../constants/tourChrome';

const PSV_TOUCH_SUPPORT_KEY = 'photoSphereViewer_touchSupport';

const ZOOM_MOVE_NAVBAR_BUTTON_IDS = [
  'zoomIn',
  'zoomOut',
  'zoomRange',
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
] as const;

type NavbarButtonWithState = {
  state?: { supported: boolean };
  show: (refresh?: boolean) => void;
  hide: (refresh?: boolean) => void;
};

/** Desktop chrome — always show PSV zoom / move controls in the bottom pill. */
export function shouldForcePsvDesktopNavbarControls(): boolean {
  return resolveTourChromeModeFromMatchMedia() === 'desktop';
}

function prefersTouchPsvNavbar(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0
  );
}

/** Prime PSV touch probe on desktop only — never leak mouse mode to phone/tablet. */
function primePsvTouchSupportForChrome(): void {
  try {
    if (shouldForcePsvDesktopNavbarControls()) {
      localStorage.setItem(PSV_TOUCH_SUPPORT_KEY, 'false');
      return;
    }

    localStorage.removeItem(PSV_TOUCH_SUPPORT_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export function syncPsvNavbarDesktopControls(viewer: Viewer): void {
  if (!shouldForcePsvDesktopNavbarControls()) return;

  viewer.container.classList.remove('psv--is-touch');

  for (const id of ZOOM_MOVE_NAVBAR_BUTTON_IDS) {
    const button = viewer.navbar.getButton(id, false);
    if (!button) continue;

    const withState = button as unknown as NavbarButtonWithState;
    if (withState.state) {
      withState.state.supported = true;
    }
    withState.show(false);
  }

  (viewer.navbar as unknown as { autoSize: () => void }).autoSize();
}

/** Restore PSV touch navbar on mobile / compact after desktop override. */
export function releasePsvNavbarDesktopControls(viewer: Viewer): void {
  if (shouldForcePsvDesktopNavbarControls()) return;

  primePsvTouchSupportForChrome();

  if (!prefersTouchPsvNavbar()) return;

  viewer.container.classList.add('psv--is-touch');

  for (const id of ZOOM_MOVE_NAVBAR_BUTTON_IDS) {
    const button = viewer.navbar.getButton(id, false);
    if (!button) continue;

    const withState = button as unknown as NavbarButtonWithState;
    if (withState.state) {
      withState.state.supported = false;
    }
    withState.hide(false);
  }

  (viewer.navbar as unknown as { autoSize: () => void }).autoSize();
}

export function syncPsvNavbarChromeControls(viewer: Viewer): void {
  if (shouldForcePsvDesktopNavbarControls()) {
    syncPsvNavbarDesktopControls(viewer);
    return;
  }

  releasePsvNavbarDesktopControls(viewer);
}

/**
 * Keep zoom / move navbar buttons visible on desktop only.
 * PSV hides them when touch is detected (`maxTouchPoints`, cached localStorage, etc.).
 */
export function bindPsvNavbarChromeControls(viewer: Viewer): () => void {
  const sync = () => syncPsvNavbarChromeControls(viewer);

  primePsvTouchSupportForChrome();
  sync();

  // PSV resolves touch support asynchronously (up to ~10s); re-sync after probe settles.
  const retryDelaysMs = [50, 500, 1500, 11_000];
  const retryTimeoutIds = retryDelaysMs.map((delayMs) =>
    window.setTimeout(sync, delayMs),
  );

  const touchClassObserver = new MutationObserver(() => {
    if (
      shouldForcePsvDesktopNavbarControls() &&
      viewer.container.classList.contains('psv--is-touch')
    ) {
      syncPsvNavbarDesktopControls(viewer);
    }
  });
  touchClassObserver.observe(viewer.container, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const onResize = () => {
    primePsvTouchSupportForChrome();
    sync();
  };
  window.addEventListener('resize', onResize);

  return () => {
    retryTimeoutIds.forEach((id) => window.clearTimeout(id));
    touchClassObserver.disconnect();
    window.removeEventListener('resize', onResize);
  };
}

/** @deprecated Use `bindPsvNavbarChromeControls`. */
export const bindPsvNavbarDesktopControls = bindPsvNavbarChromeControls;

/** @deprecated Desktop-only; use `primePsvTouchSupportForChrome` via bind. */
export function primePsvDesktopTouchSupport(): void {
  primePsvTouchSupportForChrome();
}
