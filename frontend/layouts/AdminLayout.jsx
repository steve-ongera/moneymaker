// layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/admin/AdminNavbar.jsx";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminNavbar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}