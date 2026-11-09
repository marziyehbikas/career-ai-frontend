import { useState } from "react";

import { API_BASE_URL } from "../config";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // JSON.stringify() converts the JavaScript object into JSON text.
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      // response.json() reads the server's JSON response and turns it into a JavaScript value.
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Login failed.");
        return;
      }

      // Pass the successful login result to the parent.
      onLogin(data.access_token, data.user);
    } catch {
      setMessage(
        "Could not connect to the backend. Check that FastAPI is running.",
      );
    } finally {
      // The finally block runs regardless of success or failure, so the button doesn't remain stuck in the loading state.
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="login-card">
        <div className="brand-mark">CA</div>

        <p className="brand-name">CAREER AI</p>

        <h1>Welcome back</h1>

        <p className="subtitle">Sign in to manage your profile and resumes.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}

        <p className="footer-note">
          Your career journey, organized in one place.
        </p>
      </section>
    </main>
  );
}
