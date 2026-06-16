import type { TourDirectoryNamingItem } from './tourDirectory';

/** Parse display prices such as "$75,000" into a numeric amount. */
export function parseNamingPrice(price: string): number | null {
  const cleaned = price.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function formatNamingPriceAmount(amount: number): string {
  return `$${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)}`;
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
