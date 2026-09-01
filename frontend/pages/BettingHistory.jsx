import { useEffect, useState } from "react";
import * as api from "../services/api.js";
import BettingHistory from "../components/BettingHistory.jsx";

export default function BettingHistoryPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getBetHistory();
        setBets(data.results || data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page page-betting-history">
      <h1><i className="bi bi-clock-history" /> Betting History</h1>
      <BettingHistory bets={bets} loading={loading} />
    </div>
  );
}
