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
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type VisibilityState,
  type ExpandedState,
} from "@tanstack/react-table";
import {
  getPurchaseAnalytics,
  type PurchaseAnalyticsFilters,
} from "../../api/analyticsApi";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  BarChart3,
  Award,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { useCompanyStore } from "../../store/companyStore";

export type PurchaseNode = {
  entity: string;
  entity_name?: string;
  total: number;
  indent?: number;
  subRows?: PurchaseNode[];
  [key: string]: any;
};

export type PurchaseKPIs = {
  total_purchase_value: number;
  total_entities_analyzed: number;
  average_value_per_entity: number;
  top_performers: { entity: string; total_value: number }[];
};

export type PurchaseColumn = {
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

export type PurchaseData = {
  kpis: PurchaseKPIs;
  data: PurchaseNode[];
  columns: PurchaseColumn[];
  pagination: PaginationMeta;
};

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

const buildTree = (flatData: PurchaseNode[]): PurchaseNode[] => {
  const root: PurchaseNode[] = [];
  const stack: PurchaseNode[] = [];

  for (const item of flatData) {
    const node = { ...item, subRows: [] };
    const currentIndent = node.indent || 0;

    while (
      stack.length > 0 &&
      (stack[stack.length - 1].indent || 0) >= currentIndent
    ) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].subRows!.push(node);
    }
    stack.push(node);
  }
  return root;
};

const InfoBox = ({
  title,
  icon,
  loading,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  loading: boolean;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-3 flex flex-col justify-center h-full">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {loading ? (
      <div className="animate-pulse h-12 bg-gray-100 rounded w-full mt-1"></div>
    ) : (
      children
    )}
  </div>
);

