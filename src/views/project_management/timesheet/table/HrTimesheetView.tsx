import React, { useEffect, useState, useCallback, useRef } from "react";

import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../../utils/alert";
import DateDisplay from "../../../../components/UI_Utils/Datedisplay";
import { fireManagedSwal } from "../../../../utils/swalManager";
import {
  getAllTimesheets,
  submitTimesheet,
  cancelTimesheet,
  getTimesheetById,
} from "../../../../api/project/timesheet/timesheet.api";
import Table from "../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../components/ui/Table/ActionButton";
import { usePermission } from "../../../../hooks/permission/usePermission";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../../../store/dataRefreshStore";
import type { Column } from "../../../../components/ui/Table/type";
import type {
  TimesheetEntry,
  TimesheetStatus,
  TimesheetDetail,
} from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import { HrTableFrame } from "../../../../views/hr/components/HrTabLayout";
import StatusBadge from "../../../../components/ui/Table/StatusBadge";
import MetricsRow from "../components/MetricsRow";
import { ACTION_ICONS } from "../../../../components/UI_Utils/statusActionIcons";

import TimesheetDetailDrawer from "../drawer/TimesheetDetailDrawer";
import { useCurrencySymbols } from "../../../../hooks/Usecurrencysymbols";
import {
  openAdminTimesheetFormModal,
  openEmployeeTimesheetFormModal,
} from "../../../../components/feature/project management/timesheet/timesheetForm.modal";
import TimesheetCalendar from "../components/TimesheetCalendar";
import type { TimesheetMode } from "../components/Viewtoggle";
import { TIMESHEET_VIEW_OPTIONS } from "../../timesheet/components/imesheetViews";
import ViewSelector from "../../../project_management/ViewSelector";

// ── Constants ────────────────────────────────────────────────────

const TS_MODULE = "Timesheet";

// Table and calendar share this height so switching views never shifts the page
const CONTENT_HEIGHT = "calc(85.5vh - 100px)";

const STATUS_OPTIONS = [
  { label: "Draft", value: "Draft" },
  { label: "Approved", value: "Submitted" },
  { label: "Billed", value: "Billed" },
  { label: "Cancelled", value: "Cancelled" },
];

// StatusBadge's own VARIANT_MAP doesn't know "Billed" — force the right variant per status
const STATUS_VARIANT: Record<
  TimesheetStatus,
  "draft" | "info" | "success" | "danger"
> = {
  Draft: "draft",
  Submitted: "info",
  Billed: "success",
  Cancelled: "danger",
};

// ── Component ────────────────────────────────────────────────────

const HrTimesheetView: React.FC = () => {
  const { can } = usePermission();
  const mountedRef = useRef(true);

  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<TimesheetDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [view, setView] = useState<TimesheetMode>("calendar");

  // ── Reset page on search/filter change ────────────────────────

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // ── Fetch ────────────────────────────────────────────────────

  const fetchTimesheets = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const res = await getAllTimesheets(
        page,
        pageSize,
        statusFilter.length ? statusFilter : undefined,
        searchTerm || undefined,
        sortBy || undefined,
        sortOrder,
      );
      if (!mountedRef.current) return;

      setTimesheets(res.data || []);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || res.data?.length || 0);
    } catch (error) {
      showApiError(error);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchTimesheetsRef = useRef(fetchTimesheets);
  useEffect(() => {
    fetchTimesheetsRef.current = fetchTimesheets;
  }, [fetchTimesheets]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchTimesheets();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchTimesheets();
  }, [page, pageSize, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.TIMESHEET_LIST, () =>
      fetchTimesheetsRef.current(),
    );
    return unsubscribe;
  }, [subscribeToRefresh]);

  // ── Handlers ─────────────────────────────────────────────────

const openTimesheetForm = can(TS_MODULE, "delete")
  ? openAdminTimesheetFormModal
  : openEmployeeTimesheetFormModal;

const handleAdd = () => {
  openTimesheetForm({
    onSuccess: () => triggerRefresh(REFRESH_KEYS.TIMESHEET_LIST),
  });
};

