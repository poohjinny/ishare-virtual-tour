import type { PopupCta } from '../types/tour';

/** iShare Giftabulator product branding — single source of truth for popup CTAs. */
export const GIFTABULATOR_PRODUCT = {
  id: 'giftabulator',
  name: 'GIFTABULATOR',
  mark: '®',
  ctaLabelPrefix: 'Calculate your gift with ',
  defaultSublabel: 'See your tax-efficient giving potential',
  ariaLabel: 'Calculate your gift with GIFTABULATOR registered trademark',
} as const;

export type GiftabulatorProductId = typeof GIFTABULATOR_PRODUCT.id;

export type ResolvedPopupCta =
  | {
      kind: 'giftabulator';
      url: string;
      sublabel: string;
      labelPrefix: string;
      ariaLabel: string;
    }
  | {
      kind: 'custom';
      url: string;
      sublabel?: string;
      label: string;
      ariaLabel: string;
    };

export function resolvePopupCta(cta: PopupCta): ResolvedPopupCta {
  if (cta.product === GIFTABULATOR_PRODUCT.id) {
    return {
      kind: 'giftabulator',
      url: cta.url,
      sublabel: cta.sublabel ?? GIFTABULATOR_PRODUCT.defaultSublabel,
      labelPrefix: GIFTABULATOR_PRODUCT.ctaLabelPrefix,
      ariaLabel: cta.label ?? GIFTABULATOR_PRODUCT.ariaLabel,
    };
  }

  return {
    kind: 'custom',
    url: cta.url,
    sublabel: cta.sublabel,
    label: cta.label ?? '',
    ariaLabel: cta.label ?? 'Learn more',
  };
}

export function giftabulatorCtaLabelHtml(regClass = 'tour-glass-panel__reg'): string {
  return `${GIFTABULATOR_PRODUCT.ctaLabelPrefix}${GIFTABULATOR_PRODUCT.name}<sup class="${regClass}" aria-hidden="true">&reg;</sup>`;
}

export function popupCtaLabelLength(cta: PopupCta): number {
  const resolved = resolvePopupCta(cta);
  if (resolved.kind === 'giftabulator') {
    return (
      resolved.labelPrefix.length +
      GIFTABULATOR_PRODUCT.name.length +
      GIFTABULATOR_PRODUCT.mark.length
    );
  }
  return resolved.label.length;
}
