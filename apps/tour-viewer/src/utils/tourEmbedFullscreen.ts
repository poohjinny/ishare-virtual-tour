/** Whether the tour document runs inside a parent iframe. */
export function isTourInIframe(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

/** Browser Fullscreen API availability in this browsing context. */
export function isTourFullscreenApiEnabled(): boolean {
  return document.fullscreenEnabled !== false;
}

/**
 * When embedded without iframe `allow="fullscreen"`, `requestFullscreen()` is
 * blocked and fails silently unless callers handle the rejection.
 */
export function getTourFullscreenBlockHint(): string | null {
  if (!isTourInIframe()) return null;
  if (isTourFullscreenApiEnabled()) return null;

  return 'Fullscreen blocked — host page must set allow="fullscreen" on the iframe.';
}
