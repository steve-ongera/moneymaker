// pages/admin/AdminLiveRound.jsx
import { useState } from "react";
import { useAdminSocket } from "../../hooks/useAdminSocket.js";
import { pauseEngine, resumeEngine } from "../../services/adminClient.js";

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const fmtNumber = (n) => Number(n || 0).toLocaleString();

const STATUS_LABEL = {
  connecting: "Connecting…",
  open: "Live",
  closed: "Reconnecting…",
};

// Bet status badge mapping
const BET_STATUS_BADGE = {
  active: "admin-badge-warning",
  won: "admin-badge-positive",
  lost: "admin-badge-negative",
  cashed_out: "admin-badge-accent",
};

// Bet status icon mapping
const BET_STATUS_ICON = {
  active: "bi-clock-history",
  won: "bi-trophy",
  lost: "bi-x-circle",
  cashed_out: "bi-check-circle",
};

export default function AdminLiveRound() {
  const { status, round, multiplier, bets, totals, lastRoundSummary, engineStatus } = useAdminSocket();
  const [busy, setBusy] = useState(false);

  const getBetStatusBadge = (status) => {
    const statusKey = status?.toLowerCase() || "";
    return BET_STATUS_BADGE[statusKey] || "admin-badge";
  };

  const getBetStatusIcon = (status) => {
    const statusKey = status?.toLowerCase() || "";
    return BET_STATUS_ICON[statusKey] || "bi-circle";
  };

  // Format multiplier with proper styling
  const formatMultiplier = (value) => {
    if (value === undefined || value === null) return "—";
    return `${Number(value).toFixed(2)}x`;
  };

  const handleTogglePause = async () => {
    setBusy(true);
    try {
      if (engineStatus.isPaused) {
        await resumeEngine();
      } else {
        const reason = window.prompt(
          "Reason for pausing (optional). The current round will finish and settle normally; no new round will start after it.",
          "Maintenance"
        );
        if (reason === null) return; // cancelled
        await pauseEngine(reason || "");
      }
    } catch (e) {
      alert(e.message || "Failed to update engine state");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Live Round</h1>
          <p className="admin-page-subtitle">Real-time betting activity and round status</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`admin-live-dot${status !== "open" ? " stale" : ""}`} />
          <span className="admin-badge admin-badge-accent">
            <i className={`bi ${status === "open" ? "bi-broadcast" : "bi-clock"}`} />
            {' '}{STATUS_LABEL[status] || status}
          </span>
          <button
            className={`admin-button ${engineStatus.isPaused ? "admin-button-positive" : "admin-button-warning"}`}
            onClick={handleTogglePause}
            disabled={busy}
            title={
              engineStatus.isPaused
                ? "Resume starting new rounds"
                : "Stop new rounds from starting after the current one finishes"
            }
          >
            <i className={`bi ${engineStatus.isPaused ? "bi-play-circle" : "bi-pause-circle"}`} />
            {' '}{engineStatus.isPaused ? "Resume Engine" : "Pause Engine"}
          </button>
        </div>
      </div>

      {engineStatus.isPaused && (
        <div className="admin-note" style={{ background: 'var(--admin-warning-light)', marginBottom: '16px' }}>
          <i className="bi bi-pause-circle" style={{ marginRight: '8px' }} />
          <strong>Engine paused</strong> — the current round will finish and settle normally against its
          pre-committed crash point; no new round will start after it.
          {engineStatus.reason && <span> Reason: {engineStatus.reason}</span>}
          {engineStatus.pausedBy && <span> (by {engineStatus.pausedBy})</span>}
        </div>
      )}

      {!round ? (
        <div className="admin-card">
          <div className="admin-card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="bi bi-hourglass-split" style={{ fontSize: '3rem', color: 'var(--admin-muted)', display: 'block', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--admin-text-secondary)', marginBottom: '8px' }}>
              {engineStatus.isPaused ? "Engine is paused" : "Waiting for the next round"}
            </h3>
            <p style={{ color: 'var(--admin-muted)' }}>
              {engineStatus.isPaused
                ? "No new rounds will start until you resume the engine."
                : "No active round at the moment. Check back shortly."}
            </p>
            {lastRoundSummary && (
              <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--admin-panel-subtle)', borderRadius: 'var(--admin-radius)', display: 'inline-block' }}>
                <span style={{ color: 'var(--admin-muted)', fontSize: '0.85rem' }}>
                  Last round #{lastRoundSummary.round_id}: {lastRoundSummary.bet_count} bets, 
                  profit <strong style={{ color: Number(lastRoundSummary.profit) >= 0 ? 'var(--admin-positive)' : 'var(--admin-negative)' }}>
                    {fmt(lastRoundSummary.profit)}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="admin-stat-grid">
            <div className="admin-stat-card tone-accent">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Round</span>
                <span className="admin-stat-icon">
                  <i className="bi bi-hash" />
                </span>
              </div>
              <span className="admin-stat-value">#{round.round_id}</span>
              {lastRoundSummary && (
                <div className="admin-stat-footer">
                  <i className="bi bi-clock-history" /> Previous: #{lastRoundSummary.round_id}
                </div>
              )}
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Status</span>
                <span className="admin-stat-icon">
                  <i className="bi bi-circle-fill" style={{ color: round.status === 'active' ? 'var(--admin-positive)' : 'var(--admin-warning)' }} />
                </span>
              </div>
              <span className="admin-stat-value" style={{ fontSize: '1.2rem', textTransform: 'capitalize' }}>
                {round.status}
              </span>
              <div className="admin-stat-footer">
                {round.status === 'active' ? 'Accepting bets' : 'Round in progress'}
              </div>
            </div>
            
            <div className="admin-stat-card tone-warning">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Live Multiplier</span>
                <span className="admin-stat-icon">
                  <i className="bi bi-graph-up-arrow" />
                </span>
              </div>
              <span className="admin-stat-value admin-multiplier">{formatMultiplier(multiplier)}</span>
              <div className="admin-stat-footer">
                <span className="admin-live-dot" style={{ animation: status === "open" ? 'admin-pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none' }} />
                {' '}Live updating
              </div>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Bets This Round</span>
                <span className="admin-stat-icon">
                  <i className="bi bi-dice-5" />
                </span>
              </div>
              <span className="admin-stat-value">{fmtNumber(totals.count)}</span>
              <div className="admin-stat-footer">
                <i className="bi bi-people" /> Active players
              </div>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Total Staked</span>
                <span className="admin-stat-icon">
                  <i className="bi bi-arrow-up-circle" />
                </span>
              </div>
              <span className="admin-stat-value">KES {fmt(totals.staked)}</span>
              <div className="admin-stat-footer">
                <i className="bi bi-cash-stack" /> Total wagered
              </div>
            </div>
            
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Total Paid Out</span>
                <span className="admin-stat-icon">
                  <i className="bi bi-arrow-down-circle" />
                </span>
              </div>
              <span className="admin-stat-value">KES {fmt(totals.payout)}</span>
              <div className="admin-stat-footer">
                <i className="bi bi-trophy" /> Winnings paid
              </div>
            </div>
            
            <div className="admin-stat-card tone-revenue">
              <div className="admin-stat-header">
                <span className="admin-stat-label">Running Profit</span>
                <span className="admin-stat-icon">
                  <i className="bi bi-graph-up" />
                </span>
              </div>
              <span className="admin-stat-value" style={{ color: Number(totals.profit) >= 0 ? 'var(--admin-positive)' : 'var(--admin-negative)' }}>
                {Number(totals.profit) >= 0 ? '+' : ''}{fmt(totals.profit)}
              </span>
              <div className="admin-stat-footer">
                <i className="bi bi-building" /> House earnings
              </div>
            </div>
          </div>

          {/* Bets Table */}
          <div className="admin-table-container">
            <div className="admin-toolbar">
              <div className="admin-toolbar-count">
                <i className="bi bi-list-ul" /> {bets.length} bets placed
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
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-loading" style={{ border: 'none', boxShadow: 'none' }}>
                        <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }} />
                        No bets placed on this round yet
                      </div>
                    </td>
                  </tr>
                ) : (
                  bets.map((b) => {
                    const statusKey = b.status?.toLowerCase() || "";
                    const isActive = statusKey === 'active';
                    const isWon = statusKey === 'won' || statusKey === 'cashed_out';
                    const amount = Number(b.amount || 0);
                    const payout = Number(b.payout || 0);
                    
                    return (
                      <tr key={b.bet_id} style={isActive ? { background: 'var(--admin-accent-light)' } : {}}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>{b.username}</strong>
                            {isActive && (
                              <span className="admin-badge admin-badge-warning" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                                <i className="bi bi-clock" /> Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={amount > 0 ? "positive" : ""}>
                          KES {fmt(amount)}
                        </td>
                        <td>
                          <span className={`admin-badge ${getBetStatusBadge(b.status)}`}>
                            <i className={`bi ${getBetStatusIcon(b.status)}`} style={{ marginRight: '4px' }} />
                            {b.status}
                            {b.auto ? ' (auto)' : ''}
                          </span>
                        </td>
                        <td>
                          {b.auto_cashout_multiplier ? (
                            <span style={{ fontWeight: '600', color: 'var(--admin-accent)' }}>
                              {formatMultiplier(b.auto_cashout_multiplier)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--admin-placeholder)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {b.cashout_multiplier ? (
                            <span style={{ fontWeight: '600', color: 'var(--admin-positive)' }}>
                              {formatMultiplier(b.cashout_multiplier)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--admin-placeholder)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {payout > 0 ? (
                            <span className="positive">
                              KES {fmt(payout)}
                            </span>
                          ) : isWon ? (
                            <span className="positive">KES {fmt(payout)}</span>
                          ) : (
                            <span style={{ color: 'var(--admin-placeholder)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Last Round Summary */}
          {lastRoundSummary && (
            <div className="admin-note" style={{ maxWidth: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span>
                  <i className="bi bi-clock-history" style={{ marginRight: '8px' }} />
                  <strong>Last Round #{lastRoundSummary.round_id}</strong>
                </span>
                <span>
                  {lastRoundSummary.bet_count} bets • 
                  Staked: <strong>KES {fmt(lastRoundSummary.total_staked)}</strong> • 
                  Paid: <strong>KES {fmt(lastRoundSummary.total_payout)}</strong> • 
                  Profit: <strong style={{ color: Number(lastRoundSummary.profit) >= 0 ? 'var(--admin-positive)' : 'var(--admin-negative)' }}>
                    {Number(lastRoundSummary.profit) >= 0 ? '+' : ''}{fmt(lastRoundSummary.profit)}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}