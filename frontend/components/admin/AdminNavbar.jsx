// components/admin/AdminNavbar.jsx
import { useNavigate } from "react-router-dom";
import { adminLogout, adminTokenStore } from "../../services/adminClient.js";

export default function AdminNavbar({ onToggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
  const admin = adminTokenStore.getAdmin();

  function handleLogout() {
    adminLogout();
    navigate("/admin/login", { replace: true });
  }

  // Get initials for avatar
  const getInitials = () => {
    if (admin?.username) return admin.username.charAt(0).toUpperCase();
    if (admin?.email) return admin.email.charAt(0).toUpperCase();
    return "A";
  };

  // Get display name
  const getDisplayName = () => {
    if (admin?.username) return admin.username;
    if (admin?.email) return admin.email;
    return "Admin";
  };

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        {/* Hamburger menu button - visible on mobile */}
        <button
          className="admin-navbar-toggle"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            color: 'var(--admin-text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 'var(--admin-radius)',
            transition: 'all var(--admin-transition-fast)',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--admin-panel-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <i className={`bi ${isSidebarOpen ? 'bi-x-lg' : 'bi-list'}`} />
        </button>
        <span className="admin-navbar-title">Dashboard</span>
      </div>
      <div className="admin-navbar-user">
        <div className="admin-navbar-user-info">
          <span className="admin-navbar-user-name">{getDisplayName()}</span>
          <span className="admin-navbar-user-role">Administrator</span>
        </div>
        <div className="admin-avatar">{getInitials()}</div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}