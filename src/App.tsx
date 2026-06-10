import { ProgressProvider, useProgress } from "./context/ProgressContext";
import { Header } from "./components/Header";
import { StudentSelectScreen } from "./components/StudentSelectScreen";
import { CategorySelectorScreen } from "./components/CategorySelectorScreen";
import { QuestionTypeSelectorScreen } from "./components/QuestionTypeSelectorScreen";
import { TableSelectionScreen } from "./components/TableSelectionScreen";
import { PracticeScreen } from "./components/PracticeScreen";
import { RandomPracticeScreen } from "./components/RandomPracticeScreen";
import { StatsScreen } from "./components/StatsScreen";
import { UnlockCelebration } from "./components/UnlockCelebration";
import "./App.css";

function AppContent() {
  const { screen } = useProgress();

  return (
    <div className="app">
      {screen.type !== "student-select" && <Header />}
      <main className="app-main">
        {screen.type === "student-select" && <StudentSelectScreen />}
        {screen.type === "category-select" && <CategorySelectorScreen />}
        {screen.type === "question-type-select" && (
          <QuestionTypeSelectorScreen categoryId={screen.categoryId} />
        )}
        {screen.type === "selection" && <TableSelectionScreen />}
        {screen.type === "table-selection" && <TableSelectionScreen />}
        {screen.type === "practice" && (
          <PracticeScreen tableNumber={screen.tableNumber} />
        )}
        {screen.type === "random-practice" && <RandomPracticeScreen />}
        {screen.type === "stats" && <StatsScreen />}
      </main>
      <UnlockCelebration />
    </div>
  );
}

function App() {
  return (
    <ProgressProvider>
      <AppContent />
    </ProgressProvider>
  );
}

export default App;
