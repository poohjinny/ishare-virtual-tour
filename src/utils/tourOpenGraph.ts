import { ISHARE_VIRTUAL_TOUR_NAME } from '../constants/branding';
import { resolveTourPublicOrigin } from '../constants/tourOrigin';
import type { Tour } from '../types/tour';
import { withBaseUrl } from './assetUrl';
import { buildAbsoluteShareUrl, buildShareMessage } from './buildShareUrl';
import { findHotspotInTour } from './findTourHotspot';
import {
  resolveHotspotHostScene,
  resolveNamingPopup,
} from './namingSceneInherit';

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

  const found = findHotspotInTour(tour, namingHotspotId);
  if (!found?.hotspot.popup?.namingOpportunity) return null;
  if (found.sceneId && found.sceneId !== sceneId) return null;

  const hostScene = resolveHotspotHostScene(
    tour,
    found.hotspot,
    tour.scenes[sceneId],
  );
  const popup = resolveNamingPopup(found.hotspot.popup, hostScene);
  return popup.namingOpportunity?.name?.trim() || popup.title?.trim() || null;
}

function resolveSceneShareImagePath(
  tour: Tour,
  sceneId: string,
  logoPath?: string | null,
): string | undefined {
  const thumbnail = tour.scenes[sceneId]?.thumbnail?.trim();
  if (thumbnail) return thumbnail;

  if (logoPath?.trim()) return logoPath;

  return undefined;
}

/** Relative asset URL for in-app share preview thumbnails. */
export function resolveSceneShareImageUrl(
  tour: Tour,
  sceneId: string,
  logoPath?: string | null,
): string | undefined {
  const path = resolveSceneShareImagePath(tour, sceneId, logoPath);
  return path ? withBaseUrl(path) : undefined;
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
  const imagePath = resolveSceneShareImagePath(tour, sceneId, logoPath);

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
