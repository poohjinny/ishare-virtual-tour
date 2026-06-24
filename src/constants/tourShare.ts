export const TOUR_SHARE_PANEL_TITLE = 'Share';

export const TOUR_SHARE_LEAD =
  'Send a link to this view. Anyone with the link opens the same tour location';

export const TOUR_SHARE_COPY_LABEL = 'Copy link';

export const TOUR_SHARE_COPIED_LABEL = 'Link copied';

export const TOUR_SHARE_COPY_FAILED =
  'Could not copy — select the link and copy manually';

export const TOUR_SHARE_NATIVE_LABEL = 'Share';

export const TOUR_SHARE_EMAIL_LABEL = 'Email';

export const TOUR_SHARE_WHATSAPP_LABEL = 'WhatsApp';

export const TOUR_SHARE_INSTAGRAM_LABEL = 'Instagram';

export const TOUR_SHARE_FACEBOOK_LABEL = 'Facebook';

export const TOUR_SHARE_X_LABEL = 'X';

export const TOUR_SHARE_LINKEDIN_LABEL = 'LinkedIn';

/** @deprecated Use {@link TOUR_SHARE_EMAIL_LABEL} */
export const TOUR_SHARE_GMAIL_LABEL = TOUR_SHARE_EMAIL_LABEL;

export const TOUR_SHARE_INSTAGRAM_ARIA = 'Copy link to share on Instagram';

export const TOUR_SHARE_URL_LABEL = 'Copy link';

export const TOUR_SHARE_APPS_HEADING = 'Share via';

export const TOUR_SHARE_LOCATION_LABEL = 'Share this location';

export const TOUR_SHARE_OPPORTUNITY_LABEL = 'Share opportunity';

export const TOUR_SHARE_LOCATION_ARIA = 'Share a link to this tour location';

export const TOUR_SHARE_OPPORTUNITY_ARIA =
  'Share a link to this naming opportunity';

export const TOUR_NAV_ACTION_SHARE = 'Share';

export function canUseNativeShare(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  );
}
