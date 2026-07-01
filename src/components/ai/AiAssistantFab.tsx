import { VIRTUAL_TOUR_GUIDE_NAME } from '../../constants/branding';
import { GuideAvatar } from './GuideAvatar';
import {
  aiFabAvatarClassName,
  aiFabGuideMarkClassName,
  aiFabLabelAccentClassName,
  aiFabLabelClassName,
  aiFabVariants,
} from './aiAssistantVariants';

interface AiAssistantFabProps {
  phase: 'idle' | 'enter' | 'exit';
  onClick: () => void;
  onWarmup?: () => void;
}

export function AiAssistantFab({
  phase,
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
        <GuideAvatar className={aiFabGuideMarkClassName} />
      </span>
      <span className={aiFabLabelClassName}>
        Ask <span className={aiFabLabelAccentClassName}>Guide</span>
      </span>
    </button>
  );
}
