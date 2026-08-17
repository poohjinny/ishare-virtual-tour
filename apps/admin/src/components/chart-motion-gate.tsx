'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Chart fills repaint on the main thread, so a sweep that starts on first paint
 * races hydration and thumbnail decodes and drops frames. The document ships
 * held (`data-chart-motion="hold"` in the root layout); this releases the fills
 * once the main thread goes idle, and re-arms before paint on every in-app
 * navigation so a fresh page sweeps from the start instead of mid-motion.
 */
const CHART_MOTION_ATTR = 'data-chart-motion';
/** Release regardless — a busy page must not sit on an empty chart. */
const CHART_MOTION_MAX_HOLD_MS = 900;

export function ChartMotionGate() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    document.documentElement.setAttribute(CHART_MOTION_ATTR, 'hold');
  }, [pathname]);

  useEffect(() => {
    let released = false;
    let idle: number | undefined;

    function release() {
      if (released) return;
      released = true;
      document.documentElement.setAttribute(CHART_MOTION_ATTR, 'ready');
    }

    const cap = window.setTimeout(release, CHART_MOTION_MAX_HOLD_MS);
    const frame = window.requestAnimationFrame(() => {
      if (typeof window.requestIdleCallback !== 'function') {
        release();
        return;
      }
      idle = window.requestIdleCallback(release, {
        timeout: CHART_MOTION_MAX_HOLD_MS,
      });
    });

    return () => {
      window.clearTimeout(cap);
      window.cancelAnimationFrame(frame);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [pathname]);

  return null;
}
