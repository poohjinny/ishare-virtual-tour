import { PLATFORM_PRODUCT_LOGO } from '../constants/branding';
import './TourLoadSplash.css';

interface TourLoadSplashProps {
  exiting?: boolean;
  logo?: string;
  logoAlt?: string;
  productName?: string;
}

/** Centered client logo — first panorama load only. */
export function TourLoadSplash({
  exiting = false,
  logo,
  logoAlt,
  productName,
}: TourLoadSplashProps) {
  const splashLogo = logo ?? PLATFORM_PRODUCT_LOGO;
  const splashAlt = logoAlt ?? productName ?? 'Virtual Tour';

  return (
    <div
      className={`tour-load-splash${exiting ? ' tour-load-splash--exit' : ''}`}
      role='status'
      aria-live='polite'
      aria-label={`Loading ${productName ?? 'virtual tour'}`}
    >
      <div className='tour-load-splash__card'>
        <img
          className='tour-load-splash__logo'
          src={splashLogo}
          alt={splashAlt}
          draggable={false}
        />
      </div>
    </div>
  );
}
