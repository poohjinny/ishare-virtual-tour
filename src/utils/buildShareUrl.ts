import { loadTour, tryLoadTour } from '../data/loadTour';
import {
  namingOpportunityStatusDisplayLabel,
  namingOpportunityStatusShowsBadge,
} from '../data/namingOpportunityStatus';
import type { NamingOpportunityStatus } from '../types/tour';
import {
  NAMING_OPPORTUNITY_SEARCH_KEY,
  buildTourLocation,
  toNamingOpportunitySearchValue,
} from './tourPaths';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';
import { buildOgShareCopy } from './ogShareCopy.mjs';
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
      notFoundTest: null,
      loadErrorTest: null,
      intro: null,
      disableNavPreview: null,
      skipLanding: null,
      splashHold: null,
      firstVisitHint: null,
      askGuide: null,
      guideMock: null,
      guideUiTest: null,
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
      notFoundTest: null,
      loadErrorTest: null,
      intro: null,
      disableNavPreview: null,
      skipLanding: null,
      splashHold: null,
      firstVisitHint: null,
      askGuide: null,
      guideMock: null,
      guideUiTest: null,
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
  const tour = tryLoadTour(options.tourId);
  const src = buildAbsoluteEmbedUrl(options);
  const title = escapeHtmlAttribute(
    options.title ?? (tour ? getTourProductFullName(tour) : options.tourId),
  );

  return `<iframe
  src="${src}"
  title="${title}"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0;"
></iframe>`;
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
  /**
   * Authored / catalog blurb only (no share intro). Used for OS share and
   * chat intents so we can structure name / status / price separately.
   */
  detailText?: string | null;
  /** Facility name — used for richer email compose. */
  tourTitle?: string;
  /** Current place title — used for richer email compose. */
  sceneTitle?: string;
  /** Naming opportunity name when sharing an NO. */
  namingOpportunityName?: string | null;
  /** Optional display price when sharing an NO (e.g. `$25K`). */
  priceLabel?: string | null;
  /** Naming status for Share preview badge (same as NO panel). */
  status?: NamingOpportunityStatus | null;
  statusLabel?: string | null;
  statusModifier?: string | null;
}

export interface BuildShareMessageOptions {
  /** Naming opportunity display price. */
  priceLabel?: string | null;
  status?: NamingOpportunityStatus | null;
  statusLabel?: string | null;
  statusModifier?: string | null;
}

/**
 * Share + Open Graph copy. Pass the facility name (`tour.title`), not the
 * client product line (`{Client} Virtual Tour`).
 *
 * Prefer a real {@link description} (catalog summary, scene copy, naming body).
 * Always includes a short invitation line so previews are not title-only.
 */
export function buildShareMessage(
  tourTitle: string,
  sceneTitle: string,
  namingOpportunityName?: string | null,
  description?: string | null,
  options?: BuildShareMessageOptions,
): ShareMessage {
  const authored = description?.trim() || '';
  const naming = namingOpportunityName?.trim() || null;
  const priceLabel = options?.priceLabel?.trim() || '';
  const status = options?.status ?? null;
  const statusLabel = options?.statusLabel?.trim() || null;
  const statusModifier = options?.statusModifier?.trim() || null;

  const copy = buildOgShareCopy({
    tourTitle,
    sceneTitle,
    namingName: naming,
    authored,
    priceLabel,
  });

  if (naming) {
    return {
      title: copy.title,
      text: copy.description,
      detailText: authored || null,
      tourTitle,
      sceneTitle,
      namingOpportunityName: naming,
      priceLabel: priceLabel || null,
      status,
      statusLabel,
      statusModifier,
    };
  }

  return {
    title: copy.title,
    text: copy.description,
    detailText: authored || null,
    tourTitle,
    sceneTitle,
    namingOpportunityName: null,
    priceLabel: null,
    status: null,
    statusLabel: null,
    statusModifier: null,
  };
}

/** Status label for share copy — hides Open (same as UI badges). */
function resolveShareStatusLabel(message: ShareMessage): string | null {
  const statusOrModifier =
    message.status ?? message.statusModifier ?? undefined;
  if (!namingOpportunityStatusShowsBadge(statusOrModifier)) return null;

  const explicit = message.statusLabel?.trim();
  if (explicit) return explicit;
  if (message.status) {
    return namingOpportunityStatusDisplayLabel(message.status);
  }
  return null;
}

/**
 * Conversational body for OS share / chat apps.
 * Reads like a message someone would send — not a metadata dump.
 * URL is passed separately via {@link ShareData.url} (or appended by the caller).
 */
