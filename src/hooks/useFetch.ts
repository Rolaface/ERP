import { useState, useEffect, useRef, useCallback } from "react";

export interface UseFetchOptions<T> {
  immediate?: boolean;
  debounceSearch?: boolean;
  debounceDelay?: number;
  onError?: (error: unknown) => void;
}

export interface UseFetchResult<T> {
  data: T | null;
  isInitialLoading: boolean;
  isFetching: boolean;
  error: unknown | null;
  execute: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Production-grade data fetching hook with:
 * - isInitialLoading (first mount) vs isFetching (subsequent fetches)
 * - Stale-while-revalidate (keeps old data visible during fetch)
 * - Debounced search
 * - Mounted check to prevent state updates on unmount
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    immediate = true,
    debounceSearch = false,
    debounceDelay = 300,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const mountedRef = useRef(true);
  const searchTimeoutRef = useRef<number | null>(null);
  const isInitialMountRef = useRef(immediate);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsFetching(true);
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        onError?.(err);
      }
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        if (isInitialMountRef.current) {
          setIsInitialLoading(false);
          isInitialMountRef.current = false;
        }
      }
    }
  }, [fetchFn, onError]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []); // Only run on mount

  // Debounced execute wrapper for search
  const executeWithDebounce = useCallback(
    (searchValue?: string) => {
      if (debounceSearch && searchValue) {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = window.setTimeout(() => {
          execute();
        }, debounceDelay);
      } else {
        execute();
      }
    },
    [debounceSearch, debounceDelay, execute]
  );

  return {
    data,
    isInitialLoading,
    isFetching,
    error,
    execute: executeWithDebounce,
    setData,
  };
}

/**
 * Hook for server-side pagination with smooth UX
 */
export function useServerPagination<T>(options: {
  fetchFn: (page: number, pageSize: number, search?: string) => Promise<{ data: T[]; total: number; totalPages: number }>;
  immediate?: boolean;
  debounceSearch?: boolean;
}) {
  const { fetchFn, immediate = true, debounceSearch = false } = options;

  const [data, setData] = useState<T[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(immediate);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const mountedRef = useRef(true);
  const searchTimeoutRef = useRef<number | null>(null);

  // Debounce search
  useEffect(() => {
    if (!debounceSearch) {
      setDebouncedSearch(searchTerm);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, debounceSearch]);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsFetching(true);
    try {
      const result = await fetchFn(page, pageSize, debouncedSearch || undefined);
      if (mountedRef.current) {
        setData(result.data);
        setTotalItems(result.total);
        setTotalPages(result.totalPages);
        setIsInitialLoading(false);
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error("Fetch error:", error);
      }
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
      }
    }
  }, [fetchFn, page, pageSize, debouncedSearch]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Refetch on pagination/search changes
  useEffect(() => {
    if (isInitialLoading) return; // Skip - initial load is happening
    fetchData();
  }, [page, pageSize, debouncedSearch]);

  // Reset page when search changes
  useEffect(() => {
    if (debouncedSearch === "") return;
    setPage(1);
  }, [debouncedSearch]);

  return {
    data,
    setData,
    isInitialLoading,
    isFetching,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    setTotalItems,
    totalPages,
    setTotalPages,
    searchTerm,
    setSearchTerm,
    refresh: fetchData,
  };
}