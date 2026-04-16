/**
 * Simple API cache to prevent duplicate requests
 * Provides in-memory caching with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if still valid
   */
  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const maxAge = ttl ?? this.defaultTTL;
    const isExpired = Date.now() - entry.timestamp > maxAge;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const maxAge = ttl ?? this.defaultTTL;
    const isExpired = Date.now() - entry.timestamp > maxAge;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidate entries matching prefix (useful for list refresh)
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCache();

/**
 * Create a cached fetch function
 */
export function createCachedFetch<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  ttl?: number
): () => Promise<T> {
  return async () => {
    const cached = apiCache.get<T>(cacheKey, ttl);
    if (cached) return cached;

    const data = await fetchFn();
    apiCache.set(cacheKey, data);
    return data;
  };
}
