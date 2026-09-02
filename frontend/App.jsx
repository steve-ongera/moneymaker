import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Aviator from "./pages/Aviator.jsx";
import Wallet from "./pages/Wallet.jsx";
import Transactions from "./pages/Transactions.jsx";
import BettingHistory from "./pages/BettingHistory.jsx";
import Profile from "./pages/Profile.jsx";
import Terms from "./pages/Terms.jsx";
import NotFound from "./pages/NotFound.jsx";

import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminTransactions from "./pages/admin/AdminTransactions.jsx";
import AdminLiveRound from "./pages/admin/AdminLiveRound.jsx";
import AdminRoundHistory from "./pages/admin/AdminRoundHistory.jsx";
import "./styles/admin.css";

export default function App() {
  return (
    <Routes>
      {/* ---------- Admin (own layout, own auth) ---------- */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="live" element={<AdminLiveRound />} />
        <Route path="rounds" element={<AdminRoundHistory />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="transactions" element={<AdminTransactions />} />
      </Route>

      {/* ---------- Player-facing app (unchanged) ---------- */}
      <Route
        path="/*"
        element={
          <div className="app-shell">
            <Navbar />
            <div className="app-body">
              <Sidebar />
              <main className="app-content">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/play" element={<ProtectedRoute><Aviator /></ProtectedRoute>} />
                  <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                  <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                  <Route path="/history" element={<ProtectedRoute><BettingHistory /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        }
      />
    </Routes>
  );
}