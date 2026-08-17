import type { PopupCta } from '../types/tour';
import { resolvePopupCta } from '../data/giftabulatorBrand';
import { isGmailComposeUrl } from './gmailCompose';

export type PopupCtaIconKind =
  | 'arrow'
  | 'mail'
  | 'bell'
  | 'external'
  | 'heart'
  | 'volunteer';

/** Primary footer CTA icon — status config first, then label + destination URL. */
export function resolvePopupCtaIconKind(cta: PopupCta): PopupCtaIconKind {
  if (cta.iconKind) return cta.iconKind;

  const resolved = resolvePopupCta(cta);
  const label = resolved.label.toLowerCase();
  const url = cta.url.trim().toLowerCase();

  if (resolved.kind === 'giftabulator') return 'volunteer';

  if (url.startsWith('mailto:') || isGmailComposeUrl(cta.url)) {
    if (label.includes('notify')) return 'bell';
    return 'mail';
  }

  if (label.includes('support') || label.includes('mission')) return 'heart';

  if (url.startsWith('http://') || url.startsWith('https://'))
    return 'external';

  return 'arrow';
}

/** Footer CTA icon — secondary Giftabulator keeps its branded mark. */
export function shouldShowPopupCtaIcon(
  cta: PopupCta,
  isSecondary: boolean,
): boolean {
  if (!isSecondary) return true;
  return resolvePopupCta(cta).kind === 'giftabulator';
}
