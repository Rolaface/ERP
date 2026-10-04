import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import DateRangeFilter from "../../../components/ui/modal/DateRangeFilter";
import { getAllProjects } from "../../../api/project/projectapi/project.api";
import {
  emailReport,
  fetchReport,
  getEmployeeOptions,
  getProjectTypeOptions,
  type ReportColumn,
  type ReportResponse,
  type ResourceOption,
} from "../../../api/project/report/report.api";
import { formatAmount } from "../../../utils/day-time formatter/Format";
import { formatDate } from "../../../components/UI_Utils/Datedisplay";

import type {
  LinkSource,
  ReportFilter,
  ReportViewProps,
  SelectOption,
} from "../reportOptions";
import ProjectSummaryView from "../report/Projectsummaryview";

type ReportRow = Record<string, any>;
type FilterValues = Record<string, string | boolean | undefined>;

const PAGE_SIZE = 20;
const MIN_COL_WIDTH = 110;
const DEFAULT_COL_WIDTH = 160;
const PAGE_WINDOW = 2;
const AMOUNT_TYPES = ["Currency", "Float", "Int", "Percent"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?)?$/;

const today = () => new Date().toISOString().split("T")[0];
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

const formatReportDate = (val: string) => {
  const match = ISO_DATE_PATTERN.exec(val);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const date = formatDate(val);
  return match[4] ? `${date} ${match[4]}` : date;
};

const initialValues = (defs: ReportFilter[]): FilterValues => {
  const values: FilterValues = {};
  defs.forEach((d) => {
    if (d.type === "date") {
      values.from_date = startOfYear();
      values.to_date = today();
    } else {
      values[d.key] = d.type === "check" ? false : "";
    }
  });
  return values;
};

const toApiFilters = (values: FilterValues) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, v]) => v !== "" && v !== undefined && v !== false)
      .map(([k, v]) => [k, v === true ? 1 : v]),
  );

const toOptions = (rows: ResourceOption[]): SelectOption[] =>
  rows.map((r) => ({
    value: r.name,
    label: r.title ? `${r.name}: ${r.title}` : r.name,
  }));

const LINK_LOADERS: Record<LinkSource, () => Promise<SelectOption[]>> = {
  employee: async () => toOptions(await getEmployeeOptions()),
  project_type: async () => toOptions(await getProjectTypeOptions()),
  project: async () =>
    (await getAllProjects()).map((r) => ({
      value: r.name,
      label: r.project_name || r.name,
    })),
};

const isAmountCol = (col: ReportColumn) =>
  !!col.fieldtype && AMOUNT_TYPES.includes(col.fieldtype);

const renderCell = (col: ReportColumn, val: any) => {
  if (val === null || val === undefined || val === "")
    return <span className="text-muted text-xs">—</span>;
  if (isAmountCol(col))
    return (
      <span className="text-xs font-medium tabular-nums text-main">
        {formatAmount(Number(val))}
      </span>
    );
  const dateText = typeof val === "string" ? formatReportDate(val) : null;
  if (dateText) return <span className="text-xs text-main">{dateText}</span>;
  return <span className="text-xs text-main">{String(val)}</span>;
};

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (cols: ReportColumn[], rows: ReportRow[]) =>
  [
    cols.map((c) => csvCell(c.label)).join(","),
    ...rows.map((r) => cols.map((c) => csvCell(r[c.fieldname])).join(",")),
  ].join("\r\n");

