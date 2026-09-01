//components/BettingHistory.jsx
import BetCard from "./BetCard.jsx";

export default function BettingHistory({ bets, loading }) {
  // Inline styles
  const styles = {
    loadingWrap: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--sp-3)',
      padding: 'var(--sp-16) 0',
      color: 'var(--text-dim)',
    },
    spinner: {
      width: '22px',
      height: '22px',
      border: '3px solid var(--border)',
      borderTopColor: 'var(--brand-2)',
      borderRadius: 'var(--radius-circle)',
      animation: 'spin 0.8s linear infinite',
    },
    spinnerSm: {
      width: '16px',
      height: '16px',
      borderWidth: '2px',
    },
    emptyState: {
      color: 'var(--text-faint)',
      fontSize: 'var(--fs-sm)',
      textAlign: 'center',
      padding: 'var(--sp-10) 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--sp-2)',
    },
    emptyIcon: {
      width: '40px',
      height: '40px',
      stroke: 'var(--text-faint)',
      opacity: 0.4,
    },
    emptyTitle: {
      margin: 0,
      fontSize: 'var(--fs-base)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-secondary)',
    },
    emptySubtitle: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-faint)',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 'var(--sp-3)',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={{...styles.spinner, ...styles.spinnerSm}} />
        <span>Loading bet history...</span>
      </div>
    );
  }

  if (!bets?.length) {
    return (
      <div style={styles.emptyState}>
        <svg style={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <p style={styles.emptyTitle}>No bets placed yet.</p>
        <span style={styles.emptySubtitle}>Place your first bet to get started</span>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {bets.map((bet) => (
        <BetCard key={bet.id} bet={bet} />
      ))}
    </div>
  );
}