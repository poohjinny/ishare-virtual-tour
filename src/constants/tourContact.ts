import type { NamingOpportunity } from '../types/tour';

/** Temporary inbox for platform-handled naming-opportunity contact CTAs. */
export const TOUR_CONTACT_US_EMAIL = 'wpetruck@fundingmatters.com';

export const TOUR_CONTACT_US_MAILTO = `mailto:${TOUR_CONTACT_US_EMAIL}`;

export function buildTourNotifyMeMailto(naming: NamingOpportunity): string {
  const name = naming.name.trim();
  const params = new URLSearchParams();
  params.set('subject', `Notify me: ${name}`);
  params.set(
    'body',
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
  return `mailto:${TOUR_CONTACT_US_EMAIL}?${params.toString()}`;
}
