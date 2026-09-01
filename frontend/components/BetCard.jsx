//components/BetCard.jsx
export default function BetCard({ bet }) {
  const statusClass = {
    ACTIVE: "bet-card active-bet",
    CASHED_OUT: "bet-card won",
    LOST: "bet-card lost",
    PENDING: "bet-card pending",
    REFUNDED: "bet-card refunded",
  }[bet.status] || "bet-card";

  const statusLabel = {
    ACTIVE: "Active",
    CASHED_OUT: "Cashed Out",
    LOST: "Lost",
    PENDING: "Pending",
    REFUNDED: "Refunded",
  }[bet.status] || bet.status.replace("_", " ");

  return (
    <div className={statusClass}>
      <div className="bet-card-row">
        <div className="bet-card-player">
          <div className="bet-card-avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span className="bet-card-username">You</span>
        </div>
        <span className="bet-card-amount">KSh {bet.amount}</span>
      </div>
      
      <div className="bet-card-row">
        <span className={`bet-card-status status-${bet.status.toLowerCase()}`}>
          {statusLabel}
        </span>
        {bet.round_id && (
          <span className="bet-card-round">Round #{bet.round_id.slice(-6)}</span>
        )}
      </div>

      {bet.status === "CASHED_OUT" && (
        <div className="bet-card-row bet-card-detail">
          <span className="bet-card-multiplier-tag">{bet.cashout_multiplier}x</span>
          <span className="bet-card-payout">+KSh {bet.payout}</span>
        </div>
      )}
    </div>
  );
}