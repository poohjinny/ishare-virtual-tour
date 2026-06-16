import type { Tour } from '../types/tour';
import { tourAssetPath } from './tourAssetPath';

const DEFAULT_FAVICON = '/favicon.ico';
const FAVICON_SELECTOR = 'link[rel="icon"][data-client-favicon]';

export function resolveClientFavicon(
  tour: Pick<Tour, 'id' | 'clientId' | 'branding'>,
): string {
  if (tour.branding?.favicon) {
    return tour.branding.favicon;
  }

  return tourAssetPath(tour, 'favicon.ico');
}

function getFaviconLink(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>(FAVICON_SELECTOR);
  if (existing) {
    return existing;
  }

  const link = document.createElement('link');
  link.rel = 'icon';
  link.sizes = 'any';
  link.dataset.clientFavicon = 'true';
  document.head.appendChild(link);
  return link;
}

export function applyClientFavicon(
  tour: Pick<Tour, 'id' | 'clientId' | 'branding'>,
): void {
  getFaviconLink().href = resolveClientFavicon(tour);
}

export function resetClientFavicon(): void {
  getFaviconLink().href = DEFAULT_FAVICON;
}
