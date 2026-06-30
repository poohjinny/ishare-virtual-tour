import type { Tour } from '../types/tour';
import { clientBrandFaviconPath } from './resolveTourBranding';
import { resolveTourBranding } from './resolveTourBranding';
import { getTourClientId } from './tourClientId';
import { tourAssetPath } from './tourAssetPath';

const DEFAULT_FAVICON = '/favicon.ico';
const FAVICON_SELECTOR = 'link[rel="icon"][data-client-favicon]';

export function resolveClientFavicon(tour: Tour): string {
  const branding = resolveTourBranding(tour);
  if (branding?.favicon) {
    return branding.favicon;
  }

  if (branding?.logo) {
    return clientBrandFaviconPath(getTourClientId(tour));
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

export function applyClientFavicon(tour: Tour): void {
  getFaviconLink().href = resolveClientFavicon(tour);
}

export function resetClientFavicon(): void {
  getFaviconLink().href = DEFAULT_FAVICON;
}
