// pages/admin/AdminTransactions.jsx
import { useEffect, useState } from "react";
import { getAdminTransactions } from "../../services/adminClient.js";

const TX_TYPES = ["", "DEPOSIT", "WITHDRAWAL", "BET", "WIN", "REFUND"];

// Transaction type badge mapping
const TX_BADGE_MAP = {
  DEPOSIT: "admin-badge-positive",
  WITHDRAWAL: "admin-badge-negative",
  BET: "admin-badge-warning",
  WIN: "admin-badge-accent",
  REFUND: "admin-badge",
};

export default function AdminTransactions() {
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [txType, setTxType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      getAdminTransactions({ page, search, txType })
        .then((data) => {
          if (!active) return;
          setResults(data.results);
          setCount(data.count);
        })
        .catch((err) => active && setError(err.message || "Failed to load transactions."))
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [page, search, txType]);

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

  // Get badge class for transaction type
  const getBadgeClass = (type) => {
    return TX_BADGE_MAP[type] || "admin-badge";
  };

  // Get icon for transaction type
  const getTxIcon = (type) => {
    const icons = {
      DEPOSIT: "bi-arrow-down-left-circle",
      WITHDRAWAL: "bi-arrow-up-right-circle",
      BET: "bi-dice-5",
      WIN: "bi-trophy",
      REFUND: "bi-arrow-counterclockwise",
    };
    return icons[type] || "bi-receipt";
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Transactions</h1>
          <p className="admin-page-subtitle">Complete transaction history across all users</p>
        </div>
        <span className="admin-badge admin-badge-accent">
          <i className="bi bi-receipt" /> {count} transactions
        </span>
      </div>

      <div className="admin-table-container">
        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Search by username or reference…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            value={txType}
            onChange={(e) => {
              setPage(1);
              setTxType(e.target.value);
            }}
          >
            {TX_TYPES.map((t) => (
              <option key={t} value={t}>{t || "All types"}</option>
            ))}
          </select>
          <span className="admin-toolbar-count">
            Showing {results.length} of {count}
          </span>
        </div>

        {error && <div className="admin-error" style={{ margin: '0 20px 20px 20px' }}>{error}</div>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance After</th>
              <th>Reference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="admin-loading" style={{ border: 'none', boxShadow: 'none' }}>
                    <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    {' '}Loading transactions…
                  </div>
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="admin-loading" style={{ border: 'none', boxShadow: 'none' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }} />
                    No transactions found
                  </div>
                </td>
              </tr>
            ) : (
              results.map((tx) => {
                const amount = Number(tx.amount || 0);
                const isPositive = amount >= 0;
                
                return (
                  <tr key={tx.id}>
                    <td>
                      <strong>{tx.username}</strong>
                    </td>
                    <td>
                      <span className={`admin-badge ${getBadgeClass(tx.tx_type)}`}>
                        <i className={`bi ${getTxIcon(tx.tx_type)}`} style={{ marginRight: '4px' }} />
                        {tx.tx_type}
                      </span>
                    </td>
                    <td className={isPositive ? "positive" : "negative"}>
                      {isPositive ? '+' : ''}{formatCurrency(amount)}
                    </td>
                    <td>{formatCurrency(tx.balance_after)}</td>
                    <td>
                      {tx.reference ? (
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.8rem',
                          color: 'var(--admin-muted)'
                        }}>
                          {tx.reference}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--admin-placeholder)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                      {formatDate(tx.created_at)}
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

// Add this CSS for the spin animation if not already present
/*
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
*/