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
              <i className="bi bi-cash-coin" /> KSh {Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
