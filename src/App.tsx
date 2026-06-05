import { ProgressProvider, useProgress } from "./context/ProgressContext";
import { Header } from "./components/Header";
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
      <Header />
      <main className="app-main">
        {screen.type === "selection" && <TableSelectionScreen />}
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
