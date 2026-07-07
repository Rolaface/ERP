import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Search, ChevronRight, ArrowLeft, Folder, Tag } from "lucide-react";
import { Popover } from "../common/Popover";
import {
  PopoverHeader,
  PopoverSearchInput,
  PopoverFooterHint,
} from "../common/Popoverparts";

import rawItemsClassData from "./main_itemsclass_.json";

export interface HSNNode {
  id: string;
  name: string;
  code?: string;
  children?: HSNNode[];
}

export interface HSNLeaf {
  id: string;
  name: string;
  code: string;
  trail: string[];
}

interface HsnSearchPopoverProps {
  triggerRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  tree?: HSNNode[];
}

function buildTreeFromJson(data: any[]): HSNNode[] {
  const sortedData = [...data].sort(
    (a, b) => parseInt(a.itemClsLvl) - parseInt(b.itemClsLvl)
  );

  const tree: HSNNode[] = [];
  const map = new Map<string, HSNNode>();

  for (const item of sortedData) {
    const level = parseInt(item.itemClsLvl);
    const code = item.itemClsCd;
    const name = item.itemClsNm;

    const node: HSNNode = {
      id: item.id.toString(),
      name: name,
      code: code,
      children: [],
    };

    map.set(code, node);

    if (level === 1) {
      tree.push(node);
    } else {
      let parentCode = "";
      if (level === 2) {
        parentCode = code.substring(0, 2) + "000000";
      } else if (level === 3) {
        parentCode = code.substring(0, 4) + "0000";
      } else if (level === 4) {
        parentCode = code.substring(0, 6) + "00";
      } else if (level === 5) {
        parentCode = code.substring(0, 8);
      }

      const parent = map.get(parentCode);
      if (parent) {
        parent.children!.push(node);
      } else {
        tree.push(node);
      }
    }
  }
  function cleanup(nodes: HSNNode[]) {
    for (const node of nodes) {
      if (node.children && node.children.length === 0) {
        delete node.children;
      } else if (node.children && node.children.length > 0) {
        delete node.code;
        cleanup(node.children);
      }
    }
  }
  cleanup(tree);

  return tree;
}

const JSON_HSN_TREE = buildTreeFromJson(rawItemsClassData);

function getChildrenAtPath(tree: HSNNode[], path: string[]): HSNNode[] {
  let nodes = tree;
  for (const id of path) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return [];
    nodes = node.children ?? [];
  }
  return nodes;
}

function getBreadcrumbNames(tree: HSNNode[], path: string[]): string[] {
  let nodes = tree;
  const names: string[] = [];
  for (const id of path) {
    const node = nodes.find((n) => n.id === id);
    if (!node) break;
    names.push(node.name);
    nodes = node.children ?? [];
  }
  return names;
}

function flattenLeaves(nodes: HSNNode[], trail: string[] = []): HSNLeaf[] {
  let out: HSNLeaf[] = [];
  for (const n of nodes) {
    if (n.code) {
      out.push({ id: n.id, name: n.name, code: n.code, trail });
    } else if (n.children) {
      out = out.concat(flattenLeaves(n.children, [...trail, n.name]));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const HsnSearchPopover: React.FC<HsnSearchPopoverProps> = ({
  triggerRef,
  open,
  onClose,
  onSelect,
  tree,
}) => {
  const activeTree = tree ?? JSON_HSN_TREE;
  const allLeaves = useMemo(() => flattenLeaves(activeTree), [activeTree]);

  const [path, setPath] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const mode = query.trim() ? "search" : "browse";

  const browseList = useMemo(
    () => getChildrenAtPath(activeTree, path),
    [activeTree, path]
  );

  const searchList = useMemo<HSNLeaf[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allLeaves
      .filter((l) => l.name.toLowerCase().includes(q) || l.code.includes(q))
      .slice(0, 30);
  }, [allLeaves, query]);

  const list = mode === "search" ? searchList : browseList;
  const breadcrumb = useMemo(
    () => getBreadcrumbNames(activeTree, path),
    [activeTree, path]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [path, query]);

  useEffect(() => {
    if (open) {
      setPath([]);
      setQuery("");
    }
  }, [open]);

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
        setSelectedIndex((i) => Math.min(i + 1, list.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
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
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 border-b border-theme text-[11px]">
          <button
            onClick={() => setPath([])}
            className="shrink-0 px-1.5 py-0.5 rounded text-muted hover:text-main"
          >
            All
          </button>
          {breadcrumb.map((name, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={10} className="shrink-0 text-muted" />
              <button
                onClick={() => setPath(path.slice(0, i + 1))}
                className={`shrink-0 px-1.5 py-0.5 rounded ${
                  i === breadcrumb.length - 1
                    ? "font-medium text-primary"
                    : "text-muted hover:text-main"
                }`}
              >
                {name}
              </button>
            </React.Fragment>
          ))}
          <button
            onClick={() => setPath((p) => p.slice(0, -1))}
            className="ml-auto flex shrink-0 items-center gap-1 text-muted hover:text-main"
          >
            <ArrowLeft size={10} /> Back
          </button>
        </div>
      )}

      <div role="listbox" className="flex-1 overflow-y-auto py-1">
        {list.length === 0 && query.trim() && (
          <div className="px-3 py-8 text-center text-[12px] text-muted">
            No matches for &ldquo;{query}&rdquo;
          </div>
        )}

        {list.length === 0 && !query.trim() && (
          <div className="px-3 py-6 text-center text-[12px] text-muted">
            Select a category to browse
          </div>
        )}

        {list.map((item, i) => {
          const isLeaf = mode === "search" || !!(item as HSNNode).code;
          const isActive = i === selectedIndex;
          return (
            <div
              key={item.id}
              role="option"
              aria-selected={isActive}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => handleRowActivate(item)}
              className={`mx-1.5 my-0.5 flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer row-hover ${
                isActive ? "bg-row-hover" : ""
              }`}
            >
              {isLeaf ? (
                <Tag
                  size={12}
                  className={isActive ? "text-primary" : "text-muted"}
                />
              ) : (
                <Folder
                  size={12}
                  className={isActive ? "text-primary" : "text-muted"}
                />
              )}
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[12px] ${
                    isActive ? "font-medium text-primary" : "text-main"
                  }`}
                >
                  {item.name}
                </div>
                {mode === "search" && (
                  <div className="truncate text-[10px] text-muted">
                    {(item as HSNLeaf).trail.join(" › ")}
                  </div>
                )}
              </div>
              {isLeaf ? (
                <span
                  className={`shrink-0 font-mono text-[10px] ${
                    isActive ? "text-primary" : "text-muted"
                  }`}
                >
                  {(item as HSNLeaf).code}
                </span>
              ) : (
                <ChevronRight
                  size={12}
                  className={isActive ? "text-primary" : "text-muted"}
                />
              )}
            </div>
          );
        })}
      </div>

      <PopoverFooterHint>
        ↑↓ navigate &nbsp; ↵ select &nbsp; esc close
      </PopoverFooterHint>
    </Popover>
  );
};

export default HsnSearchPopover;