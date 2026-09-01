//components/LiveBets.jsx
import { useAviator } from "../hooks/useAviator.js";
import BetCard from "./BetCard.jsx";

export default function LiveBets() {
  const { activeBet, round } = useAviator();

  return (
    <div className="live-bets">
      <h3><i className="bi bi-people-fill" /> Your Bet — {round?.round_id || "—"}</h3>
      {activeBet ? (
        <BetCard bet={activeBet} />
      ) : (
        <p className="live-bets-empty">No bet placed this round yet.</p>
      )}
    </div>
  );
}
