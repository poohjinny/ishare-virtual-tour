import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';
import type {
  ImmersiveBackgroundController,
  ImmersiveBgButtonState,
} from './immersiveBackgroundController';
import { applyIshareTooltipDom } from '../utils/ishareTooltipDom';
import { tourNavbarMaterialSymbolHtml } from './tourNavbarMaterialSymbol';

export const IMMERSIVE_BG_NAVBAR_BUTTON_ID = 'immersive-bg';

const IMMERSIVE_BG_OFF_ICON = tourNavbarMaterialSymbolHtml('music_note');
const IMMERSIVE_BG_PLAY_ICON = tourNavbarMaterialSymbolHtml('play_arrow', {
  filled: true,
});
const IMMERSIVE_BG_PAUSE_ICON = tourNavbarMaterialSymbolHtml('pause', {
  filled: true,
});

const IMMERSIVE_BG_VOLUME_BARS = `<rect class="psv-immersive-bg-bar psv-immersive-bg-bar--1" x="5" y="9" width="2.75" height="6" rx="1.375" fill="currentColor"/>
  <rect class="psv-immersive-bg-bar psv-immersive-bg-bar--2" x="9.125" y="6" width="2.75" height="12" rx="1.375" fill="currentColor"/>
  <rect class="psv-immersive-bg-bar psv-immersive-bg-bar--3" x="13.25" y="4" width="2.75" height="16" rx="1.375" fill="currentColor"/>
  <rect class="psv-immersive-bg-bar psv-immersive-bg-bar--4" x="17.375" y="7" width="2.75" height="10" rx="1.375" fill="currentColor"/>`;

/** Ambience on — animated volume bars. */
const IMMERSIVE_BG_ON_ICON = `<svg class="psv-button-svg psv-immersive-bg-volume" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  ${IMMERSIVE_BG_VOLUME_BARS}
</svg>`;

/** Ambience loading — pulsing volume bars (click to stop). */
const IMMERSIVE_BG_LOADING_ICON = `<svg class="psv-button-svg psv-immersive-bg-volume psv-immersive-bg-volume--loading" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  ${IMMERSIVE_BG_VOLUME_BARS}
</svg>`;

interface NavbarButtonWithContainer {
  container: HTMLElement;
  toggleActive: (active?: boolean) => void;
  show: (refresh?: boolean) => void;
  hide: (refresh?: boolean) => void;
}

function resolveImmersiveButtonRoot(container: HTMLElement): HTMLElement {
  const root = container.closest('.psv-immersive-bg-button');
  return root instanceof HTMLElement ? root : container;
}

function wrapIconStack(idleIcon: string, hoverIcon: string): string {
  return `<span class="psv-immersive-bg-icon-stack" aria-hidden="true">
    <span class="psv-immersive-bg-icon-layer psv-immersive-bg-icon-layer--idle">${idleIcon}</span>
    <span class="psv-immersive-bg-icon-layer psv-immersive-bg-icon-layer--hover">${hoverIcon}</span>
  </span>`;
}

function resolveIcon(state: ImmersiveBgButtonState): string {
  switch (state) {
    case 'loading':
      return wrapIconStack(IMMERSIVE_BG_LOADING_ICON, IMMERSIVE_BG_PAUSE_ICON);
    case 'muted':
      return IMMERSIVE_BG_PAUSE_ICON;
    case 'playing':
      return wrapIconStack(IMMERSIVE_BG_ON_ICON, IMMERSIVE_BG_PAUSE_ICON);
    default:
      return wrapIconStack(IMMERSIVE_BG_OFF_ICON, IMMERSIVE_BG_PLAY_ICON);
  }
}

function resolveTitle(state: ImmersiveBgButtonState): string {
  switch (state) {
    case 'loading':
      return 'Pause immersive ambience';
    case 'muted':
      return 'Pause immersive ambience';
    case 'playing':
      return 'Pause immersive ambience';
    default:
      return 'Play immersive ambience';
  }
}

