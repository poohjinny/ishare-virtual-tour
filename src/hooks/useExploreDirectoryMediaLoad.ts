import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getExploreDirectoryScrollIdle,
  subscribeExploreDirectoryScrollIdle,
} from '../utils/exploreDirectoryScrollIdle';
import { requestExploreThumbLoadSlot } from '../utils/exploreThumbLoadQueue';

function useExploreDirectoryScrollIdle(): boolean {
  const [scrollIdle, setScrollIdle] = useState(getExploreDirectoryScrollIdle);

  useEffect(
    () =>
      subscribeExploreDirectoryScrollIdle(() => {
        setScrollIdle(getExploreDirectoryScrollIdle());
      }),
    [],
  );

  return scrollIdle;
}

/**
 * Sticky gate for Explore thumbs: wait for scroll idle, then a concurrency slot.
 * Once allowed, stays allowed so mid-load scroll does not cancel work.
 * Call `onSettled` when the image/preview finishes (or fails) to free the slot.
 */
export function useExploreDirectoryMediaLoad(wantsLoad: boolean): {
  allowed: boolean;
  onSettled: () => void;
} {
  const scrollIdle = useExploreDirectoryScrollIdle();
  const [allowed, setAllowed] = useState(false);
  const releaseRef = useRef<(() => void) | null>(null);
  const settledRef = useRef(false);

  const onSettled = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    releaseRef.current?.();
    releaseRef.current = null;
  }, []);

  useEffect(() => {
    if (allowed || !wantsLoad || !scrollIdle) return;

    const { promise, cancel } = requestExploreThumbLoadSlot();
    let alive = true;

    void promise.then((release) => {
      if (!alive || !getExploreDirectoryScrollIdle()) {
        release();
        return;
      }
      releaseRef.current = release;
      setAllowed(true);
    });

    return () => {
      alive = false;
      cancel();
    };
  }, [allowed, scrollIdle, wantsLoad]);

  useEffect(() => {
    return () => {
      releaseRef.current?.();
      releaseRef.current = null;
    };
  }, []);

  return { allowed, onSettled };
}
