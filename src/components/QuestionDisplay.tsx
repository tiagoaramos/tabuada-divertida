import type { Question } from "../types";

interface QuestionDisplayProps {
  question: Question;
}

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  return (
    <div className="question-display">
      <span className="question-factor">{question.factorA}</span>
      <span className="question-operator">×</span>
      <span className="question-factor">{question.factorB}</span>
      <span className="question-equals">=</span>
      <span className="question-placeholder">?</span>
    </div>
  );
}
