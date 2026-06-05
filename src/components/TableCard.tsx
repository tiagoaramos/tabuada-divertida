import type { TableStats } from "../types";

interface TableCardProps {
  tableNumber: number;
  isUnlocked: boolean;
  stats?: TableStats;
  color: string;
  onSelect: (tableNumber: number) => void;
}

const TABLE_EMOJIS: Record<number, string> = {
  2: "🐣",
  3: "🌈",
  4: "🦋",
  5: "⭐",
  6: "🚀",
  7: "🎨",
  8: "🐬",
  9: "🦄",
  10: "🏆",
};

export function TableCard({ tableNumber, isUnlocked, stats, color, onSelect }: TableCardProps) {
  const masteryLevel = stats?.masteryLevel ?? 0;
  const emoji = TABLE_EMOJIS[tableNumber] ?? "✨";

  if (!isUnlocked) {
    return (
      <div className="table-card table-card--locked" aria-disabled="true">
        <div className="table-card__emoji">🔒</div>
        <div className="table-card__number">{tableNumber}</div>
        <div className="table-card__label">Bloqueada</div>
      </div>
    );
  }

  return (
    <button
      className="table-card table-card--unlocked"
      style={{ background: color }}
      onClick={() => onSelect(tableNumber)}
      aria-label={`Tabuada do ${tableNumber}. Domínio: ${masteryLevel}%`}
    >
      <div className="table-card__emoji">{emoji}</div>
      <div className="table-card__number">{tableNumber}</div>
      <div className="table-card__mastery">
        <div className="table-card__mastery-bar">
          <div
            className="table-card__mastery-fill"
            style={{ width: `${masteryLevel}%` }}
          />
        </div>
        <span className="table-card__mastery-text">{masteryLevel}%</span>
      </div>
    </button>
  );
}
