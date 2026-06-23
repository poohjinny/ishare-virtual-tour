import { VIRTUAL_TOUR_GUIDE_NAME } from '../../constants/branding';
import { GuideAvatarImage } from './GuideAvatarImage';
import {
  aiFabAvatarClassName,
  aiFabIconClassName,
  aiFabLabelAccentClassName,
  aiFabLabelClassName,
  aiFabVariants,
} from './aiAssistantVariants';

interface AiAssistantFabProps {
  phase: 'idle' | 'enter' | 'exit';
  guideAvatarUrl: string;
  onClick: () => void;
  onWarmup?: () => void;
}

export function AiAssistantFab({
  phase,
  guideAvatarUrl,
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
        <GuideAvatarImage
          className={aiFabIconClassName}
          src={guideAvatarUrl}
          alt=''
        />
      </span>
      <span className={aiFabLabelClassName}>
        Ask <span className={aiFabLabelAccentClassName}>Guide</span>
      </span>
    </button>
  );
}
