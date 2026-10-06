import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  GripVertical,
  Info,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import {
  getDocFields,
  type DocFieldMeta,
  type ReportColumn,
} from "../../api/project/report/report.api";
import {
  isFieldInReport,
  makeCustomKey,
  type CustomColumnDef,
} from "../../hooks/report/useCustomColumns";

interface SelectedItem {
  key: string;
  linkField: string;
  doctype: string;
  field: string;
  label: string;
  fieldtype: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  linkColumns: ReportColumn[];
  columns: ReportColumn[];
  existingKeys: string[];
  onSubmit: (defs: CustomColumnDef[]) => void;
}

type SortDir = "asc" | "desc" | null;

const DEFAULT_COLUMN_WIDTH = 160;
const PAGE_SIZE = 15;

const hoverCls = "hover:bg-[var(--row-hover)]";
const tintCls = "bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]";

const inputCls =
  "h-9 px-2.5 text-sm border border-[var(--border)] rounded-md bg-card text-main focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)] focus:border-[var(--primary)] disabled:opacity-50";
const pagerBtnCls =
  "flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const badgeCls =
  "shrink-0 rounded bg-[color-mix(in_srgb,var(--text)_8%,var(--card))] px-1.5 py-0.5 text-[10px] font-semibold text-muted";
const thCls =
  "sticky top-0 z-10 px-3 py-2.5 bg-[color-mix(in_srgb,var(--text)_6%,var(--card))] shadow-[inset_0_-1px_0_var(--border)]";
const ghostBtnCls = `border-[var(--border)] bg-card text-main ${hoverCls}`;

const pageWindow = (current: number, total: number) => {
  const size = Math.min(5, total);
  const start = Math.min(Math.max(current - 2, 1), total - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
};

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-xs text-muted">
    {text}
  </div>
);

