export type CatalogVisibility = 'public' | 'unlisted' | 'internal';

export function resolveCatalogVisibility(
  record?: { visibility?: string | null } | null,
): CatalogVisibility;

export function assertCatalogVisibility(
  visibility?: string | null,
): CatalogVisibility | undefined;
