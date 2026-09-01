//components/BettingPanel.jsx
import { useState } from "react";
import { useAviator } from "../hooks/useAviator.js";
import { useWallet } from "../hooks/useWallet.js";
import CashoutButton from "./CashoutButton.jsx";

const QUICK_AMOUNTS = [50, 100, 500, 1000];

export default function BettingPanel() {
  const { round, activeBet, placeBet } = useAviator();
  const wallet = useWallet();

  const [amount, setAmount] = useState(100);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const bettingOpen = round?.status === "BETTING_OPEN";
  const hasActiveBet = activeBet && activeBet.status === "ACTIVE";

  const adjust = (delta) => setAmount((a) => Math.max(10, a + delta));

  const handleBet = async () => {
    setError("");
    setPlacing(true); // immediate UI feedback — "Placing bet..."
    try {
      await placeBet(String(amount));
      wallet.refreshWallet();
    } catch (err) {
      setError(err.message || "Bet failed");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="betting-panel">
      <div className="amount-control">
        <button className="btn btn-icon" onClick={() => adjust(-10)} disabled={!bettingOpen || hasActiveBet}>-</button>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(10, Number(e.target.value)))}
          disabled={!bettingOpen || hasActiveBet}
        />
        <button className="btn btn-icon" onClick={() => adjust(10)} disabled={!bettingOpen || hasActiveBet}>+</button>
      </div>

      <div className="quick-amounts">
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            className="btn btn-chip"
            disabled={!bettingOpen || hasActiveBet}
            onClick={() => setAmount(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {hasActiveBet ? (
        <CashoutButton />
      ) : (
        <button
          className="btn btn-bet btn-block"
          onClick={handleBet}
          disabled={!bettingOpen || placing}
        >
          {placing ? "Placing bet..." : `BET KSh ${amount}`}
        </button>
      )}

      {!bettingOpen && !hasActiveBet && (
        <p className="betting-panel-hint">Betting opens with the next round.</p>
      )}
    </div>
  );
}
