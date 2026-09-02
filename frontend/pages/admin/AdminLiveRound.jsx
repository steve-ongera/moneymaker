import { useAdminSocket } from "../../hooks/useAdminSocket.js";

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

const STATUS_LABEL = {
  connecting: "Connecting…",
  open: "Live",
  closed: "Reconnecting…",
};

export default function AdminLiveRound() {
  const { status, round, multiplier, bets, totals, lastRoundSummary } = useAdminSocket();

  return (
    <div>
      <div className="admin-toolbar">
        <span className={`admin-live-dot${status !== "open" ? " stale" : ""}`} />
        {STATUS_LABEL[status] || status}
        {lastRoundSummary && (
          <span className="admin-toolbar-count">
            Last round {lastRoundSummary.round_id}: {lastRoundSummary.bet_count} bets, profit{" "}
            {fmt(lastRoundSummary.profit)}
          </span>
        )}
      </div>

      {!round ? (
        <p>Waiting for the next round to start…</p>
      ) : (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Round</span>
              <span className="admin-stat-value">{round.round_id}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Status</span>
              <span className="admin-stat-value">{round.status}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Live Multiplier</span>
              <span className="admin-stat-value admin-multiplier">{multiplier}x</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Bets This Round</span>
              <span className="admin-stat-value">{totals.count}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total Staked</span>
              <span className="admin-stat-value">{fmt(totals.staked)}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total Paid Out</span>
              <span className="admin-stat-value">{fmt(totals.payout)}</span>
            </div>
            <div className="admin-stat-card tone-revenue">
              <span className="admin-stat-label">Running Profit</span>
              <span className="admin-stat-value">{fmt(totals.profit)}</span>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Auto Cashout</th>
                <th>Cashout Multiplier</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {bets.length === 0 ? (
                <tr><td colSpan={6}>No bets placed on this round yet.</td></tr>
              ) : (
                bets.map((b) => (
                  <tr key={b.bet_id}>
                    <td>{b.username}</td>
                    <td>{b.amount != null ? fmt(b.amount) : "—"}</td>
                    <td>
                      <span className={`admin-badge bet-${b.status.toLowerCase()}`}>
                        {b.status}{b.auto ? " (auto)" : ""}
                      </span>
                    </td>
                    <td>{b.auto_cashout_multiplier ? `${b.auto_cashout_multiplier}x` : "—"}</td>
                    <td>{b.cashout_multiplier ? `${b.cashout_multiplier}x` : "—"}</td>
                    <td>{b.payout ? fmt(b.payout) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}