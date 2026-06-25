/** Parse display/storage prices such as "$75,000" or "75000" into a numeric amount. */
export function parseNamingPrice(price) {
  const cleaned = String(price ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Persist numeric amounts only (no currency symbols or grouping). */
export function normalizeNamingPriceStorage(price) {
  const trimmed = String(price ?? '').trim();
  if (!trimmed) return trimmed;

  const amount = parseNamingPrice(trimmed);
  if (amount == null) return trimmed;

  return String(Math.round(amount));
}
