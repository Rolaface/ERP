import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import DatePickerInput from "../../components/calendar/DatePickerInput";
import {
  getSalesAnalytics,
  type SalesAnalyticsFilters,
} from "../../api/analyticsApi";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FaCheck, FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useCompanyStore } from "../../store/companyStore";

export type SalesNode = {
  entity: string;
  entity_name?: string;
  total: number;
  [key: string]: any;
};

export type SalesKPIs = {
  total_sales_value: number;
  total_entities_analyzed: number;
  average_value_per_entity: number;
  top_performers: { entity: string; total_value: number }[];
};

export type SalesColumn = {
  fieldname: string;
  label: string;
  fieldtype: string;
  width?: number;
  options?: string;
  hidden?: number;
};

export type PaginationMeta = {
  page: number;
  page_size: number;
  items_in_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type SalesData = {
  kpis: SalesKPIs;
  data: SalesNode[];
  columns: SalesColumn[];
  pagination: PaginationMeta;
};

// ── Formatters ────────────────────────────────────────────────────────────────
const nf = (
  value: number | undefined | null,
  isCurrency = true,
  symbol = "",
): string => {
  if (value === null || value === undefined) return "—";
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: isCurrency ? 2 : 0,
    maximumFractionDigits: isCurrency ? 2 : 0,
  }).format(Math.abs(value));
  const prefix = isCurrency && symbol ? `${symbol} ` : "";
  return value < 0 ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
};

const currentYearStart = () => `${new Date().getFullYear()}-01-01`;
const currentYearEnd = () => `${new Date().getFullYear()}-12-31`;

