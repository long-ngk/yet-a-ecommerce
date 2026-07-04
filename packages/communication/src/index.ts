/**
 * @yet-a-ecommerce/communication
 *
 * Cross-zone Communication Layer for the E-Commerce Micro-Frontends platform.
 *
 * Provides three communication channels:
 *  1. Custom Events  – real-time broadcast via window.dispatchEvent / window.addEventListener
 *  2. Shared Store   – persistent state via localStorage with namespace-prefixed keys
 *  3. onStoreChange  – reactive listener for Shared Store changes
 */

export type { EventPayload } from './events';
export { dispatch, subscribe } from './events';
export { writeStore, readStore, clearStore, onStoreChange } from './store';
