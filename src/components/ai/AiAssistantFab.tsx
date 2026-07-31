import { VIRTUAL_TOUR_GUIDE_NAME } from '../../constants/branding';
import { cn } from '../../lib/cn';
import { GuideAvatar, type GuideAvatarPresence } from './GuideAvatar';
import {
  aiFabAvatarClassName,
  aiFabGuideMarkClassName,
  aiFabGuideMarkIdleClassName,
  aiFabGuideMarkPulseClassName,
  aiFabLabelAccentClassName,
  aiFabLabelClassName,
  aiFabVariants,
} from './aiAssistantVariants';

interface AiAssistantFabProps {
  phase: 'idle' | 'enter' | 'exit';
  /**
   * Proximity bubble visible — avatar morphs ring→orb and uses the faster pulse.
   */
  speaking?: boolean;
  onClick: () => void;
  onWarmup?: () => void;
}

export function AiAssistantFab({
  phase,
  speaking = false,
  onClick,
  onWarmup,
}: AiAssistantFabProps) {
  const presence: GuideAvatarPresence = speaking ? 'orb' : 'ring';

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
          presence={presence}
          className={cn(
            aiFabGuideMarkClassName,
            speaking ?
              aiFabGuideMarkPulseClassName
            : aiFabGuideMarkIdleClassName,
          )}
        />
      </span>
      <span className={aiFabLabelClassName}>
        Ask <span className={aiFabLabelAccentClassName}>Guide</span>
      </span>
    </button>
  );
}
