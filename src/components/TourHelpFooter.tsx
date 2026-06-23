import { PlatformBrandLink } from './PlatformBrandLink';
import {
  tourHelpFooterClassName,
  tourHelpFooterCopyrightClassName,
} from './tourHelpFooterVariants';

export function TourHelpFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={tourHelpFooterClassName}>
      <p className={tourHelpFooterCopyrightClassName}>
        © {year} <PlatformBrandLink brandId='fundingMatters' legalSuffix />. All
        rights reserved.
      </p>
    </footer>
  );
}
