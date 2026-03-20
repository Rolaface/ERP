import React, { useState, useEffect, useCallback, useMemo } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import {
  getPurchaseAnalytics,
  type PurchaseAnalyticsFilters,
} from "../../api/analyticsApi";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

export type PurchaseNode = {
  entity: string;
  entity_name: string;
  total: number;
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

const nf = (value: number | undefined | null, isCurrency = true): string => {
  if (value === null || value === undefined) return "—";
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: isCurrency ? 2 : 0,
    maximumFractionDigits: isCurrency ? 2 : 0,
  }).format(Math.abs(value));

  const prefix = isCurrency ? "₹" : "";
  return value < 0 ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
};

const currentYearStart = (): string => {
  const year = new Date().getFullYear();
  return `${year}-01-01`;
};

const currentYearEnd = (): string => {
  const year = new Date().getFullYear();
  return `${year}-12-31`;
};

function SummaryStrip({
  kpis,
  isQuantity,
}: {
  kpis: PurchaseKPIs;
  isQuantity: boolean;
}) {
  if (!kpis) return null;

  const topPerformer =
    kpis.top_performers?.length > 0 ? kpis.top_performers[0] : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      <div className="bg-card rounded-lg border border-theme p-4 shadow-sm">
        <span className="text-xs text-muted">
          {isQuantity ? "Total Purchase Quantity" : "Total Purchase Value"}
        </span>
        <div className="text-xl font-bold text-emerald-500 mt-1">
          {nf(kpis.total_purchase_value, !isQuantity)}
        </div>
      </div>
      <div className="bg-card rounded-lg border border-theme p-4 shadow-sm">
        <span className="text-xs text-muted">Entities Analyzed</span>
        <div className="text-xl font-bold text-blue-500 mt-1">
          {nf(kpis.total_entities_analyzed, false)}
        </div>
      </div>
      <div className="bg-card rounded-lg border border-theme p-4 shadow-sm">
        <span className="text-xs text-muted">
          {isQuantity ? "Avg Quantity / Entity" : "Avg Value / Entity"}
        </span>
        <div className="text-xl font-bold text-violet-500 mt-1">
          {nf(kpis.average_value_per_entity, !isQuantity)}
        </div>
      </div>
      <div className="bg-card rounded-lg border border-theme p-4 shadow-sm overflow-hidden">
        <span className="text-xs text-muted">Top Performer</span>
        <div className="text-xl font-bold text-main mt-1 truncate">
          {topPerformer ? topPerformer.entity : "—"}
        </div>
      </div>
    </div>
  );
}

type FilterBarProps = {
  filters: PurchaseAnalyticsFilters;
  setFilters: React.Dispatch<React.SetStateAction<PurchaseAnalyticsFilters>>;
};

function FilterBar({ filters, setFilters }: FilterBarProps) {
  const inputClass =
    "px-3 py-2 border border-theme bg-app rounded-lg text-sm text-main w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="bg-card rounded-lg border border-theme p-4 flex flex-wrap gap-4 items-center shadow-sm w-full mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-medium">Analyze By:</span>
        <select
          value={filters.tree_type}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              tree_type: e.target
                .value as PurchaseAnalyticsFilters["tree_type"],
              page: 1,
            }))
          }
          className={inputClass}
        >
          <option value="Supplier">Supplier</option>
          <option value="Supplier Group">Supplier Group</option>
          <option value="Item">Item</option>
          <option value="Item Group">Item Group</option>
          <option value="Project">Project</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-medium">Range:</span>
        <select
          value={filters.range}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              range: e.target.value as PurchaseAnalyticsFilters["range"],
              page: 1,
            }))
          }
          className={inputClass}
        >
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Yearly">Yearly</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-medium">BasedOn:</span>
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
          className={inputClass}
        >
          <option value="Value">Value</option>
          <option value="Quantity">Quantity</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-medium">From:</span>
        <input
          type="date"
          value={filters.from_date || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              from_date: e.target.value,
              page: 1,
            }))
          }
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-medium">To:</span>
        <input
          type="date"
          value={filters.to_date || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              to_date: e.target.value,
              page: 1,
            }))
          }
          className={inputClass}
        />
      </div>
    </div>
  );
}

const PurchaseAnalytics: React.FC = () => {
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
          const payload = res.message?.data || res.data;
          setData(payload);
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

  const tableColumns = useMemo((): Column<PurchaseNode>[] => {
    if (!data?.columns) return [];

    return data.columns.map((col) => {
      const isNumeric =
        col.fieldtype === "Float" || col.fieldtype === "Currency";

      return {
        key: col.fieldname,
        header: col.label,
        sortable: false,
        width: isNumeric ? 120 : 200,
        render: (row: PurchaseNode) => {
          const val = row[col.fieldname];

          if (col.fieldname === "entity" || col.fieldname === "entity_name") {
            return (
              <span className="font-semibold text-main truncate block">
                {val || "—"}
              </span>
            );
          }

          return (
            <div
              className={
                isNumeric
                  ? "text-muted font-medium w-full text-right"
                  : "text-main"
              }
            >
              {isNumeric ? nf(val, filters.value_quantity === "Value") : val}
            </div>
          );
        },
      };
    });
  }, [data, filters.value_quantity]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={30} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <AlertCircle size={26} className="text-danger" />
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={() => fetchAnalytics(filters)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  const isQuantity = filters.value_quantity === "Quantity";

  return (
    <div className="flex flex-col gap-6 bg-app p-6 w-full max-w-[calc(100vw-280px)] box-border">
      {data?.kpis && <SummaryStrip kpis={data.kpis} isQuantity={isQuantity} />}

      <FilterBar filters={filters} setFilters={setFilters} />

      <div className="w-full bg-card rounded-xl border border-theme shadow-sm overflow-hidden flex flex-col">
        <div className="w-full overflow-x-auto scrollbar-thin">
          <Table<PurchaseNode>
            key={`table-${filters.range}-${filters.value_quantity}-${data?.columns?.length || 0}`}
            columns={tableColumns}
            data={data?.data ?? []}
            loading={loading}
            showToolbar={false}
            currentPage={filters.page || 1}
            totalPages={data?.pagination?.total_pages || 1}
            pageSize={filters.page_size || 10}
            totalItems={data?.pagination?.total_items || 0}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            onPageSizeChange={(size) =>
              setFilters((prev) => ({ ...prev, page_size: size, page: 1 }))
            }
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            emptyMessage="No analytics data found for the selected criteria."
          />
        </div>
      </div>
    </div>
  );
};

export default PurchaseAnalytics;
