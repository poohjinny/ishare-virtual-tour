import { findPrimaryPopupCta, orderPopupCtasForFooter } from '../data/namingOpportunityStatus';
import type { PopupCta } from '../types/tour';

export interface PopupCtaPlacement {
  primary: PopupCta | undefined;
  headerCtas: PopupCta[];
}

/** Footer holds all CTAs; header keeps share only. */
export function partitionPopupCtasForPlacement(
  ctas: PopupCta[],
): PopupCtaPlacement {
  const ordered = orderPopupCtasForFooter(ctas);
  if (ordered.length === 0) {
    return { primary: undefined, headerCtas: [] };
  }

  const primary = findPrimaryPopupCta(ordered);

  return {
    primary,
    headerCtas: [],
  };
}

export function isMailtoCtaUrl(url: string): boolean {
  return url.startsWith('mailto:');
}
