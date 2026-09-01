import { useState } from "react";
import { useAviator } from "../hooks/useAviator.js";
import { useWallet } from "../hooks/useWallet.js";

export default function CashoutButton() {
  const { round, activeBet, multiplier, cashOutBet } = useAviator();
  const wallet = useWallet();
  const [cashing, setCashing] = useState(false);
  const [error, setError] = useState("");

  const running = round?.status === "RUNNING";
  const estimatedPayout = activeBet ? (Number(activeBet.amount) * multiplier).toFixed(2) : "0.00";

  const handleCashout = async () => {
    setError("");
    setCashing(true); // immediate UI feedback — never shown as success until server confirms
    try {
      await cashOutBet();
      wallet.refreshWallet();
    } catch (err) {
      setError(err.message || "Cash-out failed");
    } finally {
      setCashing(false);
    }
  };

  if (activeBet?.status === "CASHED_OUT") {
    return (
      <div className="cashout-result success">
        <i className="bi bi-check-circle-fill" /> Cashed out at {activeBet.cashout_multiplier}x — +KSh {activeBet.payout}
      </div>
    );
  }

  if (activeBet?.status === "LOST") {
    return (
      <div className="cashout-result lost">
        <i className="bi bi-x-circle-fill" /> Bet lost
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <button
        className="btn btn-cashout btn-block"
        onClick={handleCashout}
        disabled={!running || cashing}
      >
        {cashing ? "Cashing out..." : `CASH OUT — KSh ${estimatedPayout}`}
      </button>
    </div>
  );
}
