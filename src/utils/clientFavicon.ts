import type { Tour } from '../types/tour';
import { appendCacheBust, withBaseUrl } from './assetUrl';
import { getTourClientId } from './tourClientId';
import { tourAssetPath } from './tourAssetPath';
import {
  clientBrandFaviconCandidates,
  resolveTourBranding,
} from './resolveTourBranding';

const DEFAULT_FAVICON = '/favicon.ico';
const FAVICON_SELECTOR = 'link[rel="icon"][data-client-favicon]';

/** Ignore stale async resolves after cleanup / newer apply. */
let faviconApplyToken = 0;

async function faviconPathExists(path: string): Promise<boolean> {
  try {
    const url = withBaseUrl(path);
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) return true;
    // Some hosts reject HEAD; fall back to a lightweight GET.
    if (head.status === 405 || head.status === 501) {
      const get = await fetch(url, { method: 'GET' });
      return get.ok;
    }
    return false;
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

function iconTypeForHref(href: string): string | null {
  const path = href.split(/[?#]/)[0]?.toLowerCase() ?? '';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return null;
}

/**
 * Replace the managed favicon link so browsers actually refresh the tab icon
 * (in-place href updates are often ignored due to favicon caching).
 */
function setFaviconHref(href: string): void {
  document
    .querySelectorAll<HTMLLinkElement>(FAVICON_SELECTOR)
    .forEach((node) => node.remove());

  const link = document.createElement('link');
  link.rel = 'icon';
  link.sizes = 'any';
  link.dataset.clientFavicon = 'true';
  const type = iconTypeForHref(href);
  if (type) link.type = type;
  // Cache-bust so a re-uploaded file at the same path still updates the tab.
  link.href = appendCacheBust(href, href);
  document.head.appendChild(link);
}

export function applyClientFavicon(tour: Tour): () => void {
  const token = ++faviconApplyToken;

  void resolveClientFavicon(tour).then((path) => {
    if (token !== faviconApplyToken) return;
    setFaviconHref(withBaseUrl(path));
  });

  return () => {
    if (token === faviconApplyToken) {
      faviconApplyToken += 1;
    }
  };
}

export function resetClientFavicon(): void {
  faviconApplyToken += 1;
  setFaviconHref(DEFAULT_FAVICON);
}
