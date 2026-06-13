import type { NamingOpportunityStatus } from '../types/tour';

export interface NamingOpportunityStatusConfig {
  label: string;
  /** Hotspot pill label when this is a naming-opportunity hotspot */
  hotspotLabel: string;
  cssModifier: string;
  /** Giftabulator / CTA footer — only shown when available for purchase */
  ctaEnabled: boolean;
}

const STATUS_CONFIG: Record<
  NamingOpportunityStatus,
  NamingOpportunityStatusConfig
> = {
  on_sale: {
    label: 'On sale',
    hotspotLabel: 'Naming opportunity',
    cssModifier: 'on-sale',
    ctaEnabled: true,
  },
  sold: {
    label: 'Sold',
    hotspotLabel: 'Sold',
    cssModifier: 'sold',
    ctaEnabled: false,
  },
  reserved: {
    label: 'Reserved',
    hotspotLabel: 'Reserved',
    cssModifier: 'reserved',
    ctaEnabled: false,
  },
};

export function resolveNamingOpportunityStatus(
  status?: NamingOpportunityStatus,
): NamingOpportunityStatus {
  return status ?? 'on_sale';
}

export function namingOpportunityStatusConfig(
  status?: NamingOpportunityStatus,
): NamingOpportunityStatusConfig {
  return STATUS_CONFIG[resolveNamingOpportunityStatus(status)];
}

export function namingOpportunityCtaEnabled(
  status?: NamingOpportunityStatus,
): boolean {
  return namingOpportunityStatusConfig(status).ctaEnabled;
}

/** Display name without trailing "Naming Opportunity" (JSON stores full legal title). */
export function stripNamingOpportunitySuffix(name: string): string {
  return name.replace(/\s+Naming Opportunity\s*$/i, '').trim();
}
