'use server';

/**
 * Server Actions for Account app.
 * 
 * These functions run on the server and can access cookies directly,
 * enabling Client Components to make authenticated API calls.
 */

import { cookies } from 'next/headers';
import { getProfile, updateProfile, type UserProfile, type UpdateProfileData } from './api-client';

/**
 * Load the current user's profile.
 * Available to Client Components via server action call.
 */
export async function loadProfile(): Promise<UserProfile> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  
  return getProfile(cookieHeader);
}

/**
 * Update the current user's profile.
 * Available to Client Components via server action call.
 */
export async function saveProfile(data: UpdateProfileData): Promise<UserProfile> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  
  return updateProfile(data, cookieHeader);
}
