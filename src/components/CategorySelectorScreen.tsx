import { getAllCategories } from "../domain/category-registry";
import { useProgress } from "../context/ProgressContext";
import "./CategorySelectorScreen.css";

export function CategorySelectorScreen() {
  const { setCategoryId, navigateTo } = useProgress();

  const categories = getAllCategories();

  const handleSelect = (categoryId: string) => {
    setCategoryId(categoryId);
    navigateTo({ type: "question-type-select", categoryId });
  };

  if (categories.length === 0) {
    return (
      <div className="screen category-screen">
        <h1 className="category-screen__title">Escolha a Operação</h1>
        <p className="category-screen__empty">Nenhuma categoria disponível</p>
      </div>
    );
  }

  return (
    <div className="screen category-screen">
      <h1 className="category-screen__title">Escolha a Operação</h1>
      <p className="category-screen__subtitle">Selecione o tipo de conta</p>

      <div className="category-screen__options">
        {categories.map((category) => (
          <button
            key={category.id}
            className="category-screen__option"
            onClick={() => handleSelect(category.id)}
            aria-label={category.label}
          >
            <span className="category-screen__option-icon" aria-hidden="true">
              {category.operator}
            </span>
            <span className="category-screen__option-label">{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
