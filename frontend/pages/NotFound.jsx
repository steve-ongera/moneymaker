//pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  // Inline styles
  const styles = {
    page: {
      minHeight: 'calc(100vh - var(--navbar-h))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-8) var(--sp-4)',
      textAlign: 'center',
      background: `
        radial-gradient(600px 400px at 50% 30%, rgba(234, 93, 11, 0.08), transparent 70%),
        var(--bg-app)
      `,
      position: 'relative',
      overflow: 'hidden',
    },
    backgroundIcon: {
      position: 'absolute',
      fontSize: 'clamp(20rem, 40vw, 40rem)',
      color: 'rgba(234, 93, 11, 0.04)',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 0,
    },
    content: {
      position: 'relative',
      zIndex: 1,
      maxWidth: '600px',
    },
    iconWrapper: {
      width: '80px',
      height: '80px',
      borderRadius: 'var(--radius-circle)',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto var(--sp-5)',
      fontSize: 'var(--fs-3xl)',
      color: 'var(--brand-2)',
      boxShadow: 'var(--shadow-md)',
    },
    code: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(4rem, 12vw, 8rem)',
      fontWeight: 'var(--fw-black)',
      background: 'var(--brand-gradient)',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
      backgroundClip: 'text',
      lineHeight: '1',
      margin: '0 0 var(--sp-2) 0',
      letterSpacing: '-0.02em',
    },
    title: {
      fontSize: 'var(--fs-2xl)',
      fontWeight: 'var(--fw-bold)',
      margin: '0 0 var(--sp-3) 0',
      color: 'var(--text-primary)',
    },
    message: {
      fontSize: 'var(--fs-lg)',
      color: 'var(--text-secondary)',
      margin: '0 0 var(--sp-5) 0',
      maxWidth: '400px',
      marginLeft: 'auto',
      marginRight: 'auto',
      lineHeight: '1.6',
    },
    btnPrimary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      background: 'var(--brand-gradient)',
      color: 'var(--text-on-brand)',
      padding: '14px 32px',
      borderRadius: 'var(--radius-md)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-base)',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
      boxShadow: 'var(--shadow-brand)',
      transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)',
    },
    btnPrimaryHover: {
      filter: 'brightness(1.08)',
      transform: 'translateY(-2px)',
    },
    suggestion: {
      marginTop: 'var(--sp-6)',
      paddingTop: 'var(--sp-4)',
      borderTop: '1px solid var(--divider)',
      display: 'flex',
      gap: 'var(--sp-3)',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    suggestionLink: {
      color: 'var(--text-dim)',
      fontSize: 'var(--fs-sm)',
      textDecoration: 'none',
      padding: 'var(--sp-1) var(--sp-2)',
      borderRadius: 'var(--radius-sm)',
      transition: 'color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
    },
    suggestionLinkHover: {
      color: 'var(--text-primary)',
      background: 'var(--bg-hover)',
    },
  };

  const suggestions = [
    { to: '/', label: 'Dashboard' },
    { to: '/play', label: 'Play Game' },
    { to: '/wallet', label: 'Wallet' },
  ];

  return (
    <div style={styles.page}>
      {/* Background decorative icon */}
      <div style={styles.backgroundIcon}>
        <i className="bi bi-airplane-engines" />
      </div>

      <div style={styles.content}>
      

        {/* 404 Code */}
        <h1 style={styles.code}>404</h1>

        {/* Title */}
        <h2 style={styles.title}>Page Took Off Without You</h2>

        {/* Message */}
        <p style={styles.message}>
          Oops! The page you're looking for has flown away. 
          Don't worry, you can still find your way back.
        </p>

        {/* Primary Action */}
        <Link 
          to="/" 
          style={styles.btnPrimary}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <i className="bi bi-house-fill" />
          Back to Dashboard
        </Link>

        {/* Quick Links */}
        <div style={styles.suggestion}>
          {suggestions.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={styles.suggestionLink}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-dim)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}