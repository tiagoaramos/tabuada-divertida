# Requirements Document

## Introduction

This feature expands the Math Trainer app from a single-operation, single-question-type system into an extensible multi-category, multi-question-type platform. The app will support multiple operation categories (initially "Soma"/addition and "Multiplicação"/multiplication), each offering two question types: "Questão Aberta" (typed open answer) and "Múltipla Escolha" (multiple choice with 4 options). Progress, unlocks, and statistics are tracked independently for each combination of category and question type. The architecture is designed so new categories (e.g., subtraction, division) and new question types can be added in the future with minimal changes.

## Glossary

- **App**: The Math Trainer application
- **Category**: An arithmetic operation type available for practice (e.g., addition, multiplication)
- **Category_Registry**: The extensible module that defines available categories and their metadata (label, icon, operator symbol, compute function)
- **Category_Selector**: The screen where the student chooses which operation category to practice
- **Question_Type**: The format in which a question is presented and answered; currently "Questão Aberta" (open/typed) or "Múltipla Escolha" (multiple choice)
- **Question_Type_Selector**: The screen where the student chooses a question type within the selected category
- **Open_Answer**: A question type where the student types a numeric answer
- **Multiple_Choice**: A question type where the student selects one answer from four displayed options
- **Distractor_Generator**: The module responsible for generating plausible incorrect options for multiple-choice questions
- **Table_Selection_Screen**: The screen listing available tables (2–10) for a given category and question type combination
- **Practice_Screen**: The screen where the student answers questions during a session
- **Question_Generator**: The domain module responsible for generating questions for any category
- **Progress_Store**: The module responsible for persisting and loading progress per category, per question type, per student
- **Unlock_Engine**: The logic that determines when a new table is unlocked, operating independently per category and question type combination
- **Progress_Key**: A unique combination of category + question type that identifies an independent progress track (e.g., "addition-open", "multiplication-multiple-choice")

## Requirements

### Requirement 1: Extensible Category System

**User Story:** As a developer, I want an extensible category registry, so that new operation types can be added in the future without modifying core application logic.

#### Acceptance Criteria

1. THE Category_Registry SHALL define each category with a unique string identifier (maximum 32 characters, lowercase alphanumeric and hyphens only), a display label in Brazilian Portuguese (maximum 50 characters), an operator symbol (maximum 3 characters), an icon identifier, and a compute function that accepts two numeric operands and returns a single numeric result
2. THE Category_Registry SHALL include exactly two categories at launch: "addition" (label "Soma", operator "+", compute function returning the sum of two operands) and "multiplication" (label "Multiplicação", operator "×", compute function returning the product of two operands)
3. THE App SHALL derive all category-dependent behavior (question generation, answer evaluation, display rendering) exclusively from the Category_Registry entries, so that registering a new category entry causes the App to generate questions, evaluate answers, and render display elements for that category without changes to existing source files
4. IF a category is registered with an identifier that already exists in the Category_Registry, THEN THE Category_Registry SHALL reject the registration and throw an error indicating a duplicate identifier
5. IF a category is registered with any required metadata field missing or empty, THEN THE Category_Registry SHALL reject the registration and throw an error indicating the missing field

### Requirement 2: Category Selection Screen

**User Story:** As a child, I want to choose between addition and multiplication practice, so that I can practice the type of math I need.

#### Acceptance Criteria

1. WHEN a student selects their profile on the Student_Select screen, THE App SHALL navigate to the Category_Selector screen
2. WHILE the Category_Selector screen is displayed, THE App SHALL render exactly one selectable option for each category registered in the Category_Registry, showing the category label text and a distinguishing icon for each
3. WHEN the user selects a category option, THE App SHALL navigate to the Question_Type_Selector screen for that category
4. WHILE the Category_Selector screen is displayed, THE App SHALL render each category option as a tap target with a minimum size of 48 × 48 CSS pixels
5. IF the user navigates back from the Question_Type_Selector screen, THEN THE App SHALL return to the Category_Selector screen with no category pre-selected
6. IF the Category_Registry contains zero categories, THEN THE App SHALL display a message indicating that no categories are available instead of rendering an empty list

