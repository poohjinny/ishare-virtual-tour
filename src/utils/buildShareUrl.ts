import { loadTour } from '../data/loadTour';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  buildTourLocation,
  toNamingOpportunitySearchValue,
} from './tourPaths';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';
import { getTourProductFullName } from './tourProductName';

export interface BuildShareUrlOptions {
  tourId: string;
  sceneId: string;
  firstSceneId: string;
  namingHotspotId?: string | null;
}

/** Path + query for the current shareable tour view (no dev / internal flags). */
export function buildSharePath({
  tourId,
  sceneId,
  firstSceneId,
  namingHotspotId,
}: BuildShareUrlOptions): string {
  const tour = loadTour(tourId);
  return buildTourLocation(
    tourId,
    sceneId,
    firstSceneId,
    new URLSearchParams(),
    {
      [NAMING_OPPORTUNITY_SEARCH_KEY]:
        namingHotspotId ?
          toNamingOpportunitySearchValue(tour, namingHotspotId)
        : null,
      embed: null,
      dev: null,
      chatTest: null,
      notFoundTest: null,
      loadErrorTest: null,
      panoramaErrorTest: null,
      intro: null,
      disableNavPreview: null,
      skipLanding: null,
      splashHold: null,
      firstVisitHint: null,
      askGuide: null,
    },
  );
}

export function buildAbsoluteShareUrl(options: BuildShareUrlOptions): string {
  const relative = buildSharePath(options);
  return buildAbsoluteTourUrl(relative);
}

/** Path + query for iframe embed (`?embed=1`, no dev / internal flags). */
export function buildEmbedPath({
  tourId,
  sceneId,
  firstSceneId,
}: Omit<BuildShareUrlOptions, 'namingHotspotId'>): string {
  return buildTourLocation(
    tourId,
    sceneId,
    firstSceneId,
    new URLSearchParams(),
    {
      embed: '1',
      [NAMING_OPPORTUNITY_SEARCH_KEY]: null,
      dev: null,
      chatTest: null,
      notFoundTest: null,
      loadErrorTest: null,
      panoramaErrorTest: null,
      intro: null,
      disableNavPreview: null,
      skipLanding: null,
      splashHold: null,
      firstVisitHint: null,
      askGuide: null,
    },
  );
}

export function buildAbsoluteEmbedUrl(
  options: Omit<BuildShareUrlOptions, 'namingHotspotId'>,
): string {
  return buildAbsoluteTourUrl(buildEmbedPath(options));
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** Ready-to-paste iframe markup for client host pages (see docs/EMBED.md). */
export function buildEmbedIframeHtml(
  options: Omit<BuildShareUrlOptions, 'namingHotspotId'> & { title?: string },
): string {
  const tour = loadTour(options.tourId);
  const src = buildAbsoluteEmbedUrl(options);
  const title = escapeHtmlAttribute(
    options.title ?? getTourProductFullName(tour),
  );

  return `<iframe
  src="${src}"
  title="${title}"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0;"
></iframe>`;
}

export interface BuildEmbedTestPageOptions {
  tourId: string;
  sceneId: string;
  /** Include `dev=1` on the iframe tour URL (default true). */
  dev?: boolean;
}

/** Local parent-page harness — `public/embed-test.html` */
export function buildEmbedTestPageUrl({
  tourId,
  sceneId,
  dev = true,
}: BuildEmbedTestPageOptions): string {
  const base = import.meta.env.BASE_URL;
  const path = `${base}embed-test.html`.replace(/([^:]\/)\/+/g, '$1');
  const url = new URL(path, window.location.origin);
  url.searchParams.set('tour', tourId);
  url.searchParams.set('scene', sceneId);
  if (!dev) url.searchParams.set('dev', '0');
  return url.href;
}

function buildAbsoluteTourUrl(relative: string): string {
  const pathOnly = relative.startsWith('/') ? relative.slice(1) : relative;
  const base = import.meta.env.BASE_URL;
  const urlPath = `${base}${pathOnly}`.replace(/([^:]\/)\/+/g, '$1');
  return new URL(urlPath, resolveTourPublicOrigin()).href;
}

export interface ShareMessage {
  title: string;
  text: string;
}

export function buildShareMessage(
  tourTitle: string,
  sceneTitle: string,
  namingOpportunityName?: string | null,
): ShareMessage {
  if (namingOpportunityName) {
    return {
      title: `${namingOpportunityName} — ${tourTitle}`,
      text: `Explore the ${namingOpportunityName} naming opportunity at ${sceneTitle} in ${tourTitle}.`,
    };
  }

  return {
    title: `${sceneTitle} — ${tourTitle}`,
    text: `Explore ${sceneTitle} in ${tourTitle}.`,
  };
}

function encodeMailtoQueryValue(value: string): string {
  // RFC 6068 — use %20 for spaces (URLSearchParams would emit "+").
  return encodeURIComponent(value);
}

export function buildShareMailtoUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const subject = encodeMailtoQueryValue(message.title);
  const body = encodeMailtoQueryValue(`${message.text}\n\n${shareUrl}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

/** Gmail web compose — reliable in browsers where `mailto:` handlers are blocked. */
export function buildShareGmailComposeUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    su: message.title,
    body: `${message.text}\n\n${shareUrl}`,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Opens https share intents in a new tab (not for `mailto:` — use native navigation). */
export function openShareAppLink(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function buildShareWhatsAppUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const params = new URLSearchParams({ text: `${message.text}\n${shareUrl}` });
  return `https://wa.me/?${params.toString()}`;
}

export function buildShareFacebookUrl(shareUrl: string): string {
  const params = new URLSearchParams({ u: shareUrl });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function buildShareXUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const params = new URLSearchParams({ text: message.text, url: shareUrl });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildShareLinkedInUrl(shareUrl: string): string {
  const params = new URLSearchParams({ url: shareUrl });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/** Hostname shown in the share-panel link preview (e.g. `tour.ishare.ca`). */
export function resolveShareLinkHost(shareUrl: string): string {
  try {
    return new URL(shareUrl).host.replace(/^www\./i, '');
  } catch {
    return '';
  }
}
