/**
 * Shared Store API backed by localStorage.
 *
 * Keys are namespaced as `${namespace}:${key}` to avoid collisions between zones.
 * Reads/writes use namespace-prefixed keys.
 * Uses localStorage as the storage mechanism.
 * Writing fires a storage event (localStorage does this cross-tab automatically;
 *            within the same page we dispatch a manual StorageEvent so onStoreChange listeners
 *            are notified even in the same browsing context).
 */

function buildKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

/**
 * Write a JSON-serializable value to localStorage with namespace prefix.
 * Also dispatches a synthetic StorageEvent so same-page listeners are notified.
 */
export function writeStore(namespace: string, key: string, value: unknown): void {
  const storageKey = buildKey(namespace, key);
  try {
    const serialized = JSON.stringify(value);
    const oldValue = localStorage.getItem(storageKey);
    localStorage.setItem(storageKey, serialized);

    // localStorage storage events only fire in OTHER tabs/windows.
    // Dispatch a synthetic StorageEvent on the current window so that
    // onStoreChange listeners in the SAME page context are also triggered.
    try {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: storageKey,
          newValue: serialized,
          oldValue,
          storageArea: localStorage,
          url: window.location.href,
        }),
      );
    } catch (eventErr) {
      console.warn('[Communication] Failed to dispatch synthetic storage event:', eventErr);
    }
  } catch (err) {
    console.warn('[Communication] writeStore failed:', err);
  }
}

/**
 * Read and parse a value from localStorage.
 * Returns null if the key does not exist or JSON parsing fails.
 */
export function readStore<T>(namespace: string, key: string): T | null {
  const storageKey = buildKey(namespace, key);
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('[Communication] readStore failed to parse JSON:', err);
    return null;
  }
}

/**
 * Remove a key from localStorage.
 */
export function clearStore(namespace: string, key: string): void {
  const storageKey = buildKey(namespace, key);
  try {
    localStorage.removeItem(storageKey);
  } catch (err) {
    console.warn('[Communication] clearStore failed:', err);
  }
}

/**
 * Listen for changes to a specific namespaced key in the Shared Store.
 * Returns an unsubscribe function.
 *
 * Handles both:
 *  - Native StorageEvent (cross-tab changes from real localStorage writes)
 *  - Synthetic StorageEvent dispatched by writeStore (same-page changes)
 *
 * Triggers handler when the matching key changes.
 * Allows late-mounting zones to respond to state changes.
 */
export function onStoreChange(
  namespace: string,
  key: string,
  handler: (value: unknown) => void,
): () => void {
  const storageKey = buildKey(namespace, key);

  const listener = (event: StorageEvent) => {
    if (event.key !== storageKey) return;
    if (event.newValue === null) {
      handler(null);
      return;
    }
    try {
      const parsed = JSON.parse(event.newValue);
      handler(parsed);
    } catch (err) {
      console.warn('[Communication] onStoreChange failed to parse new value:', err);
      handler(null);
    }
  };

  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener('storage', listener);
  };
}
