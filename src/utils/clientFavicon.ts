import type { Tour } from '../types/tour';
import { appendCacheBust, withBaseUrl } from './assetUrl';
import { getTourClientId } from './tourClientId';
import {
  clientBrandFaviconCandidates,
  resolveTourBranding,
  tourBrandFaviconCandidates,
} from './resolveTourBranding';

const DEFAULT_FAVICON = '/favicon.ico';
const FAVICON_SELECTOR = 'link[rel="icon"][data-client-favicon]';

/** Ignore stale async resolves after cleanup / newer apply. */
let faviconApplyToken = 0;

/** Browser decode probe — HEAD/CORS miss valid icons that `<link rel="icon">` can show. */
function faviconPathExists(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(false);
      return;
    }
    const img = new Image();
    const finish = (ok: boolean) => {
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };
    img.onload = () => finish(img.naturalWidth > 0);
    img.onerror = () => finish(false);
    img.src = withBaseUrl(path);
  });
}

/** Resolve tab icon URL — explicit, tour png/ico, client png/ico, logo, then platform default. */
export async function resolveClientFavicon(tour: Tour): Promise<string> {
  const branding = resolveTourBranding(tour);
  const clientId = getTourClientId(tour);
  const seen = new Set<string>();
  const candidates = [
    branding?.favicon?.trim(),
    ...tourBrandFaviconCandidates(tour),
    ...clientBrandFaviconCandidates(clientId),
    branding?.logo,
    DEFAULT_FAVICON,
  ];

  for (const candidate of candidates) {
    const path = candidate?.trim();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    if (await faviconPathExists(path)) return path;
  }

  return DEFAULT_FAVICON;
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
