import { cn } from '../../lib/cn';
import {
  aiPanelSuggestionsClassName,
  aiSuggestionClassName,
} from './aiAssistantVariants';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SuggestedQuestions({
  questions,
  onSelect,
  disabled = false,
  className,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;
  return (
    <div className={cn(aiPanelSuggestionsClassName, className)}>
      {questions.map((q) => (
        <button
          key={q}
          type='button'
          className={aiSuggestionClassName}
          onClick={() => onSelect(q)}
          disabled={disabled}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
