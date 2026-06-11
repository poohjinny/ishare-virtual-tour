import {
  ISHARE_GUIDE_CTA,
  ISHARE_GUIDE_NAME,
  ISHARE_SYMBOL,
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
      aria-label={`Open ${ISHARE_GUIDE_NAME}`}
      aria-expanded={false}
    >
      <span className='ai-fab__avatar'>
        <img className='ai-fab__icon' src={ISHARE_SYMBOL} alt='' />
      </span>
      <span className='ai-fab__label'>{ISHARE_GUIDE_CTA}</span>
    </button>
  );
}
