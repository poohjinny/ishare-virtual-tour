import { cn } from '../lib/cn';
import { PLATFORM_PRODUCT_LOGO } from '../constants/branding';

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
      className={cn(
        'pointer-events-none absolute inset-0 z-[105] flex items-center justify-center bg-white',
        exiting && 'animate-load-splash-out',
      )}
      role='status'
      aria-live='polite'
      aria-label={`Loading ${productName ?? 'virtual tour'}`}
    >
      <img
        className='block h-14 w-auto'
        src={splashLogo}
        alt={splashAlt}
        draggable={false}
      />
    </div>
  );
}
