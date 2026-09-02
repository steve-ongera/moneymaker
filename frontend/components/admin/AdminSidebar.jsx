// components/admin/AdminSidebar.jsx
import { NavLink } from "react-router-dom";

const mainLinks = [
  { to: "/admin", label: "Dashboard", end: true, icon: "bi-speedometer2" },
  { to: "/admin/live", label: "Live Round", icon: "bi-broadcast" },
  { to: "/admin/rounds", label: "Round History", icon: "bi-clock-history" },
];

const managementLinks = [
  { to: "/admin/users", label: "Users", icon: "bi-people" },
  { to: "/admin/transactions", label: "Transactions", icon: "bi-receipt" },
];

function NavLinkItem({ link }) {
  return (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className={({ isActive }) => 
        `admin-sidebar-link${isActive ? " active" : ""}`
      }
    >
      <i className={`bi ${link.icon}`} />
      <span>{link.label}</span>
    </NavLink>
  );
}

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      {/* Brand - Fixed at top */}
      <div className="admin-sidebar-brand">
        MoneyMaker <span>Admin</span>
      </div>
      
      {/* Scrollable content area */}
      <div className="admin-sidebar-content">
        <div className="admin-sidebar-section">
          <div className="admin-sidebar-section-title">Main</div>
          <nav className="admin-sidebar-nav">
            {mainLinks.map((link) => (
              <NavLinkItem key={link.to} link={link} />
            ))}
          </nav>
        </div>
        <div className="admin-sidebar-section">
          <div className="admin-sidebar-section-title">Management</div>
          <nav className="admin-sidebar-nav">
            {managementLinks.map((link) => (
              <NavLinkItem key={link.to} link={link} />
            ))}
          </nav>
        </div>
      </div>
      
      {/* Footer - Fixed at bottom */}
      <div className="admin-sidebar-footer">
        <span className="admin-badge admin-badge-accent">
          v2.0.0
        </span>
      </div>
    </aside>
  );
}