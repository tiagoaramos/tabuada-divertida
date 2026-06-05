import { useProgress } from "../context/ProgressContext";
import { TableCard } from "./TableCard";

const TABLE_COLORS = [
  "linear-gradient(135deg, #FF6B6B, #FF8E8E)", // 2 - vermelho vibrante
  "linear-gradient(135deg, #FFA94D, #FFCB80)", // 3 - laranja
  "linear-gradient(135deg, #FFD43B, #FFE066)", // 4 - amarelo
  "linear-gradient(135deg, #69DB7C, #8CE99A)", // 5 - verde
  "linear-gradient(135deg, #4DABF7, #74C0FC)", // 6 - azul
  "linear-gradient(135deg, #9775FA, #B197FC)", // 7 - roxo
  "linear-gradient(135deg, #F06595, #F783AC)", // 8 - rosa
  "linear-gradient(135deg, #3BC9DB, #66D9E8)", // 9 - ciano
  "linear-gradient(135deg, #667EEA, #764BA2)", // 10 - gradiente especial
];

const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export function TableSelectionScreen() {
  const { progress, startSession, startRandomSession } = useProgress();

  return (
    <div className="screen table-selection-screen">
      <h2 className="table-selection-screen__title">
        Escolha uma tabuada para praticar! 🎯
      </h2>
      <p className="table-selection-screen__subtitle">
        Pratique e desbloqueie novas tabuadas! 💪
      </p>

      <button
        className="random-mode-btn"
        onClick={startRandomSession}
        aria-label="Modo aleatório: praticar tabuadas misturadas"
      >
        <span className="random-mode-btn__emoji">🎲</span>
        <span className="random-mode-btn__text">Modo Aleatório</span>
        <span className="random-mode-btn__desc">Tabuadas misturadas (3 a 9)</span>
      </button>

      <div className="table-selection-grid">
        {TABLES.map((tableNumber, index) => (
          <TableCard
            key={tableNumber}
            tableNumber={tableNumber}
            isUnlocked={progress.unlockedTables.includes(tableNumber)}
            stats={progress.tableStats[tableNumber]}
            color={TABLE_COLORS[index]}
            onSelect={startSession}
          />
        ))}
      </div>
    </div>
  );
}
