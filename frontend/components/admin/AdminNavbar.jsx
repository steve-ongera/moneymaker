// components/admin/AdminNavbar.jsx
import { useNavigate } from "react-router-dom";
import { adminLogout, adminTokenStore } from "../../services/adminClient.js";

export default function AdminNavbar() {
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