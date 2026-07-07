/** Delay after scene transition before hotspot enter animation starts. */
export const HOTSPOT_ENTER_DELAY_MS = 200;

/** CSS animation duration — keep in sync with `hotspot-enter` keyframes in globals.css. */
export const HOTSPOT_ENTER_DURATION_MS = 420;

/** Per-marker delay — stamp-in sequence after landing / scene change. */
export const HOTSPOT_ENTER_STAGGER_MS = 48;

export interface HotspotEnterOptions {
  holdClass?: string;
  enterClass?: string;
  enterTargetSelector?: string;
  clearDelaySelector?: string;
}

const PSV_HOTSPOT_ENTER: Required<HotspotEnterOptions> = {
  holdClass: 'viewer-container--hotspots-hold',
  enterClass: 'viewer-container--hotspots-enter',
  enterTargetSelector:
    '.psv-marker--visible:has(.hotspot-nav) .hotspot-nav, .psv-marker--visible:has(.hotspot-info) .hotspot-info, .psv-marker--visible:has(.hotspot-general-info) .hotspot-general-info',
  clearDelaySelector: '.hotspot-nav, .hotspot-info, .hotspot-general-info',
};

/** Hotspot enter classes/selectors for the Three.js CSS2D overlay. */
export const HOTSPOT_ENTER_3D: Required<HotspotEnterOptions> = {
  holdClass: 'viewer-3d-container--hotspots-hold',
  enterClass: 'viewer-3d-container--hotspots-enter',
  enterTargetSelector:
    '.hotspot-3d-wrap .hotspot-nav, .hotspot-3d-wrap .hotspot-info',
  clearDelaySelector:
    '.hotspot-3d-wrap .hotspot-nav, .hotspot-3d-wrap .hotspot-info',
};

export interface HotspotEnterController {
  hold: () => void;
  schedule: () => void;
  release: () => void;
  destroy: () => void;
}

function getEnterTargets(
  container: HTMLElement,
  enterTargetSelector: string,
): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(enterTargetSelector),
  );
}

function applyEnterStagger(
  container: HTMLElement,
  enterTargetSelector: string,
): number {
  const targets = getEnterTargets(container, enterTargetSelector);
  targets.forEach((target, index) => {
    target.style.animationDelay = `${index * HOTSPOT_ENTER_STAGGER_MS}ms`;
  });
  return targets.length;
}

function clearEnterStagger(
  container: HTMLElement,
  clearDelaySelector: string,
): void {
  container
    .querySelectorAll<HTMLElement>(clearDelaySelector)
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
  options: HotspotEnterOptions = PSV_HOTSPOT_ENTER,
): HotspotEnterController {
  const { holdClass, enterClass, enterTargetSelector, clearDelaySelector } = {
    ...PSV_HOTSPOT_ENTER,
    ...options,
  };

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
    clearEnterStagger(el, clearDelaySelector);
    el.classList.remove(enterClass);
  };

  return {
    hold() {
      clearTimers();
      const el = getEl();
      el?.classList.add(holdClass);
      el?.classList.remove(enterClass);
      if (el) clearEnterStagger(el, clearDelaySelector);
    },

    schedule() {
      clearTimers();
      const el = getEl();
      if (!el) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.classList.remove(holdClass);
        return;
      }

      // Keep hold through the delay — removing it early caused a visible flash
      // before the enter animation restarted from opacity 0.
      enterTimer = window.setTimeout(() => {
        enterTimer = null;
        el.classList.remove(holdClass);
        el.classList.add(enterClass);
        const markerCount = applyEnterStagger(el, enterTargetSelector);
        clearEnterTimer = window.setTimeout(() => {
          clearEnterTimer = null;
          finishEnter(el);
        }, enterAnimationTotalMs(markerCount));
      }, HOTSPOT_ENTER_DELAY_MS);
    },

    release() {
      clearTimers();
      const el = getEl();
      if (el) clearEnterStagger(el, clearDelaySelector);
      el?.classList.remove(holdClass, enterClass);
    },

    destroy() {
      this.release();
    },
  };
}
