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
  const locked = !bettingOpen || hasActiveBet;

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
        <button
          type="button"
          className="amount-control-btn"
          onClick={() => adjust(-10)}
          disabled={locked}
          aria-label="Decrease amount"
        >
          −
        </button>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(10, Number(e.target.value)))}
          disabled={locked}
        />
        <button
          type="button"
          className="amount-control-btn"
          onClick={() => adjust(10)}
          disabled={locked}
          aria-label="Increase amount"
        >
          +
        </button>
      </div>

      <div className="quick-amounts">
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            className={`btn btn-chip${amount === a ? " active" : ""}`}
            disabled={locked}
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
          type="button"
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