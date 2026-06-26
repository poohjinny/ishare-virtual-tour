import type {
  NamingOpportunity,
  NamingOpportunityStatus,
  PopupContent,
  PopupCta,
  Tour,
} from '../types/tour';
import {
  TOUR_CONTACT_US_MAILTO,
  buildTourNotifyMeMailto,
} from '../constants/tourContact';
import {
  giftabulatorCtaButtonPlainLabel,
  GIFTABULATOR_PRODUCT,
} from './giftabulatorBrand';
import { getTourWebsite, resolveTourClient } from '../utils/resolveTourClient';
import { buildGiftabulatorGiveNowUrl } from '../utils/giftabulatorGiveNowUrl';
import type { PopupCtaIconKind } from '../utils/popupCtaIcon';

export type NamingOpportunityContactIntent = 'inquiry' | 'simple' | 'notify';

export type NamingOpportunityCtaPreset =
  | 'contact'
  | 'website'
  | 'giftabulator'
  | 'none';

export interface NamingOpportunityStatusCtaConfig {
  preset: NamingOpportunityCtaPreset;
  label: string;
  sublabel?: string;
  ariaLabel?: string;
  variant?: 'primary' | 'secondary';
  /** Footer Material icon — independent of mailto vs website fallback URL. */
  iconKind?: PopupCtaIconKind;
  /** Contact preset routing — defaults to org inquiry mailto. */
  contactIntent?: NamingOpportunityContactIntent;
  /** @deprecated Prefer {@link contactIntent} `'simple'`. */
  mailto?: string;
}

export interface NamingOpportunityStatusConfig {
  label: string;
  /** Compact chip copy — search / narrow lists */
  shortLabel: string;
  /** Hotspot pill label when this is a naming-opportunity hotspot */
  hotspotLabel: string;
  cssModifier: string;
  ctas: NamingOpportunityStatusCtaConfig[];
}

/** Panel / popup type badge — heart + label row */
export const NAMING_OPPORTUNITY_BADGE_LABEL = 'Naming Opportunity';
export const NAMING_OPPORTUNITY_BADGE_SHORT_LABEL = 'NO';

const STATUS_CONFIG: Record<
  NamingOpportunityStatus,
  NamingOpportunityStatusConfig
