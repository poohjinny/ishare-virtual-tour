import { ISHARE_PRODUCT_LOGO } from '../constants/branding';
import './TourLoadSplash.css';

interface TourLoadSplashProps {
  exiting?: boolean;
}

/** Centered iShare logo — first panorama load only. */
export function TourLoadSplash({ exiting = false }: TourLoadSplashProps) {
  return (
    <div
      className={`tour-load-splash${exiting ? ' tour-load-splash--exit' : ''}`}
      role='status'
      aria-live='polite'
      aria-label='Loading virtual tour'
    >
      <div className='tour-load-splash__card'>
        <img
          className='tour-load-splash__logo'
          src={ISHARE_PRODUCT_LOGO}
          alt='iShare'
          draggable={false}
        />
      </div>
    </div>
  );
}
