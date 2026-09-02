import { Navigate } from "react-router-dom";
import { adminTokenStore } from "../../services/adminClient.js";

export default function AdminProtectedRoute({ children }) {
  if (!adminTokenStore.getAccess()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}