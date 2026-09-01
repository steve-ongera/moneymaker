//components/LiveBets.jsx
import { useAviator } from "../hooks/useAviator.js";
import BetCard from "./BetCard.jsx";

export default function LiveBets() {
  const { activeBet, round } = useAviator();

  return (
    <div className="live-bets">
      <div className="live-bets-header">
        <h3><i className="bi bi-people-fill" /> Your Bet</h3>
        <span className="live-bets-count">{round?.round_id || "—"}</span>
      </div>

      {activeBet ? (
        <BetCard bet={activeBet} />
      ) : (
        <p className="live-bets-empty">No bet placed this round yet.</p>
      )}
    </div>
  );
}