import { findCatalogClient } from '../data/tourCatalog';
import type { Tour, TourBranding } from '../types/tour';
import { getTourClientId } from './tourClientId';

export type BrandingFields = Partial<TourBranding>;

/** Web paths for client-level brand assets (`/assets/{clientId}/brand/…`). */
export function clientBrandLogoPath(clientId: string): string {
  return `/assets/${clientId}/brand/logo.png`;
}

export function clientBrandFaviconPath(clientId: string): string {
  return `/assets/${clientId}/favicon.png`;
}

export function clientBrandFaviconIcoPath(clientId: string): string {
  return `/assets/${clientId}/favicon.ico`;
}

/** Client-root favicon paths — catalog entry first, then conventional png/ico locations. */
export function clientBrandFaviconCandidates(
  clientId: string,
  catalogFavicon?: string | null,
): string[] {
  const paths: string[] = [];
  const catalog = catalogFavicon?.trim();
  if (catalog) paths.push(catalog);
  paths.push(clientBrandFaviconPath(clientId));
  paths.push(clientBrandFaviconIcoPath(clientId));
  return [...new Set(paths)];
}

function mergeBrandingFields(
  clientBranding: BrandingFields | undefined,
  tourBranding: BrandingFields | undefined,
  fallbackLogoAlt: string,
): BrandingFields | undefined {
  if (!clientBranding && !tourBranding) {
    return undefined;
  }

  return {
    logo: tourBranding?.logo ?? clientBranding?.logo,
    logoAlt:
      tourBranding?.logoAlt ?? clientBranding?.logoAlt ?? fallbackLogoAlt,
    primaryColor: tourBranding?.primaryColor ?? clientBranding?.primaryColor,
    fontFamily: tourBranding?.fontFamily ?? clientBranding?.fontFamily,
    fontSourceUrl: tourBranding?.fontSourceUrl ?? clientBranding?.fontSourceUrl,
    favicon: tourBranding?.favicon ?? clientBranding?.favicon,
  };
}

/**
 * Resolved branding for a tour — catalog client defaults with optional tour override.
 */
export function resolveTourBranding(tour: Tour): BrandingFields | undefined {
  const clientId = getTourClientId(tour);
  const catalogClient = findCatalogClient(clientId);
  const fallbackLogoAlt = catalogClient?.name ?? tour.title;

  return mergeBrandingFields(
    catalogClient?.branding,
    tour.branding,
    fallbackLogoAlt,
  );
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
