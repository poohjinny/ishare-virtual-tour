import type { TourDirectoryNamingItem } from './tourDirectory';

/** Parse dev input or legacy JSON strings into a rounded numeric amount. */
export function parseNamingPriceInput(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : null;
  }

  const cleaned = String(value).replace(/[^0-9.]/g, '');
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
