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

function NavLinkItem({ link, onClick }) {
  return (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className={({ isActive }) => 
        `admin-sidebar-link${isActive ? " active" : ""}`
      }
      onClick={onClick}
    >
      <i className={`bi ${link.icon}`} />
      <span>{link.label}</span>
    </NavLink>
  );
}

export default function AdminSidebar({ isOpen, onClose }) {
  // Handle link click on mobile - close sidebar
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="admin-sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 19,
            display: 'none',
          }}
        />
      )}
      
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
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
                <NavLinkItem key={link.to} link={link} onClick={handleLinkClick} />
              ))}
            </nav>
          </div>
          <div className="admin-sidebar-section">
            <div className="admin-sidebar-section-title">Management</div>
            <nav className="admin-sidebar-nav">
              {managementLinks.map((link) => (
                <NavLinkItem key={link.to} link={link} onClick={handleLinkClick} />
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
    </>
  );
}