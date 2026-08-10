import { ISHARE_VIRTUAL_TOUR_NAME } from '../constants/branding';
import { TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD } from '../constants/tourDirectory';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';
import { findCatalogTour, findCatalogTourById } from '../data/tourCatalog';
import type { Tour } from '../types/tour';
import { withBaseUrl } from './assetUrl';
import { buildAbsoluteShareUrl, buildShareMessage } from './buildShareUrl';
import { getTourClientId } from './tourClientId';
import { findHotspotInTour } from './findTourHotspot';
import { stripInlineMarkdown } from './inlineMarkdown';
import { isDefaultNamingDescription } from './namingDescriptionPlaceholder';
import {
  isNamingHotspot,
  resolveHotspotHostScene,
  resolveNamingPopup,
} from './namingSceneInherit';
import { resolveScenePlaceLead } from './resolveScenePlaceLead';
import { isDefaultSceneDescription } from './sceneDescriptionPlaceholder';

export interface TourOpenGraphMeta {
  title: string;
  description?: string;
  imageUrl?: string;
  pageUrl?: string;
}

/** Soft cap for share / OG description (messengers truncate around here). */
const SHARE_DESCRIPTION_MAX_CHARS = 220;

const MANAGED_ATTR = 'data-tour-open-graph';

type MetaKind = 'property' | 'name';

function upsertMeta(
  attribute: MetaKind,
  key: string,
  content: string | undefined,
): void {
  const selector =
    attribute === 'property' ?
      `meta[property="${key}"]`
    : `meta[name="${key}"]`;

  const existing = [...document.querySelectorAll<HTMLMetaElement>(selector)];
  const trimmed = content?.trim() ?? '';

  // No value — drop every matching tag so stale index.html / prior-scene
  // content cannot linger for crawlers or DevTools.
  if (!trimmed) {
    existing.forEach((element) => element.remove());
    return;
  }

  const [primary, ...duplicates] = existing;
  duplicates.forEach((element) => element.remove());

  const element = primary ?? document.createElement('meta');
  if (!primary) {
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute(MANAGED_ATTR, 'true');
  element.setAttribute('content', trimmed);
}

function removeManagedMeta(): void {
  document
    .querySelectorAll(`meta[${MANAGED_ATTR}]`)
    .forEach((element) => element.remove());
}

/** Write Open Graph + Twitter Card tags for the active tour view. */
export function applyDocumentOpenGraph(meta: TourOpenGraphMeta): () => void {
  document.title = meta.title;

  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', ISHARE_VIRTUAL_TOUR_NAME);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:image', meta.imageUrl);
  upsertMeta('property', 'og:url', meta.pageUrl);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', meta.imageUrl);

  return removeManagedMeta;
}

export function toAbsoluteTourAssetUrl(path: string): string {
  const normalized = withBaseUrl(path);
  return new URL(normalized, resolveTourPublicOrigin()).href;
}

function resolveNamingOpportunityName(
  tour: Tour,
  sceneId: string,
  namingHotspotId: string | null | undefined,
): string | null {
  if (!namingHotspotId) return null;

  const found = findHotspotInTour(tour, namingHotspotId);
  if (!found?.hotspot || !isNamingHotspot(found.hotspot)) return null;
  if (found.sceneId && found.sceneId !== sceneId) return null;

  const hostScene = resolveHotspotHostScene(
    tour,
    found.hotspot,
    tour.scenes[sceneId],
  );
  const popup = resolveNamingPopup(tour, found.hotspot, hostScene);
  return popup?.namingOpportunity?.name?.trim() || popup?.title?.trim() || null;
}

function resolveNamingShareBody(
  tour: Tour,
  sceneId: string,
  namingHotspotId: string | null | undefined,
): string | null {
  if (!namingHotspotId) return null;

  const found = findHotspotInTour(tour, namingHotspotId);
  if (!found?.hotspot || !isNamingHotspot(found.hotspot)) return null;
  if (found.sceneId && found.sceneId !== sceneId) return null;

  const hostScene = resolveHotspotHostScene(
    tour,
    found.hotspot,
    tour.scenes[sceneId],
  );
  const popup = resolveNamingPopup(tour, found.hotspot, hostScene);
  const body = popup?.body?.trim() || '';
  if (!body) return null;

  const namingName =
    popup?.namingOpportunity?.name?.trim() || popup?.title?.trim() || null;
  if (isDefaultNamingDescription(body, namingName, tour.title)) return null;

  return body;
}

