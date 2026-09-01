//components/CashoutButton.jsx
import { useState } from "react";
import { useAviator } from "../hooks/useAviator.js";
import { useWallet } from "../hooks/useWallet.js";

// Never let a raw object hit JSX — always coerce to a string first.
function toErrorString(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err.message && typeof err.message === "string") return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "Cash-out failed";
  }
}

export default function CashoutButton() {
  const { round, activeBet, multiplier, cashOutBet } = useAviator();
  const wallet = useWallet();
  const [cashing, setCashing] = useState(false);
  const [error, setError] = useState("");

  const running = round?.status === "RUNNING";
  const estimatedPayout = activeBet ? (Number(activeBet.amount) * multiplier).toFixed(2) : "0.00";

  const handleCashout = async () => {
    setError("");
    setCashing(true);
    try {
      await cashOutBet();
      wallet.refreshWallet();
    } catch (err) {
      setError(toErrorString(err));
    } finally {
      setCashing(false);
    }
  };

  if (activeBet?.status === "CASHED_OUT") {
    return (
      <div className="cashout-result success">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        Cashed out at {activeBet.cashout_multiplier}x — +KSh {activeBet.payout}
      </div>
    );
  }

  if (activeBet?.status === "LOST") {
    return (
      <div className="cashout-result lost">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        Bet lost
      </div>
    );
  }

  return (
    <div className="cashout-section">
      {error && <div className="alert alert-error">{error}</div>}
      <button
        className="btn btn-cashout btn-block"
        onClick={handleCashout}
        disabled={!running || cashing}
      >
        {cashing ? (
          <>
            <span className="spinner spinner-sm" />
            Cashing out...
          </>
        ) : (
          <>CASH OUT — KSh {estimatedPayout}</>
        )}
      </button>
    </div>
  );
}