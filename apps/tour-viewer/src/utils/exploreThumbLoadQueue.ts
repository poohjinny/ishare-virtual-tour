import { EXPLORE_DIRECTORY_MEDIA_MAX_CONCURRENT } from '../constants/tourDirectory';

type Grant = { tryGrant: () => void };

let activeLoads = 0;
const waiting: Grant[] = [];

function drainQueue(): void {
  while (
    activeLoads < EXPLORE_DIRECTORY_MEDIA_MAX_CONCURRENT &&
    waiting.length > 0
  ) {
    const next = waiting.shift();
    next?.tryGrant();
  }
}

/**
 * Limits how many Explore thumbs may start network/decode work at once.
 * Resolves with a release function — call once when the load settles (or on unmount).
 * `cancel` only abandons a waiting request; it does not release an already-granted slot.
 */
export function requestExploreThumbLoadSlot(): {
  promise: Promise<() => void>;
  cancel: () => void;
} {
  let cancelled = false;
  let queued: Grant | null = null;

  const promise = new Promise<() => void>((resolve) => {
    const tryGrant = () => {
      if (cancelled) return;

      if (activeLoads >= EXPLORE_DIRECTORY_MEDIA_MAX_CONCURRENT) {
        if (!queued) {
          queued = { tryGrant };
          waiting.push(queued);
        }
        return;
      }

      if (queued) {
        const index = waiting.indexOf(queued);
        if (index >= 0) waiting.splice(index, 1);
        queued = null;
      }

      activeLoads += 1;
      let released = false;
      resolve(() => {
        if (released) return;
        released = true;
        activeLoads -= 1;
        drainQueue();
      });
    };

    tryGrant();
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      if (!queued) return;
      const index = waiting.indexOf(queued);
      if (index >= 0) waiting.splice(index, 1);
      queued = null;
    },
  };
}
