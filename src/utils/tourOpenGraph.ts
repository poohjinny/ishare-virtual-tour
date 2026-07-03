import { ISHARE_VIRTUAL_TOUR_NAME } from '../constants/branding';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';
import type { Tour } from '../types/tour';
import { withBaseUrl } from './assetUrl';
import { buildAbsoluteShareUrl, buildShareMessage } from './buildShareUrl';

export interface TourOpenGraphMeta {
  title: string;
  description?: string;
  imageUrl?: string;
  pageUrl?: string;
}

const MANAGED_ATTR = 'data-tour-open-graph';

type MetaKind = 'property' | 'name';

function upsertMeta(
  attribute: MetaKind,
  key: string,
  content: string | undefined,
): void {
  if (!content) return;

  const selector =
    attribute === 'property' ?
      `meta[property="${key}"][${MANAGED_ATTR}]`
    : `meta[name="${key}"][${MANAGED_ATTR}]`;

  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    element.setAttribute(MANAGED_ATTR, 'true');
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
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

  const hotspot = tour.scenes[sceneId]?.hotspots?.find(
    (entry) => entry.id === namingHotspotId,
  );
  if (!hotspot?.popup?.namingOpportunity) return null;

  return hotspot.popup.namingOpportunity.name ?? hotspot.popup.title ?? null;
}

function resolveSceneShareImageUrl(
  tour: Tour,
  sceneId: string,
  logoPath?: string | null,
): string | undefined {
  const thumbnail = tour.scenes[sceneId]?.thumbnail?.trim();
  if (thumbnail) return toAbsoluteTourAssetUrl(thumbnail);

  if (logoPath?.trim()) return toAbsoluteTourAssetUrl(logoPath);

  return undefined;
}

/** Share-preview metadata aligned with {@link buildShareMessage}. */
export function resolveTourSceneOpenGraph({
  tour,
  tourTitle,
  sceneId,
  namingHotspotId,
  logoPath,
}: {
  tour: Tour;
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
  const message = buildShareMessage(tourTitle, sceneTitle, namingName);

  return {
    title: message.title,
    description: message.text,
    imageUrl: resolveSceneShareImageUrl(tour, sceneId, logoPath),
    pageUrl: buildAbsoluteShareUrl({
      tourId: tour.id,
      sceneId,
      firstSceneId: tour.firstScene,
      namingHotspotId,
    }),
  };
}
