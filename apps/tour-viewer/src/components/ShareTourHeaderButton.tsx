import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import type { AnchoredShareMenuPayload } from './AnchoredShareMenu';
import { shouldPreferNativeShare } from '../constants/tourShare';
import type { ShareMessage } from '../utils/buildShareUrl';
import { shareTourResultLabel, shareTourView } from '../utils/shareTour';
import { refreshIshareTooltipIfActive } from '../utils/ishareTooltipRuntime';
import { ShareIcon } from './icons/ShareIcon';
import {
  tooltipHostClassName,
  tooltipHostPortalClassName,
} from './ui/tooltipClasses';
import { MATERIAL_SYMBOL_SIZE_CHROME_HEADER } from './ui/materialSymbolClasses';

interface ShareTourHeaderButtonProps {
  shareUrl: string;
  message: ShareMessage;
  ariaLabel: string;
  /** Short hover label — defaults to {@link ariaLabel}. */
  tooltipLabel?: string;
  preferNative?: boolean;
  /** Desktop — open the anchored mini Share menu (panel target). */
  onOpenAnchoredShareMenu?: (payload: AnchoredShareMenuPayload) => void;
}

export function ShareTourHeaderButton({
  shareUrl,
  message,
  ariaLabel,
  tooltipLabel,
  preferNative = true,
  onOpenAnchoredShareMenu,
}: ShareTourHeaderButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (
      preferNative &&
      !shouldPreferNativeShare() &&
      onOpenAnchoredShareMenu &&
      buttonRef.current
    ) {
      onOpenAnchoredShareMenu({
        shareUrl,
        message,
        contextLabel:
          message.namingOpportunityName?.trim() ||
          message.sceneTitle?.trim() ||
          message.title,
        anchorEl: buttonRef.current,
      });
      return;
    }

    const result = await shareTourView({ shareUrl, message, preferNative });
    const nextLabel = shareTourResultLabel(result);
    if (!nextLabel) return;

    setFeedback(nextLabel);
    window.setTimeout(() => setFeedback(null), 2400);
  }, [message, onOpenAnchoredShareMenu, preferNative, shareUrl]);

  const idleTooltip = tooltipLabel ?? ariaLabel;
  const tooltip = feedback ?? idleTooltip;

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    refreshIshareTooltipIfActive(button);
  }, [tooltip]);

  return (
    <button
      ref={buttonRef}
      type='button'
      className={cn(
        'tour-glass-panel__header-btn',
        tooltipHostClassName,
        tooltipHostPortalClassName,
        feedback && 'opacity-92',
      )}
      aria-label={feedback ?? ariaLabel}
      data-ishare-tooltip={tooltip}
      data-ishare-tooltip-placement='left'
      disabled={feedback !== null}
      onClick={() => void handleClick()}
    >
      <ShareIcon
        className='tour-glass-panel__header-btn-icon'
        sizePx={MATERIAL_SYMBOL_SIZE_CHROME_HEADER}
      />
    </button>
  );
}
