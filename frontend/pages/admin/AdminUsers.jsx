// pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import { getAdminUsers } from "../../services/adminClient.js";

export default function AdminUsers() {
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      getAdminUsers({ page, search })
        .then((data) => {
          if (!active) return;
          setResults(data.results);
          setCount(data.count);
        })
        .catch((err) => active && setError(err.message || "Failed to load users."))
        .finally(() => active && setLoading(false));
    }, 300); // debounce search
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(count / 25));

  // Format currency
  const formatCurrency = (value, currency = "KES") => {
    return `${currency} ${Number(value || 0).toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get initials for avatar
  const getInitials = (username) => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  // Get random color for avatar based on username
  const getAvatarColor = (username) => {
    const colors = [
      '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">Manage and view all platform users</p>
        </div>
        <span className="admin-badge admin-badge-accent">
          <i className="bi bi-people" /> {count} users
        </span>
      </div>

      <div className="admin-table-container">
        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Search by username, email or phone…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <span className="admin-toolbar-count">
            Showing {results.length} of {count} users
          </span>
        </div>

        {error && <div className="admin-error" style={{ margin: '0 20px 20px 20px' }}>{error}</div>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Wallet Balance</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="admin-loading" style={{ border: 'none', boxShadow: 'none' }}>
                    <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    {' '}Loading users…
                  </div>
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="admin-loading" style={{ border: 'none', boxShadow: 'none' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }} />
                    No users found
                  </div>
                </td>
              </tr>
            ) : (
              results.map((u) => {
                const isVerified = u.is_verified;
                const balance = Number(u.wallet_balance || 0);
                
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--admin-radius-full)',
                          background: getAvatarColor(u.username),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          flexShrink: 0
                        }}>
                          {getInitials(u.username)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--admin-text)' }}>
                            {u.username}
                          </div>
                          {u.is_staff && (
                            <span className="admin-badge admin-badge-accent" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                              <i className="bi bi-shield-check" /> Staff
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${u.email}`} style={{ color: 'var(--admin-text-secondary)' }}>
                        {u.email}
                      </a>
                    </td>
                    <td>
                      {u.phone_number ? (
                        <a href={`tel:${u.phone_number}`} style={{ color: 'var(--admin-text-secondary)' }}>
                          {u.phone_number}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--admin-placeholder)' }}>—</span>
                      )}
                    </td>
                    <td className={balance > 0 ? "positive" : ""} style={{ fontWeight: '600' }}>
                      {formatCurrency(balance, u.currency || 'KES')}
                    </td>
                    <td>
                      {isVerified ? (
                        <span className="admin-badge admin-badge-positive">
                          <i className="bi bi-check-circle" /> Verified
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-warning">
                          <i className="bi bi-exclamation-circle" /> Unverified
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                      {formatDate(u.date_joined)}
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