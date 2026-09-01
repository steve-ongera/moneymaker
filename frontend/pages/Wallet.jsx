//pages/Wallet.jsx
import { useState } from "react";
import WalletBalance from "../components/WalletBalance.jsx";
import { useWallet } from "../context/WalletContext.jsx";

export default function Wallet() {
  const wallet = useWallet();
  const [amount, setAmount] = useState(500);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleDeposit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    if (amount < 10) {
      alert("Minimum deposit is KSh 10");
      return;
    }

    try {
      await wallet.initiateDeposit({
        phoneNumber: phoneNumber,
        amount: amount,
      });
    } catch (error) {
      console.error("Deposit error:", error);
    }
  };

  const handleWithdrawal = async () => {
    if (amount < 100) {
      alert("Minimum withdrawal is KSh 100");
      return;
    }

    if (amount > parseFloat(wallet.balance)) {
      alert("Insufficient balance");
      return;
    }

    try {
      await wallet.initiateWithdrawal({
        amount: amount,
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
    }
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
    amountBtnHover: {
      background: 'var(--bg-hover)',
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
    phoneInput: {
      width: '100%',
      background: 'var(--bg-input)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px',
      fontSize: 'var(--fs-base)',
      outline: 'none',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
      marginBottom: 'var(--sp-3)',
      fontFamily: 'var(--font-body)',
    },
    phoneInputFocus: {
      borderColor: 'var(--brand-2)',
      boxShadow: '0 0 0 3px rgba(234, 93, 11, 0.18)',
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
      opacity: 1,
    },
    depositBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    withdrawalBtn: {
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
      background: 'var(--red)',
      color: '#fff',
      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.35)',
      transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)',
      opacity: 1,
    },
    withdrawalBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
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
    tabs: {
      display: 'flex',
      gap: 'var(--sp-2)',
      marginBottom: 'var(--sp-4)',
      background: 'var(--bg-panel-alt)',
      borderRadius: 'var(--radius-md)',
      padding: '3px',
    },
    tab: {
      flex: 1,
      padding: '10px',
      textAlign: 'center',
      borderRadius: 'calc(var(--radius-md) - 3px)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-dim)',
      cursor: 'pointer',
      transition: 'all var(--dur-fast) var(--ease-out)',
      border: 'none',
      background: 'none',
    },
    tabActive: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
    },
    statusAlert: {
      padding: '12px var(--sp-4)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--fs-sm)',
      marginBottom: 'var(--sp-3)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
    },
    statusPending: {
      background: 'var(--blue-chip-tint)',
      color: 'var(--blue-chip)',
      border: '1px solid rgba(79, 142, 247, 0.3)',
    },
    statusCompleted: {
      background: 'var(--green-tint)',
      color: 'var(--green)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    statusFailed: {
      background: 'var(--red-tint)',
      color: 'var(--red)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    statusTimeout: {
      background: 'var(--gold-tint)',
      color: 'var(--gold)',
      border: '1px solid rgba(255, 181, 71, 0.3)',
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '3px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: 'var(--radius-circle)',
      animation: 'spin 0.8s linear infinite',
    },
  };

  const quickAmounts = [100, 250, 500, 1000];

  const getStatusStyle = () => {
    if (!wallet.depositStatus) return null;
    const status = wallet.depositStatus.status;
    if (status === "PENDING") return styles.statusPending;
    if (status === "COMPLETED") return styles.statusCompleted;
    if (status === "FAILED") return styles.statusFailed;
    if (status === "TIMEOUT") return styles.statusTimeout;
    return styles.statusPending;
  };

  const getStatusIcon = () => {
    const status = wallet.depositStatus?.status;
    if (status === "PENDING") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
    }
    if (status === "COMPLETED") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      );
    }
    if (status === "FAILED" || status === "TIMEOUT") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      );
    }
    return null;
  };

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

      {/* Deposit/Withdraw Tabs */}
      <div style={styles.card}>
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(!showWithdraw ? styles.tabActive : {}),
            }}
            onClick={() => setShowWithdraw(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
              <polyline points="7 13 12 18 17 13"/>
              <polyline points="7 5 12 10 17 5"/>
            </svg>
            Deposit
          </button>
          <button
            style={{
              ...styles.tab,
              ...(showWithdraw ? styles.tabActive : {}),
            }}
            onClick={() => setShowWithdraw(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
              <polyline points="7 11 12 6 17 11"/>
              <polyline points="7 19 12 14 17 19"/>
            </svg>
            Withdraw
          </button>
        </div>

        {/* Status Alert */}
        {wallet.depositStatus && (
          <div style={{...styles.statusAlert, ...getStatusStyle()}}>
            {getStatusIcon()}
            {wallet.depositStatus.message}
          </div>
        )}

        {/* Phone Number Input (only for deposit) */}
        {!showWithdraw && (
          <input
            type="tel"
            style={styles.phoneInput}
            placeholder="Phone Number (e.g., 0712345678)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--brand-2)';
              e.target.style.boxShadow = '0 0 0 3px rgba(234, 93, 11, 0.18)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        )}

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
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-panel-alt)'}
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
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--brand-2)';
              e.target.style.boxShadow = '0 0 0 3px rgba(234, 93, 11, 0.18)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button 
            style={styles.amountBtn} 
            onClick={() => setAmount((a) => a + 100)}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-panel-alt)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Action Button */}
        {!showWithdraw ? (
          <button 
            style={{
              ...styles.depositBtn,
              ...(wallet.isProcessingDeposit ? styles.depositBtnDisabled : {}),
            }}
            onClick={handleDeposit}
            disabled={wallet.isProcessingDeposit}
          >
            {wallet.isProcessingDeposit ? (
              <>
                <div style={styles.spinner} />
                Processing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="7 13 12 18 17 13"/>
                  <polyline points="7 5 12 10 17 5"/>
                </svg>
                Deposit KSh {amount}
              </>
            )}
          </button>
        ) : (
          <button 
            style={{
              ...styles.withdrawalBtn,
              ...(wallet.isProcessingDeposit ? styles.withdrawalBtnDisabled : {}),
            }}
            onClick={handleWithdrawal}
            disabled={wallet.isProcessingDeposit}
          >
            {wallet.isProcessingDeposit ? (
              <>
                <div style={styles.spinner} />
                Processing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="7 11 12 6 17 11"/>
                  <polyline points="7 19 12 14 17 19"/>
                </svg>
                Withdraw KSh {amount}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}