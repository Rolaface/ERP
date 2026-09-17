import { useEffect, useRef, useState } from "react";
import {
  searchItemClassifications,
  type ClassificationPage,
} from "../../../api/itemClassificationCodeApi";
import { HSNLeaf, toSearchLeaf } from "./hsnTreeUtils";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 30;

export function useHsnSearch(query: string) {
  const [searchResults, setSearchResults] = useState<HSNLeaf[]>([]);
  const [pagination, setPagination] = useState<ClassificationPage | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadMore = async () => {
    const normalizedQuery = query.trim();
    const cursor = pagination?.next_cursor;
    if (!normalizedQuery || !cursor || !pagination?.has_next || isSearching)
      return;
    setIsSearching(true);
    try {
      const response = await searchItemClassifications(
        normalizedQuery,
        SEARCH_PAGE_SIZE,
        cursor,
      );
      setSearchResults((current) => [
        ...current,
        ...response.data
          .map(toSearchLeaf)
          .filter((item) => !current.some((old) => old.code === item.code)),
      ]);
      setPagination(response.pagination);
    } catch {
      setSearchError("Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const normalizedQuery = query.trim();
    const currentRequest = ++requestId.current;
    if (!normalizedQuery) {
      setSearchResults([]);
      setPagination(null);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await searchItemClassifications(
          normalizedQuery,
          SEARCH_PAGE_SIZE,
        );
        if (currentRequest !== requestId.current) return;
        setSearchResults(response.data.map(toSearchLeaf));
        setPagination(response.pagination);
      } catch {
        if (currentRequest !== requestId.current) return;
        setSearchError("Search failed. Try again.");
      } finally {
        if (currentRequest === requestId.current) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { searchResults, pagination, isSearching, searchError, loadMore };
}
