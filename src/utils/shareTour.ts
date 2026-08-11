import {
  TOUR_SHARE_COPIED_LABEL,
  TOUR_SHARE_COPY_FAILED,
  shouldPreferNativeShare,
} from '../constants/tourShare';
import { buildNativeShareData, type ShareMessage } from './buildShareUrl';
import { copyToClipboard } from './clipboard';
import { ensureShareOgImage } from './ensureShareOgImage';
import { setIshareTooltipLabel } from './ishareTooltipDom';

export type ShareTourResult =
  | 'shared'
  | 'copied'
  | 'failed'
  | 'cancelled'
  | 'opened-panel';

export interface ShareTourOptions {
  shareUrl: string;
  message: ShareMessage;
  /** When set, try native share before copying. */
  preferNative?: boolean;
  /**
   * Desktop fallback — open the in-app Share panel (Email / apps) instead of
   * the weak OS share sheet.
   */
  onOpenSharePanel?: () => void;
}

/**
 * Mobile: OS share sheet. Desktop: in-app Share panel when provided, else copy.
 */
export async function shareTourView({
  shareUrl,
  message,
  preferNative = false,
  onOpenSharePanel,
}: ShareTourOptions): Promise<ShareTourResult> {
  await ensureShareOgImage(shareUrl);

  if (preferNative && shouldPreferNativeShare()) {
    try {
      const data = buildNativeShareData(shareUrl, message);
      if (
        typeof navigator.canShare === 'function' &&
        !navigator.canShare(data)
      ) {
        // Some targets reject structured ShareData — fall back to text+url blob.
        await navigator.share({ text: `${data.text}\n${shareUrl}` });
      } else {
        await navigator.share(data);
      }
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  if (preferNative && onOpenSharePanel && !shouldPreferNativeShare()) {
    onOpenSharePanel();
    return 'opened-panel';
  }

  const copied = await copyToClipboard(shareUrl);
  return copied ? 'copied' : 'failed';
}

export function shareTourResultLabel(result: ShareTourResult): string | null {
  switch (result) {
    case 'copied':
      return TOUR_SHARE_COPIED_LABEL;
    case 'failed':
      return TOUR_SHARE_COPY_FAILED;
    default:
      return null;
  }
}

export function applyShareButtonFeedback(
  button: HTMLButtonElement,
  result: ShareTourResult,
  defaultTooltipLabel: string,
  defaultAriaLabel: string = defaultTooltipLabel,
): void {
  const label = shareTourResultLabel(result);
  if (!label) return;

  const textEl = button.querySelector('.tour-glass-panel__cta-text');
  if (textEl instanceof HTMLElement) {
    const previous = textEl.textContent ?? defaultTooltipLabel;
    textEl.textContent = label;
    button.disabled = true;

    window.setTimeout(() => {
      textEl.textContent = previous;
      button.disabled = false;
    }, 2400);
    return;
  }

  const previousTooltip =
    button.getAttribute('data-ishare-tooltip') ?? defaultTooltipLabel;
  const previousAria = button.getAttribute('aria-label') ?? defaultAriaLabel;
  button.setAttribute('aria-label', label);
  setIshareTooltipLabel(button, label);
  button.disabled = true;

  window.setTimeout(() => {
    button.setAttribute('aria-label', previousAria);
    setIshareTooltipLabel(button, previousTooltip);
    button.disabled = false;
  }, 2400);
}
