import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "", email: "", phone_number: "", password: "", password2: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      navigate("/play");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1><i className="bi bi-airplane-fill" /> MoneyMaker</h1>
        <p className="auth-subtitle">Create your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <label>Username</label>
        <input value={form.username} onChange={update("username")} required autoFocus />

        <label>Email</label>
        <input type="email" value={form.email} onChange={update("email")} required />

        <label>Phone number</label>
        <input value={form.phone_number} onChange={update("phone_number")} placeholder="+2547XXXXXXXX" />

        <label>Password</label>
        <input type="password" value={form.password} onChange={update("password")} required />

        <label>Confirm password</label>
        <input type="password" value={form.password2} onChange={update("password2")} required />

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
