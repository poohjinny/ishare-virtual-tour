import { withBaseUrl } from '../utils/assetUrl';
import { ISHARE } from '../data/platformBrands';

/** Official SaaS platform product name — platform-level UI (e.g. client intro `/`). */
export const ISHARE_VIRTUAL_TOUR_NAME = 'iShare Virtual Tour';

/** Product name prefix paired with {@link TOUR_PRODUCT_SUFFIX} in {@link TourProductBranding}. */
export const PLATFORM_PRODUCT_NAME_PREFIX = 'iShare';

/** iShare logo gold — platform product branding accent. */
export const PLATFORM_PRODUCT_BRAND_COLOR = '#e8a838';

/** Darker gold for text/icons on light glass panels. */
export const PLATFORM_PRODUCT_BRAND_COLOR_DARK = '#9a6b12';

/** Parent platform brand — https://ishare.ca */
export const ISHARE_PLATFORM = ISHARE;

/** Platform product logo (shared across all client tours). */
export const PLATFORM_PRODUCT_LOGO = withBaseUrl(
  '/assets/brand/logo_ishare.png',
);
/** FUNDING matters® Inc. company logo — Help → Contact tour support block. */
export const PLATFORM_FMI_LOGO = withBaseUrl('/assets/brand/logo_fmi.png');
/** Platform symbol mark (shared asset). */
export const PLATFORM_SYMBOL = withBaseUrl('/assets/brand/symbol_ishare.png');

/** Looping hero for the multi-client intro screen (`/`). */
export const CLIENT_INTRO_HERO_VIDEO = withBaseUrl(
  '/assets/brand/client-intro-hero.mp4',
);

/** Unified AI assistant product name (shared across all client tours). */
export const VIRTUAL_TOUR_GUIDE_NAME = 'Virtual Tour Guide';

/** Short CTA label on nav preview and assistant FAB hover. */
export const VIRTUAL_TOUR_GUIDE_CTA = 'Ask Guide';

/**
 * Ask Guide FAB + panel product default. Keep off until the live guide API
 * is wired; flip to `true` to ship it. Dev QA can still force it on with
 * `?askGuide=1` (see Debug URL flags).
 */
export const SHOW_ASK_GUIDE = false;

/** Effective Ask Guide visibility — product default or `?askGuide=1`. */
export function isAskGuideEnabled(urlOverride = false): boolean {
  return SHOW_ASK_GUIDE || urlOverride;
}

/** Guide panel location badge — prefixes the active scene title. */
export const GUIDE_PANEL_CURRENT_SCENE_LABEL = 'Current scene';

/** Shown in chat until live AI is connected. */
export const VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE =
  'Demo preview — responses are scripted for now. Live AI assistance is coming in a future update.';
