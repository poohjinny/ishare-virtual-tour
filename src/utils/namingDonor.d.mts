import type { NamingDonor, NamingDonorKind } from '../types/tour';

export const NAMING_DONOR_CREDIT_PREFIX: 'Named by';

export const NAMING_DONOR_KINDS: readonly ['organization', 'person'];

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

/** True for canonical `sold` and legacy `closed`. */
export function isSoldNamingStatus(status?: string | null): boolean;

export function sanitizeDonorWebsite(url?: string | null): string | null;

export function namingDonorAllowsLogo(
  donor?: { kind?: string | null; affiliation?: string | null } | null,
): boolean;

/**
 * Normalize donor for storage. Returns null when missing/invalid, or when
 * status is present and not sold (legacy `closed` counts as sold).
 */
export function normalizeNamingDonor(
  donor?: NamingDonor | null,
  options?: { status?: string | null },
): NamingDonor | null;

/** “Named by {name}” or “Named by {name}, {affiliation}” — null when name is empty. */
export function formatNamingDonorCredit(
  donor?: NamingDonor | null,
): string | null;

/**
 * Credit + optional org / affiliation media for sold opportunities only.
 */
export function resolveNamingDonorPresentation(
  naming?: { status?: string | null; donor?: NamingDonor | null } | null,
): NamingDonorPresentation | null;

/**
 * Credit line for sold opportunities only.
 * Open / reserved / soon never show a donor credit even if JSON has one.
 */
export function resolveNamingDonorCredit(
  naming?: { status?: string | null; donor?: NamingDonor | null } | null,
): string | null;
