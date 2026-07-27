/**
 * @param {unknown} url
 * @returns {string | null}
 */
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

export const NAMING_DONOR_KINDS = new Set(['person', 'organization']);

/**
 * Normalize donor for tour JSON. Returns null when missing/invalid, or when
 * status is not sold.
 *
 * @param {unknown} donor
 * @param {{ status?: string | null }} [options]
 * @returns {{
 *   name: string,
 *   kind: string,
 *   affiliation?: string,
 *   website?: string,
 *   logo?: string,
 * } | null}
 */
export function normalizeNamingDonor(donor, options = {}) {
  const status =
    typeof options.status === 'string' ? options.status.trim() : options.status;
  if (status && status !== 'sold') return null;

  if (!donor || typeof donor !== 'object') return null;

  const name = typeof donor.name === 'string' ? donor.name.trim() : '';
  if (!name) return null;

  const kindRaw =
    typeof donor.kind === 'string' && donor.kind.trim() ?
      donor.kind.trim()
    : 'organization';
  if (!NAMING_DONOR_KINDS.has(kindRaw)) {
    throw new Error(`Invalid naming donor kind: ${kindRaw}`);
  }

  /** @type {{ name: string, kind: string, affiliation?: string, website?: string, logo?: string }} */
  const next = { name, kind: kindRaw };

  if (kindRaw === 'organization') {
    const website = sanitizeDonorWebsite(donor.website);
    const logo = typeof donor.logo === 'string' ? donor.logo.trim() : '';
    if (website) next.website = website;
    if (logo) next.logo = logo;
    return next;
  }

  const affiliation =
    typeof donor.affiliation === 'string' ? donor.affiliation.trim() : '';
  if (affiliation) {
    next.affiliation = affiliation;
    const website = sanitizeDonorWebsite(donor.website);
    const logo = typeof donor.logo === 'string' ? donor.logo.trim() : '';
    if (website) next.website = website;
    if (logo) next.logo = logo;
  }

  return next;
}

/**
 * Logo applies to organizations, or to persons that have an affiliation.
 *
 * @param {{ kind?: string, affiliation?: string } | null | undefined} donor
 * @returns {boolean}
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
