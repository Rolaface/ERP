import { useEffect, useRef, useState } from "react";

export type LookupOption = { value: string; label: string };

const SEARCH_DEBOUNCE_MS = 300;


export function useDebouncedLookup(
  fetcher: (query: string) => Promise<{ data: LookupOption[] }>,
  activeKey: string,
  activeDropdown: string | null,
  enabled: boolean = true,
) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = (query: string) => {
    if (!enabled) {
      setOptions([]);
      return;
    }
    setIsLoading(true);
    fetcher(query)
      .then((res) => setOptions(res.data))
      .catch((err) => console.error(`Failed to search ${activeKey}`, err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (activeDropdown !== activeKey || !enabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => run(search), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };

  }, [search, activeDropdown, enabled]);

  return { options, isLoading, search, setSearch, run };
}