import {
  TOUR_SHARE_COPIED_LABEL,
  TOUR_SHARE_COPY_FAILED,
  canUseNativeShare,
} from '../constants/tourShare';
import type { ShareMessage } from './buildShareUrl';
import { copyToClipboard } from './clipboard';
import { setIshareTooltipLabel } from './ishareTooltipDom';

export type ShareTourResult = 'shared' | 'copied' | 'failed' | 'cancelled';

export interface ShareTourOptions {
  shareUrl: string;
  message: ShareMessage;
  /** When set, try native share before copying. */
  preferNative?: boolean;
}

export async function shareTourView({
  shareUrl,
  message,
  preferNative = false,
}: ShareTourOptions): Promise<ShareTourResult> {
  if (preferNative && canUseNativeShare()) {
    try {
      await navigator.share({
        title: message.title,
        text: message.text,
        url: shareUrl,
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
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
