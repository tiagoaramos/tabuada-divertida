import { useProgress } from "../context/ProgressContext";
import { calculateOverallStats, calculateMasteryLevel } from "../domain/stats";

const TABLE_COLORS: Record<number, string> = {
  2: "#FF6B6B",
  3: "#FFA94D",
  4: "#FFD43B",
  5: "#69DB7C",
  6: "#4DABF7",
  7: "#9775FA",
  8: "#F06595",
  9: "#3BC9DB",
  10: "#667EEA",
};

const TABLE_EMOJIS: Record<number, string> = {
  2: "🐣",
  3: "🌈",
  4: "⭐",
  5: "🎈",
  6: "🐬",
  7: "🦄",
  8: "🌸",
  9: "🚀",
  10: "👑",
};

function getMasteryEmoji(percentage: number): string {
  if (percentage >= 80) return "🌟";
  if (percentage >= 50) return "💪";
  return "📚";
}

export function StatsScreen() {
  const { progress } = useProgress();
  const overall = calculateOverallStats(progress);
  const randomPercentage = calculateMasteryLevel(
    progress.randomStats.totalCorrect,
    progress.randomStats.totalAnswered
  );

  return (
    <div className="screen stats-screen">
      <h2 className="stats-screen__title">Suas Estatísticas 📊</h2>

      {/* Overall stats section */}
      <div className="stats-overall">
        <h3 className="stats-overall__heading">Resumo Geral 🏅</h3>
        <div className="stats-overall__cards">
          <div className="stats-overall__card stats-overall__card--questions">
            <span className="stats-overall__card-emoji">📝</span>
            <span className="stats-overall__card-value">{overall.totalAnswered}</span>
            <span className="stats-overall__card-label">Questões</span>
          </div>
          <div className="stats-overall__card stats-overall__card--correct">
            <span className="stats-overall__card-emoji">✅</span>
            <span className="stats-overall__card-value">{overall.totalCorrect}</span>
            <span className="stats-overall__card-label">Acertos</span>
          </div>
          <div className="stats-overall__card stats-overall__card--percentage">
            <span className="stats-overall__card-emoji">🎯</span>
            <span className="stats-overall__card-value">{overall.overallPercentage}%</span>
            <span className="stats-overall__card-label">Aproveitamento</span>
          </div>
        </div>
      </div>

      {/* Random mode stats section */}
      <div className="stats-random">
        <h3 className="stats-random__heading">🎲 Modo Aleatório</h3>
        {progress.randomStats.totalAnswered === 0 ? (
          <p className="stats-random__empty">Nenhuma questão respondida no modo aleatório ainda!</p>
        ) : (
          <div className="stats-overall__cards">
            <div className="stats-overall__card stats-overall__card--questions">
              <span className="stats-overall__card-emoji">📝</span>
              <span className="stats-overall__card-value">{progress.randomStats.totalAnswered}</span>
              <span className="stats-overall__card-label">Questões</span>
            </div>
            <div className="stats-overall__card stats-overall__card--correct">
              <span className="stats-overall__card-emoji">✅</span>
              <span className="stats-overall__card-value">{progress.randomStats.totalCorrect}</span>
              <span className="stats-overall__card-label">Acertos</span>
            </div>
            <div className="stats-overall__card stats-overall__card--percentage">
              <span className="stats-overall__card-emoji">🎯</span>
              <span className="stats-overall__card-value">{randomPercentage}%</span>
              <span className="stats-overall__card-label">Aproveitamento</span>
            </div>
          </div>
        )}
      </div>

      {/* Per-table stats section */}
      <div className="stats-tables">
        <h3 className="stats-tables__heading">Por Tabuada 📈</h3>
        {progress.unlockedTables.length === 0 ? (
          <p className="stats-tables__empty">Nenhuma tabuada desbloqueada ainda!</p>
        ) : (
          <div className="stats-tables__list">
            {progress.unlockedTables
              .slice()
              .sort((a, b) => a - b)
              .map((tableNumber) => {
                const stats = progress.tableStats[tableNumber];
                const totalAnswered = stats?.totalAnswered ?? 0;
                const totalCorrect = stats?.totalCorrect ?? 0;
                const percentage = stats?.masteryLevel ?? 0;
                const color = TABLE_COLORS[tableNumber] ?? "#667EEA";
                const emoji = TABLE_EMOJIS[tableNumber] ?? "📐";
                const masteryEmoji = getMasteryEmoji(percentage);

                return (
                  <div key={tableNumber} className="stats-table-row">
                    <div className="stats-table-row__header">
                      <span className="stats-table-row__emoji">{emoji}</span>
                      <span className="stats-table-row__label">
                        Tabuada do {tableNumber}
                      </span>
                      <span className="stats-table-row__mastery-emoji">
                        {masteryEmoji}
                      </span>
                    </div>
                    <div className="stats-table-row__bar-container">
                      <div
                        className="stats-table-row__bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Tabuada do ${tableNumber}: ${percentage}% de domínio`}
                      />
                    </div>
                    <span className="stats-table-row__text">
                      {totalCorrect}/{totalAnswered} acertos ({percentage}%)
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
