import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';
import type {
  ImmersiveBackgroundController,
  ImmersiveBgButtonState,
} from './immersiveBackgroundController';
import { applyIshareTooltipDom } from '../utils/ishareTooltipDom';

export const IMMERSIVE_BG_NAVBAR_BUTTON_ID = 'immersive-bg';

/** Ambience off / paused — music note (play on hover). */
const IMMERSIVE_BG_OFF_ICON = `<svg class="psv-button-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M14.5 4.5v11.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M14.5 4.5c2.8-.9 5.2-1.4 6.5-1.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
  <circle cx="11" cy="18.5" r="2.75" fill="currentColor" stroke="currentColor" stroke-width="1.75"/>
</svg>`;

/** Shown on hover while off — play (click to start). */
const IMMERSIVE_BG_PLAY_ICON = `<svg class="psv-button-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M8 5.5v13l11-6.5L8 5.5z" fill="currentColor"/>
</svg>`;

/** Ambience playing — pause (shown on hover while playing). */
const IMMERSIVE_BG_PAUSE_ICON = `<svg class="psv-button-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor"/>
  <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor"/>
</svg>`;

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
