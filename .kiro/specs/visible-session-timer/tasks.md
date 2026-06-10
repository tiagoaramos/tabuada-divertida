# Implementation Plan: Visible Session Timer

## Overview

Add an elapsed session timer to both practice screens using a shared custom hook (`useSessionTimer`) and a presentational component (`SessionTimer`). The hook manages interval-based counting, and the component renders the formatted time. Integration into `PracticeScreen` and `RandomPracticeScreen` places the timer between the `<h2>` title and `<QuestionDisplay>`.

## Tasks

- [x] 1. Create useSessionTimer hook and formatElapsedTime utility
  - [x] 1.1 Create `src/hooks/useSessionTimer.ts` with `formatElapsedTime` and `useSessionTimer`
    - Export `formatElapsedTime(totalSeconds: number): string` as a pure function
    - Implement `useSessionTimer()` hook using `useState(0)` and `useEffect` with `setInterval(1000)`
    - Hook returns the formatted MM:SS string via `formatElapsedTime`
    - Cleanup `clearInterval` in the useEffect return function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [x]* 1.2 Write property test for formatElapsedTime
    - **Property 1: Time formatting correctness**
    - Use fast-check to generate arbitrary non-negative integers
    - Assert that `formatElapsedTime(n)` equals `String(Math.floor(n/60)).padStart(2,'0') + ':' + String(n%60).padStart(2,'0')`
    - **Validates: Requirements 1.4, 2.1, 2.2, 2.3, 2.4**

  - [x]* 1.3 Write unit tests for useSessionTimer hook lifecycle
    - Test that hook returns "00:00" immediately on mount
    - Test that after advancing fake timers by 1 second, hook returns "00:01"
    - Test that after 65 seconds, hook returns "01:05"
    - Test that interval is cleared on unmount (no state updates after unmount)
    - Use `vi.useFakeTimers()` and `@testing-library/react` `renderHook`
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2. Create SessionTimer presentational component
  - [x] 2.1 Create `src/components/SessionTimer.tsx`
    - Accept `display: string` prop
    - Render a `<div className="session-timer">` with `role="timer"` and `aria-label="Tempo da sessão"`
    - Render a `<span className="session-timer__digits">` with the display value
    - _Requirements: 6.2, 6.3_

  - [x] 2.2 Create `src/components/SessionTimer.css`
    - Style `.session-timer` with center alignment, subdued color, small margin
    - Style `.session-timer__digits` with monospace font and `font-variant-numeric: tabular-nums`
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Checkpoint - Verify hook and component in isolation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate SessionTimer into practice screens
  - [x] 4.1 Integrate into `src/components/PracticeScreen.tsx`
    - Import `useSessionTimer` from `../hooks/useSessionTimer`
    - Import `SessionTimer` from `./SessionTimer`
    - Call `const sessionTime = useSessionTimer()` at the top of the component
    - Render `<SessionTimer display={sessionTime} />` between the `<h2>` title and `<QuestionDisplay />`
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.3_

  - [x] 4.2 Integrate into `src/components/RandomPracticeScreen.tsx`
    - Import `useSessionTimer` from `../hooks/useSessionTimer`
    - Import `SessionTimer` from `./SessionTimer`
    - Call `const sessionTime = useSessionTimer()` at the top of the component
    - Render `<SessionTimer display={sessionTime} />` between the `<h2>` title and `<QuestionDisplay />`
    - _Requirements: 4.1, 4.2, 4.3, 5.2, 5.3_

  - [x]* 4.3 Write unit tests for SessionTimer integration
    - Test that PracticeScreen renders a timer element with role="timer"
    - Test that RandomPracticeScreen renders a timer element with role="timer"
    - Verify timer starts at "00:00" on mount for both screens
    - Use fake timers to verify increment does not stop during feedback overlay display
    - **Validates: Requirements 3.1, 4.1, 5.1, 5.2**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the `formatElapsedTime` pure function across arbitrary inputs
- Unit tests validate hook lifecycle and component integration
- The session timer is completely independent from the per-question `startTimeRef` response timer

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["4.1", "4.2"] },
    { "id": 3, "tasks": ["4.3"] }
  ]
}
```
