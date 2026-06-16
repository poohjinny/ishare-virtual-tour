import { PlatformBrandLink } from './PlatformBrandLink';
import './TourHelpFooter.css';

export function TourHelpFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className='tour-glass-panel__footer tour-help-footer'>
      <p className='tour-help-footer__copyright'>
        © {year} <PlatformBrandLink brandId='fundingMatters' legalSuffix />. All
        rights reserved.
      </p>
    </footer>
  );
}
