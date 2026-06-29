import { loadTour } from '../data/loadTour';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  buildTourLocation,
  toNamingOpportunitySearchValue,
} from './tourPaths';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';

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
      panoramaErrorTest: null,
      intro: null,
      disableNavPreview: null,
      skipLanding: null,
      splashHold: null,
      firstVisitHint: null,
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
      panoramaErrorTest: null,
      intro: null,
      disableNavPreview: null,
      skipLanding: null,
      splashHold: null,
      firstVisitHint: null,
    },
  );
}

export function buildAbsoluteEmbedUrl(
  options: Omit<BuildShareUrlOptions, 'namingHotspotId'>,
): string {
  return buildAbsoluteTourUrl(buildEmbedPath(options));
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

export function buildShareMailtoUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const params = new URLSearchParams({
    subject: message.title,
    body: `${message.text}\n\n${shareUrl}`,
  });
  return `mailto:?${params.toString()}`;
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
