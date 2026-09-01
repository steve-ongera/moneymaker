import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", icon: "bi-speedometer2", label: "Dashboard" },
  { to: "/play", icon: "bi-controller", label: "Play" },
  { to: "/wallet", icon: "bi-wallet2", label: "Wallet" },
  { to: "/transactions", icon: "bi-receipt", label: "Transactions" },
  { to: "/history", icon: "bi-clock-history", label: "Bet History" },
  { to: "/profile", icon: "bi-person-circle", label: "Profile" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
          end={link.to === "/"}
        >
          <i className={`bi ${link.icon}`} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
