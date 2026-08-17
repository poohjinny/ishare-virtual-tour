/** Delay after scene transition before hotspot enter animation starts. */
export const HOTSPOT_ENTER_DELAY_MS = 200;

/** CSS animation duration — keep in sync with `hotspot-enter` keyframes in globals.css. */
export const HOTSPOT_ENTER_DURATION_MS = 420;

/** Per-marker delay — stamp-in sequence after landing / scene change. */
export const HOTSPOT_ENTER_STAGGER_MS = 48;

/**
 * Imperative phase on the viewer container. Must be a data-attribute (not a
 * class) — React reconciles `className` on the same node and would wipe
 * `classList.add('…-hotspots-hold')` during splash/chrome re-renders
 * (especially phone / device-preview), unmasking markers mid-landing.
 */
export const HOTSPOTS_PHASE_ATTR = 'data-hotspots-phase';

export type HotspotsPhase = 'hold' | 'enter';

export interface HotspotEnterOptions {
  enterTargetSelector?: string;
  clearDelaySelector?: string;
  /**
   * Runs after the hold delay and before hold is cleared.
   * Flush viewer layout so marker positions are correct before opacity returns.
   */
  prepareReveal?: () => void;
}

type HotspotEnterChrome = Required<
  Pick<HotspotEnterOptions, 'enterTargetSelector' | 'clearDelaySelector'>
>;

const PSV_HOTSPOT_ENTER: HotspotEnterChrome = {
  enterTargetSelector:
    '.psv-marker--visible:has(.hotspot-nav) .hotspot-nav, .psv-marker--visible:has(.hotspot-info) .hotspot-info, .psv-marker--visible:has(.hotspot-general-info) .hotspot-general-info',
  clearDelaySelector: '.hotspot-nav, .hotspot-info, .hotspot-general-info',
};

/** Hotspot enter selectors for the Three.js CSS2D overlay. */
export const HOTSPOT_ENTER_3D: HotspotEnterChrome = {
  enterTargetSelector:
    '.hotspot-3d-wrap .hotspot-nav, .hotspot-3d-wrap .hotspot-info',
  clearDelaySelector:
    '.hotspot-3d-wrap .hotspot-nav, .hotspot-3d-wrap .hotspot-info',
};

export interface HotspotEnterController {
  hold: () => void;
  /** Optional callback runs after the enter sequence finishes (or immediately if reduced motion). */
  schedule: (onComplete?: () => void) => void;
  release: () => void;
  destroy: () => void;
}

function setPhase(el: HTMLElement, phase: HotspotsPhase | null): void {
  if (phase === null) {
    el.removeAttribute(HOTSPOTS_PHASE_ATTR);
    return;
  }
  el.setAttribute(HOTSPOTS_PHASE_ATTR, phase);
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
  const { enterTargetSelector, clearDelaySelector, prepareReveal } = {
    ...PSV_HOTSPOT_ENTER,
    ...options,
  };

  let enterTimer: ReturnType<typeof setTimeout> | null = null;
  let clearEnterTimer: ReturnType<typeof setTimeout> | null = null;
  let revealRaf = 0;

  const clearTimers = () => {
    if (enterTimer !== null) {
      clearTimeout(enterTimer);
      enterTimer = null;
    }
    if (clearEnterTimer !== null) {
      clearTimeout(clearEnterTimer);
      clearEnterTimer = null;
    }
    if (revealRaf !== 0) {
      cancelAnimationFrame(revealRaf);
      revealRaf = 0;
    }
  };

  const getEl = () => getContainer();

  const finishEnter = (el: HTMLElement) => {
    clearEnterStagger(el, clearDelaySelector);
    setPhase(el, null);
  };

  const startEnter = (el: HTMLElement, onComplete?: () => void) => {
    prepareReveal?.();
    // Double rAF: apply marker translates while still held, then reveal.
    revealRaf = requestAnimationFrame(() => {
      revealRaf = requestAnimationFrame(() => {
        revealRaf = 0;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setPhase(el, null);
          onComplete?.();
          return;
        }

        setPhase(el, 'enter');
        const markerCount = applyEnterStagger(el, enterTargetSelector);
        clearEnterTimer = window.setTimeout(() => {
          clearEnterTimer = null;
          finishEnter(el);
          onComplete?.();
        }, enterAnimationTotalMs(markerCount));
      });
    });
  };

  return {
    hold() {
      clearTimers();
      const el = getEl();
      if (!el) return;
      clearEnterStagger(el, clearDelaySelector);
      setPhase(el, 'hold');
    },

    schedule(onComplete?: () => void) {
      clearTimers();
      const el = getEl();
      if (!el) {
        onComplete?.();
        return;
      }

      // Keep hold through the delay — removing it early caused a visible flash
      // before the enter animation restarted from opacity 0.
      enterTimer = window.setTimeout(() => {
        enterTimer = null;
        startEnter(el, onComplete);
      }, HOTSPOT_ENTER_DELAY_MS);
    },

    release() {
      clearTimers();
      const el = getEl();
      if (!el) return;
      clearEnterStagger(el, clearDelaySelector);
      setPhase(el, null);
    },

    destroy() {
      this.release();
    },
  };
}