const handleEdit = (id: string) => {
  openTimesheetForm({
    timesheetId: id,
    onSuccess: () => triggerRefresh(REFRESH_KEYS.TIMESHEET_LIST),
  });
};

  const handleView = async (id: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const detail = await getTimesheetById(id);
      setDrawerData(detail);
    } catch (err) {
      showApiError(err);
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleSubmit = async (id: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Approve Timesheet?",
      text: `Are you sure you want to approve timesheet ${id}?`,
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Approving timesheet...");

      await submitTimesheet(id);

      closeSwal();
      showSuccess("Timesheet approved");

      await fetchTimesheets();
      triggerRefresh(REFRESH_KEYS.TIMESHEET_LIST);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleCancel = async (id: string) => {
    const result = await fireManagedSwal({
      title: "Cancel Timesheet?",
      text: "This timesheet will be marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      showLoading("Cancelling...");
      await cancelTimesheet(id);
      closeSwal();
      showSuccess("Timesheet cancelled");
      await fetchTimesheets();
      triggerRefresh(REFRESH_KEYS.TIMESHEET_LIST);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Columns ──────────────────────────────────────────────────

  const columns: Column<TimesheetEntry>[] = [
    {
      key: "name",
      header: "Timesheet ID",
      align: "left",
      sortable: true,
      render: (t) => (
        <span
          className="font-mono font-bold text-primary text-xs hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleView(t.name);
          }}
        >
          {t.name}
        </span>
      ),
    },
    {
      key: "title",
      header: "Title",
      align: "left",
      sortable: true,
      render: (t) => (
        <span className="font-bold text-main text-xs">{t.title}</span>
      ),
    },
    {
      key: "start_date",
      header: "Start Date",
      align: "left",
      sortable: true,
      render: (t) => (
        <DateDisplay
          date={t.start_date}
          className="text-xs text-muted whitespace-nowrap"
        />
      ),
    },
    {
      key: "end_date",
      header: "End Date",
      align: "left",
      sortable: true,
      render: (t) => (
        <DateDisplay
          date={t.end_date}
          className="text-xs text-muted whitespace-nowrap"
        />
      ),
    },
    {
      key: "total_hours",
      header: "Total Hours",
      align: "right",
      sortable: true,
      render: (t) => (
        <span className="font-mono font-bold text-main">
          {(t.total_hours || 0).toFixed(1)} hrs
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      sortable: true,
      render: (t) => (
        <StatusBadge status={t.status} variant={STATUS_VARIANT[t.status]} />
      ),
    },
    {
      key: "per_billed",
      header: "Billing %",
      align: "left",
      render: (t) => (
        <div className="flex items-center gap-2">
          <div
            className="flex-1 rounded-full h-1.5 min-w-[50px]"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-1.5 rounded-full bg-success"
              style={{ width: `${t.per_billed || 0}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted w-7 text-right">
            {t.per_billed || 0}%
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (t) => {
        const customActions = [];

        // Draft → Submitted: hits submitTimesheet, but UI always says "Approve".
        if (t.status === "Draft" && can(TS_MODULE, "write")) {
          customActions.push({
            label: "Approve",
            icon: ACTION_ICONS.APPROVE,
            onClick: () => handleSubmit(t.name),
          });
        }

        if (
          can(TS_MODULE, "delete") &&
          (t.status === "Draft" || t.status === "Submitted")
        ) {
          customActions.push({
            label: "Cancel",
            icon: ACTION_ICONS.CANCEL,
            danger: true,
            onClick: () => handleCancel(t.name),
          });
        }

        const canEdit = t.status === "Draft" && can(TS_MODULE, "write");
        const isMenuEmpty = customActions.length === 0;

        return (
          <ActionGroup>
            <ActionButton
              type="view"
              onClick={() => handleView(t.name)}
              iconOnly
            />
            <ActionButton
              type="edit"
              onClick={() => handleEdit(t.name)}
              iconOnly
              disabled={!canEdit}
              title={
                canEdit
                  ? "Edit"
                  : "Editing is only available for Draft timesheets"
              }
            />
            <div
              className={isMenuEmpty ? "opacity-40 pointer-events-none" : ""}
            >
              <ActionMenu customActions={customActions} />
            </div>
          </ActionGroup>
        );
      },
    },
  ];

  // ── Render ───────────────────────────────────────────────────

  return (
    <HrTableFrame>
      {/* KPIs stay mounted in both views */}
      <div className="px-1 pt-1 pb-2">
        <MetricsRow timesheets={timesheets} />
      </div>

      {view === "calendar" ? (
        <div
          className="app-surface overflow-hidden"
          style={{ height: CONTENT_HEIGHT }}
        >
          <TimesheetCalendar
            canViewAll={can(TS_MODULE, "delete")}
            onSwitchToList={() => setView("table")}
          />
        </div>
      ) : (
        <Table
          tableId="hr-timesheet"
          customHeight={CONTENT_HEIGHT}
          columns={columns}
          data={timesheets}
          rowKey={(row) => row.name}
          loading={isInitialLoad}
          isFetching={isFetching}
          showToolbar
          toolbarPlaceholder="Search timesheet, employee..."
          searchValue={searchTerm}
          onSearch={(q) => setSearchTerm(q)}
          multiSelectFilters={[
            {
              key: "status",
              label: "Status",
              options: STATUS_OPTIONS,
              values: statusFilter,
              onChange: setStatusFilter,
            },
          ]}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
            setPage(1);
          }}
          enableAdd={can(TS_MODULE, "create")}
         primaryAction={
  <ViewSelector
    value={view}
    options={TIMESHEET_VIEW_OPTIONS}
    onChange={setView}
  />
}
          addLabel="+ Add Timesheet"
          onAdd={handleAdd}
          enableColumnSelector
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[20, 50, 100, 200]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onPageChange={setPage}
          onRowDoubleClick={(t) => handleView(t.name)}
        />
      )}
      <TimesheetDetailDrawer
        open={drawerOpen}
        data={drawerData}
        loading={drawerLoading}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerData(null);
        }}
        onApprove={async (id) => {
          await handleSubmit(id);
          setDrawerOpen(false);
        }}
        onSubmit={async (id) => {
          await handleSubmit(id);
          setDrawerOpen(false);
        }}
      />
    </HrTableFrame>
  );
};

export default HrTimesheetView;