import { useWallet } from "../hooks/useWallet.js";

export default function WalletBalance({ compact = false }) {
  const { balance, currency, refreshWallet } = useWallet();

  return (
    <div className={compact ? "wallet-balance compact" : "wallet-balance"}>
      <div className="wallet-balance-label">
        <i className="bi bi-wallet2" /> Balance
      </div>
      <div className="wallet-balance-amount">
        {currency} {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
      {!compact && (
        <button className="btn btn-ghost btn-small" onClick={refreshWallet}>
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      )}
    </div>
  );
}
