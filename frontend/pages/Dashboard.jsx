//pages/Dashboard.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import WalletBalance from "../components/WalletBalance.jsx";
import GameHistory from "../components/GameHistory.jsx";
import { useAviator } from "../hooks/useAviator.js";

export default function Dashboard() {
  const { user } = useAuth();
  const { round, connectionStatus } = useAviator();

  // Inline styles
  const styles = {
    page: {
      maxWidth: '100%',
      margin: '0 auto',
      padding: 0,
      overflow: 'hidden',
    },
    // Hero Section
    hero: {
      position: 'relative',
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-deep)',
      overflow: 'hidden',
    },
    heroImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: 0.15,
      zIndex: 0,
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(16,16,24,0.95) 0%, rgba(16,16,24,0.7) 100%)',
      zIndex: 1,
    },
    heroContent: {
      position: 'relative',
      zIndex: 2,
      maxWidth: '1200px',
      margin: '0 auto',
      padding: 'var(--sp-8) var(--sp-6)',
      width: '100%',
    },
    heroGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--sp-8)',
      alignItems: 'center',
    },
    heroBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      background: 'var(--green-tint)',
      color: 'var(--green)',
      padding: '6px 16px',
      borderRadius: '6px',
      fontSize: '2px',
      fontWeight: 'var(--fw-semibold)',
      marginBottom: 'var(--sp-4)',
    },
    heroTitle: {
      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
      fontWeight: 'var(--fw-black)',
      margin: '0 0 var(--sp-3) 0',
      color: 'var(--text-primary)',
      lineHeight: '1.05',
    },
    heroTitleHighlight: {
      background: 'var(--brand-gradient)',
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
      backgroundClip: 'text',
    },
    heroSubtitle: {
      fontSize: '18px',
      color: 'var(--text-secondary)',
      maxWidth: '550px',
      margin: '0 0 var(--sp-5) 0',
      lineHeight: '1.7',
    },
    heroStats: {
      display: 'flex',
      gap: 'var(--sp-6)',
      marginBottom: 'var(--sp-5)',
    },
    heroStat: {
      textAlign: 'left',
    },
    heroStatValue: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-2xl)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-primary)',
    },
    heroStatLabel: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-dim)',
    },
    heroActions: {
      display: 'flex',
      gap: 'var(--sp-3)',
      flexWrap: 'wrap',
    },
    heroImageRight: {
      position: 'relative',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      aspectRatio: '4/3',
    },
    heroImageRightImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
    heroImageRightOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 'var(--sp-4)',
      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
      color: '#fff',
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
    btnSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      background: 'rgba(255,255,255,0.08)',
      color: 'var(--text-primary)',
      padding: '14px 32px',
      borderRadius: 'var(--radius-md)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-base)',
      border: '1px solid var(--border-subtle)',
      cursor: 'pointer',
      textDecoration: 'none',
      backdropFilter: 'blur(8px)',
      transition: 'border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
    },
    // Features Section
    features: {
      padding: 'var(--sp-12) var(--sp-6)',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    featuresHeader: {
      textAlign: 'center',
      marginBottom: 'var(--sp-8)',
    },
    featuresTitle: {
      fontSize: 'clamp(2rem, 3vw, 3rem)',
      fontWeight: 'var(--fw-bold)',
      margin: '0 0 var(--sp-2) 0',
      color: 'var(--text-primary)',
    },
    featuresSubtitle: {
      fontSize: 'var(--fs-lg)',
      color: 'var(--text-secondary)',
      maxWidth: '600px',
      margin: '0 auto',
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 'var(--sp-5)',
    },
    feature: {
      textAlign: 'center',
      padding: 'var(--sp-6)',
      background: 'var(--bg-panel)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      transition: 'border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
    },
    featureIcon: {
      width: '64px',
      height: '64px',
      borderRadius: 'var(--radius-circle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-panel-alt)',
      margin: '0 auto var(--sp-3)',
      fontSize: 'var(--fs-2xl)',
      color: 'var(--brand-2)',
    },
    featureTitle: {
      fontSize: 'var(--fs-lg)',
      fontWeight: 'var(--fw-semibold)',
      margin: '0 0 var(--sp-2) 0',
      color: 'var(--text-primary)',
    },
    featureDesc: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-dim)',
      margin: 0,
      lineHeight: '1.6',
    },
    // Testimonials Section
    testimonials: {
      background: 'var(--bg-deep)',
      padding: 'var(--sp-12) var(--sp-6)',
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)',
    },
    testimonialsInner: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    testimonialsHeader: {
      textAlign: 'center',
      marginBottom: 'var(--sp-8)',
    },
    testimonialsTitle: {
      fontSize: 'clamp(2rem, 3vw, 3rem)',
      fontWeight: 'var(--fw-bold)',
      margin: '0 0 var(--sp-2) 0',
      color: 'var(--text-primary)',
    },
    testimonialsSubtitle: {
      fontSize: 'var(--fs-lg)',
      color: 'var(--text-secondary)',
    },
    testimonialsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 'var(--sp-5)',
    },
    testimonial: {
      background: 'var(--bg-panel)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-5)',
      border: '1px solid var(--border-subtle)',
    },
    testimonialStars: {
      color: 'var(--gold)',
      fontSize: 'var(--fs-lg)',
      marginBottom: 'var(--sp-3)',
      letterSpacing: '2px',
    },
    testimonialText: {
      fontSize: 'var(--fs-base)',
      color: 'var(--text-secondary)',
      lineHeight: '1.7',
      margin: '0 0 var(--sp-3) 0',
      fontStyle: 'italic',
    },
    testimonialAuthor: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
    },
    testimonialAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-circle)',
      background: 'var(--brand-gradient)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-sm)',
    },
    testimonialName: {
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-primary)',
      fontSize: 'var(--fs-sm)',
    },
    testimonialRole: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-dim)',
    },
    // Dashboard Cards Section
    dashboard: {
      padding: 'var(--sp-12) var(--sp-6)',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    dashboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: 'var(--sp-5)',
    },
    dashboardCard: {
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-5)',
      boxShadow: 'var(--shadow-inset)',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-3)',
      marginBottom: 'var(--sp-3)',
    },
    cardIcon: {
      width: '40px',
      height: '40px',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-panel-alt)',
      fontSize: 'var(--fs-xl)',
      color: 'var(--brand-2)',
    },
    cardTitle: {
      fontSize: 'var(--fs-md)',
      fontWeight: 'var(--fw-semibold)',
      margin: 0,
      color: 'var(--text-primary)',
    },
    cardSubtitle: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-dim)',
      margin: 'var(--sp-1) 0 0',
    },
    cardLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      color: 'var(--brand-1)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-sm)',
      textDecoration: 'none',
      marginTop: 'var(--sp-2)',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
    },
    statusOnline: {
      background: 'var(--green-tint)',
      color: 'var(--green)',
    },
    statusOffline: {
      background: 'var(--red-tint)',
      color: 'var(--red)',
    },
    statusConnecting: {
      background: 'var(--gold-tint)',
      color: 'var(--gold)',
    },
    dot: {
      width: '7px',
      height: '7px',
      borderRadius: 'var(--radius-circle)',
      display: 'inline-block',
    },
    dotConnected: {
      background: 'var(--green)',
      boxShadow: '0 0 6px rgba(34, 197, 94, 0.7)',
    },
    dotConnecting: {
      background: 'var(--gold)',
      animation: 'dot-pulse 1s ease-in-out infinite',
    },
    dotDisconnected: {
      background: 'var(--red)',
    },
    // CTA Section
    cta: {
      background: 'var(--bg-panel)',
      padding: 'var(--sp-12) var(--sp-6)',
      textAlign: 'center',
      borderTop: '1px solid var(--border-subtle)',
    },
    ctaInner: {
      maxWidth: '700px',
      margin: '0 auto',
    },
    ctaTitle: {
      fontSize: 'clamp(2rem, 3vw, 3rem)',
      fontWeight: 'var(--fw-bold)',
      margin: '0 0 var(--sp-3) 0',
      color: 'var(--text-primary)',
    },
    ctaSubtitle: {
      fontSize: 'var(--fs-lg)',
      color: 'var(--text-secondary)',
      marginBottom: 'var(--sp-5)',
    },
    ctaActions: {
      display: 'flex',
      gap: 'var(--sp-3)',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    '@media (max-width: 1024px)': {
      heroGrid: {
        gridTemplateColumns: '1fr',
        gap: 'var(--sp-5)',
      },
      heroImageRight: {
        aspectRatio: '16/9',
        maxWidth: '600px',
        margin: '0 auto',
      },
    },
    '@media (max-width: 768px)': {
      hero: {
        minHeight: 'auto',
        padding: 'var(--sp-8) 0',
      },
      heroStats: {
        flexWrap: 'wrap',
        gap: 'var(--sp-4)',
      },
      heroActions: {
        flexDirection: 'column',
        width: '100%',
      },
      heroImageRight: {
        aspectRatio: '4/3',
      },
      featuresGrid: {
        gridTemplateColumns: '1fr',
      },
      testimonialsGrid: {
        gridTemplateColumns: '1fr',
      },
      dashboardGrid: {
        gridTemplateColumns: '1fr',
      },
    },
    '@media (max-width: 480px)': {
      heroTitle: {
        fontSize: 'clamp(2rem, 8vw, 2.5rem)',
      },
      btnPrimary: {
        width: '100%',
        justifyContent: 'center',
      },
      btnSecondary: {
        width: '100%',
        justifyContent: 'center',
      },
    },
  };

  const getStatusStyle = () => {
    if (connectionStatus === 'connected') return styles.statusOnline;
    if (connectionStatus === 'connecting') return styles.statusConnecting;
    return styles.statusOffline;
  };

  const getDotStyle = () => {
    if (connectionStatus === 'connected') return styles.dotConnected;
    if (connectionStatus === 'connecting') return styles.dotConnecting;
    return styles.dotDisconnected;
  };

  const roundStatus = round?.status || 'WAITING';
  const statusLabels = {
    WAITING: '⏳ Waiting',
    BETTING_OPEN: '🎯 Betting Open',
    RUNNING: '✈️ Flying',
    CRASHED: '💥 Crashed',
    SETTLED: '✅ Settled',
  };

  const testimonials = [
    {
      id: 1,
      name: "John Mwangi",
      role: "Verified Player",
      text: "MoneyMaker is the most exciting game I've played! The M-Pesa integration makes deposits instant and withdrawals smooth. I've already won over 50,000 KSh!",
      initials: "JM",
    },
    {
      id: 2,
      name: "Grace Wanjiru",
      role: "Verified Player",
      text: "The provably fair system gives me confidence that every round is legitimate. I love the auto cashout feature - it's saved me from crashing multiple times!",
      initials: "GW",
    },
    {
      id: 3,
      name: "Peter Ochieng",
      role: "Verified Player",
      text: "Best crash game in Kenya! The user interface is clean, the game is fast-paced, and the customer support is responsive. Highly recommended!",
      initials: "PO",
    },
  ];

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroImage} />
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <div style={styles.heroGrid}>
            <div>
             
              <h1 style={styles.heroTitle}>
                Fly High with{' '}
                <span style={styles.heroTitleHighlight}>MoneyMaker</span>
              </h1>
              <p style={styles.heroSubtitle}>
                The most thrilling crash game in Kenya. Watch the multiplier soar, 
                cash out before it crashes, and turn small bets into massive wins. 
                Provably fair, instant M-Pesa, and non-stop action.
              </p>
              
              <div style={styles.heroActions}>
                <Link to="/play" style={styles.btnPrimary}>
                  <i className="bi bi-play-fill" />
                  Play Now
                </Link>
                <Link to="/wallet" style={styles.btnSecondary}>
                  <i className="bi bi-wallet2" />
                  Deposit Funds
                </Link>
              </div>
            </div>
            <div style={styles.heroImageRight}>
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80"
                alt="MoneyMaker Aviator Game - Crash Game"
                style={styles.heroImageRightImg}
              />
              <div style={styles.heroImageRightOverlay}>
                <strong> 15,234 Players Online</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.featuresHeader}>
          <h2 style={styles.featuresTitle}>Why Play MoneyMaker?</h2>
          <p style={styles.featuresSubtitle}>
            Experience the best crash game with features designed for winners
          </p>
        </div>
        <div style={styles.featuresGrid}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <i className="bi bi-shield-check" />
            </div>
            <h3 style={styles.featureTitle}>Provably Fair</h3>
            <p style={styles.featureDesc}>
              Every round is verifiable with our open-source fairness system. 
              No manipulation, pure transparency.
            </p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <i className="bi bi-phone" />
            </div>
            <h3 style={styles.featureTitle}>Instant M-Pesa</h3>
            <p style={styles.featureDesc}>
              Deposit and withdraw instantly via M-Pesa STK push. 
              No delays, no hidden fees.
            </p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <i className="bi bi-robot" />
            </div>
            <h3 style={styles.featureTitle}>Auto Cashout</h3>
            <p style={styles.featureDesc}>
              Set your target multiplier and let the system auto-cashout 
              for you. Never miss a win.
            </p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>
              <i className="bi bi-graph-up" />
            </div>
            <h3 style={styles.featureTitle}>High Multipliers</h3>
            <p style={styles.featureDesc}>
              Watch multipliers soar up to 100x+ and turn small bets 
              into massive wins in seconds.
            </p>
          </div>
    
          
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={styles.testimonials}>
        <div style={styles.testimonialsInner}>
          <div style={styles.testimonialsHeader}>
            <h2 style={styles.testimonialsTitle}>What Players Say</h2>
            <p style={styles.testimonialsSubtitle}>
              Join thousands of satisfied winners on MoneyMaker
            </p>
          </div>
          <div style={styles.testimonialsGrid}>
            {testimonials.map((t) => (
              <div key={t.id} style={styles.testimonial}>
                <div style={styles.testimonialStars}>
                  <i className="bi bi-star-fill" />
                  <i className="bi bi-star-fill" />
                  <i className="bi bi-star-fill" />
                  <i className="bi bi-star-fill" />
                  <i className="bi bi-star-fill" />
                </div>
                <p style={styles.testimonialText}>"{t.text}"</p>
                <div style={styles.testimonialAuthor}>
                  <div style={styles.testimonialAvatar}>{t.initials}</div>
                  <div>
                    <div style={styles.testimonialName}>{t.name}</div>
                    <div style={styles.testimonialRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>Ready to Win Big?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of players already winning on MoneyMaker. 
            Start with as little as KSh 10 and watch your profits soar!
          </p>
          <div style={styles.ctaActions}>
            <Link to="/play" style={styles.btnPrimary}>
              <i className="bi bi-play-fill" />
              Start Playing Now
            </Link>
            <Link to="/register" style={styles.btnSecondary}>
              <i className="bi bi-person-plus" />
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Add dot-pulse animation */}
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}