> = {
  on_sale: {
    label: 'On sale',
    shortLabel: 'Sale',
    hotspotLabel: 'Naming opportunity',
    cssModifier: 'on-sale',
    ctas: [
      {
        preset: 'contact',
        label: 'Express your interest',
        sublabel: 'Contact our team about this naming opportunity',
        ariaLabel: 'Express your interest in this naming opportunity',
        iconKind: 'mail',
        variant: 'primary',
      },
      {
        preset: 'giftabulator',
        label: giftabulatorCtaButtonPlainLabel(),
        ariaLabel: GIFTABULATOR_PRODUCT.ariaLabel,
        iconKind: 'external',
        variant: 'secondary',
      },
    ],
  },
  reserved: {
    label: 'Reserved',
    shortLabel: 'Rsvd',
    hotspotLabel: 'Reserved',
    cssModifier: 'reserved',
    ctas: [
      {
        preset: 'contact',
        label: 'Speak with our team',
        contactIntent: 'simple',
        sublabel:
          'A naming commitment is in progress — reach out with questions',
        ariaLabel: 'Speak with our team about this reserved naming opportunity',
        iconKind: 'mail',
        variant: 'primary',
      },
      {
        preset: 'giftabulator',
        label: giftabulatorCtaButtonPlainLabel(),
        ariaLabel: GIFTABULATOR_PRODUCT.ariaLabel,
        iconKind: 'external',
        variant: 'secondary',
      },
    ],
  },
  coming_soon: {
    label: 'Coming soon',
    shortLabel: 'Soon',
    hotspotLabel: 'Coming soon',
    cssModifier: 'coming-soon',
    ctas: [
      {
        preset: 'contact',
        label: 'Notify me',
        contactIntent: 'notify',
        sublabel: 'Be first to know when this naming opportunity opens',
        ariaLabel: 'Request notification for this naming opportunity',
        iconKind: 'bell',
        variant: 'primary',
      },
      {
        preset: 'giftabulator',
        label: giftabulatorCtaButtonPlainLabel(),
        ariaLabel: GIFTABULATOR_PRODUCT.ariaLabel,
        iconKind: 'external',
        variant: 'secondary',
      },
    ],
  },
  sold: {
    label: 'Sold',
    shortLabel: 'Sold',
    hotspotLabel: 'Sold',
    cssModifier: 'sold',
    ctas: [
      {
        preset: 'website',
        label: 'Support our mission',
        sublabel: 'Thank you to our naming partners',
        ariaLabel: 'Visit our website to support our mission',
        iconKind: 'heart',
        variant: 'primary',
      },
      {
        preset: 'giftabulator',
        label: giftabulatorCtaButtonPlainLabel(),
        ariaLabel: GIFTABULATOR_PRODUCT.ariaLabel,
        iconKind: 'external',
        variant: 'secondary',
      },
    ],
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

export function namingOpportunityStatusDisplayLabel(
  status?: NamingOpportunityStatus,
  compact = false,
): string {
  const config = namingOpportunityStatusConfig(status);
  return compact ? config.shortLabel : config.label;
}

/** @deprecated Use {@link resolvePopupContentCtas} */
export function namingOpportunityCtaEnabled(
  status?: NamingOpportunityStatus,
): boolean {
  return namingOpportunityStatusConfig(status).ctas.some(
    (cta) => cta.preset !== 'none',
  );
}

function buildContactMailto(email: string, naming: NamingOpportunity): string {
  const name = naming.name.trim();
  const params = new URLSearchParams();
  params.set('subject', `Naming opportunity inquiry: ${name}`);
  params.set(
    'body',
    `Hello,\n\nI am interested in learning more about the ${name}.\n\n`,
  );
  return `mailto:${email}?${params.toString()}`;
}

function withStatusCtaIcon(
  cta: PopupCta,
  ctaConfig: NamingOpportunityStatusCtaConfig,
): PopupCta {
  return ctaConfig.iconKind ? { ...cta, iconKind: ctaConfig.iconKind } : cta;
}

function buildCtaFromPreset(
  ctaConfig: NamingOpportunityStatusCtaConfig,
  tour: Tour,
  naming: NamingOpportunity,
): PopupCta | null {
  switch (ctaConfig.preset) {
    case 'none':
      return null;
    case 'contact': {
      if (ctaConfig.mailto || ctaConfig.contactIntent === 'simple') {
        return withStatusCtaIcon(
          {
            label: ctaConfig.label,
            sublabel: ctaConfig.sublabel,
            ariaLabel: ctaConfig.ariaLabel ?? ctaConfig.label,
            url: ctaConfig.mailto ?? TOUR_CONTACT_US_MAILTO,
            variant: ctaConfig.variant ?? 'primary',
          },
          ctaConfig,
        );
      }

      if (ctaConfig.contactIntent === 'notify') {
        return withStatusCtaIcon(
          {
            label: ctaConfig.label,
            sublabel: ctaConfig.sublabel,
            ariaLabel: ctaConfig.ariaLabel ?? ctaConfig.label,
            url: buildTourNotifyMeMailto(naming),
            variant: ctaConfig.variant ?? 'primary',
          },
          ctaConfig,
        );
      }

      const client = resolveTourClient(tour);
      const email = client?.email?.trim();
      const url =
        email ? buildContactMailto(email, naming) : TOUR_CONTACT_US_MAILTO;
      return withStatusCtaIcon(
        {
          label: ctaConfig.label,
          sublabel: ctaConfig.sublabel,
          ariaLabel: ctaConfig.ariaLabel ?? ctaConfig.label,
          url,
          variant: ctaConfig.variant ?? 'primary',
        },
        ctaConfig,
      );
    }
    case 'website': {
      return withStatusCtaIcon(
        {
          label: ctaConfig.label,
          sublabel: ctaConfig.sublabel,
          ariaLabel: ctaConfig.ariaLabel ?? ctaConfig.label,
          url: getTourWebsite(tour),
          variant: ctaConfig.variant ?? 'primary',
        },
        ctaConfig,
      );
    }
    case 'giftabulator':
      return withStatusCtaIcon(
        {
          product: 'giftabulator',
          label: ctaConfig.label,
          ariaLabel: ctaConfig.ariaLabel ?? GIFTABULATOR_PRODUCT.ariaLabel,
          url: buildGiftabulatorGiveNowUrl(tour, naming),
          variant: ctaConfig.variant ?? 'secondary',
        },
        ctaConfig,
      );
    default:
      return null;
  }
}

function buildCtasFromConfigs(
  ctaConfigs: NamingOpportunityStatusCtaConfig[],
  tour: Tour,
  naming: NamingOpportunity,
): PopupCta[] {
  return ctaConfigs
    .map((ctaConfig) => buildCtaFromPreset(ctaConfig, tour, naming))
    .filter((cta): cta is PopupCta => cta !== null);
}

function normalizePopupCtaVariants(ctas: PopupCta[]): PopupCta[] {
  return ctas.map((cta, index) => ({
    ...cta,
    variant: cta.variant ?? (index === 0 ? 'primary' : 'secondary'),
  }));
}

/** Secondary left, primary right — matches nav preview footer. */
export function orderPopupCtasForFooter(ctas: PopupCta[]): PopupCta[] {
  if (ctas.length <= 1) return ctas;

  return [...ctas].sort((a, b) => {
    const rank = (cta: PopupCta) => (cta.variant === 'secondary' ? 0 : 1);
    return rank(a) - rank(b);
  });
}

export function findPrimaryPopupCta(ctas: PopupCta[]): PopupCta | undefined {
  if (ctas.length === 0) return undefined;

  return (
    ctas.find((cta) => cta.variant === 'primary') ??
    ctas.find((cta) => cta.variant !== 'secondary') ??
    ctas[ctas.length - 1]
  );
}

export function findSecondaryPopupCtas(
  ctas: PopupCta[],
  primary: PopupCta,
): PopupCta[] {
  return ctas.filter((cta) => cta !== primary);
}

function applyGiftabulatorUrlOverride(
  ctas: PopupCta[],
  overrideUrl?: string,
): PopupCta[] {
  if (!overrideUrl) return ctas;

  return ctas.map((cta) =>
    cta.product === 'giftabulator' ? { ...cta, url: overrideUrl } : cta,
  );
}

/** Status-driven CTAs for naming popups; `popup.cta` / `popup.ctas` override defaults. */
export function resolveNamingOpportunityPopupCtas(
  popup: PopupContent,
  tour: Tour,
): PopupCta[] {
  const naming = popup.namingOpportunity;
  if (!naming) return [];

  if (popup.ctas?.length) {
    return orderPopupCtasForFooter(normalizePopupCtaVariants(popup.ctas));
  }

  const giftabulatorUrlOverride =
    popup.cta?.product === 'giftabulator' ? popup.cta.url : undefined;

  return orderPopupCtasForFooter(
    applyGiftabulatorUrlOverride(
      buildCtasFromConfigs(
        namingOpportunityStatusConfig(naming.status).ctas,
        tour,
        naming,
      ),
      giftabulatorUrlOverride,
    ),
  );
}

/** @deprecated Use {@link resolveNamingOpportunityPopupCtas} */
export function resolveNamingOpportunityPopupCta(
  popup: PopupContent,
  tour: Tour,
): PopupCta | null {
  return resolveNamingOpportunityPopupCtas(popup, tour)[0] ?? null;
}

/** Effective footer CTAs — naming status defaults or popup.cta. */
export function resolvePopupContentCtas(
  popup: PopupContent,
  tour: Tour,
): PopupCta[] {
  if (popup.namingOpportunity) {
    return resolveNamingOpportunityPopupCtas(popup, tour);
  }

  return popup.cta ? [popup.cta] : [];
}

/** @deprecated Use {@link resolvePopupContentCtas} */
export function resolvePopupContentCta(
  popup: PopupContent,
  tour: Tour,
): PopupCta | null {
  return resolvePopupContentCtas(popup, tour)[0] ?? null;
}

/** Display name without trailing "Naming Opportunity" (JSON stores full legal title). */
export function stripNamingOpportunitySuffix(name: string): string {
  return name.replace(/\s+Naming Opportunity\s*$/i, '').trim();
}
