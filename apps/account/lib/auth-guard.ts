/**
 * Auth guard for Account MFE Server Components.
 *
 * The Account MFE does not run NextAuth itself — authentication is managed
 * entirely by the Shell MFE. Instead, we verify the session by calling
 * the Shell's session endpoint and forwarding the user's cookies so that
 * NextAuth can validate the JWT.
 *
 * If unauthenticated, redirects to the Shell login page.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SHELL_API_URL =
  process.env["SHELL_API_URL"] ?? "http://localhost:3000";

// Shape returned by NextAuth v5's /api/auth/session endpoint
export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

/**
 * Returns the current session or null if unauthenticated.
 *
 * Fetches the session from the Shell MFE's NextAuth endpoint,
 * forwarding cookies so NextAuth can validate the JWT.
 *
 * ```ts
 * const session = await getSession();
 * if (!session) redirect("/login");
 * ```
 */
export async function getSession(): Promise<Session | null> {
  let cookieHeader: string;

  try {
    const cookieStore = await cookies();
    cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
  } catch {
    // cookies() may throw in environments where headers are unavailable
    cookieHeader = "";
  }

  try {
    const response = await fetch(`${SHELL_API_URL}/api/auth/session`, {
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Partial<Session>;

    // NextAuth returns an empty object `{}` when there is no active session
    if (!data.user) {
      return null;
    }

    return data as Session;
  } catch {
    // Network errors or JSON parse failures — treat as unauthenticated
    return null;
  }
}

/**
 * Ensures the user is authenticated, or redirects to login.
 *
 * Call this at the top of any Account page that requires authentication.
 *
 * ```ts
 * const session = await requireAuth();
 * // session.user is always defined here
 * ```
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    const shellUrl = process.env["SHELL_API_URL"] ?? "http://localhost:3000";
    redirect(`${shellUrl}/login?callbackUrl=${shellUrl}/account`);
  }

  return session;
}
