import { useCallback, useState } from 'react';
import {
  TOUR_SHARE_COPIED_LABEL,
  TOUR_SHARE_COPY_FAILED,
} from '../constants/tourShare';
import type { ShareMessage } from '../utils/buildShareUrl';
import { shareTourView, type ShareTourResult } from '../utils/shareTour';
import { PopupCtaArrowIcon } from './popupContentUi';
import './ShareTourButton.css';

interface ShareTourButtonProps {
  shareUrl: string;
  message: ShareMessage;
  label: string;
  ariaLabel: string;
  variant?: 'primary' | 'secondary';
  preferNative?: boolean;
  showArrow?: boolean;
}

export function ShareTourButton({
  shareUrl,
  message,
  label,
  ariaLabel,
  variant = 'primary',
  preferNative = true,
  showArrow = false,
}: ShareTourButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const isSecondary = variant === 'secondary';

  const handleClick = useCallback(async () => {
    const result = await shareTourView({ shareUrl, message, preferNative });

    const nextLabel = resolveShareFeedbackLabel(result);
    if (!nextLabel) return;

    setFeedback(nextLabel);
    window.setTimeout(() => setFeedback(null), 2400);
  }, [message, preferNative, shareUrl]);

  const displayLabel = feedback ?? label;

  return (
    <button
      type='button'
      className={`tour-glass-panel__cta share-tour-button${isSecondary ? ' tour-glass-panel__cta--secondary' : ''}${feedback ? ' share-tour-button--feedback' : ''}`}
      aria-label={ariaLabel}
      disabled={feedback !== null}
      onClick={() => void handleClick()}
    >
      <span className='tour-glass-panel__cta-text' data-cta-label={label}>
        {displayLabel}
      </span>
      {showArrow && !isSecondary && !feedback && <PopupCtaArrowIcon />}
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
