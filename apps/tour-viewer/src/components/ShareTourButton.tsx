import { useCallback, useState } from 'react';
import { cn } from '../lib/cn';
import type { ShareMessage } from '../utils/buildShareUrl';
import { shareTourResultLabel, shareTourView } from '../utils/shareTour';
import { PopupCtaArrowIcon } from './popupContentUi';

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

    const nextLabel = shareTourResultLabel(result);
    if (!nextLabel) return;

    setFeedback(nextLabel);
    window.setTimeout(() => setFeedback(null), 2400);
  }, [message, preferNative, shareUrl]);

  const displayLabel = feedback ?? label;

  return (
    <button
      type='button'
      className={cn(
        'tour-glass-panel__cta cursor-pointer',
        isSecondary && 'tour-glass-panel__cta--secondary',
        feedback && 'opacity-92',
      )}
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
