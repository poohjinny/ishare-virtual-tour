import { withBaseUrl } from '../utils/assetUrl';
import { ISHARE } from '../data/platformBrands';

/** Official SaaS platform product name — docs/internal only; do not show in app UI. */
export const ISHARE_VIRTUAL_TOUR_NAME = 'iShare Virtual Tour';

/** Parent platform brand — https://ishare.ca */
export const ISHARE_PLATFORM = ISHARE;

/** Platform product logo (shared across all client tours). */
export const PLATFORM_PRODUCT_LOGO = withBaseUrl(
  '/assets/brand/logo_ishare.png',
);
/** Funding Matters company logo — Help → Contact tour support block. */
export const PLATFORM_FMI_LOGO = withBaseUrl('/assets/brand/logo_fmi.png');
/** Platform symbol mark (shared asset). */
export const PLATFORM_SYMBOL = withBaseUrl('/assets/brand/symbol_ishare.png');

/** Virtual Tour Guide avatar — shared across all client tours. */
export const VIRTUAL_TOUR_GUIDE_AVATAR = withBaseUrl(
  '/assets/brand/tour-guide.png',
);

/** Unified AI assistant product name (shared across all client tours). */
export const VIRTUAL_TOUR_GUIDE_NAME = 'Virtual Tour Guide';

/** Short CTA label on nav preview and assistant FAB hover. */
export const VIRTUAL_TOUR_GUIDE_CTA = 'Ask Guide';

/** Shown in chat until live AI is connected. */
export const VIRTUAL_TOUR_GUIDE_PREVIEW_NOTICE =
  'Demo preview — responses are scripted for now. Live AI assistance is coming in a future update.';
