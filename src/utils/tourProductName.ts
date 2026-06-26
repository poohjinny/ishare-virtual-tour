import type { Tour } from '../types/tour';
import { resolveTourClient } from './resolveTourClient';

/**
 * Client tour product naming (in-app).
 *
 * Platform SaaS name (`iShare Virtual Tour`) — see `docs/PRODUCT_NAMING.md`.
 * Shown on platform-level screens only; in-tour UI uses `getTourProductFullName(tour)`.
 */

/** Client tour product suffix. */
export const TOUR_PRODUCT_SUFFIX = 'Virtual Tour';

/** Client organization display name (full name). */
export function getTourClientFullName(tour: Tour): string {
  return resolveTourClient(tour)?.name?.trim() || tour.title.trim();
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
