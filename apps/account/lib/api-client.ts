/**
 * API client for the Account MFE.
 * All requests proxy through the Shell MFE API Gateway.
 */

const SHELL_API_URL =
  process.env["SHELL_API_URL"] ?? "http://localhost:3000";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  cookieHeader?: string,
): Promise<T> {
  const url = `${SHELL_API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { error?: { message?: string } }).error?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ─── Profile Endpoints ───────────────────────────────────────────────────────

/**
 * Fetch the current user's profile from GET /api/users/me.
 * Requires cookie header to be passed in for authentication.
 */
export async function getProfile(cookieHeader?: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/users/me", undefined, cookieHeader);
}

/**
 * Update allowed profile fields via PATCH /api/users/me.
 * Immutable fields (id, email, role) are rejected server-side.
 */
export async function updateProfile(
  data: UpdateProfileData,
  cookieHeader?: string,
): Promise<UserProfile> {
  return apiFetch<UserProfile>(
    "/api/users/me",
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    cookieHeader,
  );
}
