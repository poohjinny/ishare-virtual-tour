import {
  TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD,
  TOUR_DIRECTORY_SCENE_NAMING_LEAD_MAX_CHARS,
} from '../constants/tourDirectory';
import { stripNamingOpportunitySuffix } from '../data/namingOpportunityStatus';
import type { Scene, Tour } from '../types/tour';
import { listSceneInfoHotspots } from './findTourHotspot';
import { resolveFirstPublicNamingBody } from './firstPublicNamingBody';
import { formatNamingPriceDisplay, parseNamingPrice } from './namingPrice';
import {
  resolveHotspotNamingRecord,
  resolveNamingPopup,
} from './namingSceneInherit';
import { isDefaultNamingDescription } from './namingDescriptionPlaceholder';
import { isNamingUsableForPlaceLead } from './namingVisibility';
import { repairTruncatedInlineMarkdown } from './inlineMarkdown';
import { isDefaultSceneDescription } from './sceneDescriptionPlaceholder';

interface SceneNamingLeadItem {
  name: string;
  price: number;
  body: string;
}

/**
 * Place teaser for Explore / nav preview:
 * 1. Client `description` (ignores auto placeholders)
 * 2. Abbreviated first public NO body (or name · price fallback)
 * 3. General empty-place phrase
 */
export function resolveScenePlaceLead(
  tour: Pick<
    Tour,
    'hotspots' | 'viewerType' | 'title' | 'id' | 'namingOpportunities'
  >,
  scene: Scene,
): string {
  const tourTitle = tour.title?.trim() || tour.id;
  const description = scene.description?.trim();
  if (
    description &&
    !isDefaultSceneDescription(description, tourTitle, scene.title)
  ) {
    return description;
  }

  return (
    buildScenePlaceLeadFromNaming(tour, scene) ||
    TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD
  );
}

export { resolveFirstPublicNamingBody };

function listSceneNamingLeadItems(
  tour: Pick<Tour, 'hotspots' | 'viewerType' | 'title' | 'namingOpportunities'>,
  scene: Scene,
): SceneNamingLeadItem[] {
  const items: SceneNamingLeadItem[] = [];
  const tourTitle = tour.title?.trim();

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    const record = resolveHotspotNamingRecord(tour, hotspot);
    if (!isNamingUsableForPlaceLead(record)) continue;

    const popup = resolveNamingPopup(tour, hotspot, scene);
    const naming = popup?.namingOpportunity;
    if (!naming || !popup) continue;

    const body = popup.body?.trim() ?? '';
    items.push({
      name: stripNamingOpportunitySuffix(naming.name),
      price: naming.price,
      // Empty-state contribute copy is display-only — not a place teaser.
      body:
        body && !isDefaultNamingDescription(body, naming.name, tourTitle) ?
          body
        : '',
    });
  }

  return items;
}

function firstParagraphs(body: string, count = 2): string {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return body.trim();
  return paragraphs.slice(0, count).join(' ');
}

/**
 * Soften NO body for place teaser — first ~2 paragraphs, sentence-complete.
 * Never appends ellipsis (UI may line-clamp).
 */
export function abbreviateNamingBodyLead(
  body: string,
  maxChars = TOUR_DIRECTORY_SCENE_NAMING_LEAD_MAX_CHARS,
): string {
  const text = firstParagraphs(body, 2).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxChars) return text;

  const withinBudget = text.slice(0, maxChars);
  const lastSentenceEnd = lastCompleteSentenceEnd(withinBudget);
  if (lastSentenceEnd > Math.floor(maxChars * 0.4)) {
    return repairTruncatedInlineMarkdown(
      withinBudget.slice(0, lastSentenceEnd).trimEnd(),
    );
  }

  const firstSentenceEnd = lastCompleteSentenceEnd(text);
  if (firstSentenceEnd > 0) {
    return repairTruncatedInlineMarkdown(
      text.slice(0, firstSentenceEnd).trimEnd(),
    );
  }

  const lastSpace = withinBudget.lastIndexOf(' ');
  const clipped =
    lastSpace > Math.floor(maxChars * 0.6) ?
      withinBudget.slice(0, lastSpace)
    : withinBudget;
  return repairTruncatedInlineMarkdown(
    clipped.replace(/[,;:–—-]+$/u, '').trimEnd(),
  );
}

function lastCompleteSentenceEnd(text: string): number {
  const pattern = /[.!?…]["'”’)]*(?=\s|$)/gu;
  let last = -1;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    last = match.index + match[0].length;
  }
  return last;
}

/**
 * Teaser from this scene's naming opportunities (no API).
 * Prefers abbreviated NO body; falls back to name · price summary.
 */
export function buildScenePlaceLeadFromNaming(
  tour: Pick<Tour, 'hotspots' | 'viewerType' | 'title' | 'namingOpportunities'>,
  scene: Scene,
): string | null {
  const namingItems = listSceneNamingLeadItems(tour, scene);
  if (namingItems.length === 0) return null;
  const lead = formatSceneNamingLead(namingItems, scene.title).trim();
  return lead || null;
}

function namingNameMatchesSceneTitle(
  name: string,
  sceneTitle: string | undefined,
): boolean {
  const title = sceneTitle?.trim();
  if (!title || !name) return false;
  return name.localeCompare(title, undefined, { sensitivity: 'accent' }) === 0;
}

function formatSceneNamingLead(
  items: SceneNamingLeadItem[],
  sceneTitle?: string,
): string {
  const withBody = items.find((item) => item.body);
  if (withBody) {
    const abbreviated = abbreviateNamingBodyLead(withBody.body);
    if (abbreviated) return abbreviated;
  }

  if (items.length === 1) {
    const item = items[0]!;
    const price = formatNamingPriceDisplay(item.price);
    const name = item.name.trim();
    if (namingNameMatchesSceneTitle(name, sceneTitle)) {
      return '';
    }
    if (name && price) return `${name} · ${price}`;
    if (name) return name;
    if (price) return `Naming opportunity · ${price}`;
    return '1 naming opportunity in this place.';
  }

  const prices = items
    .map((item) => parseNamingPrice(item.price))
    .filter((price): price is number => price != null);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const countLabel = `${items.length} naming opportunities`;
  if (minPrice != null) {
    return `${countLabel} · from ${formatNamingPriceDisplay(minPrice)}`;
  }
  return `${countLabel} in this place.`;
}
