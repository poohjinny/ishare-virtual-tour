import type { Tour } from '../types/tour';

/**
 * Client tour product naming (in-app).
 *
 * Platform SaaS name (`iShare Virtual Tour`) is documented in `docs/PRODUCT_NAMING.md`
 * and `ISHARE_VIRTUAL_TOUR_NAME` in `constants/branding.ts` — not shown in the app UI.
 */

/** Client tour product suffix. */
export const TOUR_PRODUCT_SUFFIX = 'Virtual Tour';

/** Client organization display name (full name). */
export function getTourClientFullName(tour: Tour): string {
  return tour.organization?.name?.trim() || tour.title.trim();
}

/** Client tour product full name — `{client full name} Virtual Tour`. */
export function getTourProductFullName(tour: Tour): string {
  if (tour.productFullName?.trim()) {
    return tour.productFullName.trim();
  }

  const clientName = getTourClientFullName(tour);
  const suffix = ` ${TOUR_PRODUCT_SUFFIX}`;

  if (clientName.toLowerCase().endsWith(TOUR_PRODUCT_SUFFIX.toLowerCase())) {
    return clientName;
  }

  return `${clientName}${suffix}`;
}