### Requirement 3: Question Type Selection Screen

**User Story:** As a child, I want to choose between typing my answer or picking from options, so that I can practice in the way I prefer.

#### Acceptance Criteria

1. WHEN the user arrives at the Question_Type_Selector screen for a category, THE App SHALL display exactly two options: "Questão Aberta" and "Múltipla Escolha", along with the name of the selected category
2. WHEN the user selects "Questão Aberta", THE App SHALL navigate to the Table_Selection_Screen configured for the selected category with the open-answer question type
3. WHEN the user selects "Múltipla Escolha", THE App SHALL navigate to the Table_Selection_Screen configured for the selected category with the multiple-choice question type
4. WHILE the Question_Type_Selector screen is displayed, THE App SHALL render each question type option as a tap target with a minimum size of 48 × 48 CSS pixels and include a description of the question format of no more than 60 characters
5. IF the user navigates back from the Table_Selection_Screen, THEN THE App SHALL return to the Question_Type_Selector screen preserving the previously selected category context

### Requirement 4: Table Selection per Category and Question Type

**User Story:** As a child, I want to see which tables are unlocked for my chosen category and question type, so that I can pick a table to practice.

#### Acceptance Criteria

1. WHEN the Table_Selection_Screen is displayed, THE App SHALL show exactly 9 table entries numbered 2 through 10 for the current category and question type combination, indicating each table as either locked (non-interactive, displaying a lock icon) or unlocked (interactive) based on the independent unlock state for that Progress_Key
2. WHEN the user selects an unlocked table, THE App SHALL start a practice session for that table using the current category and question type
3. WHILE the Table_Selection_Screen is displayed, THE App SHALL display the mastery level percentage (0–100%, calculated as Math.round((totalCorrect / totalAnswered) * 100), or 0% if no questions have been answered) for each unlocked table based on the statistics for the current Progress_Key
4. IF the user attempts to interact with a locked table, THEN THE App SHALL not navigate away from the Table_Selection_Screen and SHALL keep the locked table rendered as a non-interactive element (aria-disabled="true")
5. THE Table_Selection_Screen SHALL include a "Modo Aleatório" (random mode) option that starts a random practice session for the current category and question type combination

### Requirement 5: Question Generation for All Categories

**User Story:** As a child, I want questions generated correctly for both addition and multiplication, so that I practice the right operations.

#### Acceptance Criteria

1. WHEN a table number N (2–10) is selected for practice in a category, THE Question_Generator SHALL produce questions of the form "N operator B" where B ranges from 1 to 10, operator is determined by the category (e.g., "+" for addition, "×" for multiplication), and the correct answer is computed using the category compute function
2. THE Question_Generator SHALL produce exactly 10 questions per cycle, covering all integer values of B from 1 to 10 inclusive, arranged in a shuffled order using an unbiased algorithm such that each permutation is equally likely
3. WHEN a cycle is exhausted, THE Question_Generator SHALL generate a new cycle ensuring the first question of the new cycle has a different B value from the last question of the previous cycle
4. THE Question_Generator SHALL tag each question with the category identifier so that display and evaluation logic can determine the correct operator symbol and compute function
5. WHEN random mode is initiated within any category, THE Question_Generator SHALL generate batches of exactly 10 questions with table numbers selected uniformly at random from the range 3–9, and operands B selected uniformly at random from 1–10, computing correct answers using the category compute function
6. WHEN a random mode batch is exhausted, THE Question_Generator SHALL generate a new batch ensuring the first question of the new batch does not repeat the same combination of table number and operand B as the last question of the previous batch

### Requirement 6: Multiple Choice Question Presentation

**User Story:** As a child, I want to pick from four answer choices, so that I can practice recognition of correct answers.

#### Acceptance Criteria

