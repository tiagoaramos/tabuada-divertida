import { useProgress } from "../context/ProgressContext";

export function Header() {
  const { screen, navigateTo, currentStudent, logout } = useProgress();

  return (
    <header className="app-header">
      <div className="header-left">
        {screen.type !== "selection" && (
          <button
            className="header-btn"
            onClick={() => navigateTo({ type: "selection" })}
            aria-label="Voltar para seleção"
          >
            ←
          </button>
        )}
      </div>

      <h1 className="header-title">🧮 Tabuada Divertida</h1>

      <div className="header-right">
        {currentStudent && (
          <span className="header-student-name">
            👤 {currentStudent.name}
          </span>
        )}
        {screen.type !== "stats" && (
          <button
            className="header-btn"
            onClick={() => navigateTo({ type: "stats" })}
            aria-label="Ver estatísticas"
          >
            📊
          </button>
        )}
        <button
          className="header-btn header-btn--logout"
          onClick={logout}
          aria-label="Trocar de aluno"
          title="Trocar de aluno"
        >
          🔄
        </button>
      </div>
    </header>
  );
}
