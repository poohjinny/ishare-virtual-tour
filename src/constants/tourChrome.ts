/** Tour shell chrome breakpoints — keep CSS `@media` in sync. */
export const TOUR_CHROME_MOBILE_MAX_PX = 480;
export const TOUR_CHROME_COMPACT_MAX_PX = 1023;

export type TourChromeMode = 'mobile' | 'compact' | 'desktop';

export const TOUR_CHROME_MOBILE_MQ = `(max-width: ${TOUR_CHROME_MOBILE_MAX_PX}px)`;
export const TOUR_CHROME_COMPACT_MQ = `(max-width: ${TOUR_CHROME_COMPACT_MAX_PX}px)`;

export function resolveTourChromeMode(
  widthPx: number = typeof window !== 'undefined' ? window.innerWidth : 1280,
): TourChromeMode {
  if (widthPx <= TOUR_CHROME_MOBILE_MAX_PX) return 'mobile';
  if (widthPx <= TOUR_CHROME_COMPACT_MAX_PX) return 'compact';
  return 'desktop';
}

/** Match CSS `@media` breakpoints — prefer over `innerWidth` for chrome gating. */
export function resolveTourChromeModeFromMatchMedia(): TourChromeMode {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia(TOUR_CHROME_MOBILE_MQ).matches) return 'mobile';
  if (window.matchMedia(TOUR_CHROME_COMPACT_MQ).matches) return 'compact';
  return 'desktop';
}
