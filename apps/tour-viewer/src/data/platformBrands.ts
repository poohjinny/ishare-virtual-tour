/** FUNDING matters® entity brands — import when a name or URL is needed in the tour app. */

export const FUNDING_MATTERS = {
  id: 'fundingMatters',
  kind: 'company',
  name: 'FUNDING matters',
  mark: '®',
  legalSuffix: ' Inc.',
  url: 'https://fundingmatters.com',
  description: 'one of the largest and most successful philanthropic advisory firms with a strong track record of client success.',
} as const;

export const FUNDING_MATTERS_AI_SUITE = {
  id: 'fundingMattersAiSuite',
  kind: 'suite',
  name: 'FUNDING matters AI SUITE',
  url: 'https://fundingmatters.ai',
  description: 'Umbrella marketing name for FUNDING matters AI products',
} as const;

export const GIFTABULATOR = {
  id: 'giftabulator',
  kind: 'product',
  name: 'GIFTABULATOR',
  mark: '®',
  url: 'https://giftabulator.com',
  description: 'Online calculator for tax-efficient charitable giving',
} as const;

export const ISHARE = {
  id: 'ishare',
  kind: 'platform',
  name: 'iShare',
  mark: '®',
  url: 'https://ishare.ca',
  description: 'a platform for creating and sharing virtual tours of real estate properties.',
} as const;

export const PLATFORM_BRANDS = {
  fundingMatters: FUNDING_MATTERS,
  fundingMattersAiSuite: FUNDING_MATTERS_AI_SUITE,
  giftabulator: GIFTABULATOR,
  ishare: ISHARE,
} as const;

export type PlatformBrandId = keyof typeof PLATFORM_BRANDS;
export type PlatformBrand = (typeof PLATFORM_BRANDS)[PlatformBrandId];

export const PLATFORM_BRAND_LINK_CLASS = 'platform-brand-link';

export function getPlatformBrand(id: PlatformBrandId): PlatformBrand {
  return PLATFORM_BRANDS[id];
}

export function platformBrandMarkedName(
  brand: PlatformBrand,
  options?: { legalSuffix?: boolean },
): string {
  const marked = `${brand.name}${'mark' in brand && brand.mark ? brand.mark : ''}`;

  if (options?.legalSuffix && 'legalSuffix' in brand && brand.legalSuffix) {
    return `${marked}${brand.legalSuffix}`;
  }

  return marked;
}

export function platformBrandAriaLabel(brand: PlatformBrand): string {
  return `${platformBrandMarkedName(brand, { legalSuffix: true })} — ${brand.description}`;
}
