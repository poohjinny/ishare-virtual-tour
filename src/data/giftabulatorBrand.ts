import type { PopupCta } from '../types/tour';
import { GIFTABULATOR } from './platformBrands';
import { platformBrandLinkedNameHtml } from '../utils/platformBrandHtml';

/** Giftabulator popup CTA copy — brand metadata lives in `platformBrands.ts`. */
export const GIFTABULATOR_PRODUCT = {
  ...GIFTABULATOR,
  ctaButtonLabelPrefix: 'See your tax-efficient giving potential with ',
  ctaSublabelPrefix: 'Calculate your gift with ',
  ariaLabel: 'See your tax-efficient giving potential with GIFTABULATOR',
} as const;

export function giftabulatorCtaButtonPlainLabel(): string {
  const mark = GIFTABULATOR.mark ?? '';
  return `${GIFTABULATOR_PRODUCT.ctaButtonLabelPrefix}${GIFTABULATOR.name}${mark}`;
}

export function giftabulatorCtaButtonLabelHtml(
  regClass = 'tour-glass-panel__reg',
): string {
  const markHtml =
    GIFTABULATOR.mark ?
      `<sup class="${regClass}" aria-hidden="true">${GIFTABULATOR.mark}</sup>`
    : '';
  return `${GIFTABULATOR_PRODUCT.ctaButtonLabelPrefix}${GIFTABULATOR.name}${markHtml}`;
}

export type GiftabulatorProductId = typeof GIFTABULATOR_PRODUCT.id;

export type ResolvedPopupCta =
  | {
      kind: 'giftabulator';
      url: string;
      label: string;
      sublabelOverride?: string;
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
      sublabelOverride: cta.sublabel,
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
  return `${GIFTABULATOR_PRODUCT.ctaSublabelPrefix}${platformBrandLinkedNameHtml(GIFTABULATOR, { regClass })}`;
}

export function popupCtaLabelLength(cta: PopupCta): number {
  return resolvePopupCta(cta).label.length;
}
