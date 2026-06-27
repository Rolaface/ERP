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

function generateDummyTree(): HSNNode[] {
  const categories = [
    "Electronics",
    "Furniture",
    "Automobile",
    "Medical",
    "Food",
    "Textile",
    "Agriculture",
    "Chemicals",
    "Machinery",
    "Stationery",
  ];

  const tree: HSNNode[] = [];

  categories.forEach((category, c) => {
    const categoryNode: HSNNode = {
      id: `cat-${c}`,
      name: category,
      children: [],
    };

    for (let i = 1; i <= 8; i++) {
      const subCategory: HSNNode = {
        id: `cat-${c}-sub-${i}`,
        name: `Sub Category ${i}`,
        children: [],
      };

      for (let j = 1; j <= 8; j++) {
        const productType: HSNNode = {
          id: `cat-${c}-sub-${i}-type-${j}`,
          name: `Product Type ${j}`,
          children: [],
        };

        for (let k = 1; k <= 8; k++) {
          const family: HSNNode = {
            id: `cat-${c}-sub-${i}-type-${j}-family-${k}`,
            name: `Family ${k}`,
            children: [],
          };

          for (let m = 1; m <= 8; m++) {
            family.children!.push({
              id: `hsn-${c}-${i}-${j}-${k}-${m}`,
              name: `Product ${m}`,
              code: `${c}${i}${j}${k}${m}`.padEnd(8, "0"),
            });
          }

          productType.children!.push(family);
        }

        subCategory.children!.push(productType);
      }

      categoryNode.children!.push(subCategory);
    }

    tree.push(categoryNode);
  });

  return tree;
}

// ---------------------------------------------------------------------------
// Types (unchanged from your original HSNSearchModal)
// ---------------------------------------------------------------------------
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
  /** Pass your real tree here; falls back to built-in dummy data */
  tree?: HSNNode[];
}

// Tree utilities (unchanged)
// ---------------------------------------------------------------------------
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

const DUMMY_HSN_TREE = generateDummyTree();

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
  const activeTree = tree ?? DUMMY_HSN_TREE;
  const allLeaves = useMemo(() => flattenLeaves(activeTree), [activeTree]);

  const [path, setPath] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const mode = query.trim() ? "search" : "browse";

  const browseList = useMemo(
    () => getChildrenAtPath(activeTree, path),
    [activeTree, path],
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
    [activeTree, path],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [path, query]);

  // Reset state each time the popover opens (mirrors original modal behavior)
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
    [mode, onSelect, onClose],
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
    [list, selectedIndex, query, path.length, handleRowActivate],
  );

  return (
    <Popover
      triggerRef={triggerRef}
      open={open}
      onClose={onClose}
      placement="bottom-end"
      width={500}
      maxHeight={450}
      // Dim the parent "Add Item" modal while picking — keeps the single-
      // focus-layer feel without making this popover itself a modal.
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

      {/* Breadcrumb (browse mode only) */}
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

      {/* Row list */}
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
                <Tag size={12} className={isActive ? "text-primary" : "text-muted"} />
              ) : (
                <Folder size={12} className={isActive ? "text-primary" : "text-muted"} />
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
                <ChevronRight size={12} className={isActive ? "text-primary" : "text-muted"} />
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