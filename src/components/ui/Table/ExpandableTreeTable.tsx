import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react";
import { FaSearch } from "react-icons/fa";
import { Layers, RefreshCw } from "lucide-react";
import type { Column } from "./type";


// Types

export interface ExpandableTreeTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  childrenKey?: string;
  nodeKey: (node: T) => string;

  // ── Toolbar (mirrors Table's toolbar props) ──
  showToolbar?: boolean;
   showSearch?: boolean; 
  searchValue?: string;
  onSearch?: (q: string) => void;
  toolbarPlaceholder?: string;
  extraFilters?: React.ReactNode;
  onRefresh?: () => void;           
  showExpandControls?: boolean;     

  // ── Tree behaviour ──
  searchTerm?: string;               
  matchNode?: (node: T, term: string) => boolean;
  defaultExpandDepth?: number;
  indentSize?: number;

  // ── State ──
  loading?: boolean;
  emptyMessage?: string;

  // ── Row ──
  onRowClick?: (node: T) => void;
  expandIconRender?: (node: T, isExpanded: boolean, hasChildren: boolean) => React.ReactNode;
  rowClassName?: (node: T, depth: number) => string;
}


// Helpers


function nodeOrDescendantMatches<T extends Record<string, any>>(
  node: T,
  term: string,
  childrenKey: string,
  matchNode: (node: T, term: string) => boolean
): boolean {
  if (!term) return true;
  if (matchNode(node, term)) return true;
  const children: T[] = node[childrenKey] ?? [];
  return children.some((c) => nodeOrDescendantMatches(c, term, childrenKey, matchNode));
}

function collectExpandableKeys<T extends Record<string, any>>(
  nodes: T[],
  nodeKey: (n: T) => string,
  childrenKey: string,
  maxDepth: number,
  currentDepth = 0
): Set<string> {
  const keys = new Set<string>();
  if (currentDepth >= maxDepth) return keys;
  for (const node of nodes) {
    const children: T[] = node[childrenKey] ?? [];
    if (children.length > 0) {
      keys.add(nodeKey(node));
      collectExpandableKeys(children, nodeKey, childrenKey, maxDepth, currentDepth + 1)
        .forEach((k) => keys.add(k));
    }
  }
  return keys;
}

function collectAllExpandableKeys<T extends Record<string, any>>(
  nodes: T[],
  nodeKey: (n: T) => string,
  childrenKey: string
): Set<string> {
  return collectExpandableKeys(nodes, nodeKey, childrenKey, Infinity);
}

export { collectAllExpandableKeys, collectExpandableKeys };


// Skeleton Row — identical to Table's


const SkeletonRow: React.FC<{ columnsCount: number }> = ({ columnsCount }) => (
  <tr className="bg-transparent">
    {Array.from({ length: columnsCount }).map((_, idx) => (
      <td key={idx} className="px-3 sm:px-5 py-3.5 border-b border-[var(--border)]/20">
        <div className="h-4 bg-gray-300 animate-pulse rounded" />
      </td>
    ))}
  </tr>
);


// Default expand icon


function defaultExpandIcon<T extends Record<string, any>>(
  _node: T,
  isExpanded: boolean,
  hasChildren: boolean
): React.ReactNode {
  if (!hasChildren) return <FileText size={12} className="text-muted opacity-50" />;
  return isExpanded
    ? <FolderOpen size={13} className="text-muted" />
    : <Folder size={13} className="text-muted" />;
}


// Tree Row


interface TreeRowProps<T extends Record<string, any>> {
  node: T;
  depth: number;
  columns: Column<T>[];
  childrenKey: string;
  nodeKey: (n: T) => string;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  activeTerm: string;
  matchNode: (n: T, term: string) => boolean;
  indentSize: number;
  onRowClick?: (n: T) => void;
  expandIconRender?: (n: T, isExpanded: boolean, hasChildren: boolean) => React.ReactNode;
  rowClassName?: (n: T, depth: number) => string;
  rowIndex: number; // for alternating rows
}

