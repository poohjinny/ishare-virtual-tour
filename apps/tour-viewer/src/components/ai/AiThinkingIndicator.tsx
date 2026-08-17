import { useEffect, useState } from 'react';
import {
  aiThinkingDotClassName,
  aiThinkingDotsClassName,
  aiThinkingLabelClassName,
  aiThinkingRowClassName,
} from './aiAssistantVariants';

const THINKING_PHRASES = [
  'Thinking…',
  'Looking this up…',
  'Checking this area…',
] as const;

const PHRASE_ROTATE_MS = 2200;

/** Live reply pending — bouncing dots + rotating status copy. */
export function AiThinkingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;

    const timer = window.setInterval(() => {
      setPhraseIndex((index) => (index + 1) % THINKING_PHRASES.length);
    }, PHRASE_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={aiThinkingRowClassName} aria-live='polite' aria-busy='true'>
      <span className={aiThinkingDotsClassName} aria-hidden='true'>
        <span className={aiThinkingDotClassName} />
        <span
          className={aiThinkingDotClassName}
          style={{ animationDelay: '0.16s' }}
        />
        <span
          className={aiThinkingDotClassName}
          style={{ animationDelay: '0.32s' }}
        />
      </span>
      <span key={phraseIndex} className={aiThinkingLabelClassName}>
        {THINKING_PHRASES[phraseIndex]}
      </span>
    </div>
  );
}
