import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sessionCache } from '../../src/services/cache';

describe('SessionCache (TTL & Concurrent Deduplication)', () => {
  beforeEach(() => {
    sessionCache.invalidate();
  });

  it('stores and retrieves cached data before TTL expires', () => {
    sessionCache.set('test_key', { store: 'Nirai' }, 1000);
    const cached = sessionCache.get<{ store: string }>('test_key');
    expect(cached).toEqual({ store: 'Nirai' });
  });

  it('expires cached data after TTL has passed', async () => {
    sessionCache.set('short_lived', 'value', 20); // 20ms TTL
    expect(sessionCache.get('short_lived')).toBe('value');

    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(sessionCache.get('short_lived')).toBeNull();
  });

  it('fetchWithCache uses cached value without invoking fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue(['silk_saree_1', 'silk_saree_2']);

    const res1 = await sessionCache.fetchWithCache('products_list', fetcher, 5000);
    expect(res1).toEqual(['silk_saree_1', 'silk_saree_2']);
    expect(fetcher).toHaveBeenCalledTimes(1);

    const res2 = await sessionCache.fetchWithCache('products_list', fetcher, 5000);
    expect(res2).toEqual(['silk_saree_1', 'silk_saree_2']);
    expect(fetcher).toHaveBeenCalledTimes(1); // Still 1, did not call fetcher again
  });

  it('deduplicates identical concurrent in-flight requests to a single network call', async () => {
    let callCount = 0;
    const slowFetcher = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { id: 1, name: 'Bridal Kanchipuram' };
    });

    // Fire 3 simultaneous fetchWithCache requests with the same key
    const [p1, p2, p3] = await Promise.all([
      sessionCache.fetchWithCache('concurrent_item', slowFetcher, 5000),
      sessionCache.fetchWithCache('concurrent_item', slowFetcher, 5000),
      sessionCache.fetchWithCache('concurrent_item', slowFetcher, 5000),
    ]);

    expect(p1).toEqual({ id: 1, name: 'Bridal Kanchipuram' });
    expect(p2).toEqual({ id: 1, name: 'Bridal Kanchipuram' });
    expect(p3).toEqual({ id: 1, name: 'Bridal Kanchipuram' });
    expect(callCount).toBe(1); // strictly called once
    expect(slowFetcher).toHaveBeenCalledTimes(1);
  });

  it('invalidates specific keys or patterns', () => {
    sessionCache.set('category_sarees', { id: 'sarees' });
    sessionCache.set('category_dhotis', { id: 'dhotis' });
    sessionCache.set('product_101', { id: '101' });

    sessionCache.invalidate('category_');
    expect(sessionCache.get('category_sarees')).toBeNull();
    expect(sessionCache.get('category_dhotis')).toBeNull();
    expect(sessionCache.get('product_101')).toEqual({ id: '101' });

    sessionCache.invalidate(); // Clear all
    expect(sessionCache.get('product_101')).toBeNull();
  });
});
