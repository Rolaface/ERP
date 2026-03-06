import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TreeItem {
  code: string;
  name: string;
  level: number;
  children: TreeItem[];
  originalData: any;
}

interface Props {
  value?: string;
  onChange: (item: { name: string; id: string }) => void;
  fetchData: () => Promise<any>;
  label: string;
  placeholder?: string;
  className?: string;
  displayFormatter?: (option: any) => string;
  required?: boolean;
}

// ─── Level colors ─────────────────────────────────────────────────────────────
const LEVEL_COLORS = [
  {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    hover: "hover:bg-violet-100 hover:border-violet-300",
  },
  {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    hover: "hover:bg-blue-100 hover:border-blue-300",
  },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    hover: "hover:bg-emerald-100 hover:border-emerald-300",
  },
  {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    hover: "hover:bg-amber-100 hover:border-amber-300",
  },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ItemTreeSelect({
  value = "",
  onChange,
  fetchData,
  label,
  placeholder = "Select item class",
  className = "",
  displayFormatter,
  required = false,
}: Props) {
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPath, setCurrentPath] = useState<TreeItem[]>([]);
  const [searchResults, setSearchResults] = useState<TreeItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Accessors ────────────────────────────────────────────────────────────
  const getId = (item: any) => item.itemClsCd ?? item.code ?? String(item);
  const getName = (item: any) =>
    item.itemClsNm ?? item.name ?? item.code_name ?? "";
  const getLevel = (item: any) => Number(item.itemClsLvl ?? item.level ?? 1);
  const getDisplayName = (item: any) => {
    if (displayFormatter) return displayFormatter(item);
    const code = getId(item);
    const name = getName(item);
    return code && name ? `${code} – ${name}` : name || code;
  };

  // ── Build tree from flat list ────────────────────────────────────────────
  const buildTree = useCallback(
    (flatList: any[]): TreeItem[] => {
      const map: Record<string, TreeItem> = {};
      const roots: TreeItem[] = [];

      flatList
        .filter((item) => item.useYn === "Y" || item.useYn === true)
        .forEach((item) => {
          const code = getId(item);
          map[code] = {
            code,
            name: getDisplayName(item),
            level: getLevel(item),
            children: [],
            originalData: item,
          };
        });

      Object.values(map).forEach((node) => {
        if (node.level === 1) {
          roots.push(node);
          return;
        }
        let parentCode: string | null = null;
        if (node.level === 2) parentCode = node.code.slice(0, 2) + "000000";
        else if (node.level === 3) parentCode = node.code.slice(0, 4) + "0000";
        else if (node.level === 4) parentCode = node.code.slice(0, 6) + "00";
        if (parentCode && map[parentCode]) map[parentCode].children.push(node);
      });

      const sort = (nodes: TreeItem[]): TreeItem[] =>
        nodes
          .sort((a, b) => a.code.localeCompare(b.code))
          .map((n) => ({ ...n, children: sort(n.children) }));

      return sort(roots);
    },
    [displayFormatter],
  );

  // ── Find node and its path ───────────────────────────────────────────────
  const findNodeWithPath = (
    code: string,
  ): { node: TreeItem | null; path: TreeItem[] } => {
    const walk = (
      nodes: TreeItem[],
      target: string,
      path: TreeItem[],
    ): { node: TreeItem | null; path: TreeItem[] } => {
      for (const n of nodes) {
        if (n.code === target) return { node: n, path: [...path, n] };
        const result = walk(n.children, target, [...path, n]);
        if (result.node) return result;
      }
      return { node: null, path: [] };
    };
    return walk(treeData, code, []);
  };

  // ── Search across all levels ─────────────────────────────────────────────
  const searchAllLevels = (term: string): TreeItem[] => {
    if (!term.trim()) return [];
    const lower = term.toLowerCase();
    const results: TreeItem[] = [];

    const collect = (nodes: TreeItem[]) => {
      nodes.forEach((node) => {
        if (
          node.code.toLowerCase().includes(lower) ||
          node.name.toLowerCase().includes(lower)
        ) {
          results.push(node);
        }
        collect(node.children);
      });
    };

    collect(treeData);
    return results.slice(0, 20); // Limit to 20 results
  };

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const res = await fetchData();
        let data =
          res?.data?.itemClsList ??
          res?.data?.data?.itemClsList ??
          res?.data?.data?.list ??
          res?.data?.data?.items ??
          res?.data?.data ??
          res?.data ??
          res;
        if (!Array.isArray(data)) data = [];
        const tree = buildTree(data);
        setTreeData(tree);

        // If there's a value, set the path
        if (value && tree.length > 0) {
          const { path } = findNodeWithPath(value);
          if (path.length > 0) {
            setCurrentPath(path.slice(0, -1)); // All except last (selected item)
          }
        }
      } catch {
        setTreeData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchData, buildTree, value]);

  // ── Search effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (search.trim()) {
      setSearchResults(searchAllLevels(search));
    } else {
      setSearchResults([]);
    }
  }, [search, treeData]);

  // ── Outside click ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Get current level options ────────────────────────────────────────────
  const getCurrentOptions = (): TreeItem[] => {
    if (currentPath.length === 0) return treeData; // Level 1
    const lastInPath = currentPath[currentPath.length - 1];
    return lastInPath.children;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelect = (node: TreeItem) => {
    if (node.children.length > 0) {
      // Has children - drill down
      setCurrentPath([...currentPath, node]);
    } else {
      // Leaf node - select it
      onChange({ name: node.name, id: node.code });
      setOpen(false);
      setSearch("");
      setCurrentPath([]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath(currentPath.slice(0, index));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ name: "", id: "" });
    setCurrentPath([]);
    setSearch("");
  };

  const handleOpen = () => {
    setOpen(true);
    if (value) {
      const { path } = findNodeWithPath(value);
      if (path.length > 0) {
        setCurrentPath(path.slice(0, -1));
      }
    }
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // ── Get selected item ────────────────────────────────────────────────────
  const selectedNode = value ? findNodeWithPath(value).node : null;
  const selectedPath = value ? findNodeWithPath(value).path : [];

  const currentOptions = getCurrentOptions();
  const currentLevel = currentPath.length + 1;
  const levelColor = LEVEL_COLORS[Math.min(currentLevel - 1, 3)];

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label */}
      <label className="text-sm font-semibold text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div ref={containerRef} className="relative">
        {/* ── Trigger ── */}
        {!open && (
          <button
            type="button"
            disabled={loading}
            onClick={handleOpen}
            className={`
              w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border
              text-left text-sm transition-all
              ${
                loading
                  ? "bg-gray-50 border-gray-200 cursor-not-allowed"
                  : "bg-white border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-indigo-500 animate-spin" />
                <span className="text-gray-400">Loading…</span>
              </>
            ) : selectedNode ? (
              <>
                <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                  {selectedPath.map((node, i) => {
                    const color = LEVEL_COLORS[Math.min(node.level - 1, 3)];
                    const isLast = i === selectedPath.length - 1;
                    return (
                      <React.Fragment key={node.code}>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md border font-medium truncate max-w-[140px] ${color.bg} ${color.text} ${color.border} ${!isLast && "opacity-60"}`}
                        >
                          {node.name.length > 20
                            ? node.name.slice(0, 18) + "…"
                            : node.name}
                        </span>
                        {!isLast && (
                          <svg
                            className="w-3 h-3 text-gray-300 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="shrink-0 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <svg
                  className="shrink-0 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            ) : (
              <>
                <span className="text-gray-400 flex-1">{placeholder}</span>
                <svg
                  className="shrink-0 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        )}

        {/* ── Dropdown ── */}
        {open && (
          <div className="absolute left-0 right-0 top-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Search bar */}
            <div className="p-3 border-b bg-gray-50">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search all levels…"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="max-h-80 overflow-y-auto">
              {search ? (
                // ── Search results ──
                <div className="p-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Search Results ({searchResults.length})
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="space-y-1.5">
                      {searchResults.map((node) => {
                        const color = LEVEL_COLORS[Math.min(node.level - 1, 3)];
                        const { path } = findNodeWithPath(node.code);
                        const isLeaf = node.children.length === 0;
                        return (
                          <button
                            key={node.code}
                            onClick={() => handleSelect(node)}
                            className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${color.bg} ${color.border} ${color.hover}`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold ${color.text}`}
                              >
                                L{node.level}
                              </span>
                              <span className="text-sm font-medium text-gray-700 flex-1">
                                {node.name}
                              </span>
                              {!isLeaf && (
                                <span className="text-xs text-gray-400">
                                  {node.children.length} →
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {path
                                .slice(0, -1)
                                .map((n) => n.name)
                                .join(" › ")}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No results found for "{search}"
                    </div>
                  )}
                </div>
              ) : (
                // ── Breadcrumb navigation ──
                <div>
                  {/* Breadcrumb bar */}
                  {currentPath.length > 0 && (
                    <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setCurrentPath([])}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Home
                      </button>
                      {currentPath.map((node, i) => (
                        <React.Fragment key={node.code}>
                          <svg
                            className="w-3 h-3 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          <button
                            onClick={() => handleBreadcrumbClick(i + 1)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 truncate max-w-[120px]"
                          >
                            {node.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Level indicator */}
                  <div className={`px-3 py-2 border-b ${levelColor.bg}`}>
                    <div className="text-xs font-semibold uppercase text-gray-500">
                      Level {currentLevel}{" "}
                      {currentPath.length === 0 && "— Choose Category"}
                    </div>
                  </div>

                  {/* Options grid */}
                  <div className="p-3">
                    {loading ? (
                      <div className="text-center py-8 text-gray-400">
                        Loading…
                      </div>
                    ) : currentOptions.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {currentOptions.map((node) => {
                          const hasChildren = node.children.length > 0;
                          const isSelected = node.code === value;
                          return (
                            <button
                              key={node.code}
                              onClick={() => handleSelect(node)}
                              className={`
                                text-left px-4 py-3 rounded-lg border-2 transition-all
                                ${
                                  isSelected
                                    ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200"
                                    : `${levelColor.bg} ${levelColor.border} ${levelColor.hover}`
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`font-semibold text-sm ${isSelected ? "text-indigo-700" : "text-gray-700"}`}
                                  >
                                    {node.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {node.code}
                                  </div>
                                </div>
                                {hasChildren ? (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span>{node.children.length}</span>
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </div>
                                ) : isSelected ? (
                                  <svg
                                    className="w-5 h-5 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Select
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No options available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedNode && !search && (
              <div className="px-3 py-2 border-t bg-indigo-50 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-xs text-indigo-700 font-medium flex-1 truncate">
                  Selected: {selectedNode.name}
                </span>
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
