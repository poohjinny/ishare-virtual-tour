import type { Viewer } from '@photo-sphere-viewer/core';

const PERF_PAUSE_CLASS = 'viewer-area--perf-pause';

export interface TourPerfPauseState {
  chromePaused: boolean;
  viewerRenderPaused: boolean;
}

export interface ViewerPerfPauseOptions {
  /** Tour shell — `.viewer-area` so chrome (nav, minimap, AI) pauses too. */
  scope: HTMLElement;
  getViewer?: () => Viewer | null;
}

type PerfPauseListener = (state: TourPerfPauseState) => void;

let signalsBound = false;
let pointerInDocument = true;
let currentState: TourPerfPauseState = {
  chromePaused: false,
  viewerRenderPaused: false,
};
const subscribers = new Set<PerfPauseListener>();

function computeState(pointerInDoc: boolean): TourPerfPauseState {
  const chromePaused = document.hidden || !pointerInDoc;
  return {
    chromePaused,
    viewerRenderPaused: chromePaused || !document.hasFocus(),
  };
}

function publish(next: TourPerfPauseState): void {
  if (
    next.chromePaused === currentState.chromePaused &&
    next.viewerRenderPaused === currentState.viewerRenderPaused
  ) {
    return;
  }

  currentState = next;
  subscribers.forEach((listener) => listener(currentState));
}

function syncSignals(): void {
  publish(computeState(pointerInDocument));
}

/** Shared tab / focus / pointer signals for tour chrome, main PSV, and nav preview. */
export function ensureTourPerfPauseSignals(): void {
  if (signalsBound) return;
  signalsBound = true;

  const onVisibility = () => syncSignals();
  const onWindowFocus = () => syncSignals();
  const onWindowBlur = () => syncSignals();
  const onDocumentMouseLeave = () => {
    pointerInDocument = false;
    syncSignals();
  };
  const onDocumentMouseEnter = () => {
    pointerInDocument = true;
    syncSignals();
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onWindowFocus);
  window.addEventListener('blur', onWindowBlur);
  document.documentElement.addEventListener('mouseleave', onDocumentMouseLeave);
  document.documentElement.addEventListener('mouseenter', onDocumentMouseEnter);
  syncSignals();
}

export function getTourPerfPauseState(): TourPerfPauseState {
  return { ...currentState };
}

export function subscribeTourPerfPause(
  listener: PerfPauseListener,
): () => void {
  ensureTourPerfPauseSignals();
  subscribers.add(listener);
  listener(currentState);
  return () => subscribers.delete(listener);
}

export function applyViewerRenderPerfPause(
  viewer: Viewer,
  paused: boolean,
): void {
  if (paused) {
    viewer.needsContinuousUpdate(false);
    return;
  }

  viewer.needsUpdate();
}

/**
 * Pause tour motion when attention leaves the tour:
 * - Chrome animations follow the pointer (alive when cursor is over the tour,
 *   even if another app/window is focused).
 * - PSV render is stricter and stops when the window loses focus.
 */
export function bindViewerPerfPause({
  scope,
  getViewer,
}: ViewerPerfPauseOptions): () => void {
  const unsubscribe = subscribeTourPerfPause(
    ({ chromePaused, viewerRenderPaused }) => {
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
