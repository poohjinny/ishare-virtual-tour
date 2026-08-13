import type { TourDirectoryNamingItem } from './tourDirectory';
import { formatOgPriceAbbrev } from './ogShareCopy.mjs';

/** Parse dev input or legacy JSON strings into a rounded numeric amount. */
export function parseNamingPriceInput(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : null;
  }

  const trimmed = String(value).trim();
  // Allow authoring shorthand: "15M", "$1.5m", "525K".
  const abbrev = trimmed.match(/^\$?\s*([\d.,]+)\s*([MmKk])\s*$/);
  if (abbrev) {
    const amount = Number.parseFloat(abbrev[1].replace(/,/g, ''));
    if (!Number.isFinite(amount)) return null;
    const mult = abbrev[2].toLowerCase() === 'm' ? 1_000_000 : 1_000;
    return Math.round(amount * mult);
  }

  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/** Persist a rounded numeric amount — throws when missing or invalid. */
export function normalizeNamingPriceStorage(
  value: string | number | null | undefined,
): number {
  const amount = parseNamingPriceInput(value);
  if (amount == null) {
    throw new Error('Price is required');
  }
  return amount;
}

/** Return the price as-is if finite, otherwise null. */
export function parseNamingPrice(price: number): number | null {
  return Number.isFinite(price) ? Math.round(price) : null;
}

export function formatNamingPriceAmount(amount: number): string {
  return `$${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

/** Format stored price for UI — numeric → currency display. */
export function formatNamingPriceDisplay(price: number): string {
  return Number.isFinite(price) ? formatNamingPriceAmount(price) : '';
}

/** Abbreviated currency for sector totals — e.g. $10.5M, $525K. */
export function formatNamingPriceAbbrev(amount: number): string {
  return formatOgPriceAbbrev(amount);
}

/** Per-item display — honors optional priceLabel override from tour JSON. */
export function formatNamingItemDisplayPrice(item: {
  price: number;
  priceLabel?: string;
}): string {
  if (item.priceLabel?.trim()) return item.priceLabel.trim();
  return formatNamingPriceDisplay(item.price);
}

/** Gallery card trailing price — abbreviated unless a custom label is set. */
export function formatNamingGalleryItemPrice(item: {
  price: number;
  priceAmount?: number | null;
  priceLabel?: string;
}): string {
  if (item.priceLabel?.trim()) return item.priceLabel.trim();
  return formatOgPriceAbbrev(item.priceAmount ?? item.price);
}

/** Explore directory — sector group header totals (e.g. `$1.3M total`). */
export const SHOW_SECTOR_NAMING_TOTAL = true;

/**
 * Nav destination preview — hero count-up + Naming Opportunities accordion totals.
 * Kept off for now; Explore list totals use {@link SHOW_SECTOR_NAMING_TOTAL}.
 */
export const SHOW_NAV_PREVIEW_NAMING_TOTAL = false;

/**
 * Sector group header total — matches Explore item price form for the active
 * layout (gallery → abbreviated, list → full currency).
 */
export function formatNamingSectorGroupTotalLabel(
  total: number,
  layout: 'gallery' | 'list' = 'gallery',
): string {
  const price =
    layout === 'list' ?
      formatNamingPriceDisplay(total)
    : formatNamingPriceAbbrev(total);
  return price ? `${price} total` : '';
}

/** Plain string for dev panel inputs — accepts numeric JSON or text. */
export function formatNamingPriceInput(
  price: number | string | undefined | null,
): string {
  const amount = parseNamingPriceInput(price);
  return amount == null ? '' : String(amount);
}

export interface NamingPriceBounds {
  min: number;
  max: number;
  step: number;
}

export function computeNamingPriceBounds(
  items: Pick<TourDirectoryNamingItem, 'priceAmount'>[],
): NamingPriceBounds | null {
  const amounts = items
    .map((item) => item.priceAmount)
    .filter((amount): amount is number => amount != null);

  if (amounts.length < 2) return null;

  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  if (min >= max) return null;

  return { min, max, step: namingPriceStep(min, max) };
}

function namingPriceStep(min: number, max: number): number {
  const range = max - min;
  if (range <= 10_000) return 1_000;
  if (range <= 100_000) return 5_000;
  if (range <= 1_000_000) return 25_000;
  return 100_000;
}

export function filterTourNamingByPriceRange(
  items: TourDirectoryNamingItem[],
  min: number,
  max: number,
): TourDirectoryNamingItem[] {
  return items.filter((item) => {
    if (item.priceAmount == null) return true;
    return item.priceAmount >= min && item.priceAmount <= max;
  });
}

export function isNamingPriceFilterActive(
  bounds: NamingPriceBounds,
  min: number,
  max: number,
): boolean {
  return min > bounds.min || max < bounds.max;
}
