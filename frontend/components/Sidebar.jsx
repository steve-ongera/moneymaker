//components/Sidebar.jsx
import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const LINKS = [
  { to: "/", icon: "bi-speedometer2", label: "Dashboard" },
  { to: "/play", icon: "bi-controller", label: "Play" },
  { to: "/wallet", icon: "bi-wallet2", label: "Wallet" },
  { to: "/transactions", icon: "bi-receipt", label: "Transactions" },
  { to: "/history", icon: "bi-clock-history", label: "Bet History" },
  { to: "/profile", icon: "bi-person-circle", label: "Profile" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener("toggle-sidebar", toggle);
    return () => window.removeEventListener("toggle-sidebar", toggle);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e) => {
      if (e.matches) setOpen(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const close = () => setOpen(false);

  const handleLogout = () => {
    close();
    logout();
    navigate("/login");
  };

  const links = (
    <>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
          end={link.to === "/"}
          onClick={close}
        >
          <i className={`bi ${link.icon}`} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <>
      <div
        className={`sidebar-drawer-overlay${open ? " open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside className={`sidebar-drawer${open ? " open" : ""}`}>
        <div className="sidebar-drawer-header">
          <Link to="/" className="navbar-brand" onClick={close}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            MONEYMAKER
          </Link>
          <button className="sidebar-drawer-close" onClick={close} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="sidebar-drawer-links">
          {links}
        </div>
        <div className="sidebar-drawer-footer">
          <hr />
          <button type="button" className="sidebar-link" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}