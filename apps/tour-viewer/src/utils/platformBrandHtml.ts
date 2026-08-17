import {
  PLATFORM_BRAND_LINK_CLASS,
  platformBrandAriaLabel,
  type PlatformBrand,
  type PlatformBrandId,
  getPlatformBrand,
} from '../data/platformBrands';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function platformBrandLinkedNameHtml(
  brandOrId: PlatformBrand | PlatformBrandId,
  options?: {
    regClass?: string;
    linkClass?: string;
    legalSuffix?: boolean;
  },
): string {
  const brand =
    typeof brandOrId === 'string' ? getPlatformBrand(brandOrId) : brandOrId;
  const regClass = options?.regClass ?? '';
  const linkClass = options?.linkClass ?? PLATFORM_BRAND_LINK_CLASS;
  const markHtml =
    'mark' in brand && brand.mark ?
      `<sup class="${regClass}" aria-hidden="true">&reg;</sup>`
    : '';
  const suffixHtml =
    options?.legalSuffix && 'legalSuffix' in brand && brand.legalSuffix ?
      escapeHtml(brand.legalSuffix)
    : '';
  const aria = escapeHtml(platformBrandAriaLabel(brand));

  return `<a class="${linkClass}" href="${escapeHtml(brand.url)}" target="_blank" rel="noopener noreferrer" aria-label="${aria}">${escapeHtml(brand.name)}${markHtml}</a>${suffixHtml}`;
}
