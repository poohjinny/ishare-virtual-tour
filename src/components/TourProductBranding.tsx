import {
  ISHARE_VIRTUAL_TOUR_NAME,
  PLATFORM_PRODUCT_BRAND_COLOR,
  PLATFORM_PRODUCT_LOGO,
  PLATFORM_PRODUCT_NAME_PREFIX,
} from '../constants/branding';
import { TOUR_PRODUCT_SUFFIX } from '../utils/tourProductName';
import { TourMarkerIcon } from './icons/TourMarkerIcon';
import './TourProductBranding.css';

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
      className={`tour-product-branding${isPlatform ? ' tour-product-branding--platform' : ' tour-product-branding--client'}${className ? ` ${className}` : ''}`}
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
            className='tour-product-branding__logo'
            src={PLATFORM_PRODUCT_LOGO}
            alt=''
            aria-hidden='true'
            draggable={false}
          />
          <span className='tour-product-branding__text'>
            <span className='tour-product-branding__suffix'>
              {TOUR_PRODUCT_SUFFIX}
            </span>
          </span>
        </>
      : <>
          <TourMarkerIcon className='tour-product-branding__icon' />
          <span className='tour-product-branding__text'>
            <span className='tour-product-branding__client'>
              {displayPrefix}
            </span>{' '}
            <span className='tour-product-branding__suffix'>
              {TOUR_PRODUCT_SUFFIX}
            </span>
          </span>
        </>
      }
      <span className='tour-product-branding__sr-only'>{accessibleLabel}</span>
    </p>
  );
}
