import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';

import type { NavPreviewContent, ViewPosition } from '../types/tour';
import { toPsvZoom } from '../utils/psvZoom';
import {
  applyViewerRenderPerfPause,
  getTourPerfPauseState,
  subscribeTourPerfPause,
  type TourPerfPauseState,
} from './tourPerfPause';
import {
  dismissNavPreviewHero,
  isNavPreviewMiniViewerEnabled,
  markNavPreviewHeroError,
  markNavPreviewHeroLoaded,
  mountNavPreviewImageHero,
  mountNavPreviewStillHero,
  mountNavPreviewVideoHero,
  prepareNavPreviewHeroLayout,
  syncNavPreviewHeroHeight,
  wireNavPreviewFallbackImage,
} from './navPreviewHero';

export {
  dismissNavPreviewHero,
  isNavPreviewMiniViewerEnabled,
  mountNavPreviewImageHero,
  mountNavPreviewStillHero,
  mountNavPreviewVideoHero,
  prepareNavPreviewHeroLayout,
};

/** Yaw rotation speed for mini preview (degrees per second). */
const AUTO_ROTATE_DEG_PER_SEC = 5;

/** Pull mini preview back from the scene target view (lower PSV zoom = wider). */
const PREVIEW_ZOOM_PULLBACK = 22;

interface MiniViewerEntry {
  viewer: Viewer;
  stopRotate: () => void;
  renderPaused: boolean;
}

const activeViewers = new Map<string, MiniViewerEntry>();

let perfPauseUnsub: (() => void) | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

function pauseMiniViewerRender(entry: MiniViewerEntry): void {
  if (entry.renderPaused) return;

  entry.renderPaused = true;
  entry.stopRotate();
  entry.stopRotate = () => {};
  applyViewerRenderPerfPause(entry.viewer, true);
}

function resumeMiniViewerRender(entry: MiniViewerEntry): void {
  if (!entry.renderPaused) return;

  entry.renderPaused = false;
  entry.stopRotate = startAutoRotate(entry.viewer);
  applyViewerRenderPerfPause(entry.viewer, false);
}

function applyPerfPauseToEntry(
  entry: MiniViewerEntry,
  { viewerRenderPaused }: TourPerfPauseState,
): void {
  if (viewerRenderPaused) {
    pauseMiniViewerRender(entry);
    return;
  }

  resumeMiniViewerRender(entry);
}

function syncAllMiniViewers(state: TourPerfPauseState): void {
  for (const entry of activeViewers.values()) {
    applyPerfPauseToEntry(entry, state);
  }
}

function ensureMiniViewerPerfPause(): void {
  if (perfPauseUnsub) return;
  perfPauseUnsub = subscribeTourPerfPause(syncAllMiniViewers);
}

function teardownMiniViewerPerfPauseIfIdle(): void {
  if (activeViewers.size > 0 || !perfPauseUnsub) return;
  perfPauseUnsub();
  perfPauseUnsub = null;
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
    mousemove: false,
    touchmoveTwoFingers: false,
    keyboard: false,
    loadingTxt: '',
    minFov: 24,
    maxFov: 120,
    moveInertia: 0.75,
    // Match the skeleton tone (not navy) so the first fade-in frame — before the
    // sphere paints — never flashes dark during the skeleton → panorama swap.
    canvasBackground: '#e2e8f0',
    rendererParameters: { alpha: false, antialias: true },
    ...toPreviewDefaultView(view),
  });

  const entry: MiniViewerEntry = {
    viewer,
    stopRotate: () => {},
    renderPaused: false,
  };
  activeViewers.set(markerId, entry);
  ensureMiniViewerPerfPause();

  viewer.addEventListener(
    'panorama-loaded',
    () => {
      syncNavPreviewHeroHeight(hero);
      viewer.resize({
        width: `${container.clientWidth}px`,
        height: `${container.clientHeight}px`,
      });
      markNavPreviewHeroLoaded(hero);

      const { viewerRenderPaused } = getTourPerfPauseState();
      if (viewerRenderPaused) {
        pauseMiniViewerRender(entry);
        return;
      }

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
        teardownMiniViewerPerfPauseIfIdle();
        container.replaceChildren();
        wireNavPreviewFallbackImage(hero, fallbackImage);
        return;
      }
      markNavPreviewHeroError(hero);
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

  const hero = root.querySelector('.anchored-panel__hero');
  const container = root.querySelector('.anchored-panel__hero-viewer');
  if (!(hero instanceof HTMLElement) || !(container instanceof HTMLElement)) {
    return;
  }

  syncNavPreviewHeroHeight(hero);

  const fallbackImage = preview.image ?? preview.panorama;

  if (!isNavPreviewMiniViewerEnabled()) {
    dismissNavPreviewHero(root);
    return;
  }

  if (!preview.panorama) {
    if (fallbackImage) wireNavPreviewFallbackImage(hero, fallbackImage);
    return;
  }

  if (prefersReducedMotion()) {
    if (fallbackImage) wireNavPreviewFallbackImage(hero, fallbackImage);
    return;
  }

  requestAnimationFrame(() => {
    if (!hero.isConnected) return;
    syncNavPreviewHeroHeight(hero);
    mountPanoramaViewer(markerId, hero, container, preview);
  });
}

export function destroyNavPreviewMiniViewer(markerId: string): void {
  const entry = activeViewers.get(markerId);
  if (!entry) return;

  entry.stopRotate();
  entry.viewer.destroy();
  activeViewers.delete(markerId);
  teardownMiniViewerPerfPauseIfIdle();
}

export function destroyAllNavPreviewMiniViewers(): void {
  for (const markerId of [...activeViewers.keys()]) {
    destroyNavPreviewMiniViewer(markerId);
  }
}
