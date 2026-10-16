import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Download, Filter, Loader2 } from "lucide-react";
import DateRangeFilter from "../../../components/ui/modal/DateRangeFilter";
import MultiSearchSelect, {
  type Option,
} from "../../../components/selects/tabelselect/MultiSearchSelect";
import Pagination from "../../../components/Pagination";
import { getAllProjects } from "../../../api/project/projectapi/project.api";
import {
  fetchTimesheetActivityReport,
  getEmployeeOptions,
  type TimesheetActivityGroup,
  type TimesheetActivityGroupBy,
  type TimesheetActivityResponse,
} from "../../../api/project/report/report.api";
import { formatAmount } from "../../../utils/day-time formatter/Format";
import { formatDate } from "../../../components/UI_Utils/Datedisplay";
import type { ReportViewProps } from "../reportOptions";
import { downloadTimesheetSummaryExcel } from "./Timesheetsummaryexcel";

const FIRST_PAGE = 1;
const UNPAGED = 0;
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

const today = () => new Date().toISOString().split("T")[0];
const startOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};


const labelCls = "text-[9px] font-black uppercase tracking-widest text-muted";
const thCls =
  "px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap bg-card border-b border-[var(--border)]";
const tdCls = "px-3 py-1 text-xs text-main whitespace-nowrap";

const filterOptions = async (options: Option[], query: string) => {
  const term = query.trim().toLowerCase();
  return term
    ? options.filter((o) => o.label.toLowerCase().includes(term))
    : options;
};

const GROUP_BY_OPTIONS: Option[] = [
  { value: "employee", label: "Employee" },
  { value: "project", label: "Project" },
  { value: "date", label: "Date" },
  { value: "month", label: "Month" },
];

const GROUP_COLUMN_LABEL: Record<TimesheetActivityGroupBy, string> = {
  employee: "Employee",
  project: "Project",
  date: "Date",
  month: "Month",
};

const fetchGroupByOptions = (q: string) => filterOptions(GROUP_BY_OPTIONS, q);

const hours = (value: number) => Number(value || 0).toFixed(2);

const getGroupLabel = (group: TimesheetActivityGroup) =>
  group.level === "date"
    ? `${formatDate(group.group_id)}${
        group.day_name ? ` (${group.day_name.slice(0, 3)})` : ""
      }`
    : group.group || "—";

interface LeafRow {
  path: TimesheetActivityGroup[];
  leaf: TimesheetActivityGroup;
}

const flattenLeaves = (
  groups: TimesheetActivityGroup[],
  path: TimesheetActivityGroup[] = [],
): LeafRow[] =>
  groups.flatMap((group) => {
    const nextPath = [...path, group];
    return group.children?.length
      ? flattenLeaves(group.children, nextPath)
      : [{ path: nextPath, leaf: group }];
  });

const TABLE_HEADERS = [
  "Date",
  "Timesheet",
  "Title",
  "Employee",
  "Project",
  "Customer",
  "Task",
  "Activity",
  "Description",
  "Hours",
  "Billable",
  "Rate",
  "Amount",
  "Status",
];

