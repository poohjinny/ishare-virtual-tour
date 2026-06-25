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

export type DevHotspotTab = 'nav' | 'naming' | 'info';

export const DEV_INFO_DISPLAY_OPTIONS: {
  value: 'modal' | 'anchored';
  label: string;
}[] = [
  { value: 'anchored', label: 'Anchored panel on panorama' },
  { value: 'modal', label: 'Modal overlay' },
];

export const DEV_HOTSPOT_TABS: { id: DevHotspotTab; label: string }[] = [
  { id: 'nav', label: 'Nav' },
  { id: 'naming', label: 'NO' },
  { id: 'info', label: 'Info' },
];
