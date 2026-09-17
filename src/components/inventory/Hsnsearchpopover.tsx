import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Search, Tag } from "lucide-react";
import { Popover } from "../common/Popover";
import {
  PopoverHeader,
  PopoverSearchInput,
  PopoverFooterHint,
} from "../common/Popoverparts";
import { getItemClassificationByCode } from "../../api/itemClassificationCodeApi";
import { HSNLeaf, HSNNode, TrailEntry } from "./HsnSearchPopover/hsnTreeUtils";
import { useHsnTree } from "./HsnSearchPopover/useHsnTree";
import { useHsnSearch } from "./HsnSearchPopover/useHsnSearch";
import HsnBreadcrumb from "./HsnSearchPopover/HsnBreadcrumb";
import HsnResultRow from "./HsnSearchPopover/HsnResultRow";
export type { HSNNode, HSNLeaf } from "./HsnSearchPopover/hsnTreeUtils";

interface HsnSearchPopoverProps {
  triggerRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  tree?: HSNNode[];
  value?: string;
}

const HsnSearchPopover: React.FC<HsnSearchPopoverProps> = ({
  triggerRef,
  open,
  onClose,
  onSelect,
  tree,
  value,
}) => {
  const {
    apiTree,
    isTreeLoading,
    treeError,
    getChildren,
    loadChildren,
    loadMoreChildren,
    isChildrenLoading,
    hasMoreChildren,
  } = useHsnTree(open);
  const activeTree = tree ?? apiTree;
  const [path, setPath] = useState<HSNNode[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef<string | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  const isKeyboardNavRef = useRef(false);
  const debouncedQuery = query;
  const mode = debouncedQuery.trim() ? "search" : "browse";
  const {
    searchResults,
    pagination: searchPagination,
    isSearching,
    searchError,
    loadMore: loadMoreSearch,
  } = useHsnSearch(debouncedQuery);

  const browseList = useMemo(() => {
    if (tree)
      return path.length
        ? getChildren(path[path.length - 1]?.code)
        : activeTree;
    return path.length ? getChildren(path[path.length - 1].code) : activeTree;
  }, [activeTree, getChildren, path, tree]);
  const list = mode === "search" ? searchResults : browseList;
  const breadcrumb = path.map((node) => node.name);
  const isLoading =
    mode === "search"
      ? isSearching
      : isTreeLoading || isChildrenLoading(path[path.length - 1]?.code);
  const loadError = mode === "search" ? searchError : treeError;

  useEffect(() => setSelectedIndex(0), [path, debouncedQuery]);

  useEffect(() => {
    if (!open) return;
    setPath([]);
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;
    if (!value) {
      setQuery("");
      return;
    }
    let cancelled = false;
    getItemClassificationByCode(value)
      .then((item) => {
        if (cancelled || !item) return;
        setQuery(item.class_name);
      })
      .catch(() => {
        if (!cancelled) setQuery(value);
      });
    return () => {
      cancelled = true;
    };
  }, [open, value]);

  useEffect(() => {
    if (!isKeyboardNavRef.current) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const trailNode = (entry: TrailEntry): HSNNode => ({
    id: entry.class_code,
    code: entry.class_code,
    name: entry.class_name ?? entry.class_code,
    level: entry.class_level,
    hasChildren: true,
  });

  const handleRowActivate = useCallback(
    async (item: HSNNode | HSNLeaf) => {
      if (item.hasChildren) {
        if (mode === "search") {
          const searchItem = item as HSNLeaf;
          const nextPath = [...searchItem.trail.map(trailNode), item];
          setQuery("");
          setPath(nextPath);
          await loadChildren(item.code);
        } else {
          setPath((current) => [...current, item]);
          await loadChildren(item.code);
        }
        return;
      }
      onSelect(item.code);
      onClose();
    },
    [loadChildren, mode, onClose, onSelect],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        isKeyboardNavRef.current = true;
        setSelectedIndex((index) => Math.min(index + 1, list.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        isKeyboardNavRef.current = true;
        setSelectedIndex((index) => Math.max(index - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (list[selectedIndex]) void handleRowActivate(list[selectedIndex]);
      } else if (e.key === "Backspace" && query === "" && path.length > 0) {
        e.preventDefault();
        setPath((current) => current.slice(0, -1));
      }
    },
    [handleRowActivate, list, path.length, query, selectedIndex],
  );

  const navigateBreadcrumb = (codes: string[]) =>
    setPath((current) => current.slice(0, codes.length));
  const hasMore =
    mode === "search"
      ? Boolean(searchPagination?.has_next)
      : hasMoreChildren(path[path.length - 1]?.code);

  return (
    <Popover
      triggerRef={triggerRef}
      open={open}
      onClose={onClose}
      placement="bottom-end"
      width={1000}
      maxHeight={450}
      showScrim
    >
      <PopoverHeader title="HSN / product search" icon={<Tag size={13} />} />
      <PopoverSearchInput
        value={query}
        onChange={setQuery}
        onKeyDown={handleInputKeyDown}
        placeholder="Search product or HSN code..."
        icon={<Search size={13} className="shrink-0 text-muted" />}
        inputRef={inputRef}
      />
      {mode === "browse" && path.length > 0 && (
        <HsnBreadcrumb
          breadcrumb={breadcrumb}
          path={path.map((node) => node.code)}
          onNavigate={navigateBreadcrumb}
          onBack={() => setPath((current) => current.slice(0, -1))}
        />
      )}
      <div
        role="listbox"
        ref={listRef}
        className="flex-1 overflow-y-auto py-1"
        onMouseMove={() => {
          isKeyboardNavRef.current = false;
        }}
      >
        {isLoading && list.length === 0 && (
          <div className="px-3 py-8 text-center text-[12px] text-muted">
            Loading HSN codes...
          </div>
        )}
        {loadError && !isLoading && (
          <div className="px-3 py-8 text-center text-[12px] text-red-500">
            {loadError}
          </div>
        )}
        {!isLoading && !loadError && list.length === 0 && mode === "search" && (
          <div className="px-3 py-8 text-center text-[12px] text-muted">
            No matches for &ldquo;{query}&rdquo;
          </div>
        )}
        {!isLoading && !loadError && list.length === 0 && mode === "browse" && (
          <div className="px-3 py-6 text-center text-[12px] text-muted">
            No classifications found
          </div>
        )}
        {list.map((item, index) => (
          <HsnResultRow
            key={item.id}
            item={item}
            index={index}
            mode={mode}
            isActive={index === selectedIndex}
            isCurrentSelection={item.code === value}
            onHover={() => {
              if (!isKeyboardNavRef.current) setSelectedIndex(index);
            }}
            onActivate={() => void handleRowActivate(item)}
          />
        ))}
        {hasMore && (
          <button
            type="button"
            className="w-full px-3 py-2 text-center text-[11px] text-primary hover:bg-[var(--row-hover)]"
            onClick={() =>
              mode === "search"
                ? void loadMoreSearch()
                : void loadMoreChildren(path[path.length - 1]?.code)
            }
          >
            {isLoading ? "Loading more…" : "Load more classifications"}
          </button>
        )}
      </div>
      <PopoverFooterHint>
        ↑↓ navigate &nbsp; ↵ select &nbsp; esc close
      </PopoverFooterHint>
    </Popover>
  );
};

export default HsnSearchPopover;
