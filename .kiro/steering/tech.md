# Tech Stack

## Core

- **Language**: TypeScript (~6.0)
- **Framework**: React 19 (functional components, hooks only)
- **Bundler**: Vite 8
- **Package Manager**: npm

## Testing

- **Test Runner**: Vitest 4 with jsdom environment
- **Component Testing**: @testing-library/react + @testing-library/jest-dom
- **Property-Based Testing**: fast-check 4
- **Globals**: `describe`, `it`, `expect` available globally (no imports needed for Vitest globals)
- **Setup File**: `src/test-setup.ts`

## Linting

- ESLint 10 with typescript-eslint, react-hooks, and react-refresh plugins

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run test` | Run tests once (vitest --run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Key Conventions

- ES modules (`"type": "module"` in package.json)
- No external routing library — navigation is state-driven via context
- No CSS framework — plain CSS files colocated with components
- No external state management — React context + useState
- localStorage for persistence (no backend)
