import { useProgress } from "../context/ProgressContext";
import { getCategory } from "../domain/category-registry";
import "./QuestionTypeSelectorScreen.css";

interface QuestionTypeSelectorScreenProps {
  categoryId: string;
}

export function QuestionTypeSelectorScreen({ categoryId }: QuestionTypeSelectorScreenProps) {
  const { setQuestionTypeId, navigateTo } = useProgress();

  const category = getCategory(categoryId);
  const categoryLabel = category?.label ?? categoryId;

  const handleSelect = (type: "open" | "multiple-choice") => {
    setQuestionTypeId(type);
    navigateTo({ type: "table-selection", categoryId, questionTypeId: type });
  };

  return (
    <div className="screen question-type-screen">
      <h1 className="question-type-screen__title">{categoryLabel}</h1>
      <p className="question-type-screen__subtitle">Escolha o tipo de questão</p>

      <div className="question-type-screen__options">
        <button
          className="question-type-screen__option"
          onClick={() => handleSelect("open")}
          aria-label="Questão Aberta — Digite a resposta numérica"
        >
          <span className="question-type-screen__option-label">Questão Aberta</span>
          <span className="question-type-screen__option-desc">Digite a resposta numérica</span>
        </button>

        <button
          className="question-type-screen__option"
          onClick={() => handleSelect("multiple-choice")}
          aria-label="Múltipla Escolha — Escolha entre 4 opções"
        >
          <span className="question-type-screen__option-label">Múltipla Escolha</span>
          <span className="question-type-screen__option-desc">Escolha entre 4 opções</span>
        </button>
      </div>
    </div>
  );
}
