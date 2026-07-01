import type { Tour } from '../types/tour';
import { withBaseUrl } from './assetUrl';
import { getTourClientId } from './tourClientId';
import { tourAssetPath } from './tourAssetPath';
import {
  clientBrandFaviconCandidates,
  resolveTourBranding,
} from './resolveTourBranding';

const DEFAULT_FAVICON = '/favicon.ico';
const FAVICON_SELECTOR = 'link[rel="icon"][data-client-favicon]';

async function faviconPathExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(withBaseUrl(path), { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/** Resolve tab icon URL — explicit favicon, client-root png/ico, logo, then tour default. */
export async function resolveClientFavicon(tour: Tour): Promise<string> {
  const branding = resolveTourBranding(tour);
  if (branding?.favicon) {
    return branding.favicon;
  }

  const clientId = getTourClientId(tour);
  for (const path of clientBrandFaviconCandidates(clientId)) {
    if (await faviconPathExists(path)) {
      return path;
    }
  }

  if (branding?.logo) {
    return branding.logo;
  }

  return tourAssetPath(tour, 'favicon.ico');
}

function getFaviconLink(): HTMLLinkElement {
  const managed = document.querySelector<HTMLLinkElement>(FAVICON_SELECTOR);
  if (managed) {
    return managed;
  }

  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (existing) {
    existing.dataset.clientFavicon = 'true';
    return existing;
  }

  const link = document.createElement('link');
  link.rel = 'icon';
  link.sizes = 'any';
  link.dataset.clientFavicon = 'true';
  document.head.appendChild(link);
  return link;
}

function setFaviconHref(link: HTMLLinkElement, href: string): void {
  link.href = href;
  if (href.endsWith('.png')) {
    link.type = 'image/png';
  } else if (href.endsWith('.ico')) {
    link.type = 'image/x-icon';
  } else {
    link.removeAttribute('type');
  }
}

export function applyClientFavicon(tour: Tour): void {
  void resolveClientFavicon(tour).then((path) => {
    setFaviconHref(getFaviconLink(), withBaseUrl(path));
  });
}

export function resetClientFavicon(): void {
  setFaviconHref(getFaviconLink(), DEFAULT_FAVICON);
}
