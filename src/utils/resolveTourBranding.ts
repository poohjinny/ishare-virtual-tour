import { findCatalogClient } from '../data/tourCatalog';
import type { Tour, TourBranding } from '../types/tour';
import { isKnownFaviconPath } from './knownFaviconAssets';
import { getTourClientId } from './tourClientId';
import {
  conventionalClientFaviconIcoPath,
  conventionalClientFaviconPngPath,
  conventionalClientLogoPath,
  conventionalTourFaviconIcoPath,
  conventionalTourFaviconPngPath,
  hydrateCatalogClientBranding,
  resolveClientLogoPath,
  resolveTourLogoPath,
} from './tourAssetResolve.mjs';

export type BrandingFields = Omit<Partial<TourBranding>, 'logo'> & {
  logo?: string;
};

export { hydrateCatalogClientBranding, resolveClientLogoPath };

export function clientBrandLogoPath(clientId: string): string {
  return conventionalClientLogoPath(clientId);
}

export function clientBrandFaviconPath(clientId: string): string {
  return conventionalClientFaviconPngPath(clientId);
}

export function clientBrandFaviconIcoPath(clientId: string): string {
  return conventionalClientFaviconIcoPath(clientId);
}

/** Client-root favicon paths — catalog entry first, then existing png/ico. */
export function clientBrandFaviconCandidates(
  clientId: string,
  catalogFavicon?: string | null,
): string[] {
  const paths: string[] = [];
  const catalog = catalogFavicon?.trim();
  if (catalog) paths.push(catalog);
  for (const path of [
    clientBrandFaviconPath(clientId),
    clientBrandFaviconIcoPath(clientId),
  ]) {
    if (isKnownFaviconPath(path)) paths.push(path);
  }
  return [...new Set(paths)];
}

export function tourBrandFaviconCandidates(
  tour: Pick<Tour, 'id' | 'clientId'>,
): string[] {
  return [
    conventionalTourFaviconPngPath(tour),
    conventionalTourFaviconIcoPath(tour),
  ].filter(isKnownFaviconPath);
}

function mergeBrandingFields(
  clientBranding: TourBranding | undefined,
  tourBranding: TourBranding | undefined,
  fallbackLogoAlt: string,
): BrandingFields | undefined {
  if (!clientBranding && !tourBranding) {
    return undefined;
  }

  const favicon =
    typeof tourBranding?.favicon === 'string' ? tourBranding.favicon
    : typeof clientBranding?.favicon === 'string' ? clientBranding.favicon
    : undefined;

  return {
    logoAlt:
      tourBranding?.logoAlt ?? clientBranding?.logoAlt ?? fallbackLogoAlt,
    primaryColor: tourBranding?.primaryColor ?? clientBranding?.primaryColor,
    fontFamily: tourBranding?.fontFamily ?? clientBranding?.fontFamily,
    fontSourceUrl: tourBranding?.fontSourceUrl ?? clientBranding?.fontSourceUrl,
    ...(favicon ? { favicon } : {}),
  };
}

/**
 * Resolved branding for a tour — catalog client defaults with optional tour override.
 * Conventional logo paths are inferred when JSON omits them.
 */
export function resolveTourBranding(tour: Tour): BrandingFields | undefined {
  const clientId = getTourClientId(tour);
  const catalogClient = findCatalogClient(clientId);
  const fallbackLogoAlt = catalogClient?.name ?? tour.title;

  const merged = mergeBrandingFields(
    catalogClient?.branding,
    tour.branding,
    fallbackLogoAlt,
  );

  const tourLogo = resolveTourLogoPath(tour, tour.branding?.logo);
  const clientLogo = resolveClientLogoPath(
    clientId,
    catalogClient?.branding?.logo,
  );
  const logo = tourLogo ?? clientLogo ?? undefined;

  if (!merged && !logo) return undefined;

  return { ...merged, ...(logo ? { logo } : {}) };
}

export function tourUsesCustomBranding(tour: Tour): boolean {
  const branding = tour.branding;
  if (!branding) return false;
  return Boolean(
    branding.logo ||
    branding.favicon ||
    branding.primaryColor ||
    branding.logoAlt ||
    branding.fontFamily ||
    branding.fontSourceUrl,
  );
}
