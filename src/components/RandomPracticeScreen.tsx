import { useState, useEffect, useRef, useCallback } from "react";
import { useProgress } from "../context/ProgressContext";
import { evaluateAnswer } from "../domain/evaluation";
import { createResponseTimeRecord, saveResponseTimeRecord } from "../domain/response-times";
import { useSessionTimer } from "../hooks/useSessionTimer";
import type { FeedbackState } from "../types";
import { QuestionDisplay } from "./QuestionDisplay";
import { AnswerInput } from "./AnswerInput";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { SessionTimer } from "./SessionTimer";

export function RandomPracticeScreen() {
  const { randomSession, submitAnswer, advanceRandomSession } = useProgress();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({ type: "none" });
  const [questionKey, setQuestionKey] = useState(0);
  const startTimeRef = useRef<number>(0);
  const sessionTime = useSessionTimer();

  // Advance session to load the first question on mount
  useEffect(() => {
    if (randomSession && randomSession.currentIndex === 0) {
      advanceRandomSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuestion =
    randomSession && randomSession.currentIndex > 0
      ? randomSession.questions[randomSession.currentIndex - 1]
      : null;

  // Start timer when a new question is displayed
  useEffect(() => {
    if (currentQuestion) {
      startTimeRef.current = performance.now();
    }
  }, [currentQuestion]);

  const handleFeedbackTimeout = useCallback(() => {
    advanceRandomSession();
    setQuestionKey((k) => k + 1);
    setFeedbackState({ type: "none" });
  }, [advanceRandomSession]);

  const handleAnswer = (answer: number) => {
    if (!currentQuestion || feedbackState.type !== "none") return;

    const elapsedMs = performance.now() - startTimeRef.current;
    const isCorrect = evaluateAnswer(currentQuestion, answer);

    // Create and persist response time record
    const record = createResponseTimeRecord(currentQuestion, elapsedMs, isCorrect);
    saveResponseTimeRecord(record);

    // Submit answer to context (updates progress for the specific table, but no unlock)
    submitAnswer(currentQuestion.factorA, answer, currentQuestion, true);

    if (isCorrect) {
      setFeedbackState({ type: "correct" });
    } else {
      setFeedbackState({ type: "incorrect", correctAnswer: currentQuestion.correctAnswer });
    }
  };

  if (!randomSession || !currentQuestion) {
    return (
      <div className="screen practice-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="screen practice-screen">
      <h2>🎲 Modo Aleatório</h2>

      <SessionTimer display={sessionTime} />

      <QuestionDisplay question={currentQuestion} />

      {feedbackState.type === "none" && (
        <AnswerInput
          onSubmit={handleAnswer}
          disabled={false}
          questionKey={questionKey}
        />
      )}

      {feedbackState.type !== "none" && (
        <FeedbackOverlay
          type={feedbackState.type}
          correctAnswer={
            feedbackState.type === "incorrect"
              ? feedbackState.correctAnswer
              : currentQuestion.correctAnswer
          }
          onTimeout={handleFeedbackTimeout}
        />
      )}
    </div>
  );
}
