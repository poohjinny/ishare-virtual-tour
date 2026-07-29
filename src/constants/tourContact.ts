import type { NamingOpportunity } from '../types/tour';

/** Temporary inbox for platform-handled naming-opportunity contact CTAs. */
export const TOUR_CONTACT_US_EMAIL = 'wpetruck@fundingmatters.com';

export const TOUR_CONTACT_US_MAILTO = `mailto:${TOUR_CONTACT_US_EMAIL}`;

function encodeMailtoQueryValue(value: string): string {
  // RFC 6068 — %20 for spaces (URLSearchParams would emit "+").
  return encodeURIComponent(value);
}

export function buildTourNotifyMeMailto(naming: NamingOpportunity): string {
  const name = naming.name.trim();
  const subject = encodeMailtoQueryValue(`Notify me: ${name}`);
  const body = encodeMailtoQueryValue(
    [
      'Hello,',
      '',
      `Please notify me when the ${name} becomes available.`,
      '',
      'Name:',
      'Email:',
      'Phone (optional):',
      '',
    ].join('\n'),
  );
  return `mailto:${TOUR_CONTACT_US_EMAIL}?subject=${subject}&body=${body}`;
}
