export interface Cache<T> {
  get(key?: string): T | null;
  set(params: { key?: string; data: T }): void;
  remove(key?: string): void;
  clear(): void;
}
