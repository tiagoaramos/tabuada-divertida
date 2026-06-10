import { useProgress } from "../context/ProgressContext";

export function Header() {
  const { screen, navigateTo, currentStudent, logout, categoryId, questionTypeId } = useProgress();

  const handleBack = () => {
    switch (screen.type) {
      case "category-select":
        // From Category_Selector → Student_Select
        logout();
        break;
      case "question-type-select":
        // From Question_Type_Selector → Category_Selector
        navigateTo({ type: "category-select" });
        break;
      case "table-selection":
        // From Table_Selection → Question_Type_Selector (preserving category)
        navigateTo({ type: "question-type-select", categoryId: screen.categoryId });
        break;
      case "selection":
        // Legacy: go to category-select
        navigateTo({ type: "category-select" });
        break;
      case "practice":
        // From Practice → Table_Selection (preserving category + question type)
        navigateTo({ type: "table-selection", categoryId: screen.categoryId, questionTypeId: screen.questionTypeId });
        break;
      case "random-practice":
        // From Random Practice → Table_Selection (preserving category + question type)
        navigateTo({ type: "table-selection", categoryId, questionTypeId });
        break;
      case "stats":
        // From Stats → Table_Selection (or category-select if no table-selection context)
        navigateTo({ type: "category-select" });
        break;
      default:
        navigateTo({ type: "category-select" });
        break;
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="header-btn"
          onClick={handleBack}
          aria-label="Voltar"
        >
          ←
        </button>
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
