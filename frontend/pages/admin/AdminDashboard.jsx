// pages/admin/admindashboard.jsx
import { useEffect, useState } from "react";
import { getAdminStats } from "../../services/adminClient.js";

function StatCard({ label, value, tone, icon, footer }) {
  return (
    <div className={`admin-stat-card${tone ? ` tone-${tone}` : ""}`}>
      <div className="admin-stat-header">
        <span className="admin-stat-label">{label}</span>
        {icon && (
          <span className="admin-stat-icon">
            <i className={`bi ${icon}`} />
          </span>
        )}
      </div>
      <span className="admin-stat-value">{value}</span>
      {footer && <div className="admin-stat-footer">{footer}</div>}
    </div>
  );
}

const fmt = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const fmtNumber = (n) => Number(n || 0).toLocaleString();
const REFRESH_MS = 15000;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    function load() {
      getAdminStats()
        .then((data) => active && setStats(data))
        .catch((err) => active && setError(err.message || "Failed to load stats."))
        .finally(() => active && setLoading(false));
    }

    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Platform overview and key metrics</p>
        </div>
        <span className="admin-badge admin-badge-accent">
          <span className="admin-live-dot" /> Live
        </span>
      </div>

      <h2 className="admin-section-title">All-time Metrics</h2>
      <div className="admin-stat-grid">
        <StatCard 
          label="Platform Revenue" 
          value={fmt(stats.platform_revenue)} 
          tone="revenue"
          icon="bi-graph-up-arrow"
          footer="House earnings"
        />
        <StatCard 
          label="Player Wallet Balances" 
          value={fmt(stats.total_wallet_liability)}
          icon="bi-wallet2"
          footer="Total liability"
        />
        <StatCard 
          label="Total Staked" 
          value={fmt(stats.total_staked)}
          icon="bi-arrow-up-circle"
        />
        <StatCard 
          label="Total Paid Out" 
          value={fmt(stats.total_payout)}
          icon="bi-arrow-down-circle"
        />
        <StatCard 
          label="Total Deposits" 
          value={fmt(stats.total_deposits)}
          icon="bi-arrow-down-left-circle"
        />
        <StatCard 
          label="Total Withdrawals" 
          value={fmt(stats.total_withdrawals)}
          icon="bi-arrow-up-right-circle"
        />
        <StatCard 
          label="Total Users" 
          value={fmtNumber(stats.total_users)}
          icon="bi-people"
        />
        <StatCard 
          label="Verified Users" 
          value={fmtNumber(stats.verified_users)}
          icon="bi-person-check"
          tone="accent"
        />
      </div>

      <h2 className="admin-section-title">Today's Activity</h2>
      <div className="admin-stat-grid">
        <StatCard 
          label="Revenue Today" 
          value={fmt(stats.revenue_today)} 
          tone="revenue"
          icon="bi-graph-up"
        />
        <StatCard 
          label="Staked Today" 
          value={fmt(stats.staked_today)}
          icon="bi-arrow-up-circle"
        />
        <StatCard 
          label="Paid Out Today" 
          value={fmt(stats.payout_today)}
          icon="bi-arrow-down-circle"
        />
        <StatCard 
          label="Bets Today" 
          value={fmtNumber(stats.bets_today)}
          icon="bi-dice-5"
          tone="warning"
        />
        <StatCard 
          label="Active Players Today" 
          value={fmtNumber(stats.active_users_today)}
          icon="bi-person-arms-up"
          tone="accent"
        />
      </div>

      <p className="admin-note">
        <strong>Platform Revenue</strong> is what the house has actually earned (staked − paid out).<br />
        <strong>Player Wallet Balances</strong> is what's currently sitting in everyone's wallet — 
        i.e. what you'd owe out if every player withdrew right now.<br />
        Refreshes every {REFRESH_MS / 1000}s. For bet-by-bet activity as it happens, see Live Round.
      </p>
    </>
  );
}