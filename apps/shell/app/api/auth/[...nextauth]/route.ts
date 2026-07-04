/**
 * NextAuth v5 catch-all route handler.
 * Delegates all GET and POST requests to the NextAuth handlers
 * configured in lib/auth.ts.
 *
 * Covers: /api/auth/signin, /api/auth/signout, /api/auth/session,
 *         /api/auth/callback/*, /api/auth/csrf, etc.
 */

import { handlers } from '../../../../lib/auth';

export const { GET, POST } = handlers;
