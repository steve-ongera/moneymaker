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
    <div className="game-history" style={{ 
      display: 'flex', 
      gap: '6px', 
      overflowX: 'auto', 
      overflowY: 'hidden',
      padding: '4px 0',
      maxWidth: '100%',
      flex: '1',
      minWidth: '0',
      WebkitOverflowScrolling: 'touch',
      scrollBehavior: 'smooth'
    }}>
      {recentRounds.slice(0, 20).map((r) => (
        <span 
          key={r.round_id} 
          className={chipClass(r.crash_multiplier)}
          style={{
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          {parseFloat(r.crash_multiplier).toFixed(2)}x
        </span>
      ))}
    </div>
  );
}