export function buildNativeShareText(message: ShareMessage): string {
  const naming = message.namingOpportunityName?.trim();
  const tour = message.tourTitle?.trim();
  const scene = message.sceneTitle?.trim();
  const price = message.priceLabel?.trim();
  const status = resolveShareStatusLabel(message);
  const detail = message.detailText?.trim() || '';

  const metaParen = (() => {
    const bits = [status, price].filter(Boolean);
    return bits.length ? ` (${bits.join(' · ')})` : '';
  })();

  let lead: string;
  if (naming && tour && scene) {
    lead = `I'd love to share this naming opportunity from the ${tour} virtual tour: ${naming} in ${scene}${metaParen}.`;
  } else if (naming && tour) {
    lead = `I'd love to share this naming opportunity from the ${tour} virtual tour: ${naming}${metaParen}.`;
  } else if (naming) {
    lead = `I'd love to share this naming opportunity: ${naming}${metaParen}.`;
  } else if (scene && tour) {
    lead = `I'd love to share this stop from the ${tour} virtual tour: ${scene}.`;
  } else if (scene) {
    lead = `I'd love to share this stop from a virtual tour: ${scene}.`;
  } else {
    lead = `I'd love to share this from a virtual tour: ${message.title}.`;
  }

  const parts = [lead];
  if (detail) parts.push('', detail);
  parts.push(
    '',
    naming ?
      'Open the link to learn more and look around.'
    : 'Open the link to look around in 360°.',
  );
  return parts.join('\n');
}

/** Web Share API payload — richer than bare OG title/description. */
export function buildNativeShareData(
  shareUrl: string,
  message: ShareMessage,
): ShareData {
  return {
    title: buildShareEmailSubject(message),
    text: buildNativeShareText(message),
    url: shareUrl,
  };
}

/** Email subject — invitation-style, not the compact OG card title. */
export function buildShareEmailSubject(message: ShareMessage): string {
  const tour = message.tourTitle?.trim();
  const scene = message.sceneTitle?.trim();
  const naming = message.namingOpportunityName?.trim();
  const price = message.priceLabel?.trim();
  const status = resolveShareStatusLabel(message);

  if (naming && tour) {
    const meta = [status, price].filter(Boolean).join(', ');
    return meta ?
        `Naming opportunity: ${naming} (${meta}) at ${tour}`
      : `Naming opportunity: ${naming} at ${tour}`;
  }
  if (scene && tour) {
    return `Explore ${scene} in ${tour}`;
  }
  return message.title;
}

/**
 * Email body — short greeting, conversational share copy, then link.
 */
export function buildShareEmailBody(
  shareUrl: string,
  message: ShareMessage,
): string {
  return ['Hi,', '', buildNativeShareText(message), '', shareUrl].join('\n');
}

function encodeMailtoQueryValue(value: string): string {
  // RFC 6068 — use %20 for spaces (URLSearchParams would emit "+").
  return encodeURIComponent(value);
}

export function buildShareMailtoUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const subject = encodeMailtoQueryValue(buildShareEmailSubject(message));
  const body = encodeMailtoQueryValue(buildShareEmailBody(shareUrl, message));
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
    su: buildShareEmailSubject(message),
    body: buildShareEmailBody(shareUrl, message),
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

/**
 * WhatsApp compose: caption then deep link.
 * Desktop/Web often **appends** onto an existing draft — callers should also
 * copy this text and prompt Ctrl+A → Ctrl+V to replace.
 */
export function buildShareWhatsAppUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const params = new URLSearchParams({
    text: buildShareWhatsAppClipboardText(shareUrl, message),
  });
  return `https://wa.me/?${params.toString()}`;
}

/** Caption then URL — clipboard for WhatsApp / LinkedIn paste-assist. */
export function buildShareCaptionClipboardText(
  shareUrl: string,
  message: ShareMessage,
): string {
  return `${buildNativeShareText(message)}\n${shareUrl}`;
}

/** Same body as WhatsApp `text=` — for clipboard replace-over-draft. */
export function buildShareWhatsAppClipboardText(
  shareUrl: string,
  message: ShareMessage,
): string {
  return buildShareCaptionClipboardText(shareUrl, message);
}

export function buildShareFacebookUrl(shareUrl: string): string {
  const params = new URLSearchParams({ u: shareUrl });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function buildShareXUrl(
  shareUrl: string,
  message: ShareMessage,
): string {
  const params = new URLSearchParams({
    text: buildNativeShareText(message),
    url: shareUrl,
  });
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
