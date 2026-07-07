/** Parse display/storage prices such as "$75,000" or "75000" into a numeric amount. */
export function parseNamingPrice(price) {
  const cleaned = String(price ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? Math.round(value) : null;
}

/** Parse dev input or legacy JSON strings into a rounded numeric amount. */
export function parseNamingPriceInput(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : null;
  }
  return parseNamingPrice(value);
}

/** Persist a rounded numeric amount — throws when missing or invalid. */
export function normalizeNamingPriceStorage(value) {
  const amount = parseNamingPriceInput(value);
  if (amount == null) {
    throw new Error('Price is required');
  }
  return amount;
}
