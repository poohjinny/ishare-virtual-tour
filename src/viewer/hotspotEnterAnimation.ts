/** Delay after scene transition before hotspot enter animation starts. */
export const HOTSPOT_ENTER_DELAY_MS = 200;

/** CSS animation duration — keep in sync with `hotspot-enter` keyframes in globals.css. */
export const HOTSPOT_ENTER_DURATION_MS = 420;

/** Per-marker delay — stamp-in sequence after landing / scene change. */
export const HOTSPOT_ENTER_STAGGER_MS = 48;

const HOLD_CLASS = 'viewer-container--hotspots-hold';
const ENTER_CLASS = 'viewer-container--hotspots-enter';

const ENTER_TARGET_SELECTOR =
  '.psv-marker--visible:has(.hotspot-nav) .hotspot-nav, .psv-marker--visible:has(.hotspot-info) .hotspot-info, .psv-marker--visible:has(.hotspot-general-info) .hotspot-general-info';

export interface HotspotEnterController {
  hold: () => void;
  schedule: () => void;
  release: () => void;
  destroy: () => void;
}

function getEnterTargets(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(ENTER_TARGET_SELECTOR),
  );
}

function applyEnterStagger(container: HTMLElement): number {
  const targets = getEnterTargets(container);
  targets.forEach((target, index) => {
    target.style.animationDelay = `${index * HOTSPOT_ENTER_STAGGER_MS}ms`;
  });
  return targets.length;
}

function clearEnterStagger(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLElement>(
      '.hotspot-nav, .hotspot-info, .hotspot-general-info',
    )
    .forEach((target) => {
      target.style.animationDelay = '';
    });
}

function enterAnimationTotalMs(markerCount: number): number {
  const stagger =
    markerCount > 0 ? (markerCount - 1) * HOTSPOT_ENTER_STAGGER_MS : 0;
  return HOTSPOT_ENTER_DURATION_MS + stagger;
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

  const finishEnter = (el: HTMLElement) => {
    clearEnterStagger(el);
    el.classList.remove(ENTER_CLASS);
  };

  return {
    hold() {
      clearTimers();
      const el = getEl();
      el?.classList.add(HOLD_CLASS);
      el?.classList.remove(ENTER_CLASS);
      if (el) clearEnterStagger(el);
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
        const markerCount = applyEnterStagger(el);
        clearEnterTimer = window.setTimeout(() => {
          clearEnterTimer = null;
          finishEnter(el);
        }, enterAnimationTotalMs(markerCount));
      }, HOTSPOT_ENTER_DELAY_MS);
    },

    release() {
      clearTimers();
      const el = getEl();
      if (el) clearEnterStagger(el);
      el?.classList.remove(HOLD_CLASS, ENTER_CLASS);
    },

    destroy() {
      this.release();
    },
  };
}
