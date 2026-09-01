//pages/Transactions.jsx
import { useEffect } from "react";
import { useWallet } from "../hooks/useWallet.js";
import TransactionList from "../components/TransactionList.jsx";

export default function Transactions() {
  const { transactions, loading, refreshTransactions } = useWallet();

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

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
    statsBar: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 'var(--sp-3)',
      marginBottom: 'var(--sp-5)',
    },
    statCard: {
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--sp-3) var(--sp-4)',
      textAlign: 'center',
    },
    statValue: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-xl)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-primary)',
    },
    statValueGreen: {
      color: 'var(--green)',
    },
    statValueRed: {
      color: 'var(--red)',
    },
    statLabel: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-dim)',
      display: 'block',
      marginTop: 'var(--sp-1)',
    },
    filterBar: {
      display: 'flex',
      gap: 'var(--sp-2)',
      marginBottom: 'var(--sp-4)',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '6px 16px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      border: '1px solid var(--border-subtle)',
      background: 'transparent',
      color: 'var(--text-dim)',
      cursor: 'pointer',
      transition: 'all var(--dur-fast) var(--ease-out)',
    },
    filterButtonActive: {
      background: 'var(--brand-gradient)',
      color: 'var(--text-on-brand)',
      borderColor: 'transparent',
    },
  };

  // Calculate stats from transactions
  const totalTransactions = transactions?.length || 0;
  const totalCredits = transactions?.filter(t => t.type === 'credit' || t.type === 'deposit' || t.type === 'win')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalDebits = transactions?.filter(t => t.type === 'debit' || t.type === 'withdrawal' || t.type === 'bet')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalCredits - totalDebits;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h1 style={styles.pageHeaderTitle}>Transactions</h1>
      </div>

      {/* Stats Bar */}
      {!loading && transactions?.length > 0 && (
        <div style={styles.statsBar}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalTransactions}</div>
            <span style={styles.statLabel}>Total Transactions</span>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, ...styles.statValueGreen}}>
              +{totalCredits.toFixed(2)}
            </div>
            <span style={styles.statLabel}>Total Credits</span>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, ...styles.statValueRed}}>
              -{totalDebits.toFixed(2)}
            </div>
            <span style={styles.statLabel}>Total Debits</span>
          </div>
          <div style={styles.statCard}>
            <div style={{
              ...styles.statValue,
              ...(netBalance >= 0 ? styles.statValueGreen : styles.statValueRed)
            }}>
              {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(2)}
            </div>
            <span style={styles.statLabel}>Net Balance</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <button 
          style={{...styles.filterButton, ...styles.filterButtonActive}}
          onClick={() => {}}
        >
          All
        </button>
        <button 
          style={styles.filterButton}
          onClick={() => {}}
        >
          Deposits
        </button>
        <button 
          style={styles.filterButton}
          onClick={() => {}}
        >
          Withdrawals
        </button>
        <button 
          style={styles.filterButton}
          onClick={() => {}}
        >
          Bets
        </button>
        <button 
          style={styles.filterButton}
          onClick={() => {}}
        >
          Wins
        </button>
      </div>

      {/* Transaction List */}
      <TransactionList transactions={transactions} loading={loading} />
    </div>
  );
}