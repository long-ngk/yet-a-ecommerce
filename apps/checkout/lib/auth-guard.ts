import { redirect } from "next/navigation";

const SHELL_API_URL =
  process.env["SHELL_API_URL"] ?? "http://localhost:3000";

export interface Session {
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  expires?: string;
}

/**
 * Fetch the current session from the Shell API.
 * Returns null when the user is not authenticated or the request fails.
 */
export async function getSession(): Promise<Session | null> {
  const res = await fetch(`${SHELL_API_URL}/api/auth/session`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Session;

  // NextAuth returns an empty object `{}` when the session does not exist
  if (!data.user) return null;

  return data;
}

/**
 * Server-side auth guard for use in Next.js Server Components and Route
 * Handlers.
 *
 * If the user is not authenticated, redirect to the Shell
 * login page and preserve the current path so the user is returned here after
 * a successful sign-in.
 *
 * @param callbackPath  The path to return to after login (default: "/checkout")
 * @returns The active session object.
 */
export async function requireAuth(callbackPath = "/checkout"): Promise<Session> {
  const session = await getSession();

  if (!session) {
    const shellUrl = process.env["SHELL_API_URL"] ?? "http://localhost:3000";
    const loginUrl = `${shellUrl}/api/auth/signin?callbackUrl=${encodeURIComponent(`${shellUrl}${callbackPath}`)}`;
    redirect(loginUrl);
  }

  return session;
}
