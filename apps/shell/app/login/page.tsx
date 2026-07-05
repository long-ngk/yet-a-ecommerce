"use client";

/**
 * Login page — maps to `/login`
 *
 * Client Component: handles user sign in with email/password.
 * On successful login, redirects to callbackUrl or dashboard.
 */

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) setError("");
  }, [email, password]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || "Invalid email or password");
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Sign In</h1>
        <p style={styles.subtitle}>
          Don't have an account?{" "}
          <Link href="/register" style={styles.link}>
            Register here
          </Link>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div role="alert" aria-live="polite" style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* Login form */}
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
            autoComplete="current-password"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          style={
            loading || !email || !password
              ? { ...styles.submitBtn, opacity: 0.6, cursor: "not-allowed" }
              : styles.submitBtn
          }
          aria-busy={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Footer */}
      <p style={styles.footer}>
        By signing in, you agree to our{" "}
        <Link href="/terms" style={styles.link}>
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main style={styles.main}>
      <Suspense fallback={<div style={{ ...styles.card, textAlign: "center" as const }}>Loading...</div>}>
        <LoginForm />
      </Suspense>
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
