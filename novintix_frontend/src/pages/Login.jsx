import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { login } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        setError("Invalid email or password.");
      } else if (status === 400) {
        setError("Please check the details you entered.");
      } else if (!err.response) {
        setError(
          "Unable to connect to the server. Please try again."
        );
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <span className="brand-mark">N</span>
            <span>NOVINTIX</span>
          </div>

          <div className="brand-message">
            <span className="eyebrow">
              INTELLIGENT CREDIT MANAGEMENT
            </span>

            <h1>
              Smarter decisions.
              <br />
              <span>Stronger business.</span>
            </h1>

            <p>
              Manage customer credit, monitor orders, track
              shipments, and maintain complete financial
              visibility from one place.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <ShieldCheck size={23} />
            </div>

            <div>
              <strong>Credit control you can trust</strong>
              <p>
                Customer-specific pricing and credit
                exposure management.
              </p>
            </div>
          </div>

          <div className="brand-footer">
            CUSTOMER CREDIT & ORDER MANAGEMENT
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <span className="brand-mark">N</span>
            <span>NOVINTIX</span>
          </div>

          <div className="login-heading">
            <span className="welcome-label">
              WELCOME BACK
            </span>

            <h2>Sign in to your account</h2>

            <p>
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />

                <input
                  id="email"
                  type="email"
                  placeholder="admin@novintix.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="username"
                  required
                  maxLength={150}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
              </div>

              <div className="input-wrapper">
                <LockKeyhole
                  size={18}
                  className="input-icon"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              <span>
                {loading ? "Signing in..." : "Sign in"}
              </span>

              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="security-note">
            <ShieldCheck size={16} />

            <span>
              Secure access to your business workspace
            </span>
          </div>

          <div className="login-bottom">
            <p>
              Need access? Contact your system administrator.
            </p>

            <span>
              © 2026 NOVINTIX · ALL RIGHTS RESERVED
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}