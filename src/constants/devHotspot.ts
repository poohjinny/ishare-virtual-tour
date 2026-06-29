import {
  NAMING_OPPORTUNITY_STATUS_ORDER,
  namingOpportunityStatusConfig,
} from '../data/namingOpportunityStatus';
import type { NamingOpportunityStatus } from '../types/tour';

export const DEV_NAMING_STATUS_OPTIONS: {
  value: NamingOpportunityStatus;
  label: string;
}[] = NAMING_OPPORTUNITY_STATUS_ORDER.map((value) => ({
  value,
  label: namingOpportunityStatusConfig(value).label,
}));

export type DevHotspotTab = 'nav' | 'naming' | 'info';

export const DEV_INFO_DISPLAY_OPTIONS: {
  value: 'modal' | 'anchored';
  label: string;
}[] = [
  { value: 'anchored', label: 'Anchored panel on panorama' },
  { value: 'modal', label: 'Modal overlay' },
];

export const DEV_HOTSPOT_TABS: { id: DevHotspotTab; label: string }[] = [
  { id: 'nav', label: 'Navigation' },
  { id: 'naming', label: 'Naming opportunity' },
  { id: 'info', label: 'Info' },
];
