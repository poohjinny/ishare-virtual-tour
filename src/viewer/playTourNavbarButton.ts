import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';
import type { PlayTourPhase } from '../hooks/usePlayTour';
import { applyIshareTooltipDom } from '../utils/ishareTooltipDom';
import { tourNavbarMaterialSymbolHtml } from './tourNavbarMaterialSymbol';

export const PLAY_TOUR_NAVBAR_BUTTON_ID = 'play-tour';

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
