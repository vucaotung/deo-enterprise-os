import { useEffect, useState } from 'react';

/**
 * Pull data from an async source, fall back to a static mock if it
 * throws (offline/auth/empty schema). Pages call this with a typed
 * loader and a typed mock array.
 */
export function useApiWithFallback<T>(
  loader: () => Promise<T[]>,
  fallback: T[]
): { items: T[]; isLoading: boolean; usingFallback: boolean; refresh: () => void } {
  const [items, setItems] = useState<T[]>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loader()
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setItems(data);
          setUsingFallback(false);
        } else {
          setItems(fallback);
          setUsingFallback(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setItems(fallback);
        setUsingFallback(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return {
    items,
    isLoading,
    usingFallback,
    refresh: () => setTick((t) => t + 1),
  };
}
