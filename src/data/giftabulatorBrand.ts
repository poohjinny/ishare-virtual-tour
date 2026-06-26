import type { PopupCta } from '../types/tour';
import {
  GIFTABULATOR,
  platformBrandAriaLabel,
  platformBrandMarkedName,
} from './platformBrands';

/** Giftabulator popup CTA copy — brand metadata lives in `platformBrands.ts`. */
export const GIFTABULATOR_PRODUCT = {
  ...GIFTABULATOR,
  ctaLabel: 'See your tax-efficient giving',
  ctaDescription: platformBrandAriaLabel(GIFTABULATOR),
  ariaLabel: `See your tax-efficient giving with ${platformBrandMarkedName(GIFTABULATOR)}`,
} as const;

export function giftabulatorCtaButtonPlainLabel(): string {
  return GIFTABULATOR_PRODUCT.ctaLabel;
}

export function giftabulatorCtaButtonLabelHtml(
  regClass = 'tour-glass-panel__reg',
): string {
  const markHtml =
    GIFTABULATOR.mark ?
      `<sup class="${regClass}" aria-hidden="true">${GIFTABULATOR.mark}</sup>`
    : '';

  return `${GIFTABULATOR.name}${markHtml}`;
}

export type GiftabulatorProductId = typeof GIFTABULATOR_PRODUCT.id;

export type ResolvedPopupCta =
  | {
      kind: 'giftabulator';
      url: string;
      label: string;
      sublabel?: string;
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
      label: cta.label ?? giftabulatorCtaButtonPlainLabel(),
      sublabel: cta.sublabel ?? GIFTABULATOR_PRODUCT.ctaDescription,
      ariaLabel: cta.ariaLabel ?? GIFTABULATOR_PRODUCT.ariaLabel,
    };
  }

  return {
    kind: 'custom',
    url: cta.url,
    sublabel: cta.sublabel,
    label: cta.label ?? '',
    ariaLabel: cta.ariaLabel ?? cta.label ?? 'Learn more',
  };
}

export function giftabulatorCtaSublabelHtml(
  regClass = 'tour-glass-panel__reg',
): string {
  return giftabulatorCtaButtonLabelHtml(regClass);
}

export function popupCtaLabelLength(cta: PopupCta): number {
  return resolvePopupCta(cta).label.length;
}
