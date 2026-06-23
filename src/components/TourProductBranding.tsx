import {
  ISHARE_VIRTUAL_TOUR_NAME,
  PLATFORM_PRODUCT_BRAND_COLOR,
  PLATFORM_PRODUCT_LOGO,
  PLATFORM_PRODUCT_NAME_PREFIX,
} from '../constants/branding';
import { cn } from '../lib/cn';
import { TOUR_PRODUCT_SUFFIX } from '../utils/tourProductName';
import { TourMarkerIcon } from './icons/TourMarkerIcon';
import {
  tourProductBrandingClientClassName,
  tourProductBrandingIconClassName,
  tourProductBrandingLogoClassName,
  tourProductBrandingSrOnlyClassName,
  tourProductBrandingSuffixClassName,
  tourProductBrandingTextClassName,
  tourProductBrandingVariants,
} from './tourProductBrandingVariants';

export interface TourProductBrandingProps {
  /** Client organization full name — omit for platform-level branding. */
  clientName?: string;
  /** Brand accent — client `primaryColor`, or platform gold when no client. */
  themeColor?: string;
  className?: string;
}

export function TourProductBranding({
  clientName,
  themeColor,
  className = '',
}: TourProductBrandingProps) {
  const trimmedClient = clientName?.trim();
  const isPlatform = !trimmedClient;
  const displayPrefix =
    isPlatform ? PLATFORM_PRODUCT_NAME_PREFIX : trimmedClient;
  const accentColor =
    themeColor ?? (isPlatform ? PLATFORM_PRODUCT_BRAND_COLOR : undefined);
  const accessibleLabel =
    isPlatform ?
      ISHARE_VIRTUAL_TOUR_NAME
    : `${displayPrefix} ${TOUR_PRODUCT_SUFFIX}`;

  return (
    <p
      className={cn(
        tourProductBrandingVariants({
          scope: isPlatform ? 'platform' : 'client',
        }),
        className,
      )}
      style={
        accentColor ?
          ({
            '--tour-product-branding-accent': accentColor,
          } as React.CSSProperties)
        : undefined
      }
    >
      {isPlatform ?
        <>
          <img
            className={tourProductBrandingLogoClassName}
            src={PLATFORM_PRODUCT_LOGO}
            alt=''
            aria-hidden='true'
            draggable={false}
          />
          <span className={tourProductBrandingTextClassName}>
            <span
              className={cn(
                tourProductBrandingSuffixClassName,
                isPlatform && 'font-extrabold',
              )}
            >
              {TOUR_PRODUCT_SUFFIX}
            </span>
          </span>
        </>
      : <>
          <TourMarkerIcon className={tourProductBrandingIconClassName} />
          <span className={tourProductBrandingTextClassName}>
            <span className={tourProductBrandingClientClassName}>
              {displayPrefix}
            </span>{' '}
            <span
              className={cn(
                tourProductBrandingSuffixClassName,
                isPlatform && 'font-extrabold',
              )}
            >
              {TOUR_PRODUCT_SUFFIX}
            </span>
          </span>
        </>
      }
      <span className={tourProductBrandingSrOnlyClassName}>
        {accessibleLabel}
      </span>
    </p>
  );
}
