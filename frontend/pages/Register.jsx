import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import logo from "../src/assets/moneymaker_logo.png";

const PHONE_RE = /^\+?\d{9,15}$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "", phone_number: "", password: "", password2: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const togglePassword = () => setShowPassword(!showPassword);
  const togglePassword2 = () => setShowPassword2(!showPassword2);

  const validate = () => {
    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (form.password !== form.password2) {
      return "Passwords do not match.";
    }
    if (form.phone_number && !PHONE_RE.test(form.phone_number)) {
      return "Enter a valid phone number, e.g. +2547XXXXXXXX.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const clientError = validate();
    if (clientError) {
      setError(clientError);
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate("/play");
    } catch (err) {
      setError(typeof err.message === "string" ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const EyeIcon = ({ show }) => (
    <svg viewBox="0 0 24 24">
      {show ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      )}
    </svg>
  );

  return (
    <div className="auth-page">
      <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
        <div className="auth-header">
          <h1>
            <img src={logo} alt="MoneyMaker Logo" className="auth-logo" width="32" height="32" />
          </h1>
          <p className="auth-subtitle">Create your account and start winning</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="auth-form-grid">
          <div className="field">
            <label htmlFor="email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={update("email")}
              required
              autoFocus
              placeholder="your@email.com"
            />
          </div>

          <div className="field">
            <label htmlFor="phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Phone number
            </label>
            <input
              id="phone"
              className="input"
              value={form.phone_number}
              onChange={update("phone_number")}
              placeholder="+2547XXXXXXXX"
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password
            </label>
            <div className="input-group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input"
                value={form.password}
                onChange={update("password")}
                required
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                className="input-group-toggle"
                onClick={togglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="password2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Confirm password
            </label>
            <div className="input-group">
              <input
                id="password2"
                type={showPassword2 ? "text" : "password"}
                className="input"
                value={form.password2}
                onChange={update("password2")}
                required
                placeholder="Re-enter password"
              />
              <button
                type="button"
                className="input-group-toggle"
                onClick={togglePassword2}
                aria-label={showPassword2 ? "Hide password" : "Show password"}
              >
                <EyeIcon show={showPassword2} />
              </button>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-block btn-large" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner spinner-sm" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="auth-divider">or</div>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}