import {
  resolveNavPreviewHeroHeight,
  resolveNavPreviewPanelWidth,
} from '../components/tourGlassPanelHtml';
import { initPopupVideoPlayers } from '../utils/popupVideo';

/** Nav preview hero — on by default; `?disableNavPreview=1` disables (debug). */
export function isNavPreviewMiniViewerEnabled(
  searchParams?: URLSearchParams,
): boolean {
  const params =
    searchParams ??
    (typeof window !== 'undefined' ?
      new URLSearchParams(window.location.search)
    : null);
  if (!params) return true;

  return params.get('disableNavPreview') !== '1';
}

function syncHeroHeight(hero: HTMLElement): void {
  const host = hero.closest('.psv-marker, .hotspot-3d-anchored-panel');
  const width =
    host instanceof HTMLElement && host.offsetWidth > 0 ?
      host.offsetWidth
    : resolveNavPreviewPanelWidth();
  const useVideoAspect =
    hero.getAttribute('data-hero-aspect') !== 'panorama' &&
    (hero.classList.contains('anchored-panel__hero--video') ||
      hero.classList.contains('anchored-panel__hero--image'));
  hero.style.height = `${resolveNavPreviewHeroHeight(width, {
    video: useVideoAspect,
  })}px`;
}

/** Lock hero height to the host width before camera framing (avoids post-fit grow). */
export function prepareNavPreviewHeroLayout(root: ParentNode): void {
  const hero = root.querySelector('.anchored-panel__hero');
  if (hero instanceof HTMLElement) syncHeroHeight(hero);
}

export function markNavPreviewHeroLoaded(hero: HTMLElement): void {
  hero.classList.remove('anchored-panel__hero--loading');
  hero.removeAttribute('aria-busy');
}

export function markNavPreviewHeroError(hero: HTMLElement): void {
  hero.classList.remove('anchored-panel__hero--loading');
  hero.classList.add('anchored-panel__hero--error');
  hero.removeAttribute('aria-busy');
}

/** Skip hero media entirely (debug / perf test). No network, no WebGL. */
export function dismissNavPreviewHero(root: ParentNode): void {
  const hero = root.querySelector('.anchored-panel__hero');
  if (!(hero instanceof HTMLElement)) return;

  const viewer = hero.querySelector('.anchored-panel__hero-viewer');
  if (viewer instanceof HTMLElement) {
    viewer.replaceChildren();
    viewer.hidden = true;
  }

  const fallback = hero.querySelector('.anchored-panel__hero-fallback');
  if (fallback instanceof HTMLImageElement) {
    fallback.removeAttribute('src');
    fallback.hidden = true;
  }

  markNavPreviewHeroLoaded(hero);
}

export function wireNavPreviewFallbackImage(
  hero: HTMLElement,
  imageUrl: string,
): void {
  const fallback = hero.querySelector('.anchored-panel__hero-fallback');
  if (!(fallback instanceof HTMLImageElement)) return;

  fallback.hidden = false;
  fallback.src = imageUrl;

  const onLoad = () => {
    fallback.classList.add('anchored-panel__hero-fallback--loaded');
    markNavPreviewHeroLoaded(hero);
  };

  if (fallback.complete && fallback.naturalWidth > 0) {
    onLoad();
    return;
  }

  fallback.addEventListener('load', onLoad, { once: true });
  fallback.addEventListener('error', () => markNavPreviewHeroError(hero), {
    once: true,
  });
}

const NAV_PREVIEW_VIDEO_HERO_LOAD_MS = 4000;

export function mountNavPreviewVideoHero(root: ParentNode): void {
  const hero = root.querySelector('.anchored-panel__hero--video');
  if (!(hero instanceof HTMLElement)) return;

  syncHeroHeight(hero);
  initPopupVideoPlayers(root);

  const videoShell = hero.querySelector('.tour-glass-panel__video--preview');
  const finish = () => markNavPreviewHeroLoaded(hero);

  if (!(videoShell instanceof HTMLElement)) {
    finish();
    return;
  }

  if (videoShell.classList.contains('tour-glass-panel__video--thumb-loaded')) {
    finish();
    return;
  }

  const observer = new MutationObserver(() => {
    if (
      videoShell.classList.contains('tour-glass-panel__video--thumb-loaded')
    ) {
      observer.disconnect();
      finish();
    }
  });
  observer.observe(videoShell, {
    attributes: true,
    attributeFilter: ['class'],
  });
  window.setTimeout(() => {
    observer.disconnect();
    finish();
  }, NAV_PREVIEW_VIDEO_HERO_LOAD_MS);
}

/** Still-image hero (info panels) — same chrome as video, no mini-viewer. */
export function mountNavPreviewImageHero(root: ParentNode): void {
  const hero = root.querySelector('.anchored-panel__hero--image');
  if (!(hero instanceof HTMLElement)) return;

  syncHeroHeight(hero);
  const img = hero.querySelector('.anchored-panel__hero-image');
  if (!(img instanceof HTMLImageElement)) {
    markNavPreviewHeroLoaded(hero);
    return;
  }

  const finish = () => {
    img.classList.add('anchored-panel__hero-image--loaded');
    markNavPreviewHeroLoaded(hero);
  };

  if (img.complete && img.naturalWidth > 0) {
    finish();
    return;
  }

  img.addEventListener('load', finish, { once: true });
  img.addEventListener(
    'error',
    () => {
      markNavPreviewHeroError(hero);
    },
    { once: true },
  );
}

/** Static fallback image — used by model3d nav preview (no mini-PSV). */
export function mountNavPreviewStillHero(
  root: ParentNode,
  imageUrl?: string | null,
): void {
  const hero = root.querySelector('.anchored-panel__hero');
  if (!(hero instanceof HTMLElement)) return;

  syncHeroHeight(hero);
  const url = imageUrl?.trim();
  if (!url) {
    markNavPreviewHeroLoaded(hero);
    return;
  }
  wireNavPreviewFallbackImage(hero, url);
}

export { syncHeroHeight as syncNavPreviewHeroHeight };
