# Implementation Plan: Multi-Category Math Trainer

## Overview

Transform the Math Trainer from a single-operation app into an extensible multi-category, multi-question-type platform. Implementation follows a bottom-up approach: domain layer first (registry, progress-key, distractor generation, question generation updates), then context/state management, then UI components (new screens, modified screens), and finally integration wiring and data migration.

## Tasks

- [ ] 1. Create domain foundations: Category Registry and Progress Key
  - [ ] 1.1 Create `src/domain/category-registry.ts` with CategoryDefinition interface and registry
    - Define `CategoryDefinition` interface with id, label, operator, icon, compute fields
    - Implement registry Map, `registerCategory()`, `getCategory()`, `getAllCategories()`
    - Add validation: id format (lowercase alphanumeric + hyphens, max 32 chars), label max 50 chars, operator max 3 chars, non-empty fields
    - Add duplicate rejection with descriptive error
    - Register "addition" (label "Soma", operator "+", compute: (a,b) => a+b) and "multiplication" (label "Multiplicação", operator "×", compute: (a,b) => a*b)
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 14.1_

  - [ ]* 1.2 Write property tests for Category Registry
    - **Property 1: Category registry validation**
    - **Property 2: Duplicate and invalid category rejection**
    - **Validates: Requirements 1.1, 1.4, 1.5**

  - [ ] 1.3 Create `src/domain/progress-key.ts` with ProgressKey type and utilities
    - Define `QuestionTypeId` type ("open" | "multiple-choice")
    - Define `ProgressKey` template literal type
    - Implement `buildProgressKey(categoryId, questionTypeId)` returning formatted string
    - Implement `parseProgressKey(key)` returning { categoryId, questionTypeId }
    - Implement `getStorageKey(studentId, progressKey)` returning "math-trainer-progress-{studentId}-{categoryId}-{questionTypeId}"
    - _Requirements: 9.4, 12.1, 14.3_

  - [ ]* 1.4 Write property test for Progress Key storage key construction
    - **Property 13: Storage key construction**
    - **Validates: Requirements 14.3, 12.1**

- [ ] 2. Create Distractor Generator
  - [ ] 2.1 Create `src/domain/distractor-generator.ts`
    - Implement `generateDistractors(question, category)` returning exactly 3 distractor integers
    - Primary strategy: compute category.compute(factorA, factorB + offset) for offsets [-3,-2,-1,+1,+2,+3] with valid factorB in [1,10]
    - Filter: remove duplicates, remove correctAnswer, remove values < 1
    - If 3+ candidates: select 3 at random
    - Fallback: use correctAnswer ± offsets [-2,-1,+1,+2], filter out correctAnswer and values < 1, select 3
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7_

  - [ ]* 2.2 Write property test for Distractor Generator
    - **Property 8: Distractor generation validity**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.6, 6.7**

- [ ] 3. Update Question Generation for multi-category support
  - [ ] 3.1 Modify `src/domain/questions.ts` to accept category parameter
    - Update `generateSessionQuestions(tableNumber, category)` to use `category.compute` instead of hardcoded multiplication
    - Tag each question with `categoryId` from the category definition
    - Update `generateRandomSessionQuestions(category)` to use category compute function
    - Ensure factorA, factorB ranges remain [2-10] and [1-10] respectively for table mode, [3-9] for random
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 14.5_

  - [ ]* 3.2 Write property tests for multi-category question generation
    - **Property 3: Question generation structure validity**
    - **Property 4: Cycle completeness**
    - **Property 5: Cycle boundary non-repetition**
    - **Property 6: Random batch validity**
    - **Property 7: Random batch boundary non-repetition**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 14.5**

- [ ] 4. Checkpoint - Ensure all domain tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update Persistence and Progress for Progress_Key support
  - [ ] 5.1 Modify `src/domain/persistence.ts` to use Progress_Key-based storage
    - Update `saveProgress(studentId, progressKey, progress)` to write to key pattern "math-trainer-progress-{studentId}-{categoryId}-{questionTypeId}"
    - Update `loadProgress(studentId, progressKey)` to read from the corresponding key
    - Add structural validation: version === 1, valid unlockedTables (integers 2-10), valid tableStats (non-negative integers, totalCorrect <= totalAnswered)
    - Return default progress on missing/invalid/unparseable data without affecting other keys
    - Handle localStorage unavailability gracefully (no unhandled exceptions)
    - _Requirements: 9.1, 9.4, 9.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 5.2 Write property tests for persistence
    - **Property 9: Progress persistence round-trip and write isolation**
    - **Property 10: Persistence resilience**
    - **Validates: Requirements 9.1, 9.4, 9.5, 12.1, 12.2, 12.3, 12.4, 12.5**

  - [ ]* 5.3 Write property tests for stats and unlock
    - **Property 11: Mastery level calculation**
    - **Property 12: Unlock progression**
    - **Validates: Requirements 9.3, 4.3, 10.2, 10.3, 10.4, 10.7**