// ── Compact KPI Strip (mirrors AccountsReceivable style) ─────────────────────
const KpiStrip: React.FC<{
  kpis: SalesKPIs | undefined;
  isQuantity: boolean;
  loading: boolean;
  sym: string;
}> = ({ kpis, isQuantity, loading, sym }) => {
  const fmtVal = (v: number) => (isQuantity ? nf(v, false) : nf(v, true, sym));
  const topFive = (kpis?.top_performers || []).slice(0, 5);

  const sections = [
    {
      icon: <TrendingUp size={11} className="text-emerald-500" />,
      label: isQuantity ? "Sales Quantity" : "Sales Value",
      items: [
        {
          label: "Total",
          value: fmtVal(kpis?.total_sales_value || 0),
          color: "text-emerald-600",
          bold: true,
        },
        {
          label: "Avg / Entity",
          value: fmtVal(kpis?.average_value_per_entity || 0),
          color: "text-blue-500",
          bold: false,
        },
        {
          label: "Entities",
          value: String(kpis?.total_entities_analyzed || 0),
          color: "text-primary",
          bold: true,
        },
      ],
    },
    {
      icon: <Award size={11} className="text-amber-400" />,
      label: "Top Performers",
      items:
        topFive.length > 0
          ? topFive.map((p, i) => ({
              label: `#${i + 1} ${p.entity}`,
              value: fmtVal(p.total_value),
              color:
                i === 0
                  ? "text-amber-600"
                  : i === 1
                    ? "text-gray-600"
                    : "text-orange-400",
              bold: i === 0,
            }))
          : [{ label: "No data", value: "—", color: "text-muted", bold: false }],
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      {sections.map((sec) => (
        <div
          key={sec.label}
          className={`bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-2 min-w-0 ${
            sec.items.length > 3 ? "flex-[2]" : "flex-1"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {sec.icon}
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
              {sec.label}
            </span>
          </div>
          <div
            className="grid gap-1 divide-x divide-[var(--border)]"
            style={{
              gridTemplateColumns:
                sec.items.length > 3
                  ? `repeat(${sec.items.length}, minmax(0, 1fr))`
                  : "repeat(3, minmax(0, 1fr))",
            }}
          >
            {sec.items.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 px-1 first:pl-0 last:pr-0"
              >
                <span className="text-[10px] leading-tight text-muted truncate">
                  {item.label}
                </span>
                {loading ? (
                  <div className="h-3.5 w-12 bg-[var(--border)] rounded animate-pulse mt-0.5" />
                ) : (
                  <span
                    className={`leading-tight tabular-nums block ${item.color} ${
                      item.bold ? "font-extrabold" : "font-semibold"
                    } ${
                      String(item.value).length > 14
                        ? "text-[10px]"
                        : String(item.value).length > 10
                          ? "text-[11px]"
                          : String(item.value).length > 7
                            ? "text-[12px]"
                            : "text-[13px]"
                    }`}
                  >
                    {item.value || "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Dropdown wrapper (identical to AccountsReceivable) ───────────────────────
const FilterDropdown: React.FC<{
  label: string;
  active: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  width?: string;
}> = ({ label, active, isOpen, onToggle, children, width = "w-48" }) => (
  <div className="relative">
    <button
      onClick={onToggle}
      className={`h-7 px-2.5 text-[11px] font-semibold border rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40"
      }`}
    >
      {label}
    </button>
    {isOpen && (
      <div
        className={`absolute top-full left-0 mt-1.5 bg-card border border-[var(--border)] rounded-lg z-30 ${width} shadow-xl py-1 max-h-56 overflow-y-auto`}
      >
        {children}
      </div>
    )}
  </div>
);

const DropdownItem: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-1.5 text-xs flex justify-between items-center transition-colors ${
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-main hover:bg-row-hover"
    }`}
  >
    {children}
    {active && <FaCheck className="text-[9px] shrink-0" />}
  </button>
);

// ── Column visibility toggle (compact button) ────────────────────────────────
const ColVisMenu: React.FC<{ table: any }> = ({ table }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border rounded-md transition-all ${
          open
            ? "border-primary bg-primary/10 text-primary"
            : "border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40"
        }`}
      >
        <LayoutGrid size={12} />
        Columns
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-card border border-[var(--border)] shadow-xl rounded-lg p-2 z-30 flex flex-col gap-0.5 min-w-[190px] max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-1 px-1 pb-1 border-b border-[var(--border)]">
            <span className="text-[9px] font-black text-muted uppercase tracking-widest">
              Visible Columns
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.toggleAllColumnsVisible(true)}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-row-hover text-muted hover:text-main transition-colors"
              >
                All
              </button>
              <button
                onClick={() => table.toggleAllColumnsVisible(false)}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-row-hover text-muted hover:text-main transition-colors"
              >
                None
              </button>
            </div>
          </div>
          {table.getAllLeafColumns().map((col: any) => (
            <label
              key={col.id}
              className="flex items-center gap-2 px-1 py-1 hover:bg-row-hover rounded cursor-pointer text-xs text-main"
            >
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
                className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
              />
              <span className="truncate">{col.columnDef.header}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const SalesAnalytics: React.FC = () => {
  const currencySymbol = useCompanyStore((s) => s.currencySymbol);
  const sym = currencySymbol || "—";

  const [filters, setFilters] = useState<SalesAnalyticsFilters>({
    tree_type: "Customer",
    doc_type: "Sales Invoice",
    value_quantity: "Value",
    from_date: currentYearStart(),
    to_date: currentYearEnd(),
    range: "Monthly",
    page: 1,
    page_size: 20,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAnalytics = useCallback(
    async (currentFilters: SalesAnalyticsFilters) => {
      setLoading(true);
      setError(null);
      try {
        if (!currentFilters.from_date || !currentFilters.to_date) {
          setError("Please select a valid date range.");
          setLoading(false);
          return;
        }
        const res: any = await getSalesAnalytics(currentFilters);
        if (res?.status === "success" || res?.message?.status_code === 200) {
          setData(res.message?.data || res.data);
        } else {
          setError(res?.message?.message || "Failed to load Sales Analytics.");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error fetching analytics.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchAnalytics(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchAnalytics]);

  useEffect(() => {
    setFilters((f) => ({ ...f, page: 1 }));
  }, [searchTerm]);

  const flatData = useMemo(() => {
    const rows = data?.data ?? [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.entity?.toLowerCase().includes(q) ||
        r.entity_name?.toLowerCase().includes(q),
    );
  }, [data?.data, searchTerm]);

  const isQuantity = filters.value_quantity === "Quantity";

  const columns = useMemo<ColumnDef<SalesNode>[]>(() => {
    if (!data?.columns) return [];
    return data.columns.map((col) => {
      const isNumeric =
        col.fieldtype === "Float" || col.fieldtype === "Currency";
      const isTotal = col.fieldname === "total";
      return {
        accessorKey: col.fieldname,
        header: col.label,
        size: isNumeric ? 120 : 200,
        meta: { align: isNumeric ? "right" : "left" },
        cell: ({ getValue }) => {
          const val = getValue() as number | string;

          if (col.fieldname === "entity") {
            return (
              <span className="font-mono text-primary text-xs font-semibold">
                {val || "—"}
              </span>
            );
          }

          if (col.fieldname === "entity_name") {
            return (
              <span className="text-xs font-medium text-main truncate block">
                {val || "—"}
              </span>
            );
          }

          if (isNumeric) {
            const num = val as number;
            if (!num || num === 0)
              return <span className="text-xs text-muted tabular-nums">—</span>;
            return (
              <span
                className={`text-xs tabular-nums ${
                  isTotal
                    ? "text-emerald-600 font-bold"
                    : "text-gray-600 font-medium"
                }`}
              >
                {nf(num, !isQuantity, !isQuantity ? sym : "")}
              </span>
            );
          }

          return <span className="text-xs text-main">{val}</span>;
        },
      };
    });
  }, [data, isQuantity, sym]);

  const table = useReactTable({
    data: flatData,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.pagination?.total_pages ?? -1,
  });

  const paginationMeta = data?.pagination;
  const currentRows = table.getRowModel().rows;

  const treeTypeOptions: SalesAnalyticsFilters["tree_type"][] = [
    "Customer",
    "Customer Group",
    "Item",
    "Item Group",
    "Territory",
  ];
  const rangeOptions: SalesAnalyticsFilters["range"][] = [
    "Weekly",
    "Monthly",
    "Quarterly",
    "Yearly",
  ];

  const hasActiveFilters =
    filters.tree_type !== "Customer" ||
    filters.range !== "Monthly" ||
    filters.value_quantity !== "Value" ||
    filters.from_date !== currentYearStart() ||
    filters.to_date !== currentYearEnd() ||
    searchTerm !== "";

  const clearAll = () => {
    setFilters((f) => ({
      ...f,
      tree_type: "Customer",
      range: "Monthly",
      value_quantity: "Value",
      from_date: currentYearStart(),
      to_date: currentYearEnd(),
      page: 1,
    }));
    setSearchTerm("");
    setActiveDropdown(null);
  };

  const handleExportExcel = async () => {
    if (!data) return;
    try {
      setIsExporting(true);
      const res: any = await getSalesAnalytics({
        ...filters,
        page: 1,
        page_size: 999999,
      });
      const payload = res?.message?.data || res?.data;
      const rows: SalesNode[] = payload?.data || [];
      const cols: SalesColumn[] = payload?.columns || data.columns;
      if (!rows.length) {
        alert("No data to export.");
        return;
      }
      const exportData = rows.map((row) => {
        const record: Record<string, any> = {};
        cols.forEach((c) => {
          const isNumeric = c.fieldtype === "Float" || c.fieldtype === "Currency";
          record[c.label] = isNumeric
            ? Number(row[c.fieldname] ?? 0)
            : row[c.fieldname] ?? "";
        });
        return record;
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(exportData),
        "Sales Analytics",
      );
      saveAs(
        new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Sales_Analytics_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (err) {
      console.error(err);
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card border border-[var(--border)] rounded-xl m-2">
        <AlertCircle size={22} className="text-red-500" />
        <p className="text-red-500 text-xs font-medium">{error}</p>
        <button
          onClick={() => fetchAnalytics(filters)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col w-full p-2 gap-3">
      {/* ── KPI Strip ── */}
      {data?.kpis ? (
        <KpiStrip
          kpis={data.kpis}
          isQuantity={isQuantity}
          loading={loading && !data}
          sym={sym}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 h-16 animate-pulse flex-1"
            />
          ))}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div
        ref={dropdownRef}
        className="bg-card border border-[var(--border)] rounded-lg px-3 py-2 flex flex-wrap items-center gap-2"
      >
        <div className="flex items-center gap-1.5 mr-1">
          <SlidersHorizontal size={11} className="text-muted" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted">
            Filters
          </span>
        </div>

        <div className="w-px self-stretch bg-[var(--border)]" />

        {/* Analyze By */}
        <FilterDropdown
          label={filters.tree_type || "Analyze By"}
          active={filters.tree_type !== "Customer"}
          isOpen={activeDropdown === "treeType"}
          onToggle={() =>
            setActiveDropdown(
              activeDropdown === "treeType" ? null : "treeType",
            )
          }
          width="w-48"
        >
          {treeTypeOptions.map((opt) => (
            <DropdownItem
              key={opt}
              active={filters.tree_type === opt}
              onClick={() => {
                setFilters((f) => ({ ...f, tree_type: opt, page: 1 }));
                setActiveDropdown(null);
              }}
            >
              {opt}
            </DropdownItem>
          ))}
        </FilterDropdown>

        {/* Range */}
        <FilterDropdown
          label={filters.range || "Range"}
          active={filters.range !== "Monthly"}
          isOpen={activeDropdown === "range"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "range" ? null : "range")
          }
        >
          {rangeOptions.map((opt) => (
            <DropdownItem
              key={opt}
              active={filters.range === opt}
              onClick={() => {
                setFilters((f) => ({ ...f, range: opt, page: 1 }));
                setActiveDropdown(null);
              }}
            >
              {opt}
            </DropdownItem>
          ))}
        </FilterDropdown>

        {/* Value / Quantity */}
        <FilterDropdown
          label={filters.value_quantity || "Based On"}
          active={filters.value_quantity !== "Value"}
          isOpen={activeDropdown === "valueQty"}
          onToggle={() =>
            setActiveDropdown(activeDropdown === "valueQty" ? null : "valueQty")
          }
        >
          {(["Value", "Quantity"] as const).map((opt) => (
            <DropdownItem
              key={opt}
              active={filters.value_quantity === opt}
              onClick={() => {
                setFilters((f) => ({ ...f, value_quantity: opt, page: 1 }));
                setActiveDropdown(null);
              }}
            >
              {opt}
            </DropdownItem>
          ))}
        </FilterDropdown>

        {/* Date range */}
        <div className="flex items-center gap-1">
          <DatePickerInput
            name="from_date"
            value={filters.from_date}
            onChange={(name, value) =>
              setFilters((f) => ({ ...f, [name]: value, page: 1 }))
            }
          />
          <span className="text-muted text-[10px]">–</span>
          <DatePickerInput
            name="to_date"
            value={filters.to_date}
            onChange={(name, value) =>
              setFilters((f) => ({ ...f, [name]: value, page: 1 }))
            }
          />
        </div>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="h-7 px-2 flex items-center gap-1 text-[11px] text-red-500 hover:bg-red-500/10 rounded-md transition-colors font-semibold"
          >
            <X size={10} /> Clear
          </button>
        )}

        {/* Search + Columns + Export + Refresh — pushed right */}
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer…"
            className="h-7 px-2.5 text-[11px] border border-[var(--border)] bg-app rounded-md text-main
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-44"
          />
          <ColVisMenu table={table} />
          <button
            onClick={handleExportExcel}
            disabled={isExporting || flatData.length === 0}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)]
                       bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <RefreshCw size={10} className="animate-spin" />
            ) : (
              <FaDownload className="text-[9px]" />
            )}
            {isExporting ? "Exporting…" : "Export"}
          </button>
          <button
            onClick={() => fetchAnalytics(filters)}
            disabled={loading}
            className="h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all disabled:opacity-40"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1 min-h-0 relative">
          <table
            className="text-left border-separate border-spacing-0 w-full"
            style={{ tableLayout: "auto" }}
          >
            <thead className="border-b border-[var(--border)]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const align =
                      (header.column.columnDef.meta as any)?.align === "right"
                        ? "text-right"
                        : "text-left";
                    const isTotal = header.column.id === "total";
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={`sticky top-0 z-10 px-3 py-2 text-[9px] font-black uppercase tracking-widest
                                    text-muted whitespace-nowrap border-b border-[var(--border)] ${align} ${
                                      isTotal ? "bg-primary/10 text-primary" : "bg-row-hover"
                                    }`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading && !data?.data?.length ? (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    style={{ height: `${(filters.page_size ?? 10) * 38}px` }}
                  >
                    <div className="flex justify-center items-center h-full">
                      <Loader2 size={20} className="animate-spin text-muted" />
                    </div>
                  </td>
                </tr>
              ) : currentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="py-16 text-center text-xs text-muted"
                  >
                    No data matches the selected criteria.
                  </td>
                </tr>
              ) : (
                currentRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-row-hover transition-colors h-[38px]"
                    style={{ borderBottom: "1px solid rgba(128,128,128,0.12)" }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align =
                        (cell.column.columnDef.meta as any)?.align === "right"
                          ? "text-right"
                          : "text-left";
                      const isTotal = cell.column.id === "total";
                      return (
                        <td
                          key={cell.id}
                          className={`px-3 py-1 whitespace-nowrap ${align} ${
                            isTotal ? "bg-primary/5" : ""
                          }`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* loading overlay */}
          {loading && (flatData.length ?? 0) > 0 && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        <div className="border-t border-[var(--border)] bg-card px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="text-[11px]">
            {paginationMeta && paginationMeta.total_items > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-main">
                  {(paginationMeta.page - 1) * paginationMeta.page_size + 1}–
                  {Math.min(
                    paginationMeta.page * paginationMeta.page_size,
                    paginationMeta.total_items,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-main">
                  {paginationMeta.total_items}
                </span>
              </>
            ) : (
              "No entries"
            )}
          </span>

          {(paginationMeta?.total_pages ?? 0) > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                disabled={!paginationMeta?.has_previous || loading}
                className="p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from(
                { length: paginationMeta?.total_pages ?? 0 },
                (_, i) => i + 1,
              )
                .filter((p) => Math.abs(p - (filters.page ?? 1)) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    disabled={loading}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                      p === (filters.page ?? 1)
                        ? "bg-primary text-white border-primary font-bold"
                        : "border-[var(--border)] bg-card text-main hover:bg-row-hover"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                disabled={!paginationMeta?.has_next || loading}
                className="p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;