const downloadCsv = (fileName: string, csv: string) => {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const inputCls =
  "h-8 px-2.5 text-xs border border-[var(--border)] rounded-md bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const labelCls = "text-[9px] font-black uppercase tracking-widest text-muted";
const pageBtnCls =
  "p-1 rounded-md border border-[var(--border)] bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all";
const actionBtnCls =
  "h-8 flex items-center gap-1.5 px-3 text-xs font-semibold border border-[var(--border)] rounded-md bg-card text-main hover:bg-row-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

const GenericReportView: React.FC<ReportViewProps> = ({ report, leading }) => {
  const [values, setValues] = useState<FilterValues>(() =>
    initialValues(report.filters),
  );
  const [linkOptions, setLinkOptions] = useState<
    Partial<Record<LinkSource, SelectOption[]>>
  >({});
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const appliedRef = useRef<FilterValues>(values);

  const setValue = (key: string, v: string | boolean | undefined) =>
    setValues((p) => ({ ...p, [key]: v }));

  const needsDates = report.filters.some((f) => f.type === "date");
  const datesMissing = needsDates && (!values.from_date || !values.to_date);

  const load = useCallback(
    async (v: FilterValues) => {
      setLoading(true);
      setError(null);
      setNotice(null);
      appliedRef.current = v;
      try {
        setResult(
          await fetchReport(report.reportName, toApiFilters(v), {
            isTree: report.isTree,
          }),
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.exception ||
            err?.message ||
            "Failed to fetch report.",
        );
      } finally {
        setLoading(false);
      }
    },
    [report.reportName, report.isTree],
  );

  useEffect(() => {
    load(values);
  
  }, [load]);

  useEffect(() => {
    report.filters.forEach((f) => {
      if (f.type !== "link") return;
      LINK_LOADERS[f.source]()
        .then((opts) => setLinkOptions((p) => ({ ...p, [f.source]: opts })))
        .catch(() => setError(`Failed to load ${f.label} options.`));
    });
  }, [report.filters]);

  const handleApply = () => load(values);

  const visibleColumns = useMemo(
    () => (result?.columns ?? []).filter((c) => !c.hidden),
    [result?.columns],
  );

  const data = useMemo(() => result?.data ?? [], [result?.data]);

  const handleExport = () =>
    downloadCsv(`${report.label}_${today()}.csv`, toCsv(visibleColumns, data));

  const closeEmail = () => {
    setEmailOpen(false);
    setEmailError(null);
  };

  const handleSendEmail = async () => {
    const list = recipients
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (list.length === 0) return setEmailError("Enter at least one email.");
    const invalid = list.find((e) => !EMAIL_PATTERN.test(e));
    if (invalid) return setEmailError(`${invalid} is not a valid email.`);

    setSending(true);
    setEmailError(null);
    try {
      await emailReport(
        report.reportName,
        toApiFilters(appliedRef.current),
        list,
        { isTree: report.isTree },
      );
      setRecipients("");
      setEmailOpen(false);
      setNotice(`Report emailed to ${list.join(", ")}.`);
    } catch (err: any) {
      setEmailError(
        err?.response?.data?.exception ||
          err?.message ||
          "Failed to send email.",
      );
    } finally {
      setSending(false);
    }
  };

  const renderSelect = (
    key: string,
    label: string,
    options: SelectOption[],
  ) => (
    <div key={key} className="flex flex-col gap-1 min-w-[160px]">
      <label className={labelCls}>{label}</label>
      <select
        value={String(values[key] ?? "")}
        onChange={(e) => setValue(key, e.target.value)}
        className={inputCls}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderFilter = (f: ReportFilter) => {
    switch (f.type) {
      case "date":
        return (
          <div key="date" className="flex flex-col gap-1">
            <label className={labelCls}>{f.label}</label>
            <DateRangeFilter
              from={values.from_date as string | undefined}
              to={values.to_date as string | undefined}
              onChange={({ from_date, to_date }) =>
                setValues((p) => ({ ...p, from_date, to_date }))
              }
            />
          </div>
        );
      case "link":
        return renderSelect(f.key, f.label, linkOptions[f.source] ?? []);
      case "select":
        return renderSelect(f.key, f.label, f.options);
      case "check":
        return (
          <label
            key={f.key}
            className="h-8 flex items-center gap-1.5 text-xs text-main cursor-pointer whitespace-nowrap"
          >
            <input
              type="checkbox"
              checked={!!values[f.key]}
              onChange={(e) => setValue(f.key, e.target.checked)}
              className="accent-[var(--primary)]"
            />
            {f.label}
          </label>
        );
    }
  };

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () =>
      visibleColumns.map(
        (col): ColumnDef<ReportRow> => ({
          id: col.fieldname,
          accessorFn: (row) => row[col.fieldname],
          header: col.label,
          size: Math.max(col.width ?? DEFAULT_COL_WIDTH, MIN_COL_WIDTH),
          meta: { align: isAmountCol(col) ? "right" : "left" },
          cell: ({ getValue }) => renderCell(col, getValue()),
        }),
      ),
    [visibleColumns],
  );

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalRows = data.length;
  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.getState().pagination;
  const page = pageIndex + 1;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* ── Filter Bar ── */}
      <div className="relative bg-card rounded-lg border border-[var(--border)] px-3 py-2.5 flex flex-wrap items-end gap-2">
        {leading}
        {report.filters.map(renderFilter)}

        <button
          onClick={handleApply}
          disabled={loading || datesMissing}
          className="h-8 flex items-center gap-1.5 px-4 bg-primary text-white text-xs font-bold
                     rounded-md hover:bg-primary/90 transition-all disabled:opacity-50
                     disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? (
            <RefreshCw size={11} className="animate-spin" />
          ) : (
            <Filter size={11} />
          )}
          Apply
        </button>

        <div className="ml-auto flex items-end gap-2">
          <button
            onClick={handleExport}
            disabled={loading || totalRows === 0}
            className={actionBtnCls}
          >
            <Download size={12} />
            Export
          </button>
          <button
            onClick={() => (emailOpen ? closeEmail() : setEmailOpen(true))}
            disabled={loading || totalRows === 0}
            className={actionBtnCls}
          >
            <Mail size={12} />
            Email
          </button>
        </div>

        {emailOpen && (
          <div className="absolute right-3 top-full mt-1 z-30 w-80 bg-card border border-[var(--border)] rounded-lg p-3 flex flex-col gap-2 shadow-lg">
            <label className={labelCls}>Send to</label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => {
                setRecipients(e.target.value);
                setEmailError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              placeholder="name@company.com, other@company.com"
              className={inputCls}
              autoFocus
            />
            {emailError && (
              <span className="text-[11px] text-red-500">{emailError}</span>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={closeEmail} className={actionBtnCls}>
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="h-8 flex items-center gap-1.5 px-4 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sending && <RefreshCw size={11} className="animate-spin" />}
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Notice ── */}
      {notice && (
        <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-600">
          {notice}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      {columns.length > 0 && (
        <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 relative custom-scrollbar">
            <table className="w-max min-w-full text-left border-collapse">
              <thead className="sticky top-0 z-20">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => {
                      const align =
                        (header.column.columnDef.meta as any)?.align === "right"
                          ? "text-right"
                          : "text-left";
                      return (
                        <th
                          key={header.id}
                          style={{ minWidth: header.getSize() }}
                          className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest
                                      text-muted whitespace-nowrap bg-card
                                      border-b border-[var(--border)] ${align}`}
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
                {loading && !totalRows ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ height: `${Math.min(PAGE_SIZE, 10) * 38}px` }}
                    >
                      <div className="flex justify-center items-center h-full">
                        <Loader2
                          size={20}
                          className="animate-spin text-muted"
                        />
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-14 text-center text-xs text-muted"
                    >
                      No data found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-row-hover transition-colors h-[36px]"
                      style={{
                        borderBottom: "1px solid rgba(128,128,128,0.12)",
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align =
                          (cell.column.columnDef.meta as any)?.align === "right"
                            ? "text-right"
                            : "text-left";
                        return (
                          <td
                            key={cell.id}
                            className={`px-3 py-1 whitespace-nowrap ${align}`}
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

            {loading && totalRows > 0 && (
              <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* ── Pagination ── */}
          <div className="border-t border-[var(--border)] bg-card px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span className="text-[11px]">
              {totalRows > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-main">
                    {pageIndex * pageSize + 1}–
                    {Math.min(page * pageSize, totalRows)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-main">{totalRows}</span>
                </>
              ) : (
                "No entries"
              )}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage() || loading}
                  className={pageBtnCls}
                >
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= PAGE_WINDOW)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => table.setPageIndex(p - 1)}
                      disabled={loading}
                      className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                        p === page
                          ? "bg-primary text-white border-primary font-bold"
                          : "border-[var(--border)] bg-card text-main hover:bg-row-hover"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage() || loading}
                  className={pageBtnCls}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const CUSTOM_VIEWS: Record<string, React.FC<ReportViewProps>> = {
  "project-summary": ProjectSummaryView,
};

const ReportView: React.FC<ReportViewProps> = (props) => {
  const Custom = CUSTOM_VIEWS[props.report.key];
  return Custom ? <Custom {...props} /> : <GenericReportView {...props} />;
};

export default ReportView;