1. WHEN the question type is "Múltipla Escolha", THE Practice_Screen SHALL display exactly four answer options simultaneously: one correct answer and three distractors
2. THE Distractor_Generator SHALL produce three plausible distractors by computing results of nearby operations within the same category, where "nearby" means adjusting operand B by offsets in the range -3 to +3 (excluding 0) while keeping factorA fixed (e.g., for 5+3=8, candidates include 5+2=7, 5+4=9, 5+1=6)
3. THE Distractor_Generator SHALL ensure all four displayed options are distinct numeric values
4. THE Practice_Screen SHALL display the four options in a randomized order, re-shuffled independently for each new question presented
5. WHEN the student selects an option, THE App SHALL compare the selected value to the question's correctAnswer and evaluate the selection as correct if they are equal, or incorrect otherwise
6. THE Distractor_Generator SHALL constrain all distractors to non-negative integers with a minimum value of 1
7. IF the Distractor_Generator cannot produce three distinct distractors from nearby operations (due to operand B being near boundary 1 or 10), THEN THE Distractor_Generator SHALL fall back to generating distractors by adding offsets of -2, -1, +1, and +2 to the correct answer, selecting three distinct non-negative values that differ from the correct answer
8. WHEN the four options are displayed, THE Practice_Screen SHALL render each option as a tappable element with a minimum touch-target size of 48 × 48 CSS pixels

### Requirement 7: Open Answer Question Presentation

**User Story:** As a child, I want to type my answer into a number field, so that I can practice recall of math facts.

#### Acceptance Criteria

1. WHEN the question type is "Questão Aberta", THE Practice_Screen SHALL display a numeric input field where the student types a non-negative integer answer, and the input field SHALL receive focus automatically when a new question appears
2. WHEN the student submits an answer by pressing the Enter key or activating the submit button, THE App SHALL compare the typed integer value to the question's correctAnswer and determine correctness
3. IF the student enters a value that is not a non-negative integer (e.g., decimal, negative, or non-numeric characters), THEN THE Practice_Screen SHALL prevent submission and keep the current input value unchanged
4. WHILE the input field is active, THE Practice_Screen SHALL display the question in the format "{factorA} {operator} {factorB} = ?" where factorA is the table number (2–10), factorB is the operand (1–10), and operator is the category symbol from the Category_Registry
5. THE Practice_Screen SHALL constrain the numeric input field to accept a maximum of 3 digits (values 0 through 999)

### Requirement 8: Feedback System for Both Question Types

**User Story:** As a child, I want immediate feedback after I answer, so that I learn from my mistakes regardless of how I answered.

#### Acceptance Criteria

1. WHEN the student submits an answer (typed or selected), THE App SHALL display feedback indicating whether the answer is correct or incorrect on the practice screen without navigating away
2. IF the answer is incorrect, THEN THE App SHALL display the correct answer as a numeric value within the feedback area
3. WHEN correct feedback is displayed, THE App SHALL automatically advance to the next question after 1500 milliseconds
4. WHEN incorrect feedback is displayed, THE App SHALL automatically advance to the next question after 3000 milliseconds
5. WHILE a practice session is active, THE App SHALL display a session timer showing elapsed time in zero-padded MM:SS format (starting from 00:00 at session start), updated every 1 second
6. WHILE feedback is displayed, THE App SHALL disable answer input so that the student cannot submit another answer until the next question is presented

### Requirement 9: Independent Progress Tracking per Progress Key

**User Story:** As a child, I want my progress in addition open-answer tracked separately from addition multiple-choice and from multiplication, so that I can see how I'm improving in each mode independently.

#### Acceptance Criteria

