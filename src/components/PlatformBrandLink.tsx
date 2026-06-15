import {
  PLATFORM_BRAND_LINK_CLASS,
  getPlatformBrand,
  platformBrandAriaLabel,
  type PlatformBrandId,
} from '../data/platformBrands';
import './PlatformBrandLink.css';

type PlatformBrandLinkProps = {
  brandId: PlatformBrandId;
  link?: boolean;
  legalSuffix?: boolean;
  regClassName?: string;
  className?: string;
};

export function PlatformBrandLink({
  brandId,
  link = true,
  legalSuffix = false,
  regClassName = 'tour-glass-panel__reg',
  className,
}: PlatformBrandLinkProps) {
  const brand = getPlatformBrand(brandId);
  const nameContent = (
    <>
      {brand.name}
      {'mark' in brand && brand.mark && (
        <sup className={regClassName} aria-hidden='true'>
          {brand.mark}
        </sup>
      )}
    </>
  );

  if (!link) {
    return (
      <span className={className}>
        {nameContent}
        {legalSuffix && 'legalSuffix' in brand ? brand.legalSuffix : null}
      </span>
    );
  }

  return (
    <>
      <a
        className={[PLATFORM_BRAND_LINK_CLASS, className]
          .filter(Boolean)
          .join(' ')}
        href={brand.url}
        target='_blank'
        rel='noopener noreferrer'
        aria-label={platformBrandAriaLabel(brand)}
      >
        {nameContent}
      </a>
      {legalSuffix && 'legalSuffix' in brand ? brand.legalSuffix : null}
    </>
  );
}