function TreeRow<T extends Record<string, any>>({
  node,
  depth,
  columns,
  childrenKey,
  nodeKey,
  expandedKeys,
  onToggle,
  activeTerm,
  matchNode,
  indentSize,
  onRowClick,
  expandIconRender,
  rowClassName,
  rowIndex,
}: TreeRowProps<T>): React.ReactElement | null {
  if (!nodeOrDescendantMatches(node, activeTerm, childrenKey, matchNode)) return null;

  const children: T[] = node[childrenKey] ?? [];
  const hasChildren = children.length > 0;
  const key = nodeKey(node);
  const isExpanded = activeTerm.trim() !== "" ? true : expandedKeys.has(key);
  const isDirectMatch = activeTerm ? matchNode(node, activeTerm) : false;
  const extraClass = rowClassName ? rowClassName(node, depth) : "";

  const getAlignment = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <>
      <tr
        onClick={() => onRowClick?.(node)}
        className={[
          "group transition-colors duration-150",
          onRowClick ? "cursor-pointer" : "",
          rowIndex % 2 === 0 ? "bg-transparent" : "bg-row-hover/10",
          "hover:bg-row-hover",
          isDirectMatch && activeTerm ? "bg-row-hover/20" : "",
          extraClass,
        ].filter(Boolean).join(" ")}
      >
        {columns.map((col, colIdx) => (
          <td
            key={col.key}
            className={`px-3 sm:px-5 py-3.5 text-xs font-medium text-main border-b border-[var(--border)]/20 ${getAlignment(col.align)}`}
          >
            {colIdx === 0 ? (
              <div
                className="flex items-center gap-2 select-none"
                style={{ paddingLeft: depth * indentSize }}
                onClick={(e) => {
                  if (hasChildren) { e.stopPropagation(); onToggle(key); }
                }}
              >
                {/* Chevron */}
                <span className="w-4 h-4 flex-shrink-0 text-muted">
                  {hasChildren
                    ? isExpanded
                      ? <ChevronDown size={13} />
                      : <ChevronRight size={13} />
                    : <span className="inline-block w-4" />}
                </span>

                {/* Folder / leaf icon */}
                <span className="flex-shrink-0">
                  {expandIconRender
                    ? expandIconRender(node, isExpanded, hasChildren)
                    : defaultExpandIcon(node, isExpanded, hasChildren)}
                </span>

                {/* Content */}
                <span className="opacity-90">
                  {col.render ? col.render(node) : node[col.key]}
                </span>
              </div>
            ) : col.render ? (
              col.render(node)
            ) : (
              <span className="opacity-90">{node[col.key]}</span>
            )}
          </td>
        ))}
      </tr>

      {hasChildren && isExpanded && children.map((child, childIdx) => (
        <TreeRow
          key={nodeKey(child)}
          node={child}
          depth={depth + 1}
          columns={columns}
          childrenKey={childrenKey}
          nodeKey={nodeKey}
          expandedKeys={expandedKeys}
          onToggle={onToggle}
          activeTerm={activeTerm}
          matchNode={matchNode}
          indentSize={indentSize}
          onRowClick={onRowClick}
          expandIconRender={expandIconRender}
          rowClassName={rowClassName}
          rowIndex={childIdx}
        />
      ))}
    </>
  );
}


// Main ExpandableTreeTable — same outer structure as Table


