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

  // Inline styles
  const styles = {
    page: {
      maxWidth: 'var(--content-max)',
      margin: '0 auto',
      padding: 'var(--sp-4) 0',
    },
    pageHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      marginBottom: 'var(--sp-5)',
    },
    pageHeaderIcon: {
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--brand-gradient)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 'var(--fs-xl)',
    },
    pageHeaderTitle: {
      fontSize: 'var(--fs-2xl)',
      fontWeight: 'var(--fw-bold)',
      margin: 0,
    },
    card: {
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-5)',
      boxShadow: 'var(--shadow-inset)',
      marginBottom: 'var(--sp-4)',
    },
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      fontSize: 'var(--fs-lg)',
      fontWeight: 'var(--fw-semibold)',
      margin: '0 0 var(--sp-3) 0',
    },
    cardTitleIcon: {
      width: '20px',
      height: '20px',
    },
    amountControl: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      marginBottom: 'var(--sp-3)',
    },
    amountBtn: {
      width: '40px',
      height: '40px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-panel-alt)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--fs-lg)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast) var(--ease-out)',
    },
    amountInput: {
      flex: 1,
      minWidth: 0,
      textAlign: 'center',
      background: 'var(--bg-input)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '10px',
      fontSize: 'var(--fs-lg)',
      fontWeight: 'var(--fw-bold)',
      outline: 'none',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
    },
    depositBtn: {
      width: '100%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--sp-2)',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      padding: '16px var(--sp-6)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-lg)',
      cursor: 'pointer',
      background: 'var(--brand-gradient)',
      color: 'var(--text-on-brand)',
      boxShadow: 'var(--shadow-brand)',
      transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)',
    },
    quickAmounts: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 'var(--sp-2)',
      marginBottom: 'var(--sp-3)',
    },
    quickAmountBtn: {
      padding: '8px',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-panel-alt)',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all var(--dur-fast) var(--ease-out)',
    },
    quickAmountBtnActive: {
      background: 'var(--brand-gradient)',
      color: 'var(--text-on-brand)',
      borderColor: 'transparent',
    },
  };

  const quickAmounts = [100, 250, 500, 1000];

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <h1 style={styles.pageHeaderTitle}>Wallet</h1>
      </div>

      {/* Balance Card */}
      <div style={styles.card}>
        <WalletBalance />
      </div>

      {/* Deposit Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <svg style={styles.cardTitleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="7 13 12 18 17 13"/>
            <polyline points="7 5 12 10 17 5"/>
          </svg>
          Deposit Funds
        </div>

        {/* Quick Amounts */}
        <div style={styles.quickAmounts}>
          {quickAmounts.map((q) => (
            <button
              key={q}
              style={{
                ...styles.quickAmountBtn,
                ...(amount === q ? styles.quickAmountBtnActive : {}),
              }}
              onClick={() => setAmount(q)}
            >
              KSh {q}
            </button>
          ))}
        </div>

        {/* Amount Control */}
        <div style={styles.amountControl}>
          <button 
            style={styles.amountBtn} 
            onClick={() => setAmount((a) => Math.max(10, a - 100))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <input
            type="number"
            style={styles.amountInput}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="10"
          />
          <button 
            style={styles.amountBtn} 
            onClick={() => setAmount((a) => a + 100)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <button style={styles.depositBtn} onClick={handleDeposit}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="7 13 12 18 17 13"/>
            <polyline points="7 5 12 10 17 5"/>
          </svg>
          Deposit KSh {amount}
        </button>
      </div>
    </div>
  );
}