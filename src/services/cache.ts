/**
 * In-memory TTL Session Cache with concurrent request deduplication
 * Used to avoid duplicate network fetches of static/semi-static data (settings, categories, banners)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SessionCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private defaultTtl = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get cached entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Set cached entry with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Fetch with cache and deduplicate identical concurrent in-flight requests
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = this.defaultTtl
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate in-flight promises
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await fetcher();
        if (data !== null && data !== undefined) {
          this.set(key, data, ttlMs);
        }
        return data;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Invalidate specific key or matching pattern
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      this.inFlight.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const sessionCache = new SessionCache();
