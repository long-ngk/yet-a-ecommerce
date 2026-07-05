/**
 * Auth guard for the Orders MFE.
 *
 * The Orders MFE does not run NextAuth itself — authentication is managed
 * entirely by the Shell MFE.  Instead, we verify the session by calling
 * the Shell's session endpoint and forwarding the user's cookies so that
 * NextAuth can validate the JWT.
 *
 * Usage in a Server Component or page:
 * ```ts
 * import { getSession } from "@/lib/auth-guard";
 * import { redirect } from "next/navigation";
 *
 * const session = await getSession();
 * if (!session) redirect("/login");
 * ```
 *
 * Unauthenticated users must be redirected to login.
 */

import { cookies } from "next/headers";

const SHELL_API_URL = process.env["SHELL_API_URL"] ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

// ─── getSession ───────────────────────────────────────────────────────────────

/**
 * Fetches the current session from the Shell MFE's NextAuth endpoint.
 *
 * Returns the Session object when authenticated, or `null` when the user
 * is not logged in (HTTP 401 or missing user data).
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
