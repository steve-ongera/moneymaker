//components/Sidebar.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const LINKS = [
  { to: "/", icon: "bi-speedometer2", label: "Dashboard" },
  { to: "/play", icon: "bi-controller", label: "Play" },
  { to: "/wallet", icon: "bi-wallet2", label: "Wallet" },
  { to: "/transactions", icon: "bi-receipt", label: "Transactions" },
  { to: "/history", icon: "bi-clock-history", label: "Bet History" },
  { to: "/profile", icon: "bi-person-circle", label: "Profile" },
];

/**
 * Renders twice: a persistent rail (.sidebar, desktop-only via CSS) and a
 * slide-in drawer (.sidebar-drawer, mobile-only via CSS) sharing one open
 * state. Navbar's hamburger button toggles the drawer via a "toggle-sidebar"
 * window event so the two components don't need a shared parent/context.
 */
export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener("toggle-sidebar", toggle);
    return () => window.removeEventListener("toggle-sidebar", toggle);
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
      <aside className="sidebar">{links}</aside>

      <div
        className={`sidebar-drawer-overlay${open ? " open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />
      <aside className={`sidebar-drawer${open ? " open" : ""}`}>
        {links}
        <hr />
        <button type="button" className="sidebar-link" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right" />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}