import { useEffect, useRef, useState } from "react";
import { getItemClassifications } from "../../../api/itemClassificationCodeApi";
import { HSNLeaf, toSearchLeaf } from "./hsnTreeUtils";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 30;

/** Debounced backend search, keyed off the raw query string. */
export function useHsnSearch(query: string) {
  const [searchResults, setSearchResults] = useState<HSNLeaf[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    const q = query.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    debounceRef.current = setTimeout(() => {
      const requestId = ++searchRequestId.current;

      getItemClassifications(1, SEARCH_PAGE_SIZE, q)
        .then((res) => {
          if (requestId !== searchRequestId.current) return; // stale, ignore
          setSearchResults(toSearchLeaf(res.data));
        })
        .catch(() => {
          if (requestId !== searchRequestId.current) return;
          setSearchError("Search failed. Try again.");
        })
        .finally(() => {
          if (requestId === searchRequestId.current) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { searchResults, isSearching, searchError, setSearchResults };
}