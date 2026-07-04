/**
 * Shared API utility functions for Shell MFE API Gateway.
 * Provides request ID generation and other common helpers.
 */

/**
 * Generates a unique request ID using the Web Crypto API (Node.js 18+).
 * Used for tracing requests via the X-Request-Id response header.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}
