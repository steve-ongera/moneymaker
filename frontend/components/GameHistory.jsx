//components/GameHistory.jsx
import { useAviator } from "../hooks/useAviator.js";

function colorClass(mult) {
  const value = parseFloat(mult);
  if (value >= 10) return "history-chip chip-purple";
  if (value >= 2) return "history-chip chip-blue";
  return "history-chip chip-gray";
}

export default function GameHistory() {
  const { recentRounds } = useAviator();

  if (!recentRounds?.length) return null;

  return (
    <div className="game-history">
      {recentRounds.slice(0, 20).map((r) => (
        <span key={r.round_id} className={colorClass(r.crash_multiplier)}>
          {r.crash_multiplier}x
        </span>
      ))}
    </div>
  );
}
