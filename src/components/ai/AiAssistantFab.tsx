import {
  VIRTUAL_TOUR_GUIDE_AVATAR,
  VIRTUAL_TOUR_GUIDE_NAME,
} from '../../constants/branding';
import './AiAssistant.css';

interface AiAssistantFabProps {
  phase: 'idle' | 'enter' | 'exit';
  onClick: () => void;
}

export function AiAssistantFab({ phase, onClick }: AiAssistantFabProps) {
  const phaseClass =
    phase === 'exit' ? ' ai-fab--exit'
    : phase === 'enter' ? ' ai-fab--enter'
    : '';

  return (
    <button
      type='button'
      className={`ai-fab${phaseClass}`}
      onClick={onClick}
      aria-label={`Open ${VIRTUAL_TOUR_GUIDE_NAME}`}
      aria-expanded={false}
    >
      <span className='ai-fab__avatar'>
        <img className='ai-fab__icon' src={VIRTUAL_TOUR_GUIDE_AVATAR} alt='' />
      </span>
      <span className='ai-fab__label'>
        Ask <span className='ai-fab__label-accent'>Guide</span>
      </span>
    </button>
  );
}
