//pages/Terms.jsx
import { Link } from "react-router-dom";

export default function Terms() {
  const styles = {
    page: {
      maxWidth: '820px',
      margin: '0 auto',
      padding: 'var(--sp-6) var(--sp-4)',
    },
    header: {
      marginBottom: 'var(--sp-6)',
      textAlign: 'center',
    },
    iconWrapper: {
      width: '64px',
      height: '64px',
      borderRadius: 'var(--radius-circle)',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto var(--sp-4)',
      fontSize: 'var(--fs-2xl)',
      color: 'var(--brand-2)',
    },
    title: {
      fontSize: 'var(--fs-2xl)',
      fontWeight: 'var(--fw-bold)',
      margin: '0 0 var(--sp-2) 0',
      color: 'var(--text-primary)',
    },
    lastUpdated: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-dim)',
    },
    card: {
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-6)',
      marginBottom: 'var(--sp-4)',
    },
    paragraph: {
      fontSize: 'var(--fs-base)',
      color: 'var(--text-secondary)',
      lineHeight: '2',
      margin: '0 0 var(--sp-3) 0',
    },
    highlight: {
      color: 'var(--brand-1)',
      fontWeight: 'var(--fw-semibold)',
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      color: 'var(--brand-1)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      textDecoration: 'none',
      transition: 'color var(--dur-fast) var(--ease-out)',
    },
    list: {
      paddingLeft: 'var(--sp-4)',
      margin: 'var(--sp-2) 0',
      listStyle: 'none',
    },
    listItem: {
      fontSize: 'var(--fs-base)',
      color: 'var(--text-secondary)',
      lineHeight: '2',
      marginBottom: 'var(--sp-1)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--sp-2)',
    },
    listIcon: {
      color: 'var(--green)',
      marginTop: '4px',
      fontSize: 'var(--fs-md)',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          <i className="bi bi-file-text-fill" />
        </div>
        <h1 style={styles.title}>Terms & Conditions</h1>
        <p style={styles.lastUpdated}>Last Updated: January 2026</p>
      </div>

      <div style={styles.card}>
        <p style={styles.paragraph}>
          Welcome to <span style={styles.highlight}>MoneyMaker</span>, Kenya's premier provably fair crash game platform. 
          By using our platform, you agree to these Terms & Conditions. You must be at least 
          <span style={styles.highlight}> 18 years old</span> and a resident of 
          <span style={styles.highlight}> Kenya</span> with a valid 
          <span style={styles.highlight}> M-Pesa</span> account. Our game is provably fair 
          — the crash multiplier is determined by a cryptographically secure algorithm using 
          server seed, client seed, and nonce, which you can verify every round. 
          <span style={styles.highlight}> Deposits</span> are instant via M-Pesa STK push 
          (minimum KSh 20), and <span style={styles.highlight}> withdrawals</span> are processed 
          manually (minimum KSh 100, up to 24 hours). We are committed to 
          <span style={styles.highlight}> responsible gaming</span> — set limits, take breaks, 
          and never chase losses. Prohibited activities include underage gambling, fraud, 
          multiple accounts, bots, and platform abuse. We collect your data in accordance with 
          <span style={styles.highlight}> Kenya's Data Protection Act (2019)</span> and never 
          share it without your consent. Violation of these terms may result in account suspension 
          or permanent ban. For questions, contact us at 
          <span style={styles.highlight}> support@moneymaker.co.ke</span> or 
          <span style={styles.highlight}> +254 700 123 956</span> (Mon-Fri, 9AM-6PM EAT).
        </p>

        
      </div>

      
    </div>
  );
}