const AddColumnModal: React.FC<Props> = ({
  open,
  onClose,
  linkColumns,
  columns,
  existingKeys,
  onSubmit,
}) => {
  const [activeLink, setActiveLink] = useState("");
  const [cache, setCache] = useState<Record<string, DocFieldMeta[]>>({});
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortDir>(null);
  const [page, setPage] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [after, setAfter] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const requested = useRef<Set<string>>(new Set());

  const activeCol = linkColumns.find((c) => c.fieldname === activeLink);
  const activeDoctype = activeCol?.options ?? "";

  const baseColumns = useMemo(
    () => columns.filter((c) => !existingKeys.includes(c.fieldname)),
    [columns, existingKeys],
  );

  const doctypeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    linkColumns.forEach((c) => {
      const d = c.options ?? "";
      map[d] = (map[d] ?? 0) + 1;
    });
    return map;
  }, [linkColumns]);

  useEffect(() => {
    if (!open) {
      setActiveLink("");
      setSelected([]);
      setSearch("");
      setSort(null);
      setPage(1);
      setAdvancedOpen(false);
      setAfter("");
      setErr(null);
      setCache((p) => (Object.keys(p).length ? {} : p));
      requested.current.clear();
      return;
    }
    if (!activeLink && linkColumns.length) setActiveLink(linkColumns[0].fieldname);
  }, [open, activeLink, linkColumns]);

  useEffect(() => {
    if (!open || !activeDoctype || requested.current.has(activeDoctype)) return;
    const doctype = activeDoctype;
    requested.current.add(doctype);
    setLoadingDoc(doctype);
    getDocFields(doctype)
      .then((f) => setCache((p) => ({ ...p, [doctype]: f })))
      .catch(() => {
        requested.current.delete(doctype);
        setErr(`Failed to load ${doctype} fields.`);
      })
      .finally(() => setLoadingDoc((cur) => (cur === doctype ? null : cur)));
  }, [open, activeDoctype]);

  const fields = cache[activeDoctype] ?? [];
  const loading = loadingDoc === activeDoctype;
  const searching = search.trim().length > 0;

  const selectedKeys = useMemo(
    () => new Set(selected.map((s) => s.key)),
    [selected],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((f) =>
      [f.label, f.fieldname, f.fieldtype, f.description ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [fields, search]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const dir = sort === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => a.label.localeCompare(b.label) * dir);
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const keyOf = (f: DocFieldMeta) => makeCustomKey(activeLink, f.fieldname);
  const isAdded = (f: DocFieldMeta) => existingKeys.includes(keyOf(f));
  const isLocked = (f: DocFieldMeta) =>
    isAdded(f) || isFieldInReport(f, baseColumns);

  const toItem = (f: DocFieldMeta): SelectedItem => ({
    key: keyOf(f),
    linkField: activeLink,
    doctype: activeDoctype,
    field: f.fieldname,
    label: f.label,
    fieldtype: f.fieldtype,
  });

  const selectable = sorted.filter((f) => !isLocked(f));
  const allSelected =
    selectable.length > 0 && selectable.every((f) => selectedKeys.has(keyOf(f)));
  const someSelected = selectable.some((f) => selectedKeys.has(keyOf(f)));

  const toggle = (f: DocFieldMeta) => {
    const key = keyOf(f);
    setSelected((p) =>
      p.some((s) => s.key === key)
        ? p.filter((s) => s.key !== key)
        : [...p, toItem(f)],
    );
  };

  const toggleAll = () => {
    const keys = new Set(selectable.map(keyOf));
    setSelected((p) =>
      allSelected
        ? p.filter((s) => !keys.has(s.key))
        : [
            ...p,
            ...selectable
              .filter((f) => !p.some((s) => s.key === keyOf(f)))
              .map(toItem),
          ],
    );
  };

  const removeSelected = (key: string) =>
    setSelected((p) => p.filter((s) => s.key !== key));

  const move = (from: number, to: number) =>
    setSelected((p) => {
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const endDrag = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const countFor = (link: string) =>
    selected.filter((s) => s.linkField === link).length;

  const chipLabel = (c: ReportColumn) =>
    (doctypeCounts[c.options ?? ""] ?? 0) > 1
      ? `${c.options} · ${c.label}`
      : (c.options ?? c.label);

  const cycleSort = () => {
    setSort((s) => (s === null ? "asc" : s === "asc" ? "desc" : null));
    setPage(1);
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;

    let prev = after || columns[columns.length - 1]?.fieldname || "";
    const defs: CustomColumnDef[] = selected.map((s) => {
      const def: CustomColumnDef = {
        key: s.key,
        linkField: s.linkField,
        doctype: s.doctype,
        field: s.field,
        after: prev,
        column: {
          fieldname: s.key,
          label: s.label,
          fieldtype: s.fieldtype,
          width: DEFAULT_COLUMN_WIDTH,
        },
      };
      prev = s.key;
      return def;
    });

    onSubmit(defs);
    onClose();
  };

  const SortIcon =
    sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <MinimizableModal
      modalId="report-add-column"
      isOpen={open}
      onClose={onClose}
      title="Add Column"
      subtitle="Select fields to show in your report"
      icon={Columns3}
      maxWidth="6xl"
      height="700px"
      hideMinimize
      footer={
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-main transition-colors hover:text-primary"
            >
              <Settings size={14} />
              Advanced options
              <ChevronDown
                size={14}
                className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
            </button>
            {advancedOpen && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Insert</span>
                <select
                  className={`${inputCls} min-w-[180px]`}
                  value={after}
                  onChange={(e) => setAfter(e.target.value)}
                >
                  <option value="">At the end</option>
                  {columns.map((c) => (
                    <option key={c.fieldname} value={c.fieldname}>
                      After {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`h-9 rounded-md border px-4 text-xs font-semibold transition-all ${ghostBtnCls}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selected.length === 0}
              className="h-9 rounded-md bg-primary px-4 text-xs font-bold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selected.length > 1 ? `Add ${selected.length} Columns` : "Add Column"}
            </button>
          </div>
        </>
      }
    >
      <div className="-mx-4 -my-3 grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px] md:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="shrink-0 text-xs text-muted">Fields from:</span>
              {linkColumns.map((c) => {
                const active = c.fieldname === activeLink;
                const count = countFor(c.fieldname);
                return (
                  <button
                    key={c.fieldname}
                    type="button"
                    title={`via ${c.label}`}
                    onClick={() => {
                      setActiveLink(c.fieldname);
                      setSearch("");
                      setPage(1);
                      setErr(null);
                    }}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                      active
                        ? "border-[var(--primary)] bg-primary text-white"
                        : ghostBtnCls
                    }`}
                  >
                    {chipLabel(c)}
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-[10px] font-bold ${
                          active ? "bg-white/25 text-white" : "bg-primary text-white"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by label, name or type"
                disabled={!activeDoctype || loading}
                className={`${inputCls} w-full pl-9 pr-8`}
              />
              {searching && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--border)] bg-card">
            {loading ? (
              <Empty text="Loading fields..." />
            ) : !activeDoctype ? (
              <Empty text="No linked document types available." />
            ) : rows.length === 0 ? (
              <Empty text={err ?? "No fields found."} />
            ) : (
              <table className="w-full table-fixed border-separate border-spacing-0 text-xs">
                <colgroup>
                  <col className="w-11" />
                  <col className="w-[28%]" />
                  <col className="w-[24%]" />
                  <col className="w-[13%]" />
                  <col />
                </colgroup>
                <thead className="text-left text-xs font-semibold text-main">
                  <tr>
                    <th className={thCls}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        disabled={selectable.length === 0}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={toggleAll}
                        title="Select all matching fields"
                        className="accent-[var(--primary)]"
                      />
                    </th>
                    <th className={thCls}>
                      <button
                        type="button"
                        onClick={cycleSort}
                        className="inline-flex items-center gap-1.5 font-semibold hover:text-primary"
                      >
                        Field Label
                        <SortIcon size={12} className="text-muted" />
                      </button>
                    </th>
                    <th className={thCls}>Field Name</th>
                    <th className={thCls}>Type</th>
                    <th className={thCls}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => {
                    const locked = isLocked(f);
                    const checked = locked || selectedKeys.has(keyOf(f));
                    const cellCls = "border-t border-[var(--border)] px-3 py-2.5";
                    return (
                      <tr
                        key={f.fieldname}
                        onClick={() => !locked && toggle(f)}
                        className={`transition-colors ${
                          locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                        } ${
                          checked && !locked ? tintCls : locked ? "" : hoverCls
                        }`}
                      >
                        <td className={cellCls}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={locked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggle(f)}
                            className="accent-[var(--primary)]"
                          />
                        </td>
                        <td className={cellCls}>
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-main">
                              {f.label}
                            </span>
                            {locked ? (
                              <span className={badgeCls}>
                                {isAdded(f) ? "Added" : "In report"}
                              </span>
                            ) : f.hidden ? (
                              <span className={badgeCls}>Hidden</span>
                            ) : null}
                          </div>
                        </td>
                        <td className={`${cellCls} truncate text-muted`}>
                          {f.fieldname}
                        </td>
                        <td className={`${cellCls} truncate text-muted`}>
                          {f.fieldtype}
                        </td>
                        <td
                          className={`${cellCls} truncate text-muted`}
                          title={f.description}
                        >
                          {f.description || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">
              {searching
                ? `${sorted.length} of ${fields.length} fields`
                : `${fields.length} field${fields.length === 1 ? "" : "s"}`}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className={`${pagerBtnCls} ${ghostBtnCls}`}
                >
                  <ChevronLeft size={14} />
                </button>
                {pageWindow(currentPage, pageCount).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`${pagerBtnCls} ${
                      n === currentPage
                        ? "border-[var(--primary)] bg-primary text-white"
                        : ghostBtnCls
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className={`${pagerBtnCls} ${ghostBtnCls}`}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 border-t border-[var(--border)] p-4 md:border-l md:border-t-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-main">
              Selected Columns ({selected.length})
            </span>
            <button
              type="button"
              onClick={() => setSelected([])}
              disabled={!selected.length}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold disabled:opacity-40 ${ghostBtnCls}`}
            >
              <Trash2 size={11} />
              Clear all
            </button>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {selected.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-8 text-center text-xs text-muted">
                No columns selected yet.
                <br />
                Tick fields from the table.
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {selected.map((s, i) => (
                  <li
                    key={s.key}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverIdx(i);
                    }}
                    onDrop={() => {
                      if (dragIdx !== null && dragIdx !== i) move(dragIdx, i);
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={`flex items-center gap-2 rounded-lg border bg-card px-2 py-2 ${
                      overIdx === i && dragIdx !== i
                        ? "border-[var(--primary)]"
                        : "border-[var(--border)]"
                    } ${dragIdx === i ? "opacity-50" : ""}`}
                  >
                    <GripVertical
                      size={14}
                      className="shrink-0 cursor-grab text-muted active:cursor-grabbing"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-main">
                        {s.label}
                      </span>
                      <span className="block truncate text-[10px] text-muted">
                        {s.doctype}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${s.label}`}
                      onClick={() => removeSelected(s.key)}
                      className="shrink-0 text-muted hover:text-main"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`flex gap-2 rounded-lg px-3 py-2.5 ${tintCls}`}>
            <Info size={14} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <div className="text-xs font-semibold text-primary">
                Drag to reorder
              </div>
              <div className="text-[11px] text-muted">
                This order will be used in the report.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default AddColumnModal;