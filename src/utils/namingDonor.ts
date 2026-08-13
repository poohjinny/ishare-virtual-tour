import type {
  NamingDonor,
  NamingDonorKind,
  NamingOpportunity,
} from '../types/tour';
import { namingOpportunityStatusConfig } from '../data/namingOpportunityStatus';

export const NAMING_DONOR_CREDIT_PREFIX = 'Named by';

export const NAMING_DONOR_KINDS = ['organization', 'person'] as const;

export type NamingDonorPresentation = {
  name: string;
  kind: NamingDonorKind;
  affiliation: string | null;
  /** Full “Named by …” line for list/aria surfaces. */
  credit: string;
  /**
   * Organization: links `name`.
   * Person: links `affiliation` when both are set.
   */
  website: string | null;
  logo: string | null;
};

/** “Named by {name}” or “Named by {name}, {affiliation}” — null when name is empty. */
export function formatNamingDonorCredit(
  donor: NamingDonor | null | undefined,
): string | null {
  const name = donor?.name?.trim();
  if (!name) return null;
  const affiliation =
    donor?.kind === 'person' ? donor.affiliation?.trim() || null : null;
  if (affiliation) {
    return `${NAMING_DONOR_CREDIT_PREFIX} ${name}, ${affiliation}`;
  }
  return `${NAMING_DONOR_CREDIT_PREFIX} ${name}`;
}

export function sanitizeDonorWebsite(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim();
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
 * Normalize donor for storage. Returns null when missing/invalid, or when
 * status is not sold.
 */
export function normalizeNamingDonor(
  donor: NamingDonor | null | undefined,
  options?: { status?: NamingOpportunity['status'] | string | null },
): NamingDonor | null {
  if (
    options?.status != null &&
    namingOpportunityStatusConfig(options.status as NamingOpportunity['status'])
      .cssModifier !== 'sold'
  ) {
    return null;
  }

  const name = donor?.name?.trim();
  if (!name) return null;

  const kindRaw = donor?.kind?.trim() || 'organization';
  if (!NAMING_DONOR_KINDS.includes(kindRaw as NamingDonorKind)) {
    return null;
  }
  const kind = kindRaw as NamingDonorKind;

  const next: NamingDonor = { name, kind };
  const logo =
    donor?.logo === true ? true
    : typeof donor?.logo === 'string' ? donor.logo.trim() || null
    : null;

  if (kind === 'organization') {
    const website = sanitizeDonorWebsite(donor?.website);
    if (website) next.website = website;
    if (logo) next.logo = logo;
    return next;
  }

  const affiliation = donor?.affiliation?.trim() || null;
  if (affiliation) {
    next.affiliation = affiliation;
    const website = sanitizeDonorWebsite(donor?.website);
    if (website) next.website = website;
    if (logo) next.logo = logo;
  }

  return next;
}

/**
 * Credit + optional org / affiliation media for sold opportunities only.
 */
export function resolveNamingDonorPresentation(
  naming: Pick<NamingOpportunity, 'status' | 'donor'> | null | undefined,
): NamingDonorPresentation | null {
  if (!naming) return null;
  if (namingOpportunityStatusConfig(naming.status).cssModifier !== 'sold') {
    return null;
  }

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
export function resolveNamingDonorCredit(
  naming: Pick<NamingOpportunity, 'status' | 'donor'> | null | undefined,
): string | null {
  return resolveNamingDonorPresentation(naming)?.credit ?? null;
}
