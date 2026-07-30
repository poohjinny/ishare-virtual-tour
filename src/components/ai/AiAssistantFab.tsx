import { VIRTUAL_TOUR_GUIDE_NAME } from '../../constants/branding';
import { cn } from '../../lib/cn';
import { GuideAvatar } from './GuideAvatar';
import {
  aiFabAvatarClassName,
  aiFabGuideMarkClassName,
  aiFabGuideMarkPulseClassName,
  aiFabLabelAccentClassName,
  aiFabLabelClassName,
  aiFabVariants,
} from './aiAssistantVariants';

interface AiAssistantFabProps {
  phase: 'idle' | 'enter' | 'exit';
  /** Faster orb pulse while a proximity bubble is up. */
  pulse?: boolean;
  onClick: () => void;
  onWarmup?: () => void;
}

export function AiAssistantFab({
  phase,
  pulse = false,
  onClick,
  onWarmup,
}: AiAssistantFabProps) {
  return (
    <button
      type='button'
      className={aiFabVariants({ phase })}
      onClick={onClick}
      onPointerEnter={onWarmup}
      onFocus={onWarmup}
      aria-label={`Open ${VIRTUAL_TOUR_GUIDE_NAME}`}
      aria-expanded={false}
    >
      <span className={aiFabAvatarClassName}>
        <GuideAvatar
          className={cn(
            aiFabGuideMarkClassName,
            pulse && aiFabGuideMarkPulseClassName,
          )}
        />
      </span>
      <span className={aiFabLabelClassName}>
        Ask <span className={aiFabLabelAccentClassName}>Guide</span>
      </span>
    </button>
  );
}
