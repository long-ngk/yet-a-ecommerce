"use client";

/**
 * Register page — maps to `/register`
 *
 * Client Component: handles user sign up with email/password.
 * After successful registration, auto-signs in user and redirects to dashboard.
 */

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError("");
  }, [email, password, confirmPassword]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Validate form
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Call register API
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        const message = errorData.message || "Registration failed";
        setError(message);
        setLoading(false);
        return;
      }

      // Auto-sign in after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Registration successful, but automatic login failed. Please sign in manually.");
      } else if (signInResult?.ok) {
        router.push("/");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>
            Already have an account?{" "}
            <Link href="/login" style={styles.link}>
              Sign in here
            </Link>
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div role="alert" aria-live="polite" style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Register form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {/* Email field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              Email Address <span style={styles.required}>*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              aria-describedby={error ? "error-message" : undefined}
              aria-invalid={!!error}
              style={styles.input}
              autoComplete="email"
            />
          </div>

          {/* Password field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Password <span style={styles.required}>*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              aria-describedby={error ? "error-message" : undefined}
              aria-invalid={!!error}
              style={styles.input}
              autoComplete="new-password"
            />
            <p style={styles.hint}>Must be at least 8 characters</p>
          </div>

          {/* Confirm password field */}
          <div style={styles.fieldGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirm Password <span style={styles.required}>*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              aria-describedby={error ? "error-message" : undefined}
              aria-invalid={!!error}
              style={styles.input}
              autoComplete="new-password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !email || !password || !confirmPassword}
            style={
              loading || !email || !password || !confirmPassword
                ? { ...styles.submitBtn, opacity: 0.6, cursor: "not-allowed" }
                : styles.submitBtn
            }
            aria-busy={loading}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footer}>
          By signing up, you agree to our{" "}
          <Link href="/terms" style={styles.link}>
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px 16px",
  } as React.CSSProperties,

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    padding: "32px",
    width: "100%",
    maxWidth: "400px",
  } as React.CSSProperties,

  header: {
    marginBottom: "28px",
  } as React.CSSProperties,

  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 8px 0",
  } as React.CSSProperties,

  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  } as React.CSSProperties,

  link: {
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: 500,
    "&:hover": {
      textDecoration: "underline",
    },
  } as React.CSSProperties,

  errorBox: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "12px 16px",
    marginBottom: "20px",
    fontSize: "14px",
  } as React.CSSProperties,

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    marginBottom: "24px",
  } as React.CSSProperties,

  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  } as React.CSSProperties,

  label: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
  } as React.CSSProperties,

  required: {
    color: "#ef4444",
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#111827",
    backgroundColor: "#ffffff",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as React.CSSProperties,

  hint: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  } as React.CSSProperties,

  submitBtn: {
    padding: "10px 16px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,

  footer: {
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center" as const,
    margin: 0,
  } as React.CSSProperties,
} as const;
