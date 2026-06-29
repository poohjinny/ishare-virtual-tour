/** Canonical production viewer origin — share/embed docs and parent `postMessage` checks. */
export const TOUR_PUBLIC_ORIGIN = 'https://tour.ishare.ca';

/** Runtime origin for absolute tour URLs (prod host or local dev). */
export function resolveTourPublicOrigin(): string {
  const configured = import.meta.env.VITE_TOUR_PUBLIC_ORIGIN?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return TOUR_PUBLIC_ORIGIN;
}
