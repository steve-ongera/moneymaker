import { useState } from "react";
import WalletBalance from "../components/WalletBalance.jsx";
import { useWallet } from "../hooks/useWallet.js";

export default function Wallet() {
  const wallet = useWallet();
  const [amount, setAmount] = useState(500);

  // Deposits/withdrawals are typically initiated via a payment provider (e.g. M-Pesa
  // STK push) through a dedicated backend endpoint — wired up in a later phase.
  const handleDeposit = () => {
    alert(`Deposit flow for KSh ${amount} would be triggered here (e.g. M-Pesa STK push).`);
  };

  return (
    <div className="page page-wallet">
      <h1><i className="bi bi-wallet2" /> Wallet</h1>

      <div className="wallet-page-card">
        <WalletBalance />
      </div>

      <div className="wallet-page-card">
        <h3>Deposit</h3>
        <div className="amount-control">
          <button className="btn btn-icon" onClick={() => setAmount((a) => Math.max(10, a - 100))}>-</button>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <button className="btn btn-icon" onClick={() => setAmount((a) => a + 100)}>+</button>
        </div>
        <button className="btn btn-primary btn-block" onClick={handleDeposit}>
          <i className="bi bi-arrow-down-circle" /> Deposit KSh {amount}
        </button>
      </div>
    </div>
  );
}
