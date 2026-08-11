import { TOUR_CHROME_MOBILE_MQ } from './tourChrome';

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

/** Shown after WhatsApp tile — draft-append cannot safely carry a full caption. */
export const TOUR_SHARE_WHATSAPP_COPIED_HINT =
  'Message copied — clear WhatsApp draft, then paste';

export const TOUR_SHARE_INSTAGRAM_LABEL = 'Instagram';

export const TOUR_SHARE_FACEBOOK_LABEL = 'Facebook';

export const TOUR_SHARE_X_LABEL = 'X';

export const TOUR_SHARE_LINKEDIN_LABEL = 'LinkedIn';

/** @deprecated Use {@link TOUR_SHARE_EMAIL_LABEL} */
export const TOUR_SHARE_GMAIL_LABEL = TOUR_SHARE_EMAIL_LABEL;

export const TOUR_SHARE_INSTAGRAM_ARIA = 'Copy link to share on Instagram';

export const TOUR_SHARE_URL_LABEL = 'Copy link';

export const TOUR_SHARE_APPS_HEADING = 'Share via';

export const TOUR_SHARE_PREVIEW_LABEL = 'Link preview';

export const TOUR_SHARE_LOCATION_LABEL = 'Share this location';

export const TOUR_SHARE_OPPORTUNITY_LABEL = 'Share opportunity';

export const TOUR_SHARE_LOCATION_ARIA = 'Share a link to this tour location';

export const TOUR_SHARE_OPPORTUNITY_ARIA =
  'Share a link to this naming opportunity';

export const TOUR_NAV_ACTION_SHARE = 'Share';

/** Keyboard shortcut — `U` for **U**RL / link share (all viewer types). */
export const TOUR_SHARE_KEYBOARD_KEY = 'u';

export function canUseNativeShare(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  );
}

/**
 * Use the OS share sheet only on phone chrome. Desktop sheets often drop
 * title/body and feel like “copy URL only” — open the in-app Share panel there.
 */
export function shouldPreferNativeShare(): boolean {
  if (!canUseNativeShare()) return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia(TOUR_CHROME_MOBILE_MQ).matches;
}
