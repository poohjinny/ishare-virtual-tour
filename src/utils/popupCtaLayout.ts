import { popupCtaLabelLength } from '../data/giftabulatorBrand';
import {
  findPrimaryPopupCta,
  findSecondaryPopupCtas,
  orderPopupCtasForFooter,
} from '../data/namingOpportunityStatus';
import type { PopupCta } from '../types/tour';

export type PopupCtaLayoutMode = 'full' | 'row-equal' | 'primary-stack';

/**
 * Shared glass CTA size / icon placement:
 * - `full` — stretch to wrap; trailing icon at the button end
 * - `wide` — hug label; icon in-flow to the right of the label
 * - `default` — compact / no special icon slot
 */
export type PopupCtaSizeLayout = 'full' | 'wide' | 'default';

/** Max label length for equal-width row layout (per button). */
export const POPUP_CTA_ROW_EQUAL_MAX_LABEL = 32;

/** Max buttons in a single equal-width row (anchored / modal / nav Visit). */
export const POPUP_CTA_ROW_EQUAL_MAX_COUNT = 2;

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

/**
 * Button size class for a footer CTA given the wrap mode.
 * Single CTA → wide (hug); row cells → content-fit full (label|icon columns);
 * stack / no-icon → default or full stretch in stack.
 */
export function resolvePopupCtaSizeLayout(
  mode: PopupCtaLayoutMode,
  options?: { hasIcon?: boolean },
): PopupCtaSizeLayout {
  if (mode === 'full') return 'wide';
  if (options?.hasIcon === false) return 'default';
  return 'full';
}

export function popupCtaWrapClassName(mode: PopupCtaLayoutMode): string {
  return `tour-glass-panel__cta-wrap tour-glass-panel__cta-wrap--${mode}`;
}

export function popupCtaSizeClassName(layout: PopupCtaSizeLayout): string {
  return `tour-glass-panel__cta--${layout}`;
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
