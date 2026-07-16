import {
  TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD,
  TOUR_DIRECTORY_SCENE_NAMING_LEAD_MAX_CHARS,
} from '../constants/tourDirectory';
import { stripNamingOpportunitySuffix } from '../data/namingOpportunityStatus';
import type { Scene, Tour } from '../types/tour';
import { listSceneInfoHotspots } from './findTourHotspot';
import { formatNamingPriceDisplay, parseNamingPrice } from './namingPrice';
import { resolveNamingPopup } from './namingSceneInherit';

interface SceneNamingLeadItem {
  name: string;
  price: number;
  body: string;
}

/**
 * Soft place copy for Explore / nav preview:
 * 1. Client `description`
 * 2. Baked `placeLead` (generated from NO copy)
 * 3. Abbreviated NO body
 * 4. General empty-place phrase
 */
export function resolveScenePlaceLead(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  scene: Scene,
): string {
  const description = scene.description?.trim();
  if (description) return description;

  const placeLead = scene.placeLead?.trim();
  if (placeLead) return placeLead;

  return (
    buildScenePlaceLeadFromNaming(tour, scene) ||
    TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD
  );
}

function listSceneNamingLeadItems(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  scene: Scene,
): SceneNamingLeadItem[] {
  const items: SceneNamingLeadItem[] = [];

  for (const hotspot of listSceneInfoHotspots(tour, scene)) {
    const rawPopup = hotspot.popup;
    if (!rawPopup?.namingOpportunity) continue;

    const popup = resolveNamingPopup(rawPopup, scene);
    const naming = popup.namingOpportunity;
    if (!naming) continue;

    items.push({
      name: stripNamingOpportunitySuffix(naming.name),
      price: naming.price,
      body: popup.body?.trim() ?? '',
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

/** Soften NO body for place lead — first ~2 paragraphs, word-aware ellipsis. */
export function abbreviateNamingBodyLead(
  body: string,
  maxChars = TOUR_DIRECTORY_SCENE_NAMING_LEAD_MAX_CHARS,
): string {
  const text = firstParagraphs(body, 2).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const clipped =
    lastSpace > Math.floor(maxChars * 0.6) ? slice.slice(0, lastSpace) : slice;
  return `${clipped.replace(/[.,;:!?–—-]+$/u, '').trimEnd()}…`;
}

/**
 * Soft lead text derived from this scene's naming opportunities (no API).
 * Prefers abbreviated NO body; falls back to name · price summary.
 */
export function buildScenePlaceLeadFromNaming(
  tour: Pick<Tour, 'hotspots' | 'viewerType'>,
  scene: Scene,
): string | null {
  const namingItems = listSceneNamingLeadItems(tour, scene);
  if (namingItems.length === 0) return null;
  const lead = formatSceneNamingLead(namingItems).trim();
  return lead || null;
}

function formatSceneNamingLead(items: SceneNamingLeadItem[]): string {
  const withBody = items.find((item) => item.body);
  if (withBody) {
    const abbreviated = abbreviateNamingBodyLead(withBody.body);
    if (abbreviated) return abbreviated;
  }

  if (items.length === 1) {
    const item = items[0]!;
    const price = formatNamingPriceDisplay(item.price);
    const name = item.name.trim();
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
