import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

type TabLike = {
  id: string;
};

type UseUrlTabOptions<TTab extends string> = {
  tabs: readonly TabLike[];
  defaultTab: TTab;
  param?: string;
  basePath?: string;
  pathPrefix?: string;
  replace?: boolean;
};

export function useUrlTab<TTab extends string>({
  tabs,
  defaultTab,
  param = "tab",
  basePath,
  pathPrefix,
  replace = false,
}: UseUrlTabOptions<TTab>) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const validTabs = useMemo(() => new Set(tabs.map((tab) => tab.id)), [tabs]);

  const pathTab = useMemo(() => {
    if (!pathPrefix) return null;

    const normalizedPrefix = pathPrefix.endsWith("/")
      ? pathPrefix.slice(0, -1)
      : pathPrefix;

    if (
      location.pathname !== normalizedPrefix &&
      !location.pathname.startsWith(`${normalizedPrefix}/`)
    ) {
      return null;
    }

    const segment = location.pathname
      .slice(normalizedPrefix.length)
      .replace(/^\/+/, "")
      .split("/")[0];

    return segment || null;
  }, [location.pathname, pathPrefix]);

  const requestedTab = searchParams.get(param) ?? pathTab ?? defaultTab;
  const activeTab = (validTabs.has(requestedTab) ? requestedTab : defaultTab) as TTab;

  const setActiveTab = useCallback(
    (tabId: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set(param, tabId);

      const nextPath = basePath ?? location.pathname;
      const query = nextParams.toString();
      navigate(`${nextPath}${query ? `?${query}` : ""}`, { replace });
    },
    [basePath, location.pathname, navigate, param, replace, searchParams],
  );

  return [activeTab, setActiveTab] as const;
}
