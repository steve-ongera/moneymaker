//components/BetCard.jsx
export default function BetCard({ bet }) {
  const statusLabel = {
    ACTIVE: "Active",
    CASHED_OUT: "Cashed Out",
    LOST: "Lost",
    PENDING: "Pending",
    REFUNDED: "Refunded",
  }[bet.status] || bet.status.replace("_", " ");

  // Inline styles
  const styles = {
    card: {
      background: 'var(--bg-panel-alt)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--sp-3)',
      transition: 'border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
    },
    cardWon: {
      borderColor: 'var(--green)',
      background: 'var(--green-tint)',
    },
    cardLost: {
      borderColor: 'var(--red-deep)',
      opacity: 0.72,
    },
    cardActive: {
      borderColor: 'var(--gold)',
    },
    cardPending: {
      borderColor: 'var(--text-faint)',
      opacity: 0.6,
    },
    cardRefunded: {
      borderColor: 'var(--text-faint)',
      opacity: 0.5,
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 'var(--fs-sm)',
    },
    rowWithMargin: {
      marginTop: 'var(--sp-2)',
    },
    player: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--text-secondary)',
    },
    avatar: {
      width: '22px',
      height: '22px',
      borderRadius: 'var(--radius-circle)',
      background: 'var(--bg-elevated)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarSvg: {
      width: '14px',
      height: '14px',
      stroke: 'var(--text-dim)',
    },
    username: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-secondary)',
    },
    amount: {
      fontWeight: 'var(--fw-bold)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-sm)',
    },
    status: {
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-medium)',
    },
    statusCashedOut: {
      color: 'var(--green)',
    },
    statusLost: {
      color: 'var(--red)',
    },
    statusActive: {
      color: 'var(--gold)',
    },
    statusPending: {
      color: 'var(--text-dim)',
    },
    statusRefunded: {
      color: 'var(--text-faint)',
    },
    round: {
      color: 'var(--text-faint)',
      fontSize: 'var(--fs-2xs)',
    },
    detail: {
      marginTop: 'var(--sp-2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--green)',
    },
    multiplierTag: {
      padding: '2px 8px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-bold)',
      background: 'var(--green-tint)',
      color: 'var(--green)',
    },
    payout: {
      fontWeight: 'var(--fw-bold)',
      color: 'var(--green)',
    },
  };

  // Determine card style based on status
  let cardStyle = { ...styles.card };
  if (bet.status === 'CASHED_OUT') cardStyle = { ...cardStyle, ...styles.cardWon };
  if (bet.status === 'LOST') cardStyle = { ...cardStyle, ...styles.cardLost };
  if (bet.status === 'ACTIVE') cardStyle = { ...cardStyle, ...styles.cardActive };
  if (bet.status === 'PENDING') cardStyle = { ...cardStyle, ...styles.cardPending };
  if (bet.status === 'REFUNDED') cardStyle = { ...cardStyle, ...styles.cardRefunded };

  // Determine status style
  let statusStyle = { ...styles.status };
  if (bet.status === 'CASHED_OUT') statusStyle = { ...statusStyle, ...styles.statusCashedOut };
  if (bet.status === 'LOST') statusStyle = { ...statusStyle, ...styles.statusLost };
  if (bet.status === 'ACTIVE') statusStyle = { ...statusStyle, ...styles.statusActive };
  if (bet.status === 'PENDING') statusStyle = { ...statusStyle, ...styles.statusPending };
  if (bet.status === 'REFUNDED') statusStyle = { ...statusStyle, ...styles.statusRefunded };

  return (
    <div style={cardStyle}>
      <div style={styles.row}>
        <div style={styles.player}>
          <div style={styles.avatar}>
            <svg style={styles.avatarSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span style={styles.username}>You</span>
        </div>
        <span style={styles.amount}>KSh {bet.amount}</span>
      </div>
      
      <div style={{...styles.row, ...styles.rowWithMargin}}>
        <span style={statusStyle}>{statusLabel}</span>
        {bet.round_id && (
          <span style={styles.round}>Round #{bet.round_id.slice(-6)}</span>
        )}
      </div>

      {bet.status === "CASHED_OUT" && (
        <div style={styles.detail}>
          <span style={styles.multiplierTag}>{bet.cashout_multiplier}x</span>
          <span style={styles.payout}>+KSh {bet.payout}</span>
        </div>
      )}
    </div>
  );
}