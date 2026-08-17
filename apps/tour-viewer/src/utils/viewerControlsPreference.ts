/** Persisted only after the user toggles Controls; absent key → default hidden. */
const VIEWER_CONTROLS_VISIBLE_KEY = 'ishare-tour-viewer-controls-visible-v2';

export const VIEWER_CONTROLS_VISIBLE_DEFAULT = false;

export function readViewerControlsVisiblePreference(): boolean {
  if (typeof window === 'undefined') {
    return VIEWER_CONTROLS_VISIBLE_DEFAULT;
  }

  try {
    const stored = localStorage.getItem(VIEWER_CONTROLS_VISIBLE_KEY);
    if (stored === '0') return false;
    if (stored === '1') return true;
  } catch {
    /* private browsing / blocked storage */
  }

  return VIEWER_CONTROLS_VISIBLE_DEFAULT;
}

export function writeViewerControlsVisiblePreference(visible: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(VIEWER_CONTROLS_VISIBLE_KEY, visible ? '1' : '0');
  } catch {
    /* private browsing / blocked storage */
  }
}
