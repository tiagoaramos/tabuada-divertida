import { useEffect } from "react";
import "./FeedbackOverlay.css";

interface FeedbackOverlayProps {
  type: "correct" | "incorrect";
  correctAnswer: number;
  onTimeout: () => void;
}

const POSITIVE_MESSAGES = [
  "Parabéns! 🎉",
  "Muito bem! 👏",
  "Excelente! 🥳",
  "Arrasou! 💪",
  "Incrível! ✨",
];

const ENCOURAGING_MESSAGES = [
  "Quase lá! 💪",
  "Continue tentando! 🚀",
  "Você consegue! 🌈",
  "Não desista! 💫",
  "Na próxima você acerta! 🍀",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function FeedbackOverlay({
  type,
  correctAnswer,
  onTimeout,
}: FeedbackOverlayProps) {
  useEffect(() => {
    const delay = type === "correct" ? 1500 : 3000;
    const timer = setTimeout(onTimeout, delay);
    return () => clearTimeout(timer);
  }, [type, onTimeout]);

  if (type === "correct") {
    return (
      <div className="feedback-overlay feedback-correct" aria-live="polite">
        <div className="feedback-stars">🌟🌟🌟</div>
        <p className="feedback-message">{getRandomMessage(POSITIVE_MESSAGES)}</p>
      </div>
    );
  }

  return (
    <div className="feedback-overlay feedback-incorrect" aria-live="polite">
      <p className="feedback-encourage">{getRandomMessage(ENCOURAGING_MESSAGES)}</p>
      <p className="feedback-correct-answer">
        A resposta certa é <span className="answer-highlight">{correctAnswer}</span>
      </p>
    </div>
  );
}
