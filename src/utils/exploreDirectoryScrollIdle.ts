import { EXPLORE_DIRECTORY_MEDIA_SCROLL_IDLE_MS } from '../constants/tourDirectory';

let scrollIdle = true;
let idleTimer = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Call from Explore directory / search scroll handlers. */
export function notifyExploreDirectoryScroll(
  idleMs = EXPLORE_DIRECTORY_MEDIA_SCROLL_IDLE_MS,
): void {
  if (scrollIdle) {
    scrollIdle = false;
    emit();
  }

  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    scrollIdle = true;
    emit();
  }, idleMs);
}

export function getExploreDirectoryScrollIdle(): boolean {
  return scrollIdle;
}

export function subscribeExploreDirectoryScrollIdle(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