const TimesheetActivityView: React.FC<ReportViewProps> = ({ leading }) => {
  const [fromDate, setFromDate] = useState<string | undefined>(startOfMonth());
  const [toDate, setToDate] = useState<string | undefined>(today());
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [groupLevels, setGroupLevels] = useState<TimesheetActivityGroupBy[]>(
    [],
  );
  const [includeNonBillable, setIncludeNonBillable] = useState(true);

  const [employees, setEmployees] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [result, setResult] = useState<TimesheetActivityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(FIRST_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const appliedParams = useRef<Record<string, unknown> | null>(null);

  const fetchEmployeeOptions = useCallback(
    (q: string) => filterOptions(employees, q),
    [employees],
  );
  const fetchProjectOptions = useCallback(
    (q: string) => filterOptions(projects, q),
    [projects],
  );

  const buildParams = (): Record<string, unknown> => ({
    from_date: fromDate,
    to_date: toDate,
    include_non_billable: includeNonBillable ? 1 : 0,
    ...(groupLevels.length > 0 && { group_by: groupLevels.join(",") }),
    ...(employeeIds.length > 0 && { employees: JSON.stringify(employeeIds) }),
    ...(projectIds.length > 0 && { projects: JSON.stringify(projectIds) }),
  });

  const runReport = async (
    params: Record<string, unknown>,
    targetPage: number,
    targetSize: number,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTimesheetActivityReport({
        ...params,
        page: targetPage,
        page_size: targetSize,
      });
      setResult(res);
      setPage(targetPage);
      setPageSize(targetSize);
    } catch (err: any) {
      setError(
        err?.response?.data?.exception ||
          err?.message ||
          "Failed to fetch report.",
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!fromDate || !toDate) return;
    const params = buildParams();
    appliedParams.current = params;
    runReport(params, FIRST_PAGE, pageSize);
  };

  const changePage = (targetPage: number) => {
    if (!appliedParams.current) return;
    runReport(appliedParams.current, targetPage, pageSize);
  };

  const changePageSize = (targetSize: number) => {
    if (!appliedParams.current) return;
    runReport(appliedParams.current, FIRST_PAGE, targetSize);
  };

  useEffect(() => {
    applyFilters();
    getEmployeeOptions()
      .then((r) =>
        setEmployees(
          r.map((e) => ({
            value: e.name,
            label: e.title ? `${e.name}: ${e.title}` : e.name,
          })),
        ),
      )
      .catch(() => setError("Failed to load employee options."));
    getAllProjects()
      .then((r) =>
        setProjects(
          r.map((p) => ({ value: p.name, label: p.project_name || p.name })),
        ),
      )
      .catch(() => setError("Failed to load project options."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    if (!appliedParams.current || !result?.summary.total_entries) return;
    setLoading(true);
    try {
      const exportParams = { ...appliedParams.current };
      delete exportParams.group_by;

      const all = await fetchTimesheetActivityReport({
        ...exportParams,
        page_size: UNPAGED,
      });

      await downloadTimesheetSummaryExcel(
        all.data,
        String(exportParams.from_date),
        String(exportParams.to_date),
        `Timesheet_Monthly_Summary_${today()}.xlsx`,
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.exception ||
          err?.message ||
          "Failed to export report.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(() => {
    const s = result?.summary;
    if (!s) return [];
    return [
      ["Entries", s.total_entries],
      ["Employees", s.total_employees],
      ["Projects", s.total_projects],
      ["Total Hours", s.total_hours],
      ["Billable Hours", s.billable_hours],
      ["Non-Billable Hours", s.non_billable_hours],
      ["Billable Amount", formatAmount(s.total_billable_amount)],
      ["Costing Amount", formatAmount(s.total_costing_amount)],
    ] as [string, string | number][];
  }, [result]);

  const activeGroupBy = result?.group_by ?? [];
  const leafRows = useMemo(
    () => flattenLeaves(result?.groups ?? []),
    [result?.groups],
  );
  const showGroupedView = activeGroupBy.length > 0 && leafRows.length > 0;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="bg-card rounded-lg border border-[var(--border)] px-3 py-2.5 flex flex-wrap items-end gap-2">
        {leading}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Date Range</label>
          <DateRangeFilter
            from={fromDate}
            to={toDate}
            onChange={({ from_date, to_date }) => {
              setFromDate(from_date);
              setToDate(to_date);
            }}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[200px] max-w-[260px]">
          <label className={labelCls}>Employee</label>
          <MultiSearchSelect
            values={employeeIds}
            onChange={(values) => setEmployeeIds(values)}
            fetchOptions={fetchEmployeeOptions}
            placeholder="All Employees"
            maxVisibleChips={1}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[200px] max-w-[260px]">
          <label className={labelCls}>Project</label>
          <MultiSearchSelect
            values={projectIds}
            onChange={(values) => setProjectIds(values)}
            fetchOptions={fetchProjectOptions}
            placeholder="All Projects"
            maxVisibleChips={1}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[200px] max-w-[260px]">
          <label className={labelCls}>Group By</label>
          <MultiSearchSelect
            values={groupLevels}
            onChange={(values) =>
              setGroupLevels(values as TimesheetActivityGroupBy[])
            }
            fetchOptions={fetchGroupByOptions}
            placeholder="No Grouping"
            maxVisibleChips={2}
          />
        </div>
        <label className="h-8 flex items-center gap-1.5 text-xs text-main cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={includeNonBillable}
            onChange={(e) => setIncludeNonBillable(e.target.checked)}
            className="accent-[var(--primary)]"
          />
          Include Non-Billable
        </label>

        <button
          onClick={applyFilters}
          disabled={loading || !fromDate || !toDate}
          className="h-8 flex items-center gap-1.5 px-4 bg-primary text-white text-xs font-bold rounded-md hover:brightness-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Filter size={11} />
          )}
          Apply
        </button>
        <button
          onClick={handleExport}
          disabled={loading || !result?.summary.total_entries}
          className="ml-auto h-8 flex items-center gap-1.5 px-3 text-xs font-semibold border border-[var(--border)] rounded-md bg-card text-main disabled:opacity-50"
        >
          <Download size={12} /> Export Excel
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
          {error}
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
          {cards.map(([label, value]) => (
            <div
              key={label}
              className="bg-card border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <div className={labelCls}>{label}</div>
              <div className="text-sm font-bold text-main tabular-nums">
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-[var(--border)] rounded-xl overflow-auto flex-1 min-h-0 custom-scrollbar">
        {loading && !result ? (
          <div className="flex justify-center items-center py-14">
            <Loader2 size={20} className="animate-spin text-muted" />
          </div>
        ) : !result?.data.length && !leafRows.length ? (
          <div className="py-14 text-center text-xs text-muted">
            No data found for the selected filters.
          </div>
        ) : showGroupedView ? (
          <table className="w-max min-w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                {activeGroupBy.map((level) => (
                  <th key={level} className={thCls}>
                    {GROUP_COLUMN_LABEL[level]}
                  </th>
                ))}
                <th className={`${thCls} text-right`}>Work Days</th>
                <th className={`${thCls} text-right`}>Total Hours</th>
                <th className={`${thCls} text-right`}>Billable Hours</th>
                <th className={`${thCls} text-right`}>Non-Billable Hours</th>
                <th className={`${thCls} text-right`}>Billable Amount</th>
              </tr>
            </thead>
            <tbody>
              {leafRows.map(({ path, leaf }, rowIndex) => {
                const previousPath = leafRows[rowIndex - 1]?.path;
                let changed = false;

                return (
                  <tr
                    key={path.map((node) => node.group_id).join("/")}
                    className="hover:bg-[var(--row-hover)] h-[36px]"
                    style={{
                      borderBottom: "1px solid rgba(128,128,128,0.12)",
                    }}
                  >
                    {path.map((node, level) => {
                      if (previousPath?.[level]?.group_id !== node.group_id) {
                        changed = true;
                      }
                      return (
                        <td key={level} className={`${tdCls} font-medium`}>
                          {changed ? getGroupLabel(node) : ""}
                        </td>
                      );
                    })}
                    <td className={`${tdCls} text-right tabular-nums`}>
                      {leaf.work_days}
                    </td>
                    <td className={`${tdCls} text-right tabular-nums`}>
                      {hours(leaf.total_hours)}
                    </td>
                    <td className={`${tdCls} text-right tabular-nums`}>
                      {hours(leaf.billable_hours)}
                    </td>
                    <td className={`${tdCls} text-right tabular-nums`}>
                      {hours(leaf.non_billable_hours)}
                    </td>
                    <td
                      className={`${tdCls} text-right tabular-nums font-medium`}
                    >
                      {formatAmount(leaf.total_billable_amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {result && (
              <tfoot>
                <tr className="bg-[var(--row-hover)] font-bold">
                  <td
                    className={tdCls}
                    colSpan={activeGroupBy.length}
                  >
                    Total
                  </td>
                  <td className={tdCls} />
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {hours(result.summary.total_hours)}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {hours(result.summary.billable_hours)}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {hours(result.summary.non_billable_hours)}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {formatAmount(result.summary.total_billable_amount)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        ) : (
          <table className="w-max min-w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                {TABLE_HEADERS.map((h) => (
                  <th key={h} className={thCls}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(result?.data ?? []).map((e) => (
                <tr
                  key={e.detail_id}
                  className="hover:bg-[var(--row-hover)] h-[36px]"
                  style={{ borderBottom: "1px solid rgba(128,128,128,0.12)" }}
                >
                  <td className={tdCls}>
                    {formatDate(e.date)}{" "}
                    <span className="text-muted">
                      ({e.day_name.slice(0, 3)})
                    </span>
                  </td>
                  <td className={tdCls}>{e.timesheet}</td>
                  <td className={tdCls}>{e.timesheet_title || e.timesheet}</td>
                  <td className={tdCls}>{e.employee_name || "—"}</td>
                  <td className={tdCls}>{e.project_name || "—"}</td>
                  <td className={tdCls}>{e.customer_name || "—"}</td>
                  <td className={tdCls}>{e.task_name || "—"}</td>
                  <td className={tdCls}>{e.activity_type || "—"}</td>
                  <td className={tdCls}>{e.description || "—"}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {e.hours}
                  </td>
                  <td className={tdCls}>{e.is_billable ? "Yes" : "No"}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {formatAmount(e.billing_rate)}
                  </td>
                  <td
                    className={`${tdCls} text-right tabular-nums font-medium`}
                  >
                    {formatAmount(e.billing_amount)}
                  </td>
                  <td className={tdCls}>{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {result && result.pagination.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={result.pagination.total_pages}
          pageSize={pageSize}
          totalItems={result.pagination.total}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      )}
    </div>
  );
};

export default TimesheetActivityView;