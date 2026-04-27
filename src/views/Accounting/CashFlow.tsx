import React, { useState, useEffect, useCallback, useMemo } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import { getCashFlow } from "../../api/Accounting/AccountApi";
import {
    AlertCircle,
    Loader2,
    RefreshCw,
    Folder,
    FolderOpen,
    FileText,
    ChevronRight,
    Layers,
} from "lucide-react";
import DatePickerInput from "../../components/calendar/DatePickerInput";
import type {
    CFResponse,
    CFRawRow,
    CFSummaryItem,
} from "../../types/Accounting/Cashflow";
import { getCompanyCurrentFiscalYear } from "../../api/utils/frappeUtilsApi";

/* ───────────────── TYPES ───────────────── */

export type CFNode = {
    id: string;
    section: string;
    currency?: string;
    parent_section?: string | null;
    indent: number;
    periods: Record<string, number>;
    children: CFNode[];
};

type FilterMode = "Fiscal Year" | "Date Range";
type Periodicity = "Monthly" | "Quarterly" | "Yearly" | "Half-Yearly";

interface CFFilters {
    mode: FilterMode;
    periodicity: Periodicity;
    from_fiscal_year: number;
    to_fiscal_year: number;
    from_date?: string;
    to_date?: string;
}

const res = await getCompanyCurrentFiscalYear();

const fiscalYear = res.data?.fiscal_year;
const fiscalYearStartDate = res?.data?.start_date;
const fiscalYearEndDate = res ?.data?.end_date;

/* ───────────────── DATE HELPERS ───────────────── */

const toInputDate = (apiDate?: string) => {
    if (!apiDate) return "";
    const [d, m, y] = apiDate.split("-");
    return `${y}-${m}-${d}`;
};

const toApiDate = (inputDate: string) => {
    const [y, m, d] = inputDate.split("-");
    return `${d}-${m}-${y}`;
};

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
};

/* ───────────────── FORMAT ───────────────── */

const nf = (value?: number | null, currency?: string) => {
    if (value === undefined || value === null) return "—";

    const formatted = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(value));

    const prefix = currency ? `${currency} ` : "";
    return value < 0 ? `${prefix}-${formatted}` : `${prefix}${formatted}`;
};

const isNetRow = (section: string, parentSection?: string | null) =>
    section.toLowerCase().startsWith("net") && !parentSection;


/* ───────────────── TREE MAPPER (NEW API STRUCTURE) ───────────────── */

function mapNode(row: CFRawRow): CFNode {
    return {
        id: row.section || row.section_name || Math.random().toString(),

        section: (row.section ?? row.section_name ?? "")
            .toString()
            .replace(/^'|'$/g, ""),

        currency: row.currency,
        indent: row.indent ?? 0,
        parent_section: row.parent_section ?? null,

        periods: row.periods ?? {},

        children: (row.children ?? []).map(mapNode),
    };
}

function buildTree(rows: CFRawRow[]): CFNode[] {
    return rows
        .filter((r) => r && Object.keys(r).length > 0)
        .map(mapNode);
}

/* ───────────────── ICON ───────────────── */

function expandIcon(
    _node: CFNode,
    isExpanded: boolean,
    hasChildren: boolean
) {
    if (!hasChildren)
        return <FileText size={12} className="text-muted opacity-50" />;

    return isExpanded ? (
        <FolderOpen size={13} className="text-muted" />
    ) : (
        <Folder size={13} className="text-muted" />
    );
}


const getSummaryColor = (item: CFSummaryItem) => {
    const label = item.label?.toLowerCase() || "";
    const value = item.value ?? 0;

    // Priority 1 → Label based (better UX)
    if (label.includes("operating")) return "text-blue-500";
    if (label.includes("investing")) return "text-purple-500";
    if (label.includes("financing")) return "text-orange-500";
    if (label.includes("net")) return value >= 0 ? "text-emerald-600" : "text-red-500";

    // Fallback → value based
    if (value > 0) return "text-emerald-600";
    if (value < 0) return "text-red-500";

    return "text-main";
};

