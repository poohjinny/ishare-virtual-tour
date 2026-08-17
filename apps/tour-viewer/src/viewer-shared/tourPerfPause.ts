import type { Viewer } from '@photo-sphere-viewer/core';

export interface TourPerfPauseState {
  chromePaused: boolean;
  viewerRenderPaused: boolean;
}

type PerfPauseListener = (state: TourPerfPauseState) => void;

let signalsBound = false;
let currentState: TourPerfPauseState = {
  chromePaused: false,
  viewerRenderPaused: false,
};
const subscribers = new Set<PerfPauseListener>();

function computeState(): TourPerfPauseState {
  const chromePaused = document.hidden;
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
  publish(computeState());
}

/** Shared tab / focus signals for tour chrome, main viewer, and nav preview. */
export function ensureTourPerfPauseSignals(): void {
  if (signalsBound) return;
  signalsBound = true;

  document.addEventListener('visibilitychange', syncSignals);
  window.addEventListener('focus', syncSignals);
  window.addEventListener('blur', syncSignals);
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

/** Pause/resume PSV continuous render (main viewer + nav preview mini). */
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
