import type { Viewer } from '@photo-sphere-viewer/core';

import {
  applyViewerRenderPerfPause,
  subscribeTourPerfPause,
  type TourPerfPauseState,
} from '../viewer-shared/tourPerfPause';

const PERF_PAUSE_CLASS = 'viewer-area--perf-pause';

export interface ViewerPerfPauseOptions {
  /** Tour shell — `.viewer-area` so chrome (nav, AI) pauses too. */
  scope: HTMLElement;
  getViewer?: () => Viewer | null;
}

/**
 * Pause tour motion when attention leaves the tour:
 * - Chrome animations pause when the tab is hidden.
 * - PSV render also stops when the window loses focus.
 */
export function bindViewerPerfPause({
  scope,
  getViewer,
}: ViewerPerfPauseOptions): () => void {
  const unsubscribe = subscribeTourPerfPause(
    ({ chromePaused, viewerRenderPaused }: TourPerfPauseState) => {
      scope.classList.toggle(PERF_PAUSE_CLASS, chromePaused);

      const viewer = getViewer?.() ?? null;
      if (!viewer) return;

      applyViewerRenderPerfPause(viewer, viewerRenderPaused);
    },
  );

  return () => {
    unsubscribe();
    scope.classList.remove(PERF_PAUSE_CLASS);
    getViewer?.()?.needsUpdate();
  };
}
