import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type Column,
  type ColumnDef,
  type FilterFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import DataTable from "../../../../components/ui/Tankstack/Datatable";
import ActionButton, { ActionGroup } from "../../../../components/ui/Table/ActionButton";
import StatusBadge from "../../../../components/ui/Table/StatusBadge";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import ColumnToggle from "./Columntoggle";
import TablePagination from "./Tablepagination";
import { cardCls, inputCls } from "./Styles";
import { clampPercent, formatPercent } from "../Utils";
import type { ProjectSummaryRow } from "../Types";

type TabKey = "all" | "overdue" | "no_tasks";

const TABLE_MAX_HEIGHT = "520px";
const PAGE_SIZES = [10, 20, 50, 100];

const STATUS_VARIANT: Record<string, "draft" | "info" | "success" | "danger"> = {
  Open: "success",
  Completed: "info",
  Cancelled: "danger",
};

const TAB_FILTERS: Record<TabKey, (r: ProjectSummaryRow) => boolean> = {
  all: () => true,
  overdue: (r) => r.overdue_tasks > 0,
  no_tasks: (r) => r.total_tasks === 0,
};

const TAB_LABELS: Record<TabKey, string> = {
  all: "All Projects",
  overdue: "Overdue",
  no_tasks: "No Tasks",
};

const dash = <span className="text-xs text-muted">—</span>;

const searchFilter: FilterFn<ProjectSummaryRow> = (row, _id, value) => {
  const q = String(value ?? "").trim().toLowerCase();
  if (!q) return true;
  const r = row.original;
  return (
    r.name.toLowerCase().includes(q) ||
    r.project_name.toLowerCase().includes(q) ||
    (r.project_type ?? "").toLowerCase().includes(q)
  );
};

const SortHeader: React.FC<{ column: Column<ProjectSummaryRow, unknown>; label: string }> = ({
  column,
  label,
}) => {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className="inline-flex items-center gap-1 uppercase tracking-widest hover:text-main"
    >
      {label}
      <Icon size={10} className={sorted ? "text-primary" : "opacity-40"} />
    </button>
  );
};

interface Props {
  rows: ProjectSummaryRow[];
  loading: boolean;
  isInitialLoad: boolean;
  onView?: (projectName: string) => void;
}

const ProjectsTable: React.FC<Props> = ({ rows, loading, isInitialLoad, onView }) => {
  const [tab, setTab] = useState<TabKey>("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const counts = useMemo(
    () =>
      (Object.keys(TAB_FILTERS) as TabKey[]).reduce(
        (acc, k) => ({ ...acc, [k]: rows.filter(TAB_FILTERS[k]).length }),
        {} as Record<TabKey, number>,
      ),
    [rows],
  );

  const data = useMemo(() => rows.filter(TAB_FILTERS[tab]), [rows, tab]);

  const columns = useMemo<ColumnDef<ProjectSummaryRow>[]>(() => {
    // header = sortable button, meta.label = Columns dropdown me naam
    const sortable = (label: string) => ({
      header: ({ column }: { column: Column<ProjectSummaryRow, unknown> }) => (
        <SortHeader column={column} label={label} />
      ),
    });

    return [
      {
        id: "sn",
        header: "#",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          const pos = table.getRowModel().rows.findIndex((r) => r.id === row.id);
          return <span className="text-xs text-muted">{pageIndex * pageSize + pos + 1}</span>;
        },
      },
      {
        accessorKey: "name",
        size: 110,
        meta: { label: "Project" },
        ...sortable("Project"),
        cell: ({ row }) => <span className="text-xs text-main">{row.original.name}</span>,
      },
      {
        accessorKey: "project_name",
        size: 240,
        meta: { label: "Project Name" },
        ...sortable("Project Name"),
        cell: ({ row }) => (
          <span className="text-xs font-medium text-main">{row.original.project_name}</span>
        ),
      },
      {
        id: "project_type",
        accessorFn: (r) => r.project_type ?? "",
        size: 110,
        meta: { label: "Type" },
        ...sortable("Type"),
        cell: ({ row }) =>
          row.original.project_type ? (
            <span className="text-xs text-main">{row.original.project_type}</span>
          ) : (
            dash
          ),
      },
      {
        accessorKey: "status",
        size: 110,
        meta: { label: "Status", align: "center" },
        ...sortable("Status"),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            variant={STATUS_VARIANT[row.original.status] ?? "draft"}
          />
        ),
      },
      {
        accessorKey: "total_tasks",
        size: 100,
        meta: { label: "Total Tasks", align: "center" },
        ...sortable("Total Tasks"),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-main">{row.original.total_tasks}</span>
        ),
      },
      {
        accessorKey: "completed_tasks",
        size: 100,
        meta: { label: "Completed", align: "center" },
        ...sortable("Completed"),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-main">{row.original.completed_tasks}</span>
        ),
      },
      {
        accessorKey: "overdue_tasks",
        size: 90,
        meta: { label: "Overdue", align: "center" },
        ...sortable("Overdue"),
        cell: ({ row }) => (
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: row.original.overdue_tasks > 0 ? "var(--danger)" : "var(--text)" }}
          >
            {row.original.overdue_tasks}
          </span>
        ),
      },
      {
        accessorKey: "percent_complete",
        size: 190,
        meta: { label: "Completion" },
        ...sortable("Completion"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${clampPercent(row.original.percent_complete)}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-[11px] text-muted">
              {formatPercent(row.original.percent_complete, 2)}
            </span>
          </div>
        ),
      },
      {
        id: "expected_start_date",
        accessorFn: (r) => r.expected_start_date ?? "",
        size: 120,
        meta: { label: "Start Date" },
        ...sortable("Start Date"),
        cell: ({ row }) =>
          row.original.expected_start_date ? (
            <DateDisplay
              date={row.original.expected_start_date}
              className="whitespace-nowrap text-xs text-main"
            />
          ) : (
            dash
          ),
      },
      {
        id: "expected_end_date",
        accessorFn: (r) => r.expected_end_date ?? "",
        size: 120,
        meta: { label: "End Date" },
        ...sortable("End Date"),
        cell: ({ row }) =>
          row.original.expected_end_date ? (
            <DateDisplay
              date={row.original.expected_end_date}
              className="whitespace-nowrap text-xs text-main"
            />
          ) : (
            dash
          ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        meta: { align: "center" },
        cell: ({ row }) => (
          <ActionGroup>
            <ActionButton type="view" iconOnly onClick={() => onView?.(row.original.name)} />
          </ActionGroup>
        ),
      },
    ];
  }, [onView]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: searchFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className={`${cardCls} flex flex-col overflow-hidden`}>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 pt-2">
        <div className="flex items-center gap-5">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 py-2 text-xs font-semibold transition-colors ${
                tab === k
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-main"
              }`}
            >
              {TAB_LABELS[k]} ({counts[k] ?? 0})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search project..."
              className={`${inputCls} w-56 pl-8`}
            />
          </div>
          <ColumnToggle columns={table.getAllLeafColumns()} />
          <select
            value={pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className={inputCls}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="custom-scrollbar overflow-auto" style={{ maxHeight: TABLE_MAX_HEIGHT }}>
        <DataTable
          table={table}
          loading={isInitialLoad}
          refreshing={loading}
          className="min-w-[1200px]"
          emptyMessage="No projects found for the selected filters."
        />
      </div>

      <TablePagination table={table} disabled={loading} />
    </div>
  );
};

export default ProjectsTable;