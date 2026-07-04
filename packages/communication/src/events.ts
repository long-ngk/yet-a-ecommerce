import { writeStore } from './store';

/**
 * Payload structure for all cross-zone custom events.
 * CustomEvent detail contains event name and JSON payload.
 */
export interface EventPayload {
  type: string;
  data: unknown;
  timestamp: number;
  source: string; // zone name that dispatched the event
}

/**
 * Dispatch a custom event to all listening zones.
 *
 * Uses window.dispatchEvent with CustomEvent, payload serialized as JSON in detail.
 * Also writes the latest state to Shared Store for catch-up by late-mounting zones.
 */
export function dispatch(eventName: string, payload: EventPayload): void {
  try {
    // persist latest state to Shared Store before dispatching
    writeStore('events', eventName, payload);
  } catch (err) {
    // Non-blocking — log but do not prevent event dispatch
    console.warn('[Communication] Failed to write event to Shared Store:', err);
  }

  try {
    // dispatch using window.dispatchEvent with CustomEvent
    const event = new CustomEvent(eventName, {
      detail: payload,
      bubbles: false,
      cancelable: false,
    });
    window.dispatchEvent(event);
  } catch (err) {
    // Non-blocking — log but do not throw
    console.error('[Communication] Failed to dispatch event:', err);
  }
}

/**
 * Subscribe to custom events by name.
 *
 * Uses window.addEventListener to register handlers per event name.
 * Returns an unsubscribe function that calls window.removeEventListener.
 */
export function subscribe(
  eventName: string,
  handler: (payload: EventPayload) => void,
): () => void {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<EventPayload>;
    handler(customEvent.detail);
  };

  // register via window.addEventListener
  window.addEventListener(eventName, listener);

  // return unsubscribe function using window.removeEventListener
  return () => {
    window.removeEventListener(eventName, listener);
  };
}
