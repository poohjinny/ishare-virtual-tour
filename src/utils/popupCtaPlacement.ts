import {
  findPrimaryPopupCta,
  findSecondaryPopupCtas,
  orderPopupCtasForFooter,
} from '../data/namingOpportunityStatus';
import type { PopupCta } from '../types/tour';

export interface PopupCtaPlacement {
  primary: PopupCta | undefined;
  headerCtas: PopupCta[];
}

/** Footer = primary only; secondaries move to header icon actions. */
export function partitionPopupCtasForPlacement(
  ctas: PopupCta[],
): PopupCtaPlacement {
  const ordered = orderPopupCtasForFooter(ctas);
  if (ordered.length === 0) {
    return { primary: undefined, headerCtas: [] };
  }

  const primary = findPrimaryPopupCta(ordered);
  if (!primary) {
    return { primary: undefined, headerCtas: [] };
  }

  return { primary, headerCtas: findSecondaryPopupCtas(ordered, primary) };
}

export function isMailtoCtaUrl(url: string): boolean {
  return url.startsWith('mailto:');
}
