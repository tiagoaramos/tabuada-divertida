import "./MultipleChoiceInput.css";

interface MultipleChoiceInputProps {
  options: number[];
  onSelect: (value: number) => void;
  disabled?: boolean;
}

export function MultipleChoiceInput({ options, onSelect, disabled = false }: MultipleChoiceInputProps) {
  return (
    <div className="multiple-choice-grid" role="group" aria-label="Opções de resposta">
      {options.map((option, index) => (
        <button
          key={index}
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
