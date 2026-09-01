//pages/Profile.jsx
import { useAuth } from "../hooks/useAuth.js";
import { useAviator } from "../hooks/useAviator.js";
import { useState } from "react";
import * as api from "../services/api.js";

export default function Profile() {
  const { user } = useAuth();
  const { round } = useAviator();
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!round?.server_seed) return;
    setVerifying(true);
    try {
      const result = await api.verifyFairness({
        serverSeed: round.server_seed,
        serverSeedHash: round.server_seed_hash,
        clientSeed: round.client_seed,
        nonce: round.nonce,
      });
      setVerifyResult(result);
    } finally {
      setVerifying(false);
    }
  };

  // Inline styles for profile page
  const styles = {
    page: {
      maxWidth: '720px',
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
      width: '24px',
      height: '24px',
    },
    infoRow: {
      display: 'flex',
      padding: 'var(--sp-2) 0',
      borderBottom: '1px solid var(--divider)',
      fontSize: 'var(--fs-sm)',
    },
    infoRowLast: {
      borderBottom: 'none',
    },
    infoLabel: {
      color: 'var(--text-dim)',
      minWidth: '100px',
      fontWeight: 'var(--fw-medium)',
    },
    infoValue: {
      color: 'var(--text-primary)',
    },
    code: {
      fontFamily: 'var(--font-mono)',
      background: 'var(--bg-panel-alt)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.85em',
      wordBreak: 'break-all',
      display: 'inline-block',
      maxWidth: '100%',
    },
    codeBlock: {
      fontFamily: 'var(--font-mono)',
      background: 'var(--bg-panel-alt)',
      padding: 'var(--sp-3)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.85em',
      wordBreak: 'break-all',
      display: 'block',
      maxWidth: '100%',
      overflowX: 'auto',
      margin: 'var(--sp-1) 0 var(--sp-2)',
    },
    seedSection: {
      marginTop: 'var(--sp-3)',
    },
    buttonWrapper: {
      marginTop: 'var(--sp-3)',
    },
    alert: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--sp-2)',
      padding: '12px var(--sp-4)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--fs-sm)',
      margin: 'var(--sp-3) 0 0',
      border: '1px solid transparent',
    },
    alertSuccess: {
      background: 'var(--green-tint)',
      color: '#8ff0b3',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    alertError: {
      background: 'var(--red-tint)',
      color: '#ffb3b8',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    emptyState: {
      color: 'var(--text-faint)',
      fontSize: 'var(--fs-sm)',
      textAlign: 'center',
      padding: 'var(--sp-4) 0',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h1 style={styles.pageHeaderTitle}>Profile</h1>
      </div>

      {/* User Info Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <svg style={styles.cardTitleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Account Information
        </div>

        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Username</span>
          <span style={styles.infoValue}>{user?.username || '—'}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Email</span>
          <span style={styles.infoValue}>{user?.email || '—'}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Phone</span>
          <span style={styles.infoValue}>{user?.phone_number || '—'}</span>
        </div>
        <div style={{...styles.infoRow, ...styles.infoRowLast}}>
          <span style={styles.infoLabel}>Verified</span>
          <span style={styles.infoValue}>
            {user?.is_verified ? (
              <span style={{ color: 'var(--green)' }}>✓ Yes</span>
            ) : (
              <span style={{ color: 'var(--text-dim)' }}>No</span>
            )}
          </span>
        </div>
      </div>

      {/* Provably Fair Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <svg style={styles.cardTitleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          Provably Fair — Last Round
        </div>

        {round ? (
          <>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Round</span>
              <span style={styles.infoValue}>#{round.round_id?.slice(-8) || '—'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Server seed hash</span>
              <span style={styles.infoValue}>
                <code style={styles.code}>{round.server_seed_hash || '—'}</code>
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Client seed</span>
              <span style={styles.infoValue}>
                <code style={styles.code}>{round.client_seed || '—'}</code>
              </span>
            </div>
            <div style={{...styles.infoRow, ...styles.infoRowLast}}>
              <span style={styles.infoLabel}>Nonce</span>
              <span style={styles.infoValue}>{round.nonce || '—'}</span>
            </div>

            {round.server_seed ? (
              <div style={styles.seedSection}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Server seed</span>
                  <span style={styles.infoValue}>
                    <code style={styles.codeBlock}>{round.server_seed}</code>
                  </span>
                </div>
                <div style={styles.buttonWrapper}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleVerify} 
                    disabled={verifying}
                    style={{ width: '100%' }}
                  >
                    {verifying ? (
                      <>
                        <span className="spinner spinner-sm" />
                        Verifying...
                      </>
                    ) : (
                      'Verify this round'
                    )}
                  </button>
                </div>
                {verifyResult && (
                  <div style={{
                    ...styles.alert,
                    ...(verifyResult.is_valid ? styles.alertSuccess : styles.alertError)
                  }}>
                    {verifyResult.is_valid ? '✓ Valid — ' : '✗ Mismatch — '}
                    recomputed crash: {verifyResult.recomputed_crash_multiplier}x
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto var(--sp-2)' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
                <p style={{ margin: 0 }}>Seed reveals once the round crashes.</p>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto var(--sp-2)' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ margin: 0 }}>No round data available yet.</p>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-faint)' }}>
              Place a bet to see round details
            </span>
          </div>
        )}
      </div>
    </div>
  );
}