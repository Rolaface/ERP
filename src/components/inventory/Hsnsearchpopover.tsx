import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Tag } from "lucide-react";
import { Popover } from "../common/Popover";
import { PopoverHeader, PopoverSearchInput, PopoverFooterHint } from "../common/Popoverparts";
import { getItemClassificationByCode } from "../../api/itemClassificationCodeApi";

import {
  HSNNode,
  HSNLeaf,
  getChildrenAtPath,
  getBreadcrumbNames,
  buildCodeExpansionMap,
} from "./HsnSearchPopover/hsnTreeUtils";
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
  /** class_code currently set on the HSN field, used to pre-select on reopen. */
  value?: string;
}

/** Cap on leaves expanded from a single matched category, to avoid an
 *  overwhelming list when a broad category matches the search term. */
const MAX_EXPANDED_PER_MATCH = 25;

const HsnSearchPopover: React.FC<HsnSearchPopoverProps> = ({
  triggerRef,
  open,
  onClose,
  onSelect,
  tree,
  value,
}) => {
  const { apiTree, isTreeLoading, treeError } = useHsnTree(open);
  const activeTree = tree ?? apiTree;

  const [path, setPath] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef<string | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  const isKeyboardNavRef = useRef(false);

  const mode = query.trim() ? "search" : "browse";
  const { searchResults, isSearching, searchError, setSearchResults } = useHsnSearch(query);

  const browseList = useMemo(() => getChildrenAtPath(activeTree, path), [activeTree, path]);

  // Maps every code (leaf or category) found in the tree to its resolved
  // list of selectable leaves. Backend search may match an intermediate
  // category instead of a leaf; this expands that match into real,
  // selectable HSN codes with their full hierarchy trail attached.
  const codeExpansionMap = useMemo(() => buildCodeExpansionMap(activeTree), [activeTree]);

  const filteredSearchResults = useMemo(() => {
    // Tree not loaded yet — skip expansion, show raw results.
    if (codeExpansionMap.size === 0) return searchResults;

    const seen = new Set<string>();
    const resolved: HSNLeaf[] = [];

    for (const result of searchResults) {
      const leaves = codeExpansionMap.get(result.code);
      if (!leaves) continue;

      for (const leaf of leaves.slice(0, MAX_EXPANDED_PER_MATCH)) {
        if (seen.has(leaf.code)) continue;
        seen.add(leaf.code);
        resolved.push(leaf);
      }
    }

    return resolved;
  }, [searchResults, codeExpansionMap]);

  const list = mode === "search" ? filteredSearchResults : browseList;
  const breadcrumb = useMemo(() => getBreadcrumbNames(activeTree, path), [activeTree, path]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [path, query]);

  // Reset navigation on open; pre-resolve the current code's name so the
  // search box shows it immediately, pre-selected.
  useEffect(() => {
    if (!open) return;

    setPath([]);
    setSearchResults([]);
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
  }, [open, value, setSearchResults]);

  // Keep the keyboard-selected row scrolled into view.
  useEffect(() => {
    if (!isKeyboardNavRef.current) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleRowActivate = useCallback(
    (item: HSNNode | HSNLeaf) => {
      if (mode === "browse" && (item as HSNNode).children) {
        setPath((p) => [...p, item.id]);
      } else {
        onSelect((item as HSNLeaf).code);
        onClose();
      }
    },
    [mode, onSelect, onClose]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        isKeyboardNavRef.current = true;
        setSelectedIndex((i) => Math.min(i + 1, list.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        isKeyboardNavRef.current = true;
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (list[selectedIndex]) handleRowActivate(list[selectedIndex]);
      } else if (e.key === "Backspace" && query === "" && path.length > 0) {
        e.preventDefault();
        setPath((p) => p.slice(0, -1));
      }
    },
    [list, selectedIndex, query, path.length, handleRowActivate]
  );

  const isLoading = mode === "search" ? isSearching : isTreeLoading;
  const loadError = mode === "search" ? searchError : treeError;

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
          path={path}
          onNavigate={setPath}
          onBack={() => setPath((p) => p.slice(0, -1))}
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
        {isLoading && (
          <div className="px-3 py-8 text-center text-[12px] text-muted">
            {mode === "search" ? "Searching..." : "Loading HSN codes..."}
          </div>
        )}

        {loadError && !isLoading && (
          <div className="px-3 py-8 text-center text-[12px] text-red-500">{loadError}</div>
        )}

        {!isLoading && !loadError && list.length === 0 && query.trim() && (
          <div className="px-3 py-8 text-center text-[12px] text-muted">
            No matches for &ldquo;{query}&rdquo;
          </div>
        )}

        {!isLoading && !loadError && list.length === 0 && !query.trim() && (
          <div className="px-3 py-6 text-center text-[12px] text-muted">
            Select a category to browse
          </div>
        )}

        {!isLoading &&
          list.map((item, i) => (
            <HsnResultRow
              key={item.id}
              item={item}
              index={i}
              mode={mode}
              isActive={i === selectedIndex}
              isCurrentSelection={
                (mode === "search" || !!(item as HSNNode).code) &&
                (item as HSNLeaf | HSNNode).code === value
              }
              onHover={() => {
                if (isKeyboardNavRef.current) return;
                setSelectedIndex(i);
              }}
              onActivate={() => handleRowActivate(item)}
            />
          ))}
      </div>

      <PopoverFooterHint>↑↓ navigate &nbsp; ↵ select &nbsp; esc close</PopoverFooterHint>
    </Popover>
  );
};

export default HsnSearchPopover;