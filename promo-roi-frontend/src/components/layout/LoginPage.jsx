import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  UserRoundKey,
} from "lucide-react";
import "./login.css";
 
export default function LoginPage({ onLogin }) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
 
  function handleSubmit(event) {
    event.preventDefault();
 
    if (!name.trim() || !userId.trim() || !password.trim()) {
      setError("Please enter your name, user ID and password.");
      return;
    }
 
    setError("");
 
    // Temporary frontend login.
    // Backend authentication will be connected later.
    onLogin({
      name: name.trim(),
      userId: userId.trim(),
    });
  }
 
  return (
    <main className="login-screen">
      <div className="login-background-grid" aria-hidden="true" />
      <div className="login-orb login-orb-blue" aria-hidden="true" />
      <div className="login-orb login-orb-teal" aria-hidden="true" />
      <div className="login-orb login-orb-pink" aria-hidden="true" />
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />
 
      <section className="login-brand-panel">
        <div className="login-brand-lockup">
          <div className="login-brand-mark">
            <span className="login-brand-mark-core" />
          </div>
 
          <div>
            <strong>Promo ROI</strong>
            <span>SIMULATOR</span>
          </div>
        </div>
 
        <div className="login-hero-copy">
          <span className="login-eyebrow">
            PROMOTION INTELLIGENCE
          </span>
 
          <h1>
            Make every
            <br />
            <em>promotion</em> count.
          </h1>
 
          <p>
            Understand the impact behind every offer.
            Turn promotion decisions into measurable
            commercial outcomes.
          </p>
        </div>
 
        <div className="login-visual" aria-hidden="true">
          <div className="visual-glass visual-glass-back" />
 
          <div className="visual-glass visual-glass-front">
            <div className="visual-topline">
              <i />
              <i />
              <i />
            </div>
 
            <div className="visual-chart-label">
              PROMOTION PERFORMANCE
            </div>
 
            <div className="visual-chart-value">
              +24.8% <small>ROI</small>
            </div>
 
            <div className="visual-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
 
            <div className="visual-chart-foot">
              <span>INCREMENTAL PROFIT</span>
              <b>↗</b>
            </div>
          </div>
 
          <div className="visual-orb" />
 
          <div className="visual-mini-card">
            <span>✓</span>
            <div>
              <b>Decision ready</b>
              <small>Insights at a glance</small>
            </div>
          </div>
        </div>
 
        <div className="login-brand-foot">
          <span>Commercial performance workspace</span>
          <span>● Secure workspace</span>
        </div>
      </section>
 
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <div className="login-brand-mark">
              <span className="login-brand-mark-core" />
            </div>
            <strong>
              Promo ROI <small>SIMULATOR</small>
            </strong>
          </div>
 
          <span className="login-form-eyebrow">
            WELCOME TO YOUR WORKSPACE
          </span>
 
          <h2>Sign in to continue</h2>
 
          <p className="login-form-intro">
            Enter your assigned workspace details to access
            the promotion dashboard.
          </p>
 
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="login-name">Full name</label>
 
            <div className="login-input-wrap">
              <UserRound size={18} />
              <input
                id="login-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
              />
            </div>
 
            <label htmlFor="login-userid">User ID</label>
 
            <div className="login-input-wrap">
              <UserRoundKey size={18} />
              <input
                id="login-userid"
                autoComplete="username"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="Enter your user ID"
              />
            </div>
 
            <label htmlFor="login-password">Password</label>
 
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
 
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
 
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
 
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
 
            <button className="login-submit" type="submit">
              Open dashboard
              <ArrowRight size={17} />
            </button>
          </form>
 
          <div className="login-auth-note">
            <span className="login-auth-dot" />
            Authentication will be connected to the company backend.
          </div>
 
          <p className="login-legal">
            For authorised workspace users only.
          </p>
        </div>
      </section>
    </main>
  );
}