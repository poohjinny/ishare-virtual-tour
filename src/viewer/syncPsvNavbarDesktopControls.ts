import type { Viewer } from '@photo-sphere-viewer/core';
import { resolveTourChromeModeFromMatchMedia } from '../constants/tourChrome';

const PSV_TOUCH_SUPPORT_KEY = 'photoSphereViewer_touchSupport';
const PSV_MENU_BUTTON_ID = 'menu';

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

type NavbarWithCollapsed = {
  collapsed?: Array<{ uncollapse: () => void }>;
  autoSize: () => void;
  container?: HTMLElement;
};

/** Desktop chrome — always show PSV zoom / move controls in the bottom pill. */
export function shouldForcePsvDesktopNavbarControls(): boolean {
  return resolveTourChromeModeFromMatchMedia() === 'desktop';
}

/** Prime PSV touch probe so zoom / move stay in the bottom pill (not overflow menu). */
function primePsvTouchSupportForInlineControls(): void {
  try {
    localStorage.setItem(PSV_TOUCH_SUPPORT_KEY, 'false');
  } catch {
    // ignore quota / private mode
  }
}

function showPsvZoomMoveButtons(viewer: Viewer): void {
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
}

function hidePsvNavbarMenuButton(viewer: Viewer): void {
  const menu = viewer.navbar.getButton(PSV_MENU_BUTTON_ID, false);
  if (!menu) return;
  (menu as unknown as NavbarButtonWithState).hide(false);
}

function restorePsvNavbarUncollapsedButtons(viewer: Viewer): void {
  const navbar = viewer.navbar as unknown as NavbarWithCollapsed;
  if (!navbar.collapsed?.length) return;

  navbar.collapsed.forEach((item) => item.uncollapse());
  navbar.collapsed = [];
}

/** Keep every control in the bottom pill — no PSV overflow menu button or drawer. */
function finalizePsvNavbarInlineLayout(viewer: Viewer): void {
  restorePsvNavbarUncollapsedButtons(viewer);
  hidePsvNavbarMenuButton(viewer);
}

export function syncPsvNavbarDesktopControls(viewer: Viewer): void {
  showPsvZoomMoveButtons(viewer);
  (viewer.navbar as unknown as NavbarWithCollapsed).autoSize();
  finalizePsvNavbarInlineLayout(viewer);
}

/** @deprecated Menu overflow removed — same as `syncPsvNavbarDesktopControls`. */
export function releasePsvNavbarDesktopControls(viewer: Viewer): void {
  syncPsvNavbarDesktopControls(viewer);
}

export function syncPsvNavbarChromeControls(viewer: Viewer): void {
  syncPsvNavbarDesktopControls(viewer);
}

/**
 * Keep zoom / move navbar buttons visible and suppress PSV's overflow menu drawer.
 * PSV hides zoom/move on touch and collapses custom buttons into a menu when space is tight.
 */
export function bindPsvNavbarChromeControls(viewer: Viewer): () => void {
  const sync = () => syncPsvNavbarChromeControls(viewer);

  primePsvTouchSupportForInlineControls();
  sync();

  // PSV resolves touch support asynchronously (up to ~10s); re-sync after probe settles.
  const retryDelaysMs = [50, 500, 1500, 11_000];
  const retryTimeoutIds = retryDelaysMs.map((delayMs) =>
    window.setTimeout(sync, delayMs),
  );

  const touchClassObserver = new MutationObserver(() => {
    if (viewer.container.classList.contains('psv--is-touch')) {
      syncPsvNavbarDesktopControls(viewer);
    }
  });
  touchClassObserver.observe(viewer.container, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const navbar = viewer.navbar as unknown as NavbarWithCollapsed;
  const resizeObserver =
    navbar.container ?
      new ResizeObserver(() => {
        finalizePsvNavbarInlineLayout(viewer);
      })
    : null;
  resizeObserver?.observe(navbar.container!);

  const onResize = () => {
    primePsvTouchSupportForInlineControls();
    sync();
  };
  window.addEventListener('resize', onResize);

  return () => {
    retryTimeoutIds.forEach((id) => window.clearTimeout(id));
    touchClassObserver.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', onResize);
  };
}

/** @deprecated Use `bindPsvNavbarChromeControls`. */
export const bindPsvNavbarDesktopControls = bindPsvNavbarChromeControls;

/** @deprecated Use `primePsvTouchSupportForInlineControls` via bind. */
export function primePsvDesktopTouchSupport(): void {
  primePsvTouchSupportForInlineControls();
}