function ExpandableTreeTable<T extends Record<string, any>>({
  columns,
  data,
  childrenKey = "children",
  nodeKey,

  showToolbar = false,
  showSearch = true,
  searchValue = "",
  onSearch,
  toolbarPlaceholder = "Search...",
  extraFilters,
  onRefresh,
  showExpandControls = true,

  searchTerm: externalSearchTerm,
  matchNode,
  defaultExpandDepth = 1,
  indentSize = 20,

  loading = false,
  emptyMessage = "No records found.",
  onRowClick,
  expandIconRender,
  rowClassName,
}: ExpandableTreeTableProps<T>) {

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Active search term: toolbar's searchValue takes priority over external searchTerm prop
  const activeTerm = showToolbar ? searchValue : (externalSearchTerm ?? "");

  const resolvedMatchNode = useCallback(
    (node: T, term: string): boolean => {
      if (matchNode) return matchNode(node, term);
      const t = term.toLowerCase();
      return Object.values(node).some(
        (v) => typeof v === "string" && v.toLowerCase().includes(t)
      );
    },
    [matchNode]
  );

  useEffect(() => {
    if (data.length === 0) return;
    const keys = collectExpandableKeys(data, nodeKey, childrenKey, defaultExpandDepth);
    setExpandedKeys(keys);
  }, [data, nodeKey, childrenKey, defaultExpandDepth]);

  const toggleNode = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedKeys(collectAllExpandableKeys(data, nodeKey, childrenKey));
  }, [data, nodeKey, childrenKey]);

  const collapseAll = useCallback(() => {
    setExpandedKeys(new Set()); // collapse everything
  }, []);

  const getAlignment = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    // ── Exact same outer wrapper as Table ──
    <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col shadow-sm transition-all relative z-10 w-full">

      {/* ── Toolbar — exact same layout as Table's toolbar ── */}
     {showToolbar && (
  <div className="px-5 py-4 border-b border-[var(--border)] bg-card flex flex-col lg:flex-row lg:items-center gap-4 shrink-0">

    {/* Search — left */}
    {showSearch && (
      <div className="relative w-52 group">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs group-focus-within:text-primary transition-colors" />
        <input
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder={toolbarPlaceholder}
          className="w-full pl-10 pr-4 py-2 bg-card border border-[var(--border)] rounded-xl text-xs font-medium text-main focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
        />
      </div>
    )}

    {/* Right side — ml-auto pushes everything to the right */}
    <div className="flex items-center gap-2 ml-auto shrink-0">

      {/* Expand / Collapse controls */}
      {showExpandControls && (
        <>
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-main bg-card border border-[var(--border)] rounded-xl hover:bg-row-hover transition-all whitespace-nowrap"
          >
            <Layers size={11} />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-main bg-card border border-[var(--border)] rounded-xl hover:bg-row-hover transition-all whitespace-nowrap"
          >
            <ChevronRight size={11} />
            Collapse
          </button>
        </>
      )}

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-main bg-card border border-[var(--border)] rounded-xl hover:bg-row-hover transition-all"
        >
          <RefreshCw size={11} />
        </button>
      )}

      {/* extraFilters — + New button yahan aayega, rightmost */}
      {extraFilters && (
        <div className="flex items-center gap-2 shrink-0">
          {extraFilters}
        </div>
      )}
    </div>

  </div>
)}
      {/* ── Table — exact same scroll wrapper as Table ── */}
      <div
        className="w-full overflow-x-auto custom-scrollbar"
        style={{ minHeight: "200px", overflowY: "auto", maxHeight: "70vh" }}
      >
        <div className="pb-4">
          <table className="w-full min-w-full md:min-w-[800px] border-separate border-spacing-0">

            {/* ── thead — exact same sticky style as Table ── */}
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      "px-3 sm:px-5 py-3.5 sm:py-4",
                      "text-[10px] font-black uppercase tracking-[0.08em] sm:tracking-[0.12em]",
                      "text-muted border-b border-[var(--border)] bg-card whitespace-nowrap",
                      getAlignment(col.align),
                    ].join(" ")}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── tbody ── */}
            <tbody className="relative z-10">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonRow key={idx} columnsCount={columns.length} />
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-24 text-center">
                    <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
                      {emptyMessage}
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((node, idx) => (
                  <TreeRow
                    key={nodeKey(node)}
                    node={node}
                    depth={0}
                    columns={columns}
                    childrenKey={childrenKey}
                    nodeKey={nodeKey}
                    expandedKeys={expandedKeys}
                    onToggle={toggleNode}
                    activeTerm={activeTerm}
                    matchNode={resolvedMatchNode}
                    indentSize={indentSize}
                    onRowClick={onRowClick}
                    expandIconRender={expandIconRender}
                    rowClassName={rowClassName}
                    rowIndex={idx}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

   
    </div>
  );
}

export default ExpandableTreeTable;