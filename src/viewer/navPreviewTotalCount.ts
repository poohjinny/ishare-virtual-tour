const COUNT_ATTR = 'data-nav-count-to';
const COUNT_DURATION_MS = 3000;
const HERO_LOADING_CLASS = 'anchored-panel__hero--loading';
const HERO_READY_TIMEOUT_MS = 4500;

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Abbreviated currency with the unit + decimal places locked to the *target*'s
 * magnitude, so the digit count never shifts mid-count (e.g. always `$X.XM`).
 */
export function formatCountValue(value: number, target: number): string {
  if (target >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (target >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

/** Run the count-up once the hero has finished loading, to avoid competing with
 * the panorama/WebGL mount for frame budget. Resolves immediately when there's
 * no loading hero (e.g. body-only panel), with a timeout fallback. */
function whenHeroReady(root: HTMLElement, run: () => void): void {
  const hero = root.querySelector('.anchored-panel__hero');
  if (
    !(hero instanceof HTMLElement) ||
    !hero.classList.contains(HERO_LOADING_CLASS)
  ) {
    run();
    return;
  }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    window.clearTimeout(timer);
    run();
  };

  const observer = new MutationObserver(() => {
    if (!hero.classList.contains(HERO_LOADING_CLASS)) finish();
  });
  observer.observe(hero, { attributes: true, attributeFilter: ['class'] });
  const timer = window.setTimeout(finish, HERO_READY_TIMEOUT_MS);
}

function runCountUp(el: HTMLElement, target: number, finalText: string): void {
  const start = performance.now();
  const tick = (now: number) => {
    if (!el.isConnected) return;

    const progress = Math.min((now - start) / COUNT_DURATION_MS, 1);
    if (progress >= 1) {
      el.textContent = finalText;
      return;
    }

    el.textContent = formatCountValue(target * easeOutExpo(progress), target);
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

/**
 * Count-up for the nav preview sector total. Runs once per panel mount, honors
 * `prefers-reduced-motion` (jumps straight to the final abbreviated value), waits
 * for the hero to load before animating, and stops early if the element leaves
 * the DOM (panel closed mid-animation).
 */
export function animateNavPreviewTotal(root: HTMLElement): void {
  const el = root.querySelector<HTMLElement>(`[${COUNT_ATTR}]`);
  if (!el) return;

  const target = Number(el.getAttribute(COUNT_ATTR));
  if (!Number.isFinite(target) || target <= 0) return;

  const finalText = formatCountValue(target, target);
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReduced) {
    el.textContent = finalText;
    return;
  }

  el.textContent = formatCountValue(0, target);
  whenHeroReady(root, () => runCountUp(el, target, finalText));
}