- [ ] 6. Update Types and Navigation State
  - [ ] 6.1 Update `src/types/index.ts` with new types and extended Screen union
    - Add `QuestionTypeId` type export
    - Add `categoryId` field to `Question` interface
    - Extend `Screen` type with: "category-select", "question-type-select" (with categoryId), updated "table-selection", "practice", "random-practice" states to include categoryId and questionTypeId
    - _Requirements: 13.1, 9.1_

  - [ ] 6.2 Update `src/context/ProgressContext.tsx` to manage Progress_Key state
    - Add active Progress_Key state (categoryId + questionTypeId)
    - Update `loadProgress` / `saveProgress` calls to use Progress_Key-based persistence
    - Provide methods to set active category and question type
    - Load progress independently per Progress_Key when switching
    - _Requirements: 9.1, 9.6, 13.5_

- [ ] 7. Implement new navigation screens
  - [ ] 7.1 Create `src/components/CategorySelectorScreen.tsx`
    - Render one selectable option per registry entry with label and icon
    - Use `getAllCategories()` from registry to iterate entries
    - Navigate to question-type-select screen on selection
    - Show "no categories available" message if registry is empty
    - Ensure minimum 48x48px tap targets
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 14.2_

  - [ ] 7.2 Create `src/components/QuestionTypeSelectorScreen.tsx`
    - Display category name and two options: "Questão Aberta" and "Múltipla Escolha"
    - Each option includes description (max 60 chars) and minimum 48x48px tap target
    - Navigate to table-selection with category + question type on selection
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 7.3 Create `src/components/MultipleChoiceInput.tsx`
    - Render 4 shuffled option buttons (1 correct + 3 distractors)
    - Report selected value on tap
    - Minimum 48x48px tap targets
    - Disable during feedback display
    - _Requirements: 6.1, 6.4, 6.5, 6.8, 8.6_

- [ ] 8. Modify existing screens for multi-category support
  - [ ] 8.1 Update `src/components/TableSelectionScreen.tsx` for Progress_Key
    - Accept Progress_Key (category + question type) as context
    - Show lock/unlock state based on current Progress_Key's progress
    - Display mastery percentage per unlocked table for current Progress_Key
    - Locked tables are non-interactive with aria-disabled="true"
    - Include "Modo Aleatório" option for current Progress_Key
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 8.2 Update `src/components/PracticeScreen.tsx` for multi-category and question types
    - Render `AnswerInput` for open-answer or `MultipleChoiceInput` for multiple-choice based on active question type
    - Use category from registry for operator display and answer computation
    - Pass category to question generator
    - _Requirements: 6.1, 7.1, 7.4, 8.1, 8.2, 8.3, 8.4, 8.6_

  - [ ] 8.3 Update `src/components/RandomPracticeScreen.tsx` for multi-category support
    - Same pattern as PracticeScreen: render appropriate input based on question type
    - Use category compute function for question generation
    - _Requirements: 4.5, 5.5, 5.6_

  - [ ] 8.4 Update `src/components/QuestionDisplay.tsx` to use category operator
    - Render operator symbol from category registry instead of hardcoded "×"
    - Display format: "{factorA} {operator} {factorB} = ?"
    - _Requirements: 7.4, 5.1_

  - [ ] 8.5 Update `src/components/StatsScreen.tsx` for multi-category statistics
    - Organize by category → question type (4 sections at launch)
    - Show mastery, total answered, total correct per table per Progress_Key
    - Show overall totals per Progress_Key
    - Show random mode stats per Progress_Key
    - Handle zero-state (0% mastery, 0 answered, 0 correct)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 8.6 Update `src/components/UnlockCelebration.tsx` with category and question type info
    - Display category name + question type in celebration message
    - _Requirements: 10.5, 10.6_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Wire navigation flow and App integration
  - [ ] 10.1 Update `src/App.tsx` with extended navigation and screen routing
    - Add "category-select" and "question-type-select" screen states
    - Route: Student_Select → Category_Selector → QuestionType_Selector → Table_Selection → Practice
    - Implement back navigation at each level
    - Preserve selected category and question type in navigation state
    - Return to Table_Selection after practice session completes/exits
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 2.1, 2.5, 3.5_

  - [ ] 10.2 Add data migration for existing multiplication progress
    - On first load, check for legacy key pattern "math-trainer-progress-{studentId}"
    - Map existing data to "math-trainer-progress-{studentId}-multiplication-open"
    - Remove legacy key after successful migration
    - _Requirements: 9.1_

  - [ ]* 10.3 Write unit tests for navigation flow and data migration
    - Test full navigation flow: Student_Select → Category → QuestionType → Table → Practice
    - Test back button behavior at each level
    - Test data migration from legacy key to new Progress_Key pattern
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript with React 19, Vitest, and fast-check 4 for property-based testing
- Domain modules are pure functions with no React dependencies
- Navigation is state-driven via React context (no router library)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "2.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.2"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 7, "tasks": ["10.1", "10.2"] },
    { "id": 8, "tasks": ["10.3"] }
  ]
}
```