/* ───────────────── SUMMARY STRIP ───────────────── */

function SummaryStrip({ summary }: { summary: CFSummaryItem[] }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-[900px]">
            {summary.map((item) => (
                <div
                    key={item.label}
                    className="rounded-xl border p-3 flex flex-col gap-1 bg-card"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted opacity-70">
                        {item.label}
                    </span>

                    <div className={`text-sm font-black ${getSummaryColor(item)}`}>
                        {nf(item.value, item.currency)}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ───────────────── FILTER BAR ───────────────── */

function FilterBar({
    filters,
    setFilters,
    onExpandAll,
    onCollapseAll,
}: {
    filters: CFFilters;
    setFilters: React.Dispatch<React.SetStateAction<CFFilters>>;
    onExpandAll: () => void;
    onCollapseAll: () => void;
}) {
    const inputClass =
        "w-25 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-card text-xs no-spinner";

    const btnClass =
        "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase border rounded-xl";

    return (
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto p-3 rounded-xl border bg-card w-full max-w-[900px]">

            {/* MODE */}
            <select
                value={filters.mode}
                onChange={(e) => {
                    const mode = e.target.value as FilterMode;

                    setFilters((f) => ({
                        ...f,
                        mode,
                        ...(mode === "Date Range"
                            ? { from_date: currentMonthStart(), to_date: currentMonthEnd() }
                            : { from_fiscal_year: fiscalYear, to_fiscal_year: fiscalYear }),
                    }));
                }}
                className={inputClass}
            >
                <option value="Fiscal Year">Fiscal Year</option>
                <option value="Date Range">Date Range</option>
            </select>

            {/* PERIOD */}
            <select
                value={filters.periodicity}
                onChange={(e) =>
                    setFilters((f) => ({
                        ...f,
                        periodicity: e.target.value as Periodicity,
                    }))
                }
                className={inputClass}
            >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
                <option value="Half-Yearly">Half-Yearly</option>
            </select>

            {/* FY */}
            {filters.mode !== "Date Range" && (
                <>
                    <input
                        type="number"
                        value={filters.from_fiscal_year}
                        onChange={(e) =>
                            setFilters((f) => ({
                                ...f,
                                from_fiscal_year: Number(e.target.value),
                            }))
                        }
                        className={inputClass}
                    />

                    <input
                        type="number"
                        value={filters.to_fiscal_year}
                        onChange={(e) =>
                            setFilters((f) => ({
                                ...f,
                                to_fiscal_year: Number(e.target.value),
                            }))
                        }
                        className={inputClass}
                    />
                </>
            )}

            {/* DATE RANGE */}
            {filters.mode === "Date Range" && (
                <>
                    {/* DATE RANGE */}
                    {filters.mode === "Date Range" && (
                        <>
                            {/* FROM */}
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
                                    From
                                </span>

                                <div className="w-[120px]">
                                    <DatePickerInput
                                        name="from_date"
                                        value={toInputDate(filters.from_date)}
                                        onChange={(name, value) =>
                                            setFilters((f) => ({
                                                ...f,
                                                from_date: toApiDate(value),
                                            }))
                                        }
                                        label=""
                                    />
                                </div>
                            </div>

                            {/* TO */}
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
                                    To
                                </span>

                                <div className="w-[120px]">
                                    <DatePickerInput
                                        name="to_date"
                                        value={toInputDate(filters.to_date)}
                                        onChange={(name, value) =>
                                            setFilters((f) => ({
                                                ...f,
                                                to_date: toApiDate(value),
                                            }))
                                        }
                                        label=""
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            <button onClick={onExpandAll} className={btnClass}>
                <Layers size={11} /> Expand All
            </button>

            <button onClick={onCollapseAll} className={btnClass}>
                <ChevronRight size={11} /> Collapse
            </button>
        </div>
    );
}

/* ───────────────── MAIN COMPONENT ───────────────── */

const CashFlow: React.FC = () => {
    const [filters, setFilters] = useState<CFFilters>({
        mode: "Fiscal Year",
        periodicity: "Monthly",
        from_fiscal_year: fiscalYear,
        to_fiscal_year: fiscalYear,
        from_date: currentMonthStart(),
        to_date: currentMonthEnd(),
    });

    const [data, setData] = useState<CFResponse["message"]["data"] | null>(null);
    const [tree, setTree] = useState<CFNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [expandDepth, setExpandDepth] = useState(2);
    const [expandKey, setExpandKey] = useState(0);

    const handleExpandAll = () => {
        setExpandDepth(Number.MAX_SAFE_INTEGER);
        setExpandKey((k) => k + 1);
    };

    const handleCollapseAll = () => {
        setExpandDepth(0);
        setExpandKey((k) => k + 1);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const params =
                filters.mode === "Date Range"
                    ? {
                        periodicity: filters.periodicity,
                        from_date: filters.from_date,
                        to_date: filters.to_date,
                        filter_based_on: "Date Range",
                    }
                    : {
                        periodicity: filters.periodicity,
                        from_fiscal_year: String(filters.from_fiscal_year),
                        to_fiscal_year: String(filters.to_fiscal_year),
                        filter_based_on: "Fiscal Year",
                    };

            const res: CFResponse = await getCashFlow(params as any);

            if (res.message.status_code === 200) {
                const d = res.message.data;

                setData(d);
                setTree(buildTree(d.data));
                setExpandDepth(2);
            } else {
                setError(res.message.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const columns: Column<CFNode>[] = useMemo(() => {
        if (!data) return [];

        return data.columns
            .filter((c) => !c.hidden)
            .map((col) => {
                if (col.fieldname === "section") {
                    return {
                        key: "section",
                        header: col.label,
                        width: "260px",
                        align: "left",
                        render: (row) => {
                            const isNet = isNetRow(row.section, row.parent_section);
                            return (
                                <span className={
                                    isNet
                                        ? "font-bold text-primary"
                                        : row.children.length
                                            ? "font-semibold"
                                            : ""
                                }>
                                    {row.section}
                                </span>
                            );
                        },
                    };
                }

                return {
                    key: col.fieldname,
                    header: col.label,
                    align: "right",
                    render: (row) => {
                        const val = row.periods?.[col.fieldname as keyof typeof row.periods] ?? 0;
                        const colorClass =
                            val > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : val < 0
                                    ? "text-red-500 dark:text-red-400"
                                    : "text-muted";
                        return (
                            <span className={colorClass}>
                                {nf(val, row.currency)}
                            </span>
                        );
                    },
                };
            });
    }, [data]);

    if (loading && !data)
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={30} className="animate-spin text-primary" />
            </div>
        );

    if (error)
        return (
            <div className="flex flex-col items-center py-20 gap-3">
                <AlertCircle size={26} className="text-danger" />
                <p>{error}</p>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );

    return (
        <div className="flex flex-col gap-4 w-full">

            {data && <SummaryStrip summary={data.summary} />}

            <FilterBar
                filters={filters}
                setFilters={setFilters}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
            />

            <ExpandableTreeTable<CFNode>
                key={`cf-${expandKey}`}
                columns={columns}
                data={tree}
                childrenKey="children"
                nodeKey={(n) => n.id}
                defaultExpandDepth={expandDepth}
                expandIconRender={expandIcon}
                loading={loading}
                emptyMessage="No cash flow data found."
                rowClassName={(row) =>
                    isNetRow(row.section, row.parent_section)
                        ? "bg-muted/40 border-t border-border font-semibold"
                        : ""
                }
            />
        </div>
    );
};

export default CashFlow;