# Project Structure

```
src/
├── types/index.ts        # All shared TypeScript interfaces and types
├── domain/               # Pure business logic (no React, no side effects)
│   ├── evaluation.ts     # Answer correctness checking
│   ├── questions.ts      # Question generation and session cycling
│   ├── persistence.ts    # localStorage load/save logic
│   ├── response-times.ts # Response time record creation and storage
│   ├── stats.ts          # Mastery level calculation
│   └── unlock.ts         # Table unlock conditions
├── context/              # React context providers (app state management)
│   └── ProgressContext.tsx
├── hooks/                # Custom React hooks
│   └── useSessionTimer.ts
├── components/           # React UI components
│   ├── Header.tsx
│   ├── TableSelectionScreen.tsx
│   ├── PracticeScreen.tsx
│   ├── RandomPracticeScreen.tsx
│   ├── StatsScreen.tsx
│   ├── QuestionDisplay.tsx
│   ├── AnswerInput.tsx
│   ├── FeedbackOverlay.tsx
│   ├── SessionTimer.tsx
│   ├── TableCard.tsx
│   └── UnlockCelebration.tsx
├── App.tsx               # Root component with screen routing
├── main.tsx              # Entry point
└── App.css / index.css   # Global styles
```

## Architecture Rules

1. **Domain layer is pure** — functions in `src/domain/` take inputs, return outputs, have no React dependencies and no direct DOM/browser access (except localStorage in persistence.ts).
2. **Types are centralized** — all shared interfaces live in `src/types/index.ts`.
3. **State lives in context** — `ProgressContext` is the single source of truth for app state. Components read from it via `useProgress()`.
4. **Components are presentational where possible** — complex logic goes in domain or hooks, not in component bodies.
5. **Tests colocate with source** — test files sit next to their source file with `.test.ts` or `.test.tsx` suffix. Property-based tests use `.property.test.ts`.
6. **CSS colocates with components** — component-specific styles use `ComponentName.css` alongside the component file.
7. **Navigation is state-driven** — the `Screen` type union in context determines which screen renders. No router library.
