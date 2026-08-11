import { NAMING_OPPORTUNITY_SEARCH_KEY } from './tourPaths';

const ENSURE_WAIT_MS = 1800;

export interface EnsureShareOgImageIds {
  tourId: string;
  sceneId: string;
  no?: string;
}

/**
 * Parse a share URL into ids for POST /og/ensure.
 * Supports `/t_…/s_…` and optional `?no=`.
 */
export function parseShareUrlForOgEnsure(
  shareUrl: string,
): EnsureShareOgImageIds | null {
  try {
    const url = new URL(shareUrl, window.location.origin);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const tourId = parts[0];
    const sceneId = parts[1];
    if (!/^t_[a-z0-9]+$/i.test(tourId) && !/^[a-z0-9-]+$/i.test(tourId)) {
      return null;
    }
    if (!/^s_[a-z0-9]+$/i.test(sceneId) && !/^[a-z0-9-]+$/i.test(sceneId)) {
      return null;
    }
    const no =
      url.searchParams.get(NAMING_OPPORTUNITY_SEARCH_KEY)?.trim() || undefined;
    return { tourId, sceneId, ...(no ? { no } : {}) };
  } catch {
    return null;
  }
}

/**
 * Warm R2 OG JPEG for a share URL.
 * Does **not** abort the request — proceeding after a short wait leaves the
 * fetch running so bake can finish (abort used to cancel the Worker mid-put).
 */
export async function ensureShareOgImage(shareUrl: string): Promise<void> {
  const ids = parseShareUrlForOgEnsure(shareUrl);
  if (!ids) return;

  const request = fetch('/og/ensure', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(ids),
    credentials: 'same-origin',
    keepalive: true,
  }).catch(() => null);

  await Promise.race([
    request,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ENSURE_WAIT_MS);
    }),
  ]);
}
