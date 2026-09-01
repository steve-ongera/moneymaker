//components/BettingHistory.jsx
import BetCard from "./BetCard.jsx";

export default function BettingHistory({ bets, loading }) {
  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner spinner-sm" />
        <span>Loading bet history...</span>
      </div>
    );
  }

  if (!bets?.length) {
    return (
      <div className="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <p>No bets placed yet.</p>
        <span className="text-faint">Place your first bet to get started</span>
      </div>
    );
  }

  return (
    <div className="betting-history-grid">
      {bets.map((bet) => (
        <BetCard key={bet.id} bet={bet} />
      ))}
    </div>
  );
}