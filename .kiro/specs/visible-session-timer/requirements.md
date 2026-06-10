# Requirements Document

## Introduction

This feature adds a visible elapsed session timer to both the PracticeScreen and RandomPracticeScreen components. The timer displays total time spent in the current practice session in MM:SS format, positioned below the screen title. A shared custom hook (useSessionTimer) encapsulates the timing logic for reuse across both screens.

## Glossary

- **Session_Timer**: A visible UI element that displays the total elapsed time since the student entered a practice screen, formatted as MM:SS
- **PracticeScreen**: The screen component where a student practices a specific multiplication table (displays title "Tabuada do X")
- **RandomPracticeScreen**: The screen component where a student practices random multiplication questions from all unlocked tables (displays title "Modo Aleatório")
- **useSessionTimer_Hook**: A custom React hook that manages elapsed time state, starts counting on mount, and provides the formatted time string
- **Elapsed_Time**: The total number of whole seconds that have passed since the timer started
- **MM_SS_Format**: A time display format showing minutes (zero-padded to 2 digits) followed by a colon and seconds (zero-padded to 2 digits), e.g., "02:45"

## Requirements

### Requirement 1: Session Timer Hook Lifecycle

**User Story:** As a developer, I want a reusable hook that tracks elapsed time from mount to unmount, so that both practice screens can share the same timing logic.

#### Acceptance Criteria

1. WHEN the useSessionTimer_Hook is mounted, THE useSessionTimer_Hook SHALL start counting elapsed seconds from zero
2. WHILE the useSessionTimer_Hook is mounted, THE useSessionTimer_Hook SHALL increment the Elapsed_Time by one every second
3. WHEN the useSessionTimer_Hook is unmounted, THE useSessionTimer_Hook SHALL stop incrementing and release its interval resource
4. THE useSessionTimer_Hook SHALL return the Elapsed_Time formatted in MM_SS_Format

### Requirement 2: Timer Display Format

**User Story:** As a student, I want to see the elapsed time in a clear minutes-and-seconds format, so that I can understand how long I have been practicing.

#### Acceptance Criteria

1. THE Session_Timer SHALL display the Elapsed_Time in MM_SS_Format
2. WHEN the Elapsed_Time is less than 60 seconds, THE Session_Timer SHALL display minutes as "00" (e.g., "00:37")
3. WHEN the Elapsed_Time reaches or exceeds 60 seconds, THE Session_Timer SHALL display the correct number of whole minutes and remaining seconds (e.g., "02:05" for 125 seconds)
4. THE Session_Timer SHALL zero-pad both the minutes and seconds portions to exactly two digits

### Requirement 3: Timer Placement on PracticeScreen

**User Story:** As a student practicing a specific table, I want to see a session timer below the title, so that I can track how long I have been practicing.

#### Acceptance Criteria

1. WHEN the PracticeScreen is rendered, THE PracticeScreen SHALL display the Session_Timer below the screen title "Tabuada do X" and above the question area
2. WHEN the student enters the PracticeScreen, THE Session_Timer SHALL start from "00:00"
3. WHEN the student leaves the PracticeScreen, THE Session_Timer SHALL stop and reset

### Requirement 4: Timer Placement on RandomPracticeScreen

**User Story:** As a student practicing in random mode, I want to see a session timer below the title, so that I can track how long I have been practicing.

#### Acceptance Criteria

1. WHEN the RandomPracticeScreen is rendered, THE RandomPracticeScreen SHALL display the Session_Timer below the screen title "Modo Aleatório" and above the question area
2. WHEN the student enters the RandomPracticeScreen, THE Session_Timer SHALL start from "00:00"
3. WHEN the student leaves the RandomPracticeScreen, THE Session_Timer SHALL stop and reset

### Requirement 5: Timer Continuity During Practice

**User Story:** As a student, I want the timer to run continuously while I am on the practice screen, so that I get an accurate measure of my total session time.

#### Acceptance Criteria

1. WHILE the student is on the PracticeScreen, THE Session_Timer SHALL continue incrementing regardless of feedback overlays or question transitions
2. WHILE the student is on the RandomPracticeScreen, THE Session_Timer SHALL continue incrementing regardless of feedback overlays or question transitions
3. THE Session_Timer SHALL operate independently from the per-question response time tracking

### Requirement 6: Timer Visual Styling

**User Story:** As a student, I want the timer to be visually distinct but not distracting, so that I can glance at it without losing focus on the questions.

#### Acceptance Criteria

1. THE Session_Timer SHALL be styled using plain CSS
2. THE Session_Timer SHALL be visually distinguishable from the screen title and question display area
3. THE Session_Timer SHALL use a monospace or tabular-number font style to prevent layout shifts as digits change