1. THE Progress_Store SHALL maintain separate progress records for each Progress_Key (category + question type combination), resulting in four independent progress tracks at launch: addition-open, addition-multiple-choice, multiplication-open, multiplication-multiple-choice. Each progress record SHALL contain: unlockedTables (array of table numbers 2–10), tableStats (per-table totalAnswered, totalCorrect, and masteryLevel), and aggregate counters (totalAnswered, totalCorrect).
2. WHEN the student answers a question, THE Progress_Store SHALL update only the progress record matching the current Progress_Key, incrementing totalAnswered by 1 and incrementing totalCorrect by 1 if and only if the answer is correct, leaving all other Progress_Key records unchanged.
3. WHEN a progress record's tableStats entry is updated for a given table number, THE Progress_Store SHALL recalculate masteryLevel for that table as Math.round((totalCorrect / totalAnswered) * 100), yielding an integer from 0 to 100 inclusive. IF totalAnswered for that table is 0, THEN THE Progress_Store SHALL set masteryLevel to 0.
4. THE Progress_Store SHALL persist each Progress_Key's data under a distinct localStorage key per student, following the pattern "math-trainer-progress-{studentId}-{progressKey}" (e.g., "math-trainer-progress-abc123-multiplication-open"), so that writing data for one Progress_Key does not overwrite or modify data stored under any other Progress_Key.
5. IF progress data for a Progress_Key is absent from localStorage, OR JSON parsing fails, OR the parsed data fails structural validation (version field, valid unlockedTables array with integers 2–10, valid tableStats with non-negative integers where totalCorrect ≤ totalAnswered), THEN THE Progress_Store SHALL return a default progress state for that Progress_Key consisting of unlockedTables equal to [2], empty tableStats, totalAnswered equal to 0, and totalCorrect equal to 0, without reading, modifying, or invalidating data for any other Progress_Key.
6. WHEN the student switches between Progress_Keys (e.g., navigates from addition-open practice to multiplication-open practice), THE Progress_Store SHALL load the progress record for the newly selected Progress_Key and display its independent statistics, without merging or aggregating data from other Progress_Keys.

### Requirement 10: Independent Unlock System per Progress Key

**User Story:** As a child, I want to unlock new tables independently in each mode, so that mastering addition multiple-choice does not automatically unlock addition open-answer tables.

#### Acceptance Criteria

1. THE Unlock_Engine SHALL maintain independent unlock state for each Progress_Key (where a Progress_Key is defined as the combination of category — "addition" or "multiplication" — and question type — "open" or "multiple-choice"), so that tables unlocked in one Progress_Key have no effect on unlock state in any other Progress_Key
2. THE Unlock_Engine SHALL start each student with only table 2 unlocked for every Progress_Key
3. WHEN a student achieves the mastery threshold on a table within a specific Progress_Key, THE Unlock_Engine SHALL unlock the next sequential table (current highest unlocked table + 1, up to table 10) only within that same Progress_Key
4. THE Unlock_Engine SHALL define the mastery threshold as: at least 10 questions answered on that table within the Progress_Key AND a mastery level (Math.round((totalCorrect / totalAnswered) * 100)) of at least 80%
5. WHEN a new table is unlocked, THE App SHALL display a celebration dialog indicating the unlocked table number, the category name (e.g., "Soma" or "Multiplicação"), and the question type (e.g., "Questão Aberta" or "Múltipla Escolha") associated with the Progress_Key that triggered the unlock
6. WHEN a celebration dialog is displayed, THE App SHALL require the student to manually dismiss it by activating a confirmation button before resuming practice
7. IF the student has already unlocked table 10 for a given Progress_Key, THEN THE Unlock_Engine SHALL not unlock any further tables for that Progress_Key regardless of mastery achievements

### Requirement 11: Statistics Display per Category and Question Type

**User Story:** As a child, I want to see my statistics broken down by category and question type, so that I can understand where I'm strong and where I need more practice.

#### Acceptance Criteria

1. WHEN the user navigates to the statistics screen, THE App SHALL display statistics organized by category, with each category showing separate sections for each question type (resulting in four sections at launch: Soma Questão Aberta, Soma Múltipla Escolha, Multiplicação Questão Aberta, Multiplicação Múltipla Escolha)
2. THE App SHALL display mastery level as a percentage (0–100%), total answered, and total correct for each table (2–10) within each Progress_Key
3. THE App SHALL display overall totals (total answered, total correct, and overall percentage calculated as Math.round((totalCorrect / totalAnswered) * 100)) per Progress_Key in a summary area
4. THE App SHALL display random mode statistics (total answered, total correct, and percentage) separately for each Progress_Key that has random mode data
5. IF no questions have been answered for a given table or random mode within a Progress_Key, THEN THE App SHALL display that entry with 0% mastery, 0 answered, and 0 correct

