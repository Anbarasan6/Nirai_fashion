import React from 'react';

/**
 * Resilient React.lazy wrapper that automatically handles post-deployment
 * chunk loading failures (e.g., "Failed to fetch dynamically imported module").
 *
 * It attempts to reload the page once using a sessionStorage lock to prevent infinite reload loops.
 */
export function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  chunkName = 'module'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const lockKey = `nirai_chunk_retry_${chunkName}`;
    try {
      const module = await componentImport();
      // On successful load, reset reload lock for this chunk
      sessionStorage.removeItem(lockKey);
      return module;
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isChunkError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('dynamically imported module');

      const hasRetried = sessionStorage.getItem(lockKey);

      if (isChunkError && !hasRetried) {
        console.warn(`[lazyRetry] Chunk load failure detected for "${chunkName}". Triggering one-time page reload.`);
        sessionStorage.setItem(lockKey, 'true');
        window.location.reload();
        // Return a suspended promise while the browser initiates reload
        return new Promise<{ default: T }>(() => {});
      }

      console.error(`[lazyRetry] Failed to load component module "${chunkName}":`, error);
      throw error;
    }
  });
}
