import { describe, expect, it } from 'vitest';
import { dispatch, subscribe } from '../events';

// jsdom environment provides window, CustomEvent, etc.

const makePayload = (overrides = {}) => ({
  type: 'test:event',
  data: { foo: 'bar' },
  timestamp: Date.now(),
  source: 'products',
  ...overrides,
});

describe('dispatch', () => {
  it('dispatches a CustomEvent on window with the given event name', () => {
    const received: Event[] = [];
    window.addEventListener('test:event', (e) => received.push(e));

    dispatch('test:event', makePayload());
    expect(received).toHaveLength(1);

    window.removeEventListener('test:event', (e) => received.push(e));
  });

  it('includes the payload in the CustomEvent detail', () => {
    let detail: unknown = null;
    const listener = (e: Event) => {
      detail = (e as CustomEvent).detail;
    };
    window.addEventListener('test:payload', listener);

    const payload = makePayload({ type: 'test:payload', data: { productId: '42' } });
    dispatch('test:payload', payload);

    expect(detail).toEqual(payload);
    window.removeEventListener('test:payload', listener);
  });

  it('also writes the payload to Shared Store under events namespace', () => {
    const eventName = 'test:store-write';
    dispatch(eventName, makePayload({ type: eventName }));

    const stored = localStorage.getItem(`events:${eventName}`);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.type).toBe(eventName);
  });
});

describe('subscribe', () => {
  it('receives events dispatched after subscribing', () => {
    const received: unknown[] = [];
    const unsub = subscribe('sub:event', (p) => received.push(p));

    const payload = makePayload({ type: 'sub:event' });
    dispatch('sub:event', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);
    unsub();
  });

  it('can have multiple subscribers all receiving the same payload', () => {
    const a: unknown[] = [];
    const b: unknown[] = [];

    const unsubA = subscribe('multi:event', (p) => a.push(p));
    const unsubB = subscribe('multi:event', (p) => b.push(p));

    dispatch('multi:event', makePayload({ type: 'multi:event' }));

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(a[0]).toEqual(b[0]);

    unsubA();
    unsubB();
  });

  it('returns an unsubscribe function that stops the handler from receiving further events', () => {
    const received: unknown[] = [];
    const unsub = subscribe('unsub:event', (p) => received.push(p));

    dispatch('unsub:event', makePayload({ type: 'unsub:event' }));
    expect(received).toHaveLength(1);

    unsub();

    dispatch('unsub:event', makePayload({ type: 'unsub:event' }));
    expect(received).toHaveLength(1); // still 1 — unsubscribed handler was not called
  });

  it('does not receive events dispatched before subscribing', () => {
    const received: unknown[] = [];

    // dispatch first
    dispatch('pre:event', makePayload({ type: 'pre:event' }));

    // subscribe after
    const unsub = subscribe('pre:event', (p) => received.push(p));

    expect(received).toHaveLength(0);
    unsub();
  });
});
