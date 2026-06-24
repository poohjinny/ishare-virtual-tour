import type { NamingOpportunityStatus } from '../types/tour';

export const DEV_NAMING_STATUS_OPTIONS: {
  value: NamingOpportunityStatus;
  label: string;
}[] = [
  { value: 'coming_soon', label: 'Coming soon' },
  { value: 'on_sale', label: 'On sale' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
];

export const DEV_NAMING_DEFAULT_PRICE = '$75,000';

export const DEV_NAMING_DEFAULT_BODY =
  'First paragraph describing the naming opportunity…';

export type DevHotspotTab = 'nav' | 'naming';

export const DEV_HOTSPOT_TABS: { id: DevHotspotTab; label: string }[] = [
  { id: 'nav', label: 'Nav' },
  { id: 'naming', label: 'NO' },
];
