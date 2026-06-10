# Design Document

## Overview

This feature adds a visible elapsed session timer to both practice screens. It consists of a custom React hook for timing logic and a presentational component for rendering, integrated into the existing screen components.

## Architecture

The visible session timer feature introduces a lightweight timing layer using a custom React hook (`useSessionTimer`) and a presentational component (`SessionTimer`). The hook encapsulates all state and interval management, while the component handles rendering and styling. Both `PracticeScreen` and `RandomPracticeScreen` consume the hook independently, ensuring each screen has its own timer lifecycle tied to mount/unmount.

```
┌─────────────────────────────────────────────┐
│  PracticeScreen / RandomPracticeScreen      │
│  ┌───────────────────────────────────────┐  │
│  │  useSessionTimer()                    │  │
│  │  - useState(0) for elapsedSeconds     │  │
│  │  - useEffect with setInterval(1000ms) │  │
│  │  - returns formatted MM:SS string     │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  <SessionTimer display={formattedTime}│  │
│  │  />                                   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Components and Interfaces

### useSessionTimer Hook

**File:** `src/hooks/useSessionTimer.ts`

A custom React hook that manages the elapsed time counter.

```typescript
import { useState, useEffect } from "react";

export function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function useSessionTimer(): string {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return formatElapsedTime(elapsedSeconds);
}
```

**Key decisions:**
- `formatElapsedTime` is exported separately as a pure function for easy testability
- The hook returns only the formatted string — consumers don't need raw seconds
- The interval is created once on mount and cleaned up on unmount via the useEffect cleanup function
- State starts at 0 and increments by 1 each second, completely independent of any other timers

### SessionTimer Component

**File:** `src/components/SessionTimer.tsx`

A stateless presentational component that displays the formatted time.

```typescript
import "./SessionTimer.css";

interface SessionTimerProps {
  display: string;
}

export function SessionTimer({ display }: SessionTimerProps) {
  return (
    <div className="session-timer" aria-label="Tempo da sessão" role="timer">
      <span className="session-timer__digits">{display}</span>
    </div>
  );
}
```

**Key decisions:**
- Pure presentational component — receives formatted string as prop
- Uses `role="timer"` and `aria-label` for accessibility
- CSS class-based styling keeps it decoupled from logic

### SessionTimer.css

**File:** `src/components/SessionTimer.css`

```css
.session-timer {
  text-align: center;
  margin: 0.25rem 0 0.75rem;
  color: var(--text-secondary, #666);
  font-size: 0.9rem;
}

.session-timer__digits {
  font-family: "Courier New", Courier, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}
```

**Key decisions:**
- Monospace font + `font-variant-numeric: tabular-nums` prevents layout shifts when digits change
- Subdued color keeps focus on the question area
- Small top margin positions it tightly below the title

## Integration Points

### PracticeScreen Integration

The hook is called at the top of `PracticeScreen`. The `SessionTimer` component is rendered between the `<h2>` title and `<QuestionDisplay>`.

```typescript
// Inside PracticeScreen component
const sessionTime = useSessionTimer();

// In JSX, after <h2>Tabuada do {tableNumber} ✏️</h2>
<SessionTimer display={sessionTime} />
```

### RandomPracticeScreen Integration

Same pattern as PracticeScreen:

```typescript
// Inside RandomPracticeScreen component
const sessionTime = useSessionTimer();

// In JSX, after <h2>🎲 Modo Aleatório</h2>
<SessionTimer display={sessionTime} />
```

### Non-interference with Per-Question Timer

The existing `startTimeRef` in both screens uses `performance.now()` to measure individual question response times. The session timer uses an independent `useState` + `setInterval` pattern. They share no state and cannot interfere with each other:

- `startTimeRef`: measures milliseconds between question display and answer submission (per-question)
- `useSessionTimer`: counts whole seconds since screen mount (per-session)

## Data Models

No new data persistence is needed. The timer is ephemeral — it exists only in component state and resets on unmount/remount.

| Field | Type | Description |
|-------|------|-------------|
| `elapsedSeconds` | `number` | Internal state: whole seconds since mount (starts at 0) |
| `formattedTime` | `string` | Return value: MM:SS formatted string |

## Error Handling

- **Interval cleanup:** The `useEffect` cleanup function guarantees `clearInterval` is called on unmount, preventing memory leaks or stale updates
- **No external dependencies:** The timer has no network calls, storage operations, or error-prone I/O — it only uses `setInterval` and React state
- **Overflow:** For sessions exceeding 99 minutes (unlikely in a children's math trainer), the format naturally extends (e.g., "120:05") since `padStart(2, "0")` does not truncate larger numbers

## Testing Strategy

- **Property-based tests (fast-check):** Validate the `formatElapsedTime` pure function across a wide range of integer inputs to ensure formatting correctness
- **Unit tests (vitest):** Verify hook lifecycle behavior (start at zero, increment with fake timers, cleanup on unmount), component rendering (timer element position, accessibility attributes), and integration (non-interference with per-question timer)
- **Edge cases:** 0 seconds, exactly 60 seconds boundary, large values (>99 minutes)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time formatting correctness

*For any* non-negative integer `totalSeconds`, the function `formatElapsedTime(totalSeconds)` SHALL produce a string where the minutes portion equals `Math.floor(totalSeconds / 60)` zero-padded to 2 digits, followed by a colon, followed by the seconds portion equals `totalSeconds % 60` zero-padded to 2 digits.

**Validates: Requirements 1.4, 2.1, 2.2, 2.3, 2.4**

### Property 2: Monotonic increment

*For any* number of seconds `N` (where N >= 0) that have elapsed since the hook was mounted, the internal `elapsedSeconds` state SHALL equal `N`, meaning the timer increments exactly once per second and never skips or repeats a value.

**Validates: Requirements 1.2, 5.1, 5.2**

### Property 3: Timer continuity during interactions

*For any* sequence of user interactions (answering questions, viewing feedback overlays, transitioning between questions) occurring while the practice screen remains mounted, the session timer SHALL reflect only the total wall-clock seconds elapsed since mount, unaffected by those interactions.

**Validates: Requirements 5.1, 5.2, 5.3**