/** Plain, length-capped copy for share cards and OG description. */
export function formatShareDescriptionPlain(
  text: string,
  maxChars = SHARE_DESCRIPTION_MAX_CHARS,
): string {
  const plain = stripInlineMarkdown(text).replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= maxChars) return plain;

  const withinBudget = plain.slice(0, maxChars);
  const lastSentenceEnd = (() => {
    const pattern = /[.!?…]["'”’)]*(?=\s|$)/gu;
    let last = -1;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(withinBudget)) !== null) {
      last = match.index + match[0].length;
    }
    return last;
  })();
  if (lastSentenceEnd > Math.floor(maxChars * 0.4)) {
    return withinBudget.slice(0, lastSentenceEnd).trimEnd();
  }

  const lastSpace = withinBudget.lastIndexOf(' ');
  const clipped =
    lastSpace > Math.floor(maxChars * 0.6) ?
      withinBudget.slice(0, lastSpace)
    : withinBudget;
  return clipped.replace(/[,;:–—-]+$/u, '').trimEnd();
}

/**
 * Prefer the same visitor copy Explore detail shows:
 * naming body (when sharing an NO) → place lead → catalog summary.
 */
export function resolveShareDescription({
  tour,
  sceneId,
  namingHotspotId,
}: {
  tour: Tour;
  sceneId: string;
  namingHotspotId?: string | null;
}): string {
  const namingBody = resolveNamingShareBody(tour, sceneId, namingHotspotId);
  if (namingBody) return formatShareDescriptionPlain(namingBody);

  const scene = tour.scenes[sceneId];
  if (scene) {
    const placeLead = resolveScenePlaceLead(tour, scene).trim();
    if (
      placeLead &&
      placeLead !== TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD &&
      !isDefaultSceneDescription(placeLead, tour.title, scene.title)
    ) {
      return formatShareDescriptionPlain(placeLead);
    }
  }

  const summary =
    findCatalogTour(getTourClientId(tour), tour.id)?.summary?.trim() ||
    findCatalogTourById(tour.id)?.summary?.trim() ||
    '';
  if (summary) return formatShareDescriptionPlain(summary);

  return '';
}

function resolveNamingShareImagePath(
  tour: Tour,
  sceneId: string,
  namingHotspotId: string | null | undefined,
): string | undefined {
  if (!namingHotspotId) return undefined;

  const found = findHotspotInTour(tour, namingHotspotId);
  if (!found?.hotspot || !isNamingHotspot(found.hotspot)) return undefined;
  if (found.sceneId && found.sceneId !== sceneId) return undefined;

  const hostScene = resolveHotspotHostScene(
    tour,
    found.hotspot,
    tour.scenes[sceneId],
  );
  const popup = resolveNamingPopup(tour, found.hotspot, hostScene);
  return popup?.image?.trim() || undefined;
}

/**
 * Share panel + OG image — same priority:
 * naming hero image → scene thumbnail → client logo.
 */
function resolveSceneShareImagePath(
  tour: Tour,
  sceneId: string,
  logoPath?: string | null,
  namingHotspotId?: string | null,
): string | undefined {
  const namingImage = resolveNamingShareImagePath(
    tour,
    sceneId,
    namingHotspotId,
  );
  if (namingImage) return namingImage;

  const thumbnail = tour.scenes[sceneId]?.thumbnail?.trim();
  if (thumbnail) return thumbnail;

  if (logoPath?.trim()) return logoPath;

  return undefined;
}

/** Relative asset URL for in-app share preview thumbnails (matches OG image). */
export function resolveSceneShareImageUrl(
  tour: Tour,
  sceneId: string,
  logoPath?: string | null,
  namingHotspotId?: string | null,
): string | undefined {
  const path = resolveSceneShareImagePath(
    tour,
    sceneId,
    logoPath,
    namingHotspotId,
  );
  return path ? withBaseUrl(path) : undefined;
}

/**
 * Share-preview metadata aligned with {@link buildShareMessage}.
 * `tourTitle` must be the facility name (`tour.title`), not the client product name.
 */
export function resolveTourSceneOpenGraph({
  tour,
  tourTitle,
  sceneId,
  namingHotspotId,
  logoPath,
}: {
  tour: Tour;
  /** Facility / catalog title — e.g. Ken Sargent House. */
  tourTitle: string;
  sceneId: string;
  namingHotspotId?: string | null;
  logoPath?: string | null;
}): TourOpenGraphMeta {
  const sceneTitle = tour.scenes[sceneId]?.title ?? sceneId;
  const namingName = resolveNamingOpportunityName(
    tour,
    sceneId,
    namingHotspotId,
  );
  const description = resolveShareDescription({
    tour,
    sceneId,
    namingHotspotId,
  });
  const message = buildShareMessage(
    tourTitle,
    sceneTitle,
    namingName,
    description,
  );
  const imagePath = resolveSceneShareImagePath(
    tour,
    sceneId,
    logoPath,
    namingHotspotId,
  );

  return {
    title: message.title,
    description: message.text,
    imageUrl: imagePath ? toAbsoluteTourAssetUrl(imagePath) : undefined,
    pageUrl: buildAbsoluteShareUrl({
      tourId: tour.id,
      sceneId,
      firstSceneId: tour.firstScene,
      namingHotspotId,
    }),
  };
}
