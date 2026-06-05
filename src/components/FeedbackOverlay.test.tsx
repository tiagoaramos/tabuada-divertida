import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FeedbackOverlay } from "./FeedbackOverlay";

describe("FeedbackOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("correct feedback", () => {
    it("renders stars and a positive message", () => {
      const onTimeout = vi.fn();
      render(
        <FeedbackOverlay type="correct" correctAnswer={12} onTimeout={onTimeout} />
      );

      expect(screen.getByText("🌟🌟🌟")).toBeInTheDocument();
      // Should have a positive message (one of the predefined ones)
      const overlay = screen.getByText("🌟🌟🌟").closest(".feedback-overlay");
      expect(overlay).toHaveClass("feedback-correct");
    });

    it("calls onTimeout after 1.5 seconds", () => {
      const onTimeout = vi.fn();
      render(
        <FeedbackOverlay type="correct" correctAnswer={12} onTimeout={onTimeout} />
      );

      expect(onTimeout).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1499);
      });
      expect(onTimeout).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe("incorrect feedback", () => {
    it("renders the correct answer prominently", () => {
      const onTimeout = vi.fn();
      render(
        <FeedbackOverlay type="incorrect" correctAnswer={42} onTimeout={onTimeout} />
      );

      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("42")).toHaveClass("answer-highlight");
    });

    it("shows an encouraging message without negative language", () => {
      const onTimeout = vi.fn();
      render(
        <FeedbackOverlay type="incorrect" correctAnswer={42} onTimeout={onTimeout} />
      );

      const overlay = screen.getByText("42").closest(".feedback-overlay");
      expect(overlay).toHaveClass("feedback-incorrect");
      // Should not contain negative words
      const overlayText = overlay?.textContent ?? "";
      expect(overlayText).not.toMatch(/errado|incorret|falh/i);
    });

    it("calls onTimeout after 3 seconds", () => {
      const onTimeout = vi.fn();
      render(
        <FeedbackOverlay type="incorrect" correctAnswer={42} onTimeout={onTimeout} />
      );

      expect(onTimeout).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(onTimeout).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("cleans up timeout on unmount", () => {
      const onTimeout = vi.fn();
      const { unmount } = render(
        <FeedbackOverlay type="correct" correctAnswer={12} onTimeout={onTimeout} />
      );

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(onTimeout).not.toHaveBeenCalled();
    });
  });
});
