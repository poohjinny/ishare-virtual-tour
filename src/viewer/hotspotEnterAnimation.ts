/** Delay after scene transition before hotspot enter animation starts. */
export const HOTSPOT_ENTER_DELAY_MS = 200;

/** CSS animation duration — keep in sync with `hotspot-enter` keyframes in hotspots.css. */
export const HOTSPOT_ENTER_DURATION_MS = 320;

const HOLD_CLASS = 'viewer-container--hotspots-hold';
const ENTER_CLASS = 'viewer-container--hotspots-enter';

export interface HotspotEnterController {
  hold: () => void;
  schedule: () => void;
  release: () => void;
  destroy: () => void;
}

export function createHotspotEnterController(
  getContainer: () => HTMLElement | null,
): HotspotEnterController {
  let enterTimer: ReturnType<typeof setTimeout> | null = null;
  let clearEnterTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (enterTimer !== null) {
      clearTimeout(enterTimer);
      enterTimer = null;
    }
    if (clearEnterTimer !== null) {
      clearTimeout(clearEnterTimer);
      clearEnterTimer = null;
    }
  };

  const getEl = () => getContainer();

  return {
    hold() {
      clearTimers();
      getEl()?.classList.add(HOLD_CLASS);
      getEl()?.classList.remove(ENTER_CLASS);
    },

    schedule() {
      clearTimers();
      const el = getEl();
      if (!el) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.classList.remove(HOLD_CLASS);
        return;
      }

      // Keep hold through the delay — removing it early caused a visible flash
      // before the enter animation restarted from opacity 0.
      enterTimer = window.setTimeout(() => {
        enterTimer = null;
        el.classList.remove(HOLD_CLASS);
        el.classList.add(ENTER_CLASS);
        clearEnterTimer = window.setTimeout(() => {
          clearEnterTimer = null;
          el.classList.remove(ENTER_CLASS);
        }, HOTSPOT_ENTER_DURATION_MS);
      }, HOTSPOT_ENTER_DELAY_MS);
    },

    release() {
      clearTimers();
      const el = getEl();
      el?.classList.remove(HOLD_CLASS, ENTER_CLASS);
    },

    destroy() {
      this.release();
    },
  };
}
