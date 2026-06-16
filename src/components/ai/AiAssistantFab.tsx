import { VIRTUAL_TOUR_GUIDE_NAME } from '../../constants/branding';
import { GuideAvatarImage } from './GuideAvatarImage';
import './AiAssistant.css';

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
  const phaseClass =
    phase === 'exit' ? ' ai-fab--exit'
    : phase === 'enter' ? ' ai-fab--enter'
    : '';

  return (
    <button
      type='button'
      className={`ai-fab${phaseClass}`}
      onClick={onClick}
      onPointerEnter={onWarmup}
      onFocus={onWarmup}
      aria-label={`Open ${VIRTUAL_TOUR_GUIDE_NAME}`}
      aria-expanded={false}
    >
      <span className='ai-fab__avatar'>
        <GuideAvatarImage className='ai-fab__icon' src={guideAvatarUrl} alt='' />
      </span>
      <span className='ai-fab__label'>
        Ask <span className='ai-fab__label-accent'>Guide</span>
      </span>
    </button>
  );
}
