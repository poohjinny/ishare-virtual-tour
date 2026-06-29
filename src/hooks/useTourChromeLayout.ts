import { useEffect, useState } from 'react';
import {
  resolveTourChromeModeFromMatchMedia,
  TOUR_CHROME_COMPACT_MQ,
  TOUR_CHROME_MOBILE_MQ,
  type TourChromeMode,
} from '../constants/tourChrome';

const SHORT_VIEWPORT_MQ = '(max-height: 700px)';
const COARSE_POINTER_MQ = '(pointer: coarse)';

function readLayout() {
  if (typeof window === 'undefined') {
    return {
      chromeMode: 'desktop' as TourChromeMode,
      isShortViewport: false,
      isCoarsePointer: false,
    };
  }

  return {
    chromeMode: resolveTourChromeModeFromMatchMedia(),
    isShortViewport: window.matchMedia(SHORT_VIEWPORT_MQ).matches,
    isCoarsePointer: window.matchMedia(COARSE_POINTER_MQ).matches,
  };
}

/** Tour chrome layout — mobile / compact / desktop + touch signals. */
export function useTourChromeLayout() {
  const [layout, setLayout] = useState(readLayout);

  useEffect(() => {
    const mobileMq = window.matchMedia(TOUR_CHROME_MOBILE_MQ);
    const compactMq = window.matchMedia(TOUR_CHROME_COMPACT_MQ);
    const shortMq = window.matchMedia(SHORT_VIEWPORT_MQ);
    const coarseMq = window.matchMedia(COARSE_POINTER_MQ);

    const sync = () => setLayout(readLayout());

    mobileMq.addEventListener('change', sync);
    compactMq.addEventListener('change', sync);
    shortMq.addEventListener('change', sync);
    coarseMq.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    return () => {
      mobileMq.removeEventListener('change', sync);
      compactMq.removeEventListener('change', sync);
      shortMq.removeEventListener('change', sync);
      coarseMq.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  const { chromeMode, isShortViewport, isCoarsePointer } = layout;

  return {
    chromeMode,
    isMobile: chromeMode === 'mobile',
    isCompact: chromeMode === 'compact',
    isDesktop: chromeMode === 'desktop',
    /** @deprecated Use `isMobile`. */
    isPhone: chromeMode === 'mobile',
    isShortViewport,
    isCoarsePointer,
  };
}

/** Dev tools default closed on phone chrome. */
export function prefersMobileTourChrome(): boolean {
  return readLayout().chromeMode === 'mobile';
}

/** @deprecated Use `prefersMobileTourChrome`. */
export function prefersCompactTourChrome(): boolean {
  return prefersMobileTourChrome();
}
