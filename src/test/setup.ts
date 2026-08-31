import '@testing-library/jest-dom';

class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
  configurable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
}
