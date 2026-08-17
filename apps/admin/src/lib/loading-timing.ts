import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

/**
 * One threshold for every passive loading surface — the route skeleton and the
 * navigation bar. Most in-app navigations land inside this window, and loading
 * UI that never appears cannot flash.
 */
export const LOADING_REVEAL_DELAY_MS = 200;

/**
 * The skeleton ramps in rather than popping. A Suspense fallback cannot hold
 * itself on screen — React drops it the moment content arrives — so the ramp
 * is what keeps a just-past-threshold navigation from blinking: it clears a
 * faint skeleton instead of a fully drawn one.
 */
const LOADING_REVEAL_FADE_MS = 240;

/**
 * Route `loading.tsx` fallbacks. Wrap the skeleton and pass the route's own
 * layout classes; the reveal recipe lives in `globals.css`.
 */
export function loadingRevealProps(className?: string) {
  return {
    className: cn('admin-loading-reveal', className),
    style: {
      '--admin-loading-delay': `${LOADING_REVEAL_DELAY_MS}ms`,
      '--admin-loading-fade': `${LOADING_REVEAL_FADE_MS}ms`,
    } as CSSProperties,
  };
}
