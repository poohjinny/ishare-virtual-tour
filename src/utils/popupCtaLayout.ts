import { popupCtaLabelLength } from '../data/giftabulatorBrand';
import {
  findPrimaryPopupCta,
  findSecondaryPopupCtas,
  orderPopupCtasForFooter,
} from '../data/namingOpportunityStatus';
import type { PopupCta } from '../types/tour';

export type PopupCtaLayoutMode = 'full' | 'row-equal' | 'primary-stack';

/** Max label length for equal-width row layout (per button). */
export const POPUP_CTA_ROW_EQUAL_MAX_LABEL = 24;

/** Max buttons in a single equal-width row. */
export const POPUP_CTA_ROW_EQUAL_MAX_COUNT = 3;

export function resolvePopupCtaLayoutMode(
  ctas: PopupCta[],
): PopupCtaLayoutMode {
  if (ctas.length <= 1) return 'full';

  const ordered = orderPopupCtasForFooter(ctas);
  const hasLongLabel = ordered.some(
    (cta) => popupCtaLabelLength(cta) > POPUP_CTA_ROW_EQUAL_MAX_LABEL,
  );

  if (hasLongLabel || ordered.length > POPUP_CTA_ROW_EQUAL_MAX_COUNT) {
    return 'primary-stack';
  }

  return 'row-equal';
}

export function popupCtaWrapClassName(mode: PopupCtaLayoutMode): string {
  return `tour-glass-panel__cta-wrap tour-glass-panel__cta-wrap--${mode}`;
}

export function popupCtaRowClassName(secondaryCount: number): string {
  return secondaryCount === 1 ?
      'tour-glass-panel__cta-row tour-glass-panel__cta-row--single'
    : 'tour-glass-panel__cta-row';
}

export function partitionPopupCtas(ctas: PopupCta[]): {
  ordered: PopupCta[];
  primary: PopupCta;
  secondaries: PopupCta[];
} {
  const ordered = orderPopupCtasForFooter(ctas);
  const primary = findPrimaryPopupCta(ordered)!;

  return {
    ordered,
    primary,
    secondaries: findSecondaryPopupCtas(ordered, primary),
  };
}

export interface PopupFooterLayout {
  mode: PopupCtaLayoutMode;
  primary: PopupCta;
  secondaries: PopupCta[];
}

export function resolvePopupFooterLayout(
  ctas: PopupCta[],
): PopupFooterLayout | null {
  if (ctas.length === 0) return null;

  const { primary, secondaries } = partitionPopupCtas(ctas);

  return { mode: resolvePopupCtaLayoutMode(ctas), primary, secondaries };
}
