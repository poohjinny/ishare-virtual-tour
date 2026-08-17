/** Same tiers as catalog tours / scenes / namings — omit / undefined = public. */

export function resolveCatalogVisibility(record) {
  const value = record?.visibility;
  if (value === 'unlisted' || value === 'internal') return value;
  return 'public';
}

export function assertCatalogVisibility(visibility) {
  if (visibility === undefined || visibility === null || visibility === '') {
    return undefined;
  }
  const value = String(visibility).trim();
  if (value === 'public' || value === 'unlisted' || value === 'internal') {
    return value;
  }
  throw new Error(
    `visibility must be public, unlisted, or internal (got ${visibility})`,
  );
}
