import { TOUR_CONTACT_US_EMAIL } from '../constants/tourContact';
import type { TourOrganization } from '../types/tour';

import { FUNDING_MATTERS, platformBrandMarkedName } from './platformBrands';

/** Platform tour support — shown in Help → Contact below the client organization. */
export const PLATFORM_TOUR_SUPPORT: TourOrganization = {
  name: platformBrandMarkedName(FUNDING_MATTERS, { legalSuffix: true }),
  website: FUNDING_MATTERS.url,
  email: TOUR_CONTACT_US_EMAIL,
  phones: [
    { label: 'Telephone', number: '(416) 249-0788' },
    { label: 'Toll-free', number: '1 (800) 856-1354' },
  ],
  address: '333 Dundas Street E, Toronto, ON M5A 2A2',
};
