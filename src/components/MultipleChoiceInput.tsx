import "./MultipleChoiceInput.css";

interface MultipleChoiceInputProps {
  options: number[];
  onSelect: (value: number) => void;
  disabled?: boolean;
  questionKey?: number | string;
}

export function MultipleChoiceInput({ options, onSelect, disabled = false, questionKey }: MultipleChoiceInputProps) {
  return (
    <div className="multiple-choice-grid" role="group" aria-label="Opções de resposta" key={questionKey}>
      {options.map((option, index) => (
        <button
          key={`${questionKey}-${index}`}
          className="multiple-choice-btn"
          onClick={() => onSelect(option)}
          disabled={disabled}
          aria-label={`Opção ${option}`}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
