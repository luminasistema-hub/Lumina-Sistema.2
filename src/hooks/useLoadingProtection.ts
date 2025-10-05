import { useRef, useCallback } from 'react';

interface UseLoadingProtectionOptions {
  debounceMs?: number;
  timeoutMs?: number;
}

export const useLoadingProtection = (options: UseLoadingProtectionOptions = {}) => {
  const { debounceMs = 150, timeoutMs = 10000 } = options;
  
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const protectedFetch = useCallback(
    async <T>(
      fetchFn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: any) => void,
      onFinally?: () => void
    ): Promise<T | null> => {
      // Evita reentradas
      if (isFetchingRef.current) {
        return null;
      }

      isFetchingRef.current = true;

      // Timeout de segurança
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        isFetchingRef.current = false;
        onFinally?.();
      }, timeoutMs);

      try {
        const result = await fetchFn();
        onSuccess?.(result);
        return result;
      } catch (error) {
        onError?.(error);
        return null;
      } finally {
        isFetchingRef.current = false;
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        onFinally?.();
      }
    },
    [timeoutMs]
  );

  const debouncedFetch = useCallback(
    <T>(
      fetchFn: () => Promise<T>,
      onSuccess?: (data: T) => void,
      onError?: (error: any) => void,
      onFinally?: () => void
    ) => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        protectedFetch(fetchFn, onSuccess, onError, onFinally);
      }, debounceMs);
    },
    [protectedFetch, debounceMs]
  );

  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isFetchingRef.current = false;
  }, []);

  return {
    protectedFetch,
    debouncedFetch,
    cleanup,
    isFetching: () => isFetchingRef.current,
  };
};