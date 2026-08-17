/**
 * Naming donor normalize + credit. SPA, Dev panel, and bake scripts share this.
 *
 * Sold check matches `namingOpportunityStatus` aliases: legacy `closed` counts
 * as sold. Invalid kind returns null (do not throw — public display must not
 * crash on bad JSON).
 */

export const NAMING_DONOR_CREDIT_PREFIX = 'Named by';

export const NAMING_DONOR_KINDS = ['organization', 'person'];

/** Legacy `closed` was the canonical key before brochure-aligned `sold`. */
const SOLD_STATUS_KEYS = new Set(['sold', 'closed']);

export function isSoldNamingStatus(status) {
  const raw = typeof status === 'string' ? status.trim() : '';
  if (!raw) return false;
  return SOLD_STATUS_KEYS.has(raw);
}

export function sanitizeDonorWebsite(url) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Logo applies to organizations, or to persons that have an affiliation.
 */
export function namingDonorAllowsLogo(donor) {
  if (!donor || typeof donor !== 'object') return false;
  if (donor.kind === 'person') {
    return Boolean(
      typeof donor.affiliation === 'string' && donor.affiliation.trim(),
    );
  }
  return true;
}

/**
 * Normalize donor for storage / display. Returns null when missing/invalid,
 * or when status is present and not sold (including legacy `closed`).
 */
export function normalizeNamingDonor(donor, options = {}) {
  if (options.status != null && !isSoldNamingStatus(options.status)) {
    return null;
  }

  if (!donor || typeof donor !== 'object') return null;

  const name = typeof donor.name === 'string' ? donor.name.trim() : '';
  if (!name) return null;

  const kindRaw =
    typeof donor.kind === 'string' && donor.kind.trim() ?
      donor.kind.trim()
    : 'organization';
  if (!NAMING_DONOR_KINDS.includes(kindRaw)) {
    return null;
  }

  const next = { name, kind: kindRaw };
  const logo =
    donor.logo === true ? true
    : typeof donor.logo === 'string' ? donor.logo.trim() || null
    : null;

  if (kindRaw === 'organization') {
    const website = sanitizeDonorWebsite(donor.website);
    if (website) next.website = website;
    if (logo) next.logo = logo;
    return next;
  }

  const affiliation =
    typeof donor.affiliation === 'string' ? donor.affiliation.trim() : '';
  if (affiliation) {
    next.affiliation = affiliation;
    const website = sanitizeDonorWebsite(donor.website);
    if (website) next.website = website;
    if (logo) next.logo = logo;
  }

  return next;
}

/** “Named by {name}” or “Named by {name}, {affiliation}” — null when name is empty. */
export function formatNamingDonorCredit(donor) {
  const name = typeof donor?.name === 'string' ? donor.name.trim() : '';
  if (!name) return null;
  const affiliation =
    donor?.kind === 'person' && typeof donor.affiliation === 'string' ?
      donor.affiliation.trim() || null
    : null;
  if (affiliation) {
    return `${NAMING_DONOR_CREDIT_PREFIX} ${name}, ${affiliation}`;
  }
  return `${NAMING_DONOR_CREDIT_PREFIX} ${name}`;
}

/**
 * Credit + optional org / affiliation media for sold opportunities only.
 */
export function resolveNamingDonorPresentation(naming) {
  if (!naming || typeof naming !== 'object') return null;
  if (!isSoldNamingStatus(naming.status)) return null;

  const donor = normalizeNamingDonor(naming.donor, { status: 'sold' });
  if (!donor) return null;

  const credit = formatNamingDonorCredit(donor);
  if (!credit) return null;

  const affiliation =
    donor.kind === 'person' ? (donor.affiliation ?? null) : null;

  return {
    name: donor.name,
    kind: donor.kind,
    affiliation,
    credit,
    website: donor.website ?? null,
    logo: typeof donor.logo === 'string' ? donor.logo : null,
  };
}

/**
 * Credit line for sold opportunities only.
 * Open / reserved / soon never show a donor credit even if JSON has one.
 */
export function resolveNamingDonorCredit(naming) {
  return resolveNamingDonorPresentation(naming)?.credit ?? null;
}
