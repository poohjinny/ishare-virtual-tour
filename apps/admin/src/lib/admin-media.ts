import { buildViewerAssetUrl } from '@/lib/viewer-url';

/** Shared viewer-hosted media path helpers (see assets/README.md). */

export const SCENE_THUMB_DIR = 'scene-thumbs';
export const BRAND_LOGO_FILE = 'brand/logo.png';

export function resolveTourMediaUrl(
  value: string,
  clientId: string,
  tourId: string,
) {
  if (/^https?:\/\//i.test(value)) return value;
  const relative = value.replace(/^\/+/, '');
  if (relative.startsWith('assets/')) return buildViewerAssetUrl(relative);
  return buildViewerAssetUrl(`assets/${clientId}/${tourId}/${relative}`);
}

export function clientLogoUrl(clientId: string) {
  return buildViewerAssetUrl(`assets/${clientId}/${BRAND_LOGO_FILE}`);
}

export function tourLogoUrl(clientId: string, tourId: string) {
  return buildViewerAssetUrl(`assets/${clientId}/${tourId}/${BRAND_LOGO_FILE}`);
}

/**
 * Favicons are conventional `favicon.png` or `favicon.ico` (see viewer
 * `tourAssetResolve`), so callers try the png first and fall back to the ico.
 */
export function clientFaviconUrls(clientId: string) {
  return {
    png: buildViewerAssetUrl(`assets/${clientId}/favicon.png`),
    ico: buildViewerAssetUrl(`assets/${clientId}/favicon.ico`),
  };
}

export function tourFaviconUrls(clientId: string, tourId: string) {
  return {
    png: buildViewerAssetUrl(`assets/${clientId}/${tourId}/favicon.png`),
    ico: buildViewerAssetUrl(`assets/${clientId}/${tourId}/favicon.ico`),
  };
}

export function sceneThumbUrl(
  clientId: string,
  tourId: string,
  sceneId: string,
  explicitThumbnail?: string,
) {
  if (explicitThumbnail) {
    return resolveTourMediaUrl(explicitThumbnail, clientId, tourId);
  }
  return buildViewerAssetUrl(
    `assets/${clientId}/${tourId}/${SCENE_THUMB_DIR}/${sceneId}.webp`,
  );
}