### Requirement 12: Data Persistence Isolation

**User Story:** As a developer, I want each progress track stored in its own localStorage key, so that corruption in one track does not affect any other.

#### Acceptance Criteria

1. THE Progress_Store SHALL use a separate localStorage key for each Progress_Key per student, following the pattern "math-trainer-progress-{studentId}-{categoryId}-{questionTypeId}" (e.g., "math-trainer-progress-abc123-addition-open")
2. IF data for one Progress_Key is missing or fails validation, THEN THE Progress_Store SHALL return default progress for that Progress_Key without reading, modifying, or removing any other Progress_Key's localStorage data
3. WHEN the app initializes for a student, THE Progress_Store SHALL load each Progress_Key via independent localStorage read operations, so that a failure in parsing one key does not prevent other keys from loading successfully
4. WHEN the Progress_Store saves progress for a Progress_Key, THE Progress_Store SHALL write only to the localStorage key for that specific Progress_Key without modifying any other key
5. THE Progress_Store SHALL validate stored data structure on load, rejecting the entire stored object and returning default progress IF any of the following conditions are true: version field is not equal to 1, unlockedTables is not a non-empty array of integers between 2 and 10 inclusive, any tableStats entry has a key outside 2–10, totalCorrect or totalAnswered is not a non-negative integer, or totalCorrect exceeds totalAnswered
6. IF localStorage is unavailable or a write operation throws an error, THEN THE Progress_Store SHALL allow the app to continue operating with in-memory progress without throwing an unhandled exception

### Requirement 13: Student Navigation Flow

**User Story:** As a child, I want a clear step-by-step navigation from profile to practice, so that I always know where I am and can go back easily.

#### Acceptance Criteria

1. THE App SHALL implement the navigation flow: Student_Select → Category_Selector → Question_Type_Selector → Table_Selection_Screen → Practice_Screen
2. WHEN the user activates the back control from any screen, THE App SHALL return to the immediately preceding screen in the navigation flow
3. WHILE the student is on any screen beyond Student_Select, THE App SHALL display a visible back button that returns to the previous screen
4. WHEN the student completes or exits a practice session, THE App SHALL return to the Table_Selection_Screen for the current category and question type
5. THE App SHALL preserve the selected category and question type in navigation state so that returning from practice does not require re-selecting them
6. WHEN the user activates the back control from the Table_Selection_Screen, THE App SHALL return to the Question_Type_Selector screen for the current category
7. WHEN the user activates the back control from the Question_Type_Selector screen, THE App SHALL return to the Category_Selector screen

### Requirement 14: Future Extensibility

**User Story:** As a developer, I want the architecture to accommodate new categories and question types, so that features like subtraction or new question formats can be added with minimal code changes.

#### Acceptance Criteria

1. THE Category_Registry SHALL accept new category definitions that provide a unique string identifier, a display label, an operator symbol (single character), an icon reference, and a compute function of signature (operandA: number, operandB: number) => number, without requiring modifications to the Question_Generator, Unlock_Engine, Progress_Store, or Practice_Screen source files
2. THE App SHALL render category options on the Category_Selector screen by iterating over all entries currently in the Category_Registry, so that adding a new registry entry causes the corresponding option to appear without modifications to the Category_Selector source file
3. THE Progress_Store SHALL construct localStorage key names by concatenating a fixed application prefix, the student identifier, the category identifier, and the question-type identifier, so that any new category-and-question-type combination receives a dedicated storage key without code changes to the persistence layer
4. THE Unlock_Engine SHALL evaluate unlock conditions using only the Progress_Key's numeric statistics (totalAnswered, totalCorrect, masteryLevel) and SHALL contain zero conditional branches that reference specific category identifiers, so that new categories inherit the same unlock behavior by default
5. THE Question_Generator SHALL invoke the compute function provided by the Category_Registry entry to calculate the correct answer for each generated question, so that new operations (subtraction, division) require only a new registry entry containing the appropriate compute function
6. IF the Category_Registry contains zero entries, THEN THE App SHALL display the Category_Selector screen with no category options and SHALL not throw a runtime error
