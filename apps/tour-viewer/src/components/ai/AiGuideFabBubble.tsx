import { useEffect, type ReactNode } from 'react';
import { VIRTUAL_TOUR_GUIDE_NAME } from '../../constants/branding';
import { cn } from '../../lib/cn';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_12,
  MATERIAL_SYMBOL_SIZE_14,
} from '../ui/materialSymbolClasses';
import {
  aiFabBubbleClassName,
  aiFabBubbleDismissClassName,
  aiFabBubbleEmphasisClassName,
  aiFabBubbleEnterClassName,
  aiFabBubbleExitClassName,
  aiFabBubbleNamingHeartClassName,
  aiFabBubbleOpenClassName,
  aiFabBubblePlaceDotClassName,
  aiFabBubbleTailClassName,
  aiFabBubbleTextClassName,
} from './aiAssistantVariants';

const BUBBLE_EXIT_FALLBACK_MS = 220;
/** Light `**name**` markers from {@link getGuideFabSceneBubble} / naming twin. */
const EMPHASIS_CHUNK = /(\*\*[^*]+\*\*)/g;
const EMPHASIS_INNER = /^\*\*([^*]+)\*\*$/;

export type AiGuideFabBubbleEmphasis = 'place' | 'naming';

interface AiGuideFabBubbleProps {
  text: string;
  /** Icon before the emphasized name: place → theme dot, naming → theme heart. */
  emphasis?: AiGuideFabBubbleEmphasis;
  phase?: 'enter' | 'exit';
  onOpen: () => void;
  onDismiss: () => void;
  onExitComplete?: () => void;
}

function stripEmphasisMarkers(text: string): string {
  return text.replace(/\*\*/g, '');
}

function EmphasisLead({ emphasis }: { emphasis?: AiGuideFabBubbleEmphasis }) {
  if (emphasis === 'place') {
    return <span className={aiFabBubblePlaceDotClassName} aria-hidden='true' />;
  }
  if (emphasis === 'naming') {
    return (
      <MaterialSymbol
        name='favorite'
        filled
        className={aiFabBubbleNamingHeartClassName}
        sizePx={MATERIAL_SYMBOL_SIZE_12}
      />
    );
  }
  return null;
}

function renderBubbleCopy(
  text: string,
  emphasis?: AiGuideFabBubbleEmphasis,
): ReactNode {
  const parts = text.split(EMPHASIS_CHUNK);
  return parts.map((chunk, index) => {
    const match = EMPHASIS_INNER.exec(chunk);
    if (match) {
      return (
        <strong key={index} className={aiFabBubbleEmphasisClassName}>
          <EmphasisLead emphasis={emphasis} />
          {match[1]}
        </strong>
      );
    }
    // Margin-start on the emphasis unit owns breathing room before the name.
    let content = chunk;
    if (
      index < parts.length - 1 &&
      EMPHASIS_INNER.test(parts[index + 1] ?? '')
    ) {
      content = content.replace(/\s+$/, '');
    }
    return <span key={index}>{content}</span>;
  });
}

/** Tap opens Ask Guide — soft proximity line from the guide avatar. */
export function AiGuideFabBubble({
  text,
  emphasis,
  phase = 'enter',
  onOpen,
  onDismiss,
  onExitComplete,
}: AiGuideFabBubbleProps) {
  const plainText = stripEmphasisMarkers(text);
  const exiting = phase === 'exit';

  useEffect(() => {
    if (!exiting || !onExitComplete) return;
    const timer = window.setTimeout(onExitComplete, BUBBLE_EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [exiting, onExitComplete]);

  return (
    <div
      className={cn(
        aiFabBubbleClassName,
        exiting ? aiFabBubbleExitClassName : aiFabBubbleEnterClassName,
      )}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (!exiting) return;
        onExitComplete?.();
      }}
      role='group'
      aria-label={`${VIRTUAL_TOUR_GUIDE_NAME} says: ${plainText}`}
    >
      <button
        type='button'
        className={aiFabBubbleOpenClassName}
        onClick={onOpen}
        aria-label={`${VIRTUAL_TOUR_GUIDE_NAME} says: ${plainText}. Open chat.`}
        tabIndex={exiting ? -1 : undefined}
      >
        <p className={aiFabBubbleTextClassName}>
          {renderBubbleCopy(text, emphasis)}
        </p>
      </button>
      <button
        type='button'
        className={aiFabBubbleDismissClassName}
        onClick={(event) => {
          event.stopPropagation();
          onDismiss();
        }}
        aria-label='Dismiss guide message'
        tabIndex={exiting ? -1 : undefined}
      >
        <MaterialSymbol name='close' sizePx={MATERIAL_SYMBOL_SIZE_14} />
      </button>
      <svg
        className={aiFabBubbleTailClassName}
        viewBox='0 0 16 8'
        aria-hidden='true'
      >
        <path d='M0 0 L8 8 L16 0 Z' fill='var(--fab-bubble-fill)' />
      </svg>
    </div>
  );
}
