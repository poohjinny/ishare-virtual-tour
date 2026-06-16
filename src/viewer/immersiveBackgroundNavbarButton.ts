import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';
import type {
  ImmersiveBackgroundController,
  ImmersiveBgButtonState,
} from './immersiveBackgroundController';

export const IMMERSIVE_BG_NAVBAR_BUTTON_ID = 'immersive-bg';

/** Ambience off — music note. */
const IMMERSIVE_BG_OFF_ICON = `<svg class="psv-button-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M14.5 4.5v11.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M14.5 4.5c2.8-.9 5.2-1.4 6.5-1.8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
  <circle cx="11" cy="18.5" r="2.75" fill="currentColor" stroke="currentColor" stroke-width="1.75"/>
</svg>`;

const IMMERSIVE_BG_VOLUME_BARS = `<rect class="psv-immersive-bg-bar psv-immersive-bg-bar--1" x="5" y="9" width="2.75" height="6" rx="1.375" fill="currentColor"/>
  <rect class="psv-immersive-bg-bar psv-immersive-bg-bar--2" x="9.125" y="6" width="2.75" height="12" rx="1.375" fill="currentColor"/>
  <rect class="psv-immersive-bg-bar psv-immersive-bg-bar--3" x="13.25" y="4" width="2.75" height="16" rx="1.375" fill="currentColor"/>
  <rect class="psv-immersive-bg-bar psv-immersive-bg-bar--4" x="17.375" y="7" width="2.75" height="10" rx="1.375" fill="currentColor"/>`;

/** Ambience on — animated volume bars. */
const IMMERSIVE_BG_ON_ICON = `<svg class="psv-button-svg psv-immersive-bg-volume" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  ${IMMERSIVE_BG_VOLUME_BARS}
</svg>`;

/** Loading — pulsing volume bars. */
const IMMERSIVE_BG_LOADING_ICON = `<svg class="psv-button-svg psv-immersive-bg-volume psv-immersive-bg-volume--loading" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  ${IMMERSIVE_BG_VOLUME_BARS}
</svg>`;

/** Muted for foreground video — static bars + slash. */
const IMMERSIVE_BG_MUTED_ICON = `<svg class="psv-button-svg psv-immersive-bg-volume psv-immersive-bg-volume--muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  ${IMMERSIVE_BG_VOLUME_BARS}
  <path class="psv-immersive-bg-mute-slash" d="M4.5 5.5 19.5 18.5" stroke="currentColor" stroke-width="1.85" stroke-linecap="round"/>
</svg>`;

interface NavbarButtonWithContainer {
  container: HTMLElement;
  toggleActive: (active?: boolean) => void;
}

function resolveImmersiveButtonRoot(container: HTMLElement): HTMLElement {
  const root = container.closest('.psv-immersive-bg-button');
  return root instanceof HTMLElement ? root : container;
}

function resolveIcon(state: ImmersiveBgButtonState): string {
  switch (state) {
    case 'loading':
      return IMMERSIVE_BG_LOADING_ICON;
    case 'muted':
      return IMMERSIVE_BG_MUTED_ICON;
    case 'playing':
      return IMMERSIVE_BG_ON_ICON;
    default:
      return IMMERSIVE_BG_OFF_ICON;
  }
}

function resolveTitle(state: ImmersiveBgButtonState): string {
  switch (state) {
    case 'loading':
      return 'Loading immersive ambience';
    case 'muted':
      return 'Immersive ambience muted for video';
    case 'playing':
      return 'Stop immersive ambience';
    default:
      return 'Play immersive ambience';
  }
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
  const active = state !== 'off';

  button.toggleActive(active);
  root.classList.toggle('psv-button--active', active);
  root.classList.toggle('psv-immersive-bg-button--loading', state === 'loading');
  root.classList.toggle('psv-immersive-bg-button--muted', state === 'muted');
  button.container.innerHTML = resolveIcon(state);
  root.setAttribute('aria-pressed', active ? 'true' : 'false');
  root.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
  root.setAttribute('title', resolveTitle(state));
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

      void controller.toggle().then(() => syncButton(viewer, controller));
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
