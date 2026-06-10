import { useEffect, useRef } from "react";
import { useProgress } from "../context/ProgressContext";
import { getCategory } from "../domain/category-registry";
import "./UnlockCelebration.css";

const questionTypeLabels: Record<string, string> = {
  "open": "Questão Aberta",
  "multiple-choice": "Múltipla Escolha",
};

export function UnlockCelebration() {
  const { unlockCelebration, dismissCelebration, categoryId, questionTypeId } = useProgress();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const category = getCategory(categoryId);
  const categoryLabel = category?.label ?? categoryId;
  const questionTypeLabel = questionTypeLabels[questionTypeId] ?? questionTypeId;

  useEffect(() => {
    if (unlockCelebration !== null && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [unlockCelebration]);

  // Trap focus: keep focus on the button when modal is visible
  useEffect(() => {
    if (unlockCelebration === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab") {
        e.preventDefault();
        buttonRef.current?.focus();
      }
      if (e.key === "Escape") {
        dismissCelebration();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [unlockCelebration, dismissCelebration]);

  if (unlockCelebration === null) {
    return null;
  }

  return (
    <div className="unlock-overlay" role="dialog" aria-modal="true" aria-label="Celebração de desbloqueio">
      <div className="unlock-modal">
        <div className="unlock-trophy" aria-hidden="true">
          🏆
        </div>
        <h2 className="unlock-heading">Parabéns!</h2>
        <p className="unlock-message">
          Você desbloqueou a tabuada do {unlockCelebration} em {categoryLabel} - {questionTypeLabel}!
        </p>
        <button
          ref={buttonRef}
          className="unlock-btn"
          onClick={dismissCelebration}
          type="button"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
