import { buildGmailComposeUrl } from '../utils/gmailCompose';

/** Temporary inbox for platform-handled naming-opportunity contact CTAs. */
export const TOUR_CONTACT_US_EMAIL = 'wpetruck@fundingmatters.com';

/** Fallback Express interest / contact — Gmail compose, same as Share Email. */
export const TOUR_CONTACT_US_MAILTO = buildGmailComposeUrl({
  to: TOUR_CONTACT_US_EMAIL,
});
