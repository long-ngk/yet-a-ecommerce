/**
 * Auth guard for Account MFE Server Components.
 *
 * Checks whether the current user has a valid session by calling the Shell
 * MFE session endpoint.  If unauthenticated, redirects to the Shell login page.
 */

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
 * Returns the current session or redirects to the Shell login page.
 *
 * Call this at the top of any Account page / layout that requires
 * authentication.
 *
 * ```ts
 * const session = await getSession();
 * // session.user is always defined here
 * ```
 */
export async function getSession(): Promise<Session> {
  let session: Session | null = null;

  try {
    const response = await fetch(`${SHELL_API_URL}/api/auth/session`, {
      // Forward cookies so NextAuth can read the JWT
      credentials: "include",
      // Do not cache — auth state must be fresh on every request
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as Partial<Session>;
      // NextAuth returns {} when there is no active session
      if (data.user) {
        session = data as Session;
      }
    }
  } catch {
    // Network errors are treated as unauthenticated
  }

  if (!session) {
    // unauthenticated users are redirected to login
    const shellUrl = process.env["SHELL_API_URL"] ?? "http://localhost:3000";
    redirect(`${shellUrl}/login?callbackUrl=${shellUrl}/account`);
  }

  return session;
}
