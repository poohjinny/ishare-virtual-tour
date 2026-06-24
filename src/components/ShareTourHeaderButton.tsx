import { useCallback, useState } from 'react';
import { cn } from '../lib/cn';
import {
  TOUR_SHARE_COPIED_LABEL,
  TOUR_SHARE_COPY_FAILED,
} from '../constants/tourShare';
import type { ShareMessage } from '../utils/buildShareUrl';
import { shareTourView, type ShareTourResult } from '../utils/shareTour';
import { ShareIcon } from './icons/ShareIcon';
import { IconTooltip } from './ui/IconTooltip';

interface ShareTourHeaderButtonProps {
  shareUrl: string;
  message: ShareMessage;
  ariaLabel: string;
  preferNative?: boolean;
}

export function ShareTourHeaderButton({
  shareUrl,
  message,
  ariaLabel,
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

  const label = feedback ?? ariaLabel;

  return (
    <IconTooltip label={label} placement='bottom'>
      <button
        type='button'
        className={cn('tour-glass-panel__header-btn', feedback && 'opacity-92')}
        aria-label={label}
        disabled={feedback !== null}
        onClick={() => void handleClick()}
      >
        <ShareIcon className='tour-glass-panel__header-btn-icon' />
      </button>
    </IconTooltip>
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
