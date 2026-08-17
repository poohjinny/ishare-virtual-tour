import type { ImmersiveBackgroundController } from './immersiveBackgroundController';

export const IMMERSIVE_BG_NAVBAR_BUTTON_ID = 'immersive-bg';

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

/** Start ambience if it isn’t already on (Play Tour companion). */
export function ensureImmersiveBackgroundPlaying(
  controller: ImmersiveBackgroundController,
): void {
  if (controller.isEnabled()) return;
  void controller.toggle();
}

/** Pause ambience when Play Tour pauses (no-op if already off). */
export function ensureImmersiveBackgroundPaused(
  controller: ImmersiveBackgroundController,
): void {
  if (!controller.isEnabled()) return;
  controller.pause();
}
