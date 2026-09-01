export default function BetCard({ bet }) {
  const statusClass = {
    ACTIVE: "bet-card active",
    CASHED_OUT: "bet-card won",
    LOST: "bet-card lost",
    PENDING: "bet-card pending",
    REFUNDED: "bet-card refunded",
  }[bet.status] || "bet-card";

  return (
    <div className={statusClass}>
      <div className="bet-card-row">
        <span className="bet-card-amount">KSh {bet.amount}</span>
        <span className="bet-card-status">{bet.status.replace("_", " ")}</span>
      </div>
      {bet.status === "CASHED_OUT" && (
        <div className="bet-card-row bet-card-detail">
          <span>{bet.cashout_multiplier}x</span>
          <span>+KSh {bet.payout}</span>
        </div>
      )}
      {bet.round_id && <div className="bet-card-round">{bet.round_id}</div>}
    </div>
  );
}
