import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';
import type { PlayTourPhase } from '../hooks/usePlayTour';
import { applyIshareTooltipDom } from '../utils/ishareTooltipDom';
import { tourNavbarMaterialSymbolHtml } from './tourNavbarMaterialSymbol';
import { RECENTER_VIEW_NAVBAR_BUTTON_ID } from './recenterViewNavbarButton';

export const PLAY_TOUR_NAVBAR_BUTTON_ID = 'play-tour';

/** Camera / framing controls that fight Play Tour ken-burns — lock while playing. */
const PLAY_TOUR_LOCKED_NAVBAR_BUTTON_IDS = [
  'zoomIn',
  'zoomOut',
  'zoomRange',
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  RECENTER_VIEW_NAVBAR_BUTTON_ID,
] as const;

const PLAY_TOUR_PLAY_ICON = tourNavbarMaterialSymbolHtml('play_arrow', {
  filled: true,
});
const PLAY_TOUR_PAUSE_ICON = tourNavbarMaterialSymbolHtml('pause', {
  filled: true,
});

interface NavbarButtonWithContainer {
  container: HTMLElement;
  toggleActive: (active?: boolean) => void;
  show: (refresh?: boolean) => void;
  hide: (refresh?: boolean) => void;
  disable: () => void;
  enable: () => void;
  content?: string | HTMLElement;
}

function resolveButtonRoot(container: HTMLElement): HTMLElement {
  const root = container.closest('.psv-play-tour-button');
  return root instanceof HTMLElement ? root : container;
}

function resolveIcon(phase: PlayTourPhase): string {
  return phase === 'playing' ? PLAY_TOUR_PAUSE_ICON : PLAY_TOUR_PLAY_ICON;
}

function resolveTitle(phase: PlayTourPhase): string {
  return phase === 'playing' ? 'Pause tour' : 'Play tour';
}

/**
 * Disable move / zoom / recenter while Play Tour is running.
 * Play, fullscreen, and immersive stay available.
 */
export function syncPlayTourNavbarInteractionGuard(
  viewer: Viewer,
  locked: boolean,
): void {
  viewer.container.dataset.playTourNavLock = locked ? '1' : '';
  for (const id of PLAY_TOUR_LOCKED_NAVBAR_BUTTON_IDS) {
    const button = viewer.navbar.getButton(id, false) as
      | NavbarButtonWithContainer
      | undefined;
    if (!button) continue;
    if (locked) button.disable();
    else button.enable();
  }
}

/** Re-apply lock after PSV chrome sync re-shows zoom/move buttons. */
export function reapplyPlayTourNavbarInteractionGuard(viewer: Viewer): void {
  syncPlayTourNavbarInteractionGuard(
    viewer,
    viewer.container.dataset.playTourNavLock === '1',
  );
}

export function syncPlayTourNavbarButton(
  viewer: Viewer,
  options: { enabled: boolean; phase: PlayTourPhase },
): void {
  const button = viewer.navbar.getButton(PLAY_TOUR_NAVBAR_BUTTON_ID, false) as
    | NavbarButtonWithContainer
    | undefined;
  if (!button) return;

  if (!options.enabled) {
    button.hide(false);
    syncPlayTourNavbarInteractionGuard(viewer, false);
    (viewer.navbar as unknown as { autoSize: () => void }).autoSize();
    return;
  }

  button.show(false);
  const root = resolveButtonRoot(button.container);
  const icon = resolveIcon(options.phase);
  const title = resolveTitle(options.phase);

  button.container.innerHTML = icon;
  button.toggleActive(options.phase === 'playing');
  root.setAttribute('aria-label', title);
  root.setAttribute(
    'aria-pressed',
    options.phase === 'playing' ? 'true' : 'false',
  );
  applyIshareTooltipDom(root, title, 'top');

  syncPlayTourNavbarInteractionGuard(viewer, options.phase === 'playing');

  (viewer.navbar as unknown as { autoSize: () => void }).autoSize();
}

export function createPlayTourNavbarButton(
  onToggle: () => void,
): NavbarCustomButton {
  return {
    id: PLAY_TOUR_NAVBAR_BUTTON_ID,
    title: 'Play tour',
    className: 'psv-play-tour-button',
    content: PLAY_TOUR_PLAY_ICON,
    collapsable: false,
    onClick() {
      onToggle();
    },
  };
}
