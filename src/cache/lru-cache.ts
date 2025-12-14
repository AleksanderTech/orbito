import { CachedData } from "./cached-data";
import { Cache } from "./cache";

function isTimestampExpired(timestampMs: number, timeInSec: number): boolean {
  const nowInSec = new Date().getTime() / 1000;
  const timestampInSec = timestampMs / 1000;

  return timestampInSec + timeInSec < nowInSec;
}

export class LRUCache<T> implements Cache<T> {
  cache = new Map<string, CachedData<T>>();

  constructor(
    private readonly cacheTimeInSec: number,
    private readonly maxSize: number
  ) {}

  get(key: string): T | null {
    const cacheItem = this.cache.get(key);
    if (
      cacheItem &&
      !isTimestampExpired(cacheItem.cachedAt, this.cacheTimeInSec)
    ) {
      this.remove(key);
      this.set({ key, data: cacheItem.data });
      return cacheItem.data;
    }

    if (
      cacheItem &&
      isTimestampExpired(cacheItem.cachedAt, this.cacheTimeInSec)
    ) {
      this.remove(key);
    }

    return null;
  }

  set({ key, data }: { key: string; data: T }): void {
    if (this.cache.size == this.maxSize) this.cache.delete(this.first());
    this.cache.set(key, { data, cachedAt: new Date().getTime() });
  }

  remove(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private first() {
    return this.cache.keys().next().value;
  }
}