const NoteItem = ({
  label,
  title,
  subTitle,
  value,
  icon,
  list,
  formatter,
}: any) => (
  <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex-1">
    {label && (
      <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
        {icon} {label}
      </div>
    )}

    {list ? (
      <div className="flex flex-col mt-0.5">
        {list.length > 0 ? (
          list.map((item: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1 border-b border-gray-200 last:border-0"
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
              ${
                i === 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-200 text-gray-600"
              }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-xs font-medium text-gray-800 truncate">
                {item.name || "N/A"}
              </span>
              <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                {formatter ? formatter.format(item.value || 0) : item.value}
              </span>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-400 py-1">No data</div>
        )}
      </div>
    ) : (
      <>
        {title && (
          <div
            className="font-medium text-xs text-gray-800 truncate"
            title={title}
          >
            {title}
          </div>
        )}
        {subTitle && subTitle !== "N/A" && (
          <div className="text-[10px] text-gray-400 truncate">
            Code: {subTitle}
          </div>
        )}
        <div className="text-sm font-bold text-gray-900 mt-0.5">{value}</div>
      </>
    )}
  </div>
);

function SummaryStrip({
  kpis,
  isQuantity,
  loading,
}: {
  kpis: PurchaseKPIs | undefined;
  isQuantity: boolean;
  loading: boolean;
}) {
  const currencySymbol = useCompanyStore((s) => s.currencySymbol);

  const valueFormatter = {
    format: (val: number) =>
      nf(val, !isQuantity, !isQuantity ? currencySymbol : ""),
  };
  const countFormatter = {
    format: (val: number) => nf(val, false),
  };

  const topPerformersList = (kpis?.top_performers || [])
    .slice(0, 3)
    .map((p) => ({
      name: p.entity,
      value: p.total_value,
    }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      <InfoBox
        title={isQuantity ? "Total Purchase Quantity" : "Total Purchase Value"}
        loading={loading}
        icon={<TrendingUp size={14} />}
      >
        <NoteItem
          label="Overall"
          value={valueFormatter.format(kpis?.total_purchase_value || 0)}
        />
      </InfoBox>

      <InfoBox
        title="Entities Analyzed"
        loading={loading}
        icon={<Users size={14} />}
      >
        <NoteItem
          label="Analyzed Count"
          value={countFormatter.format(kpis?.total_entities_analyzed || 0)}
        />
      </InfoBox>

      <InfoBox
        title={isQuantity ? "Avg Qty / Entity" : "Avg Value / Entity"}
        loading={loading}
        icon={<BarChart3 size={14} />}
      >
        <NoteItem
          label="Average"
          value={valueFormatter.format(kpis?.average_value_per_entity || 0)}
        />
      </InfoBox>

      <InfoBox
        title="Top Performers"
        loading={loading}
        icon={<Award size={14} />}
      >
        <NoteItem list={topPerformersList} formatter={valueFormatter} />
      </InfoBox>
    </div>
  );
}

type FilterBarProps = {
  filters: PurchaseAnalyticsFilters;
  setFilters: React.Dispatch<React.SetStateAction<PurchaseAnalyticsFilters>>;
  table: any;
};

function FilterBar({ filters, setFilters, table }: FilterBarProps) {
  const [showColMenu, setShowColMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowColMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectClass =
    "bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none px-2 h-8 min-w-[110px] cursor-pointer";
  const inputClass =
    "bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none px-2 h-8 w-32";

  return (
    <div className="flex flex-wrap items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-xl p-2 mb-3">
      <div className="flex items-center gap-1.5 px-2 border-r border-gray-300 text-gray-500">
        <Filter size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Filters
        </span>
      </div>

      <select
        value={filters.tree_type}
        onChange={(e) =>
          setFilters((f) => ({
            ...f,
            tree_type: e.target.value as PurchaseAnalyticsFilters["tree_type"],
            page: 1,
          }))
        }
        className={selectClass}
        title="Analyze By"
      >
        <option value="Supplier">Supplier</option>
        <option value="Supplier Group">Supplier Group</option>
        <option value="Item">Item</option>
        <option value="Item Group">Item Group</option>
        <option value="Project">Project</option>
      </select>

      <select
        value={filters.range}
        onChange={(e) =>
          setFilters((f) => ({
            ...f,
            range: e.target.value as PurchaseAnalyticsFilters["range"],
            page: 1,
          }))
        }
        className={selectClass}
        title="Range"
      >
        <option value="Weekly">Weekly</option>
        <option value="Monthly">Monthly</option>
        <option value="Quarterly">Quarterly</option>
        <option value="Yearly">Yearly</option>
      </select>

      <select
        value={filters.value_quantity}
        onChange={(e) =>
          setFilters((f) => ({
            ...f,
            value_quantity: e.target
              .value as PurchaseAnalyticsFilters["value_quantity"],
            page: 1,
          }))
        }
        className={selectClass}
        title="Based On"
      >
        <option value="Value">Value</option>
        <option value="Quantity">Quantity</option>
      </select>

      <div className="flex items-center gap-1 ml-auto">
        <input
          type="date"
          value={filters.from_date || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, from_date: e.target.value, page: 1 }))
          }
          className={inputClass}
          title="From Date"
        />
        <span className="text-gray-400 text-xs font-medium">-</span>
        <input
          type="date"
          value={filters.to_date || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, to_date: e.target.value, page: 1 }))
          }
          className={inputClass}
          title="To Date"
        />

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setShowColMenu(!showColMenu)}
            className={`flex items-center justify-center h-9 px-3 gap-2 bg-white border rounded-lg text-xs font-semibold transition-all shadow-sm
                      ${showColMenu ? "border-primary text-primary ring-2 ring-primary/20" : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"}`}
          >
            <LayoutGrid size={14} />
            <span>Columns</span>
          </button>

          {showColMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-lg p-2 z-50 flex flex-col gap-1 min-w-[200px] max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-1 px-1 pb-1 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Visible Columns
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => table.toggleAllColumnsVisible(true)}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => table.toggleAllColumnsVisible(false)}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Hide All
                  </button>
                </div>
              </div>

              {table.getAllLeafColumns().map((col: any) => (
                <label
                  key={col.id}
                  className="flex items-center gap-2 px-1 py-1 hover:bg-gray-50 rounded cursor-pointer text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="truncate">{col.columnDef.header}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PurchaseAnalytics: React.FC = () => {
  const currencySymbol = useCompanyStore((s) => s.currencySymbol);
  const [filters, setFilters] = useState<PurchaseAnalyticsFilters>({
    tree_type: "Supplier",
    doc_type: "Purchase Invoice",
    value_quantity: "Value",
    from_date: currentYearStart(),
    to_date: currentYearEnd(),
    range: "Monthly",
    page: 1,
    page_size: 10,
  });

  const [data, setData] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const fetchAnalytics = useCallback(
    async (currentFilters: PurchaseAnalyticsFilters) => {
      setLoading(true);
      setError(null);
      try {
        if (!currentFilters.from_date || !currentFilters.to_date) {
          setError("Please select a valid date range.");
          setLoading(false);
          return;
        }
        const res: any = await getPurchaseAnalytics(currentFilters);
        if (res?.status === "success" || res?.message?.status_code === 200) {
          setData(res.message?.data || res.data);
        } else {
          setError(
            res?.message?.message || "Failed to load Purchase Analytics.",
          );
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

  const treeData = useMemo(() => {
    if (!data?.data) return [];
    return buildTree(data.data);
  }, [data?.data]);

  const columns = useMemo<ColumnDef<PurchaseNode>[]>(() => {
    if (!data?.columns) return [];
    return data.columns.map((col) => {
      const isNumeric =
        col.fieldtype === "Float" || col.fieldtype === "Currency";
      return {
        accessorKey: col.fieldname,
        header: col.label,
        size: isNumeric ? 120 : 200,
        meta: {
          align: isNumeric ? "right" : "left",
        },
        cell: ({ row, getValue }) => {
          const val = getValue() as number | string;
          
          if (col.fieldname === "entity" || col.fieldname === "entity_name") {
            return (
              <div 
                style={{ paddingLeft: `${row.depth * 1.5}rem` }} 
                className="flex items-center gap-2"
              >
                {row.getCanExpand() ? (
                  <button
                    onClick={row.getToggleExpandedHandler()}
                    className="cursor-pointer text-gray-500 hover:text-gray-800 focus:outline-none flex items-center justify-center w-4 h-4"
                  >
                    {row.getIsExpanded() ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                ) : (
                  <span className="w-4 flex-shrink-0"></span>
                )}
                <span className="font-semibold text-gray-800 truncate block text-xs">
                  {val || "—"}
                </span>
              </div>
            );
          }

          return (
            <div
              className={`text-xs ${
                isNumeric ? "text-gray-600 font-medium" : "text-gray-800"
              }`}
            >
              {isNumeric
                ? nf(
                    val as number,
                    filters.value_quantity === "Value",
                    filters.value_quantity === "Value" ? currencySymbol : "",
                  )
                : val}
            </div>
          );
        },
      };
    });
  }, [data, filters.value_quantity, currencySymbol]);

  const table = useReactTable({
    data: treeData,
    columns,
    state: {
      columnVisibility,
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: row => row.subRows,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
    pageCount: data?.pagination?.total_pages ?? -1,
  });

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-xl border border-gray-200 m-2 shadow-sm">
        <AlertCircle size={24} className="text-red-500" />
        <p className="text-red-600 text-sm font-medium">{error}</p>
        <button
          onClick={() => fetchAnalytics(filters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  const isQuantity = filters.value_quantity === "Quantity";
  const paginationMeta = data?.pagination;
  const currentRows = table.getRowModel().rows;
  const emptyRowsCount = Math.max(0, filters.page_size - currentRows.length);
  const visibleColumnsCount = table.getVisibleLeafColumns().length;

  return (
    <div className="h-full min-h-0 flex flex-col w-full p-2">
      <SummaryStrip
        kpis={data?.kpis}
        isQuantity={isQuantity}
        loading={loading && !data}
      />

      <FilterBar filters={filters} setFilters={setFilters} table={table} />

      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-gray-50/95 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const align =
                      (header.column.columnDef.meta as any)?.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={`px-3 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap ${align}`}
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
            <tbody className="divide-y divide-gray-100 relative">
              {loading && !data?.data?.length ? (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    style={{ height: `${filters.page_size * 37}px` }}
                  >
                    <div className="flex justify-center items-center absolute inset-0">
                      <Loader2
                        size={24}
                        className="animate-spin text-gray-400"
                      />
                    </div>
                  </td>
                </tr>
              ) : currentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    style={{ height: `${filters.page_size * 37}px` }}
                  >
                    <div className="flex justify-center items-center absolute inset-0 text-gray-500 text-sm">
                      No data matches the selected criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {currentRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors group h-[37px]"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align =
                          (cell.column.columnDef.meta as any)?.align === "right"
                            ? "text-right"
                            : "text-left";
                        return (
                          <td
                            key={cell.id}
                            className={`px-3 py-1.5 whitespace-nowrap ${align}`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {Array.from({ length: emptyRowsCount }).map((_, index) => (
                    <tr key={`empty-${index}`} className="h-[37px]">
                      <td
                        colSpan={visibleColumnsCount}
                        className="px-3 py-1.5"
                      ></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>

          {loading && data?.data?.length > 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="bg-gray-50/50 border-t border-gray-200 px-3 py-2 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={filters.page_size}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  page_size: Number(e.target.value),
                  page: 1,
                }))
              }
              className="bg-white border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {[10, 15, 25, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-medium">
              {paginationMeta ? (
                <>
                  Showing{" "}
                  {(paginationMeta.page - 1) * paginationMeta.page_size + 1} to{" "}
                  {Math.min(
                    paginationMeta.page * paginationMeta.page_size,
                    paginationMeta.total_items,
                  )}{" "}
                  of {paginationMeta.total_items}
                </>
              ) : (
                "Loading..."
              )}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={!paginationMeta?.has_previous || loading}
                className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={!paginationMeta?.has_next || loading}
                className="p-1 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseAnalytics;