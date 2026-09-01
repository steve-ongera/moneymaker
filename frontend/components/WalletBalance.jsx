//components/WalletBalance.jsx
import { useWallet } from "../hooks/useWallet.js";

export default function WalletBalance({ compact = false }) {
  const { balance, currency, refreshWallet } = useWallet();

  // Inline styles
  const styles = {
    walletBalance: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--sp-2)',
    },
    compact: {
      gap: 'var(--sp-1)',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      color: 'var(--text-dim)',
      fontSize: 'var(--fs-sm)',
    },
    labelIcon: {
      width: '16px',
      height: '16px',
      stroke: 'var(--text-dim)',
    },
    amount: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
      fontWeight: 'var(--fw-black)',
      color: 'var(--gold)',
    },
    compactAmount: {
      fontSize: 'var(--fs-lg)',
    },
    refreshBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 14px',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all var(--dur-fast) var(--ease-out)',
      alignSelf: 'flex-start',
      marginTop: 'var(--sp-1)',
    },
    refreshBtnHover: {
      borderColor: 'var(--border-strong)',
      color: 'var(--text-primary)',
    },
    refreshIcon: {
      width: '16px',
      height: '16px',
      stroke: 'currentColor',
    },
  };

  return (
    <div style={{
      ...styles.walletBalance,
      ...(compact ? styles.compact : {}),
    }}>
      <div style={styles.label}>
        <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
        Balance
      </div>
      <div style={{
        ...styles.amount,
        ...(compact ? styles.compactAmount : {}),
      }}>
        {currency} {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
      {!compact && (
        <button 
          style={styles.refreshBtn}
          onClick={refreshWallet}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <svg style={styles.refreshIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      )}
    </div>
  );
}