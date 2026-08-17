import { useEffect, useState } from 'react';
import { FOLLOW_UP_PREVIEW_COUNT } from '../../utils/guideMessageExtras';
import { cn } from '../../lib/cn';
import {
  aiFollowUpButtonClassName,
  aiFollowUpListClassName,
  aiFollowUpShowMoreClassName,
} from './aiAssistantVariants';

interface FollowUpQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FollowUpQuestions({
  questions,
  onSelect,
  disabled = false,
  className,
}: FollowUpQuestionsProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [questions]);

  if (questions.length === 0) return null;

  const needsCollapse = questions.length > FOLLOW_UP_PREVIEW_COUNT;
  const visible =
    needsCollapse && !expanded ?
      questions.slice(0, FOLLOW_UP_PREVIEW_COUNT)
    : questions;
  const hiddenCount = questions.length - FOLLOW_UP_PREVIEW_COUNT;

  return (
    <div className={cn(aiFollowUpListClassName, className)}>
      {visible.map((q) => (
        <button
          key={q}
          type='button'
          className={aiFollowUpButtonClassName}
          // Keep the composer caret — don't let the chip steal focus on press.
          onPointerDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => onSelect(q)}
          disabled={disabled}
        >
          {q}
        </button>
      ))}
      {needsCollapse ?
        <button
          type='button'
          className={aiFollowUpShowMoreClassName}
          disabled={disabled}
          aria-expanded={expanded}
          onPointerDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Show less' : `Show more (${hiddenCount})`}
        </button>
      : null}
    </div>
  );
}
