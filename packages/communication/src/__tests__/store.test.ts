import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearStore, onStoreChange, readStore, writeStore } from '../store';

// jsdom environment provides localStorage and StorageEvent.

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('writeStore', () => {
  it('stores a value under the namespaced key in localStorage', () => {
    writeStore('cart', 'items', [{ id: '1', qty: 2 }]);
    const raw = localStorage.getItem('cart:items');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([{ id: '1', qty: 2 }]);
  });

  it('stores strings, numbers, objects, and arrays', () => {
    writeStore('ns', 'str', 'hello');
    writeStore('ns', 'num', 42);
    writeStore('ns', 'obj', { a: 1 });
    writeStore('ns', 'arr', [1, 2, 3]);

    expect(JSON.parse(localStorage.getItem('ns:str')!)).toBe('hello');
    expect(JSON.parse(localStorage.getItem('ns:num')!)).toBe(42);
    expect(JSON.parse(localStorage.getItem('ns:obj')!)).toEqual({ a: 1 });
    expect(JSON.parse(localStorage.getItem('ns:arr')!)).toEqual([1, 2, 3]);
  });

  it('overwrites an existing value', () => {
    writeStore('auth', 'token', 'old-token');
    writeStore('auth', 'token', 'new-token');
    expect(readStore<string>('auth', 'token')).toBe('new-token');
  });
});

describe('readStore', () => {
  it('returns the stored value after a write', () => {
    writeStore('orders', 'list', [{ id: 'o1' }]);
    const result = readStore<{ id: string }[]>('orders', 'list');
    expect(result).toEqual([{ id: 'o1' }]);
  });

  it('returns null for a key that does not exist', () => {
    expect(readStore('ns', 'nonexistent')).toBeNull();
  });

  it('returns null and does not throw when stored value is malformed JSON', () => {
    localStorage.setItem('ns:bad', '{not json');
    expect(readStore('ns', 'bad')).toBeNull();
  });
});

describe('clearStore', () => {
  it('removes the key from localStorage', () => {
    writeStore('checkout', 'cart', { items: [] });
    clearStore('checkout', 'cart');
    expect(localStorage.getItem('checkout:cart')).toBeNull();
  });

  it('does not throw when clearing a key that does not exist', () => {
    expect(() => clearStore('ns', 'missing')).not.toThrow();
  });
});

describe('onStoreChange', () => {
  it('calls the handler when writeStore updates the matching key', () => {
    const received: unknown[] = [];
    const unsub = onStoreChange('auth', 'token', (v) => received.push(v));

    writeStore('auth', 'token', { userId: 'u1' });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ userId: 'u1' });
    unsub();
  });

  it('does not call the handler for a different key in the same namespace', () => {
    const received: unknown[] = [];
    const unsub = onStoreChange('auth', 'token', (v) => received.push(v));

    writeStore('auth', 'user-name', 'Alice');

    expect(received).toHaveLength(0);
    unsub();
  });

  it('does not call the handler for the same key in a different namespace', () => {
    const received: unknown[] = [];
    const unsub = onStoreChange('auth', 'data', (v) => received.push(v));

    writeStore('profile', 'data', { name: 'Bob' });

    expect(received).toHaveLength(0);
    unsub();
  });

  it('returns an unsubscribe function that stops further notifications', () => {
    const received: unknown[] = [];
    const unsub = onStoreChange('cart', 'items', (v) => received.push(v));

    writeStore('cart', 'items', [1]);
    expect(received).toHaveLength(1);

    unsub();

    writeStore('cart', 'items', [2]);
    expect(received).toHaveLength(1); // still 1 — listener was removed
  });

  it('receives multiple successive writes', () => {
    const received: unknown[] = [];
    const unsub = onStoreChange('cart', 'count', (v) => received.push(v));

    writeStore('cart', 'count', 1);
    writeStore('cart', 'count', 2);
    writeStore('cart', 'count', 3);

    expect(received).toEqual([1, 2, 3]);
    unsub();
  });
});
