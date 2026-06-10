import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useSessionTimer } from "./useSessionTimer";

/**
 * Validates: Requirements 1.1, 1.2, 1.3
 */
describe("useSessionTimer hook lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "00:00" immediately on mount', () => {
    const { result } = renderHook(() => useSessionTimer());
    expect(result.current).toBe("00:00");
  });

  it('returns "00:01" after 1 second', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe("00:01");
  });

  it('returns "01:05" after 65 seconds', () => {
    const { result } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(65000);
    });

    expect(result.current).toBe("01:05");
  });

  it("clears interval on unmount (no state updates after unmount)", () => {
    const { result, unmount } = renderHook(() => useSessionTimer());

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current).toBe("00:03");

    unmount();

    // Advancing timers after unmount should not cause errors or state updates
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // The last value before unmount should remain unchanged
    expect(result.current).toBe("00:03");
  });
});
