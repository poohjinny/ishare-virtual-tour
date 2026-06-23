import { cn } from '../lib/cn';
import {
  getPlatformBrand,
  platformBrandAriaLabel,
  type PlatformBrandId,
} from '../data/platformBrands';

/** Tailwind classes for React — HTML markers use PLATFORM_BRAND_LINK_CLASS in components-layer.css */
export const platformBrandLinkClassName = cn(
  'font-[inherit] text-inherit underline decoration-current/35 underline-offset-[0.14em] transition-[color,text-decoration-color] duration-150',
  'hover:text-primary hover:decoration-primary/55 focus-visible:text-primary focus-visible:decoration-primary/55 focus-visible:outline-none',
);

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

  const suffix =
    legalSuffix && 'legalSuffix' in brand ? brand.legalSuffix : null;

  if (!link) {
    return (
      <span className={className}>
        {nameContent}
        {suffix}
      </span>
    );
  }

  return (
    <a
      className={cn(platformBrandLinkClassName, className)}
      href={brand.url}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={platformBrandAriaLabel(brand)}
    >
      {nameContent}
      {suffix}
    </a>
  );
}
