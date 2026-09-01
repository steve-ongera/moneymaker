import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useWallet } from "../hooks/useWallet.js";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openSidebar = () => window.dispatchEvent(new CustomEvent("toggle-sidebar"));

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="navbar-menu-btn"
          onClick={openSidebar}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <Link to="/" className="navbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          MONEYMAKER
        </Link>
      </div>

      {isAuthenticated && (
        <div className="navbar-links">
          <Link to="/play">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Play
          </Link>
          <Link to="/wallet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Wallet
          </Link>
          <Link to="/transactions">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Transactions
          </Link>
          <Link to="/history">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            History
          </Link>
          <Link to="/profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {user?.username}
          </Link>
        </div>
      )}

      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <span className="navbar-balance">
              <span className="currency">KSh</span> {Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <button className="btn btn-ghost btn-small navbar-logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary btn-small">Login</Link>
        )}
      </div>
    </nav>
  );
}