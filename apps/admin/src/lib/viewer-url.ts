import { DEBUG_FLAG_TOGGLES } from '@/lib/authoring-copy';

const DEFAULT_VIEWER_URL = 'http://localhost:5173';

export const viewerBaseUrl =
  process.env.NEXT_PUBLIC_TOUR_VIEWER_URL ?? DEFAULT_VIEWER_URL;

export type AdminPreviewFlagKey =
  | 'notFoundTest'
  | 'loadErrorTest'
  | 'disableNavPreview'
  | 'skipLanding'
  | 'splashHold'
  | 'firstVisitHint'
  | 'askGuide'
  | 'askGuideOff'
  | 'guideMock'
  | 'guideUiTest'
  | 'embed';

export type AdminPreviewFlags = Partial<Record<AdminPreviewFlagKey, boolean>>;

export const ADMIN_PREVIEW_FLAG_TOGGLES = DEBUG_FLAG_TOGGLES.map((toggle) => ({
  ...toggle,
}));

export function buildAdminPreviewUrl(
  tourId: string,
  options?: {
    sceneId?: string;
    flags?: AdminPreviewFlags;
    includeDev?: boolean;
  },
) {
  const viewerPath = options?.sceneId ? `${tourId}/${options.sceneId}` : tourId;
  const url = new URL(viewerPath, `${viewerBaseUrl.replace(/\/$/, '')}/`);
  if (options?.includeDev !== false) {
    url.searchParams.set('dev', '1');
  }

  const flags = options?.flags ?? {};
  for (const [key, enabled] of Object.entries(flags)) {
    if (!enabled) continue;
    if (key === 'askGuide') {
      url.searchParams.set('askGuide', '1');
      continue;
    }
    if (key === 'askGuideOff') {
      url.searchParams.set('askGuide', '0');
      continue;
    }
    url.searchParams.set(key, '1');
  }

  return url.toString();
}

export function buildProductionEmbedUrl(tourId: string, sceneId?: string) {
  return buildAdminPreviewUrl(tourId, {
    sceneId,
    includeDev: false,
    flags: { embed: true },
  });
}

export function buildEmbedIframeHtml(tourId: string, sceneId?: string) {
  const src = buildProductionEmbedUrl(tourId, sceneId);
  return `<iframe src="${src}" title="iShare Virtual Tour" style="width:100%;height:100%;border:0;" allow="fullscreen; xr-spatial-tracking" allowfullscreen></iframe>`;
}

/** Viewer-served media (`/assets/…`) — Admin never bundles tour assets. */
export function buildViewerAssetUrl(assetPath: string) {
  const normalizedPath = assetPath.replace(/^\/+/, '');
  return new URL(
    normalizedPath,
    `${viewerBaseUrl.replace(/\/$/, '')}/`,
  ).toString();
}

export function buildViewerDevApiUrl(path: string) {
  const normalizedPath = path.replace(/^\/+/, '');
  return new URL(
    `__dev/api/${normalizedPath}`,
    `${viewerBaseUrl.replace(/\/$/, '')}/`,
  ).toString();
}
