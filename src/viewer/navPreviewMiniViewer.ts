import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';

import {
  resolveNavPreviewHeroHeight,
  resolveNavPreviewPanelWidth,
} from '../components/tourGlassPanelHtml';
import type { NavPreviewContent, ViewPosition } from '../types/tour';
import { toPsvZoom } from '../utils/psvZoom';

/** Nav preview hero — on by default; `?navPreview=0` disables (debug). */
export function isNavPreviewMiniViewerEnabled(
  searchParams?: URLSearchParams,
): boolean {
  const params =
    searchParams ??
    (typeof window !== 'undefined' ?
      new URLSearchParams(window.location.search)
    : null);
  if (!params) return true;

  const value = params.get('navPreview');
  if (value === '0') return false;
  if (value === '1') return true;
  return true;
}

/** Yaw rotation speed for mini preview (degrees per second). */
const AUTO_ROTATE_DEG_PER_SEC = 5;

/** Pull mini preview back from the scene target view (lower PSV zoom = wider). */
const PREVIEW_ZOOM_PULLBACK = 22;

interface MiniViewerEntry {
  viewer: Viewer;
  stopRotate: () => void;
}

const activeViewers = new Map<string, MiniViewerEntry>();

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function syncHeroHeight(hero: HTMLElement): void {
  const marker = hero.closest('.psv-marker');
  const width =
    marker instanceof HTMLElement && marker.offsetWidth > 0 ?
      marker.offsetWidth
    : resolveNavPreviewPanelWidth();
  hero.style.height = `${resolveNavPreviewHeroHeight(width)}px`;
}

function markHeroLoaded(hero: HTMLElement): void {
  hero.classList.remove('nav-preview-panel__hero--loading');
  hero.removeAttribute('aria-busy');
}

function markHeroError(hero: HTMLElement): void {
  hero.classList.remove('nav-preview-panel__hero--loading');
  hero.classList.add('nav-preview-panel__hero--error');
  hero.removeAttribute('aria-busy');
}

/** Skip hero media entirely (debug / perf test). No network, no WebGL. */
export function dismissNavPreviewHero(root: ParentNode): void {
  const hero = root.querySelector('.nav-preview-panel__hero');
  if (!(hero instanceof HTMLElement)) return;

  const viewer = hero.querySelector('.nav-preview-panel__hero-viewer');
  if (viewer instanceof HTMLElement) {
    viewer.replaceChildren();
    viewer.hidden = true;
  }

  const fallback = hero.querySelector('.nav-preview-panel__hero-fallback');
  if (fallback instanceof HTMLImageElement) {
    fallback.removeAttribute('src');
    fallback.hidden = true;
  }

  markHeroLoaded(hero);
}

function wireFallbackImage(hero: HTMLElement, imageUrl: string): void {
  const fallback = hero.querySelector('.nav-preview-panel__hero-fallback');
  if (!(fallback instanceof HTMLImageElement)) return;

  fallback.hidden = false;
  fallback.src = imageUrl;

  const onLoad = () => {
    fallback.classList.add('nav-preview-panel__hero-fallback--loaded');
    markHeroLoaded(hero);
  };

  if (fallback.complete && fallback.naturalWidth > 0) {
    onLoad();
    return;
  }

  fallback.addEventListener('load', onLoad, { once: true });
  fallback.addEventListener('error', () => markHeroError(hero), { once: true });
}

function startAutoRotate(viewer: Viewer): () => void {
  let raf = 0;
  let last = performance.now();

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const position = viewer.getPosition();
    const yaw = position.yaw + ((AUTO_ROTATE_DEG_PER_SEC * Math.PI) / 180) * dt;
    viewer.rotate({ yaw, pitch: position.pitch });
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
  };
}

function toPreviewDefaultView(view: ViewPosition) {
  const zoomLvl = Math.max(0, toPsvZoom(view.zoom) - PREVIEW_ZOOM_PULLBACK);
  return {
    defaultYaw: `${view.yaw}deg`,
    defaultPitch: `${view.pitch}deg`,
    defaultZoomLvl: zoomLvl,
  };
}

function mountPanoramaViewer(
  markerId: string,
  hero: HTMLElement,
  container: HTMLElement,
  preview: NavPreviewContent,
): void {
  const view = preview.targetView ?? { yaw: 0, pitch: 0, zoom: 0 };
  const fallbackImage = preview.image ?? preview.panorama;

  container.style.width = '100%';
  container.style.height = '100%';

  const viewer = new Viewer({
    container,
    panorama: preview.panorama!,
    navbar: false,
    mousewheel: false,
    mousemove: true,
    touchmoveTwoFingers: false,
    keyboard: false,
    loadingTxt: '',
    minFov: 24,
    maxFov: 120,
    moveInertia: 0.75,
    canvasBackground: '#0f172a',
    rendererParameters: { alpha: false, antialias: true },
    ...toPreviewDefaultView(view),
  });

  const entry: MiniViewerEntry = { viewer, stopRotate: () => {} };
  activeViewers.set(markerId, entry);

  viewer.addEventListener(
    'panorama-loaded',
    () => {
      syncHeroHeight(hero);
      viewer.resize({
        width: `${container.clientWidth}px`,
        height: `${container.clientHeight}px`,
      });
      markHeroLoaded(hero);
      entry.stopRotate = startAutoRotate(viewer);
    },
    { once: true },
  );
  viewer.addEventListener(
    'panorama-error',
    () => {
      if (fallbackImage) {
        entry.stopRotate();
        viewer.destroy();
        activeViewers.delete(markerId);
        container.replaceChildren();
        wireFallbackImage(hero, fallbackImage);
        return;
      }
      markHeroError(hero);
    },
    { once: true },
  );
}

export function mountNavPreviewMiniViewer(
  markerId: string,
  root: ParentNode,
  preview: NavPreviewContent,
): void {
  destroyNavPreviewMiniViewer(markerId);

  const hero = root.querySelector('.nav-preview-panel__hero');
  const container = root.querySelector('.nav-preview-panel__hero-viewer');
  if (!(hero instanceof HTMLElement) || !(container instanceof HTMLElement)) {
    return;
  }

  syncHeroHeight(hero);

  const fallbackImage = preview.image ?? preview.panorama;

  if (!isNavPreviewMiniViewerEnabled()) {
    dismissNavPreviewHero(root);
    return;
  }

  if (!preview.panorama) {
    if (fallbackImage) wireFallbackImage(hero, fallbackImage);
    return;
  }

  if (prefersReducedMotion()) {
    if (fallbackImage) wireFallbackImage(hero, fallbackImage);
    return;
  }

  requestAnimationFrame(() => {
    if (!hero.isConnected) return;
    syncHeroHeight(hero);
    mountPanoramaViewer(markerId, hero, container, preview);
  });
}

export function destroyNavPreviewMiniViewer(markerId: string): void {
  const entry = activeViewers.get(markerId);
  if (!entry) return;

  entry.stopRotate();
  entry.viewer.destroy();
  activeViewers.delete(markerId);
}

export function destroyAllNavPreviewMiniViewers(): void {
  for (const markerId of [...activeViewers.keys()]) {
    destroyNavPreviewMiniViewer(markerId);
  }
}
