import { TOUR_CONTACT_US_EMAIL } from '../constants/tourContact';
import type { TourClient } from '../types/tour';

import { ISHARE, platformBrandMarkedName } from './platformBrands';

/** Platform tour support — shown in Help → Contact below the client block. */
export const PLATFORM_TOUR_SUPPORT: TourClient = {
  name: platformBrandMarkedName(ISHARE),
  website: ISHARE.url,
  email: TOUR_CONTACT_US_EMAIL,
  phones: [
    { label: 'Telephone', number: '(416) 249-0788' },
    { label: 'Toll-free', number: '1 (800) 856-1354' },
  ],
  address: '333 Dundas Street E, Toronto, ON M5A 2A2',
};
