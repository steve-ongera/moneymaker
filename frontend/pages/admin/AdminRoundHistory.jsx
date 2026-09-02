// pages/admin/AdminRoundHistory.jsx
import { useEffect, useState } from "react";
import { getAdminRounds } from "../../services/adminClient.js";

export default function AdminRoundHistory() {
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminRounds({ page })
      .then((data) => {
        if (!active) return;
        setResults(data.results);
        setCount(data.count);
      })
      .catch((err) => active && setError(err.message || "Failed to load rounds."))
      .finally(() => active && setLoading(false));
    return () => (active = false);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(count / 25));

  // Format currency
  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Round History</h1>
          <p className="admin-page-subtitle">Complete history of all game rounds</p>
        </div>
        <span className="admin-badge admin-badge-accent">
          <i className="bi bi-clock-history" /> {count} rounds
        </span>
      </div>

      <div className="admin-table-container">
        <div className="admin-toolbar">
          <div className="admin-toolbar-count">
            Showing {results.length} of {count} rounds
          </div>
        </div>

        {error && <div className="admin-error" style={{ margin: '0 20px 20px 20px' }}>{error}</div>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>Crash At</th>
              <th>Bets</th>
              <th>Staked</th>
              <th>Paid Out</th>
              <th>Profit</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="admin-loading" style={{ border: 'none', boxShadow: 'none' }}>
                    <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    {' '}Loading rounds…
                  </div>
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="admin-loading" style={{ border: 'none', boxShadow: 'none' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }} />
                    No rounds found
                  </div>
                </td>
              </tr>
            ) : (
              results.map((r) => {
                const profit = Number(r.profit || 0);
                const isProfit = profit >= 0;
                
                return (
                  <tr key={r.round_id}>
                    <td>
                      <span className="admin-badge admin-badge-accent">
                        #{r.round_id}
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge" style={{ fontWeight: '700' }}>
                        {r.crash_multiplier}x
                      </span>
                    </td>
                    <td>{r.bet_count}</td>
                    <td>KES {formatCurrency(r.total_staked)}</td>
                    <td>KES {formatCurrency(r.total_payout)}</td>
                    <td className={isProfit ? "positive" : "negative"}>
                      {isProfit ? '+' : ''}{formatCurrency(profit)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="admin-pagination" style={{ padding: '16px 20px' }}>
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="admin-pagination-controls">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage((p) => p - 1)}
            >
              <i className="bi bi-chevron-left" /> Prev
            </button>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage((p) => p + 1)}
            >
              Next <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Add this CSS for the spin animation (add to your CSS file)
/* 
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
*/