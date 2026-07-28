/** Same tiers as scenes / catalog tours — omit / undefined = public. */

/**
 * @param {{ visibility?: string } | null | undefined} record
 * @returns {'public' | 'unlisted' | 'internal'}
 */
export function resolveNamingVisibility(record) {
  const value = record?.visibility;
  if (value === 'unlisted' || value === 'internal') return value;
  return 'public';
}

/**
 * @param {{ visibility?: string } | null | undefined} record
 */
export function isNamingVisibleInExplore(record) {
  return resolveNamingVisibility(record) === 'public';
}

/**
 * Soft place-lead / overview body inherit — public + unlisted.
 * @param {{ visibility?: string } | null | undefined} record
 */
export function isNamingUsableForPlaceLead(record) {
  return resolveNamingVisibility(record) !== 'internal';
}

/**
 * @param {string | undefined | null} visibility
 * @returns {'public' | 'unlisted' | 'internal' | undefined}
 */
export function assertNamingVisibility(visibility) {
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
