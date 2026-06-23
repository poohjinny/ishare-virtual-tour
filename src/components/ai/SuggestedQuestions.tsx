import {
  aiSuggestionClassName,
  aiPanelSuggestionsClassName,
} from './aiAssistantVariants';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({
  questions,
  onSelect,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;
  return (
    <div className={aiPanelSuggestionsClassName}>
      {questions.map((q) => (
        <button
          key={q}
          type='button'
          className={aiSuggestionClassName}
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
