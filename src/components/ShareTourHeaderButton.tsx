import { useCallback, useState } from 'react';
import { cn } from '../lib/cn';
import {
  TOUR_SHARE_COPIED_LABEL,
  TOUR_SHARE_COPY_FAILED,
} from '../constants/tourShare';
import type { ShareMessage } from '../utils/buildShareUrl';
import { shareTourView, type ShareTourResult } from '../utils/shareTour';
import { ShareIcon } from './icons/ShareIcon';
import { tooltipHostClassName } from './ui/tooltipClasses';
import { MATERIAL_SYMBOL_SIZE_16 } from './ui/materialSymbolClasses';

interface ShareTourHeaderButtonProps {
  shareUrl: string;
  message: ShareMessage;
  ariaLabel: string;
  /** Short hover label — defaults to {@link ariaLabel}. */
  tooltipLabel?: string;
  preferNative?: boolean;
}

export function ShareTourHeaderButton({
  shareUrl,
  message,
  ariaLabel,
  tooltipLabel,
  preferNative = true,
}: ShareTourHeaderButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    const result = await shareTourView({ shareUrl, message, preferNative });
    const nextLabel = resolveShareFeedbackLabel(result);
    if (!nextLabel) return;

    setFeedback(nextLabel);
    window.setTimeout(() => setFeedback(null), 2400);
  }, [message, preferNative, shareUrl]);

  const idleTooltip = tooltipLabel ?? ariaLabel;
  const tooltip = feedback ?? idleTooltip;

  return (
    <button
      type='button'
      className={cn(
        'tour-glass-panel__header-btn',
        tooltipHostClassName,
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
        sizePx={MATERIAL_SYMBOL_SIZE_16}
      />
    </button>
  );
}

function resolveShareFeedbackLabel(result: ShareTourResult): string | null {
  switch (result) {
    case 'copied':
      return TOUR_SHARE_COPIED_LABEL;
    case 'failed':
      return TOUR_SHARE_COPY_FAILED;
    default:
      return null;
  }
}
