//components/Navbar.jsx
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
      <Link to="/" className="navbar-brand">
        <i className="bi bi-airplane-fill" /> MONEYMAKER
      </Link>

      {isAuthenticated && (
        <div className="navbar-links">
          <Link to="/play"><i className="bi bi-controller" /> Play</Link>
          <Link to="/wallet"><i className="bi bi-wallet2" /> Wallet</Link>
          <Link to="/transactions"><i className="bi bi-receipt" /> Transactions</Link>
          <Link to="/history"><i className="bi bi-clock-history" /> History</Link>
          <Link to="/profile"><i className="bi bi-person-circle" /> {user?.username}</Link>
        </div>
      )}

      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <span className="navbar-balance">
              <span className="currency">KSh</span> {Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <button className="btn btn-ghost hide-mobile" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" /> Logout
            </button>
            {/* Mobile-only: opens the Sidebar drawer. Hidden at 1024px+ where
                the persistent sidebar rail takes over (see main.css). */}
            <button
              className="navbar-menu-btn"
              onClick={openSidebar}
              aria-label="Open menu"
            >
              <i className="bi bi-list" style={{ fontSize: "1.5rem" }} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-small">Login</Link>
            <Link to="/register" className="btn btn-primary btn-small">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}