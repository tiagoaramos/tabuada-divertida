import { useMemo } from "react";
import { useProgress } from "../context/ProgressContext";
import { calculateOverallStats, calculateMasteryLevel } from "../domain/stats";
import { getAllCategories } from "../domain/category-registry";
import { buildProgressKey } from "../domain/progress-key";
import { loadProgress } from "../domain/persistence";
import type { Progress, QuestionTypeId } from "../types";

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

const QUESTION_TYPES: { id: QuestionTypeId; label: string }[] = [
  { id: "open", label: "Questão Aberta" },
  { id: "multiple-choice", label: "Múltipla Escolha" },
];

function getMasteryEmoji(percentage: number): string {
  if (percentage >= 80) return "🌟";
  if (percentage >= 50) return "💪";
  return "📚";
}

interface SectionProgress {
  categoryId: string;
  categoryLabel: string;
  questionTypeId: QuestionTypeId;
  questionTypeLabel: string;
  progress: Progress;
}

export function StatsScreen() {
  const { currentStudent } = useProgress();

  const sections: SectionProgress[] = useMemo(() => {
    const studentId = currentStudent?.id;
    if (!studentId) return [];

    const categories = getAllCategories();
    const loaded: SectionProgress[] = [];
    for (const category of categories) {
      for (const qt of QUESTION_TYPES) {
        const progressKey = buildProgressKey(category.id, qt.id);
        const progress = loadProgress(studentId, progressKey);
        loaded.push({
          categoryId: category.id,
          categoryLabel: category.label,
          questionTypeId: qt.id,
          questionTypeLabel: qt.label,
          progress,
        });
      }
    }
    return loaded;
  }, [currentStudent?.id]);

  return (
    <div className="screen stats-screen">
      <h2 className="stats-screen__title">Suas Estatísticas 📊</h2>

      {sections.map((section) => {
        const sectionKey = `${section.categoryId}-${section.questionTypeId}`;
        const overall = calculateOverallStats(section.progress);
        const randomPercentage = calculateMasteryLevel(
          section.progress.randomStats.totalCorrect,
          section.progress.randomStats.totalAnswered
        );

        return (
          <div key={sectionKey} className="stats-section">
            <h3 className="stats-section__title">
              {section.categoryLabel} - {section.questionTypeLabel}
            </h3>

            {/* Overall stats */}
            <div className="stats-overall">
              <h4 className="stats-overall__heading">Resumo 🏅</h4>
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

            {/* Random mode stats */}
            <div className="stats-random">
              <h4 className="stats-random__heading">🎲 Modo Aleatório</h4>
              {section.progress.randomStats.totalAnswered === 0 ? (
                <p className="stats-random__empty">
                  Nenhuma questão respondida no modo aleatório ainda!
                </p>
              ) : (
                <div className="stats-overall__cards">
                  <div className="stats-overall__card stats-overall__card--questions">
                    <span className="stats-overall__card-emoji">📝</span>
                    <span className="stats-overall__card-value">
                      {section.progress.randomStats.totalAnswered}
                    </span>
                    <span className="stats-overall__card-label">Questões</span>
                  </div>
                  <div className="stats-overall__card stats-overall__card--correct">
                    <span className="stats-overall__card-emoji">✅</span>
                    <span className="stats-overall__card-value">
                      {section.progress.randomStats.totalCorrect}
                    </span>
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

            {/* Per-table stats */}
            <div className="stats-tables">
              <h4 className="stats-tables__heading">Por Tabuada 📈</h4>
              <div className="stats-tables__list">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((tableNumber) => {
                  const stats = section.progress.tableStats[tableNumber];
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
