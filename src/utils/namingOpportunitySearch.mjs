/**
 * `?no=` identity shared by the SPA and tour-og Worker.
 * Canonical value is the catalog id (`no_*`) only.
 */

/** Keep in sync with `OPAQUE_NAMING_ID_PREFIX` in `opaqueId.ts`. */
export const OPAQUE_NAMING_ID_PREFIX = 'no_';

export function isOpaqueNamingSearchValue(value) {
  return /^no_[a-z0-9]+$/i.test(String(value || '').trim());
}

/** New share / URL sync value — opaque `no_*` only. */
export function toCanonicalNamingSearchValue({ namingId } = {}) {
  const id = String(namingId || '').trim();
  return isOpaqueNamingSearchValue(id) ? id : '';
}

export function namingSearchValueMatches(searchValue, { namingId } = {}) {
  const trimmed = String(searchValue || '').trim();
  const naming = String(namingId || '').trim();
  return Boolean(
    trimmed &&
    naming &&
    isOpaqueNamingSearchValue(trimmed) &&
    naming.toLowerCase() === trimmed.toLowerCase(),
  );
}
