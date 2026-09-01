//pages/BettingHistory.jsx
import { useEffect, useState } from "react";
import * as api from "../services/api.js";
import BettingHistory from "../components/BettingHistory.jsx";

export default function BettingHistoryPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getBetHistory();
        setBets(data.results || data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Inline styles for betting history page
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
    statLabel: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-dim)',
      display: 'block',
      marginTop: 'var(--sp-1)',
    },
    statValueGreen: {
      color: 'var(--green)',
    },
    statValueRed: {
      color: 'var(--red)',
    },
    statValueGold: {
      color: 'var(--gold)',
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

  // Calculate stats from bets
  const totalBets = bets.length;
  const totalWon = bets.filter(b => b.status === 'CASHED_OUT').length;
  const totalLost = bets.filter(b => b.status === 'LOST').length;
  const totalProfit = bets.reduce((sum, b) => {
    if (b.status === 'CASHED_OUT') return sum + Number(b.payout || 0);
    if (b.status === 'LOST') return sum - Number(b.amount || 0);
    return sum;
  }, 0);

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1 style={styles.pageHeaderTitle}>Betting History</h1>
      </div>

      {/* Stats Bar */}
      {!loading && bets.length > 0 && (
        <div style={styles.statsBar}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalBets}</div>
            <span style={styles.statLabel}>Total Bets</span>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, ...styles.statValueGreen}}>{totalWon}</div>
            <span style={styles.statLabel}>Won</span>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, ...styles.statValueRed}}>{totalLost}</div>
            <span style={styles.statLabel}>Lost</span>
          </div>
          <div style={styles.statCard}>
            <div style={{
              ...styles.statValue,
              ...(totalProfit >= 0 ? styles.statValueGreen : styles.statValueRed)
            }}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} KSh
            </div>
            <span style={styles.statLabel}>Profit/Loss</span>
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
          Won
        </button>
        <button 
          style={styles.filterButton}
          onClick={() => {}}
        >
          Lost
        </button>
        <button 
          style={styles.filterButton}
          onClick={() => {}}
        >
          Pending
        </button>
      </div>

      {/* Betting History List */}
      <BettingHistory bets={bets} loading={loading} />
    </div>
  );
}