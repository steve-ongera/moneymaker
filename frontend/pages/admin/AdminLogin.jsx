// pages/admin/AdminLogin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLoginStep1, adminResendOtp, adminVerifyOtp } from "../../services/adminClient.js";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = credentials, 2 = otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [loginToken, setLoginToken] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function handleCredentials(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLoginStep1(email, password);
      setLoginToken(res.login_token);
      setStep(2);
      setResendCooldown(30);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminVerifyOtp(loginToken, code);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    try {
      const res = await adminResendOtp(loginToken);
      setLoginToken(res.login_token);
      setResendCooldown(30);
    } catch (err) {
      setError(err.message || "Could not resend code.");
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="admin-auth-screen">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <div className="admin-auth-brand">
            MoneyMaker <span>Admin</span>
          </div>
          <h1 className="admin-auth-title">
            {step === 1 ? "Welcome Back" : "Verify Your Identity"}
          </h1>
          <p className="admin-auth-subtitle">
            {step === 1 
              ? "Sign in to the control panel" 
              : `Enter the 6-digit code sent to ${email}`
            }
          </p>
        </div>

        {error && <div className="admin-auth-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleCredentials} className="admin-auth-form">
            <label>
              Email Address
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="admin@example.com"
                required 
                autoFocus 
              />
            </label>
            <label>
              Password
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password"
                  required 
                  style={{ 
                    paddingRight: '44px',
                    width: '100%'
                  }}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-placeholder)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color var(--admin-transition-fast)',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    borderRadius: 'var(--admin-radius-sm)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--admin-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--admin-placeholder)';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = '2px solid var(--admin-accent)';
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </label>
            <button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  {' '}Checking…
                </>
              ) : (
                <>
                  Continue <i className="bi bi-arrow-right" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="admin-auth-form">
            <label>
              6-Digit Verification Code
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                autoFocus
                style={{ 
                  textAlign: 'center', 
                  fontSize: '1.5rem', 
                  letterSpacing: '8px',
                  fontWeight: '600'
                }}
              />
            </label>
            <button 
              type="submit" 
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  {' '}Verifying…
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check" /> Verify & Sign In
                </>
              )}
            </button>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: '12px',
              marginTop: '4px'
            }}>
              <button
                type="button"
                className="admin-auth-link"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{ 
                  opacity: resendCooldown > 0 ? 0.5 : 1,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {resendCooldown > 0 ? (
                  <>
                    <i className="bi bi-clock" /> Resend code ({resendCooldown}s)
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-counterclockwise" /> Resend code
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="admin-auth-link" 
                onClick={() => setStep(1)}
              >
                <i className="bi bi-arrow-left" /> Back
              </button>
            </div>
          </form>
        )}

        <div className="admin-auth-footer">
          {step === 1 ? (
            <span>Secure admin access with two-factor authentication</span>
          ) : (
            <span>Check your email for the verification code</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Add this CSS for the spin animation if not already present
/*
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
*/