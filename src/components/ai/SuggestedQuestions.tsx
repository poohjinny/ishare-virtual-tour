import './AiAssistant.css';

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
    <div className='ai-panel__suggestions'>
      {questions.map((q) => (
        <button
          key={q}
          type='button'
          className='ai-suggestion'
          onClick={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
