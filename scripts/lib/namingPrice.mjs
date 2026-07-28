/** Parse display/storage prices such as "$75,000" or "75000" into a numeric amount. */
export function parseNamingPrice(price) {
  if (price == null || price === '') return null;
  if (typeof price === 'number') {
    return Number.isFinite(price) ? Math.round(price) : null;
  }

  const trimmed = String(price).trim();
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
