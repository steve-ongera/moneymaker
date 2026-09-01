//components/GameHistory.jsx
import { useAviator } from "../hooks/useAviator.js";

function chipClass(mult) {
  const value = parseFloat(mult);
  if (value >= 10) return "history-chip chip-high";
  if (value >= 2) return "history-chip chip-mid";
  return "history-chip chip-low";
}

export default function GameHistory() {
  const { recentRounds } = useAviator();

  if (!recentRounds?.length) return null;

  return (
    <div className="game-history">
      {recentRounds.slice(0, 20).map((r) => (
        <span key={r.round_id} className={chipClass(r.crash_multiplier)}>
          {parseFloat(r.crash_multiplier).toFixed(2)}x
        </span>
      ))}
    </div>
  );
}