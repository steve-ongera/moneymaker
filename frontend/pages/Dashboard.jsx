import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import WalletBalance from "../components/WalletBalance.jsx";
import GameHistory from "../components/GameHistory.jsx";
import { useAviator } from "../hooks/useAviator.js";

export default function Dashboard() {
  const { user } = useAuth();
  const { round, connectionStatus } = useAviator();

  return (
    <div className="page page-dashboard">
      <h1>Welcome back, {user?.username}</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <WalletBalance />
        </div>

        <div className="dashboard-card">
          <h3><i className="bi bi-broadcast" /> Live Round</h3>
          <p>Status: <strong>{round?.status || "—"}</strong></p>
          <p>Connection: <strong>{connectionStatus}</strong></p>
          <Link to="/play" className="btn btn-primary">
            <i className="bi bi-play-fill" /> Go to game
          </Link>
        </div>

        <div className="dashboard-card">
          <h3><i className="bi bi-graph-up" /> Recent Rounds</h3>
          <GameHistory />
        </div>
      </div>
    </div>
  );
}
