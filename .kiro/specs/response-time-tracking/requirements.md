# Requirements Document

## Introduction

Add an invisible response time counter to the Math Multiplication Trainer that records how long the student takes to answer each question. The timer operates silently in the background with no UI changes, no time limits, and no penalties. Collected data is stored in a dedicated localStorage key for future performance analysis.

## Glossary

- **Response_Time_Tracker**: The module responsible for measuring elapsed time between question display and answer submission.
- **Response_Time_Record**: A single data entry containing tableNumber, factorA, factorB, responseTimeMs, isCorrect, and timestamp.
- **Response_Times_Store**: The localStorage-based persistence layer using the key `math-trainer-response-times` to store response time records.
- **PracticeScreen**: The existing UI component where the student answers multiplication questions.
- **Rolling_Window**: A capped collection of the most recent 1000 Response_Time_Records, discarding older entries when the limit is exceeded.

## Requirements

### Requirement 1

**User Story:** As a parent/educator, I want response times recorded per question, so that I can analyze student performance patterns in the future.

#### Acceptance Criteria

1. WHEN a new question is displayed in the PracticeScreen, THE Response_Time_Tracker SHALL start measuring elapsed time in milliseconds.
2. WHEN the student submits an answer, THE Response_Time_Tracker SHALL stop measuring and produce a responseTimeMs value representing the elapsed time since the question was displayed.
3. WHEN the student submits an answer, THE Response_Time_Tracker SHALL create a Response_Time_Record containing tableNumber, factorA, factorB, responseTimeMs, isCorrect, and timestamp.

### Requirement 2

**User Story:** As a parent/educator, I want response time data stored independently from progress data, so that the tracking mechanism does not interfere with existing functionality.

#### Acceptance Criteria

1. THE Response_Times_Store SHALL persist Response_Time_Records using the localStorage key `math-trainer-response-times`.
2. THE Response_Times_Store SHALL store data independently from the existing `math-trainer-progress` localStorage key.
3. IF the Response_Times_Store contains 1000 or more entries, THEN THE Response_Times_Store SHALL discard the oldest entries to maintain a maximum of 1000 records (Rolling_Window).

### Requirement 3

**User Story:** As a student, I want to practice without visual pressure, so that I can focus on learning without stress.

#### Acceptance Criteria

1. THE Response_Time_Tracker SHALL operate without rendering any visible timer element in the UI.
2. THE Response_Time_Tracker SHALL impose no time limit on question responses.
3. THE Response_Time_Tracker SHALL apply no penalty or scoring modification based on response time.

### Requirement 4

**User Story:** As a developer, I want the response time data to be resilient to storage errors, so that the practice experience is never disrupted.

#### Acceptance Criteria

1. IF localStorage write fails during Response_Time_Record persistence, THEN THE Response_Times_Store SHALL silently discard the record without disrupting the practice session.
2. IF localStorage contains corrupted or unparseable response time data, THEN THE Response_Times_Store SHALL reset to an empty collection and continue operation.

### Requirement 5

**User Story:** As a developer, I want each Response_Time_Record to contain sufficient context, so that future analysis can be granular and meaningful.

#### Acceptance Criteria

1. THE Response_Time_Record SHALL include the field `tableNumber` as an integer from 2 to 10.
2. THE Response_Time_Record SHALL include the field `factorA` representing the first multiplicand.
3. THE Response_Time_Record SHALL include the field `factorB` representing the second multiplicand.
4. THE Response_Time_Record SHALL include the field `responseTimeMs` as a non-negative integer representing milliseconds.
5. THE Response_Time_Record SHALL include the field `isCorrect` as a boolean indicating whether the student's answer was correct.
6. THE Response_Time_Record SHALL include the field `timestamp` as an ISO 8601 string representing when the answer was submitted.