function resolveAriaLabel(state: ImmersiveBgButtonState): string {
  return resolveTitle(state);
}

function syncButton(
  viewer: Viewer,
  controller: ImmersiveBackgroundController,
): void {
  const button = viewer.navbar.getButton(
    IMMERSIVE_BG_NAVBAR_BUTTON_ID,
    false,
  ) as NavbarButtonWithContainer | undefined;

  if (!button) return;

  const state = controller.getButtonState();
  const root = resolveImmersiveButtonRoot(button.container);
  const showEnabledTheme = controller.isEnabled() && state !== 'muted';

  button.toggleActive(false);
  root.classList.remove('psv-button--active');
  root.classList.toggle('psv-immersive-bg-button--enabled', showEnabledTheme);
  root.classList.toggle(
    'psv-immersive-bg-button--loading',
    state === 'loading',
  );
  button.container.innerHTML = resolveIcon(state);
  root.setAttribute('aria-pressed', 'false');
  root.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  root.setAttribute('aria-label', resolveAriaLabel(state));
  applyIshareTooltipDom(root, resolveTitle(state), 'top');
}

/** Play / pause — shared by navbar button and keyboard shortcut (M). */
export function toggleImmersiveBackgroundPlayback(
  controller: ImmersiveBackgroundController,
): void {
  if (controller.isEnabled()) {
    controller.pause();
    return;
  }

  void controller.toggle();
}

function applyImmersiveBackgroundNavbarButtonOff(viewer: Viewer): void {
  const button = viewer.navbar.getButton(
    IMMERSIVE_BG_NAVBAR_BUTTON_ID,
    false,
  ) as NavbarButtonWithContainer | undefined;

  if (!button) return;

  const root = resolveImmersiveButtonRoot(button.container);

  button.toggleActive(false);
  root.classList.remove(
    'psv-button--active',
    'psv-immersive-bg-button--enabled',
    'psv-immersive-bg-button--loading',
  );
  button.container.innerHTML = resolveIcon('off');
  root.setAttribute('aria-pressed', 'false');
  root.setAttribute('aria-busy', 'false');
  root.setAttribute('aria-label', resolveAriaLabel('off'));
  applyIshareTooltipDom(root, resolveTitle('off'), 'top');
}

export function resetImmersiveBackgroundNavbarButtonIdle(viewer: Viewer): void {
  applyImmersiveBackgroundNavbarButtonOff(viewer);
}

export function syncImmersiveBackgroundNavbarButtonVisibility(
  viewer: Viewer,
  visible: boolean,
): void {
  const button = viewer.navbar.getButton(
    IMMERSIVE_BG_NAVBAR_BUTTON_ID,
    false,
  ) as NavbarButtonWithContainer | undefined;

  if (!button) return;

  if (visible) {
    button.show(false);
  } else {
    applyImmersiveBackgroundNavbarButtonOff(viewer);
    button.hide(false);
  }

  (viewer.navbar as unknown as { autoSize: () => void }).autoSize();
}

export function createImmersiveBackgroundNavbarButton(
  getController: () => ImmersiveBackgroundController | null,
): NavbarCustomButton {
  return {
    id: IMMERSIVE_BG_NAVBAR_BUTTON_ID,
    title: 'Play immersive ambience',
    className: 'psv-immersive-bg-button',
    content: IMMERSIVE_BG_OFF_ICON,
    collapsable: false,
    onClick(viewer: Viewer) {
      const controller = getController();
      if (!controller) return;

      toggleImmersiveBackgroundPlayback(controller);
      syncButton(viewer, controller);
    },
  };
}

export function bindImmersiveBackgroundNavbarButton(
  viewer: Viewer,
  controller: ImmersiveBackgroundController,
): () => void {
  const sync = () => syncButton(viewer, controller);
  const unsubscribe = controller.subscribe(sync);
  sync();

  return () => {
    unsubscribe();
  };
}
