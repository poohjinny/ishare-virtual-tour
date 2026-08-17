export const OPAQUE_NAMING_ID_PREFIX: string;

export function isOpaqueNamingSearchValue(value?: string | null): boolean;

export function toCanonicalNamingSearchValue(input?: {
  namingId?: string | null;
}): string;

export function namingSearchValueMatches(
  searchValue?: string | null,
  input?: { namingId?: string | null },
): boolean;
