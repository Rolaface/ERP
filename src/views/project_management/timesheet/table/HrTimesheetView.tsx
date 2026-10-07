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
  deleteTimesheetById,
  renameTimesheetTitle,
  searchEmployees,
  sendTimesheetForApproval,
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
import { useHRView } from "../../../../hooks/permission/useHRView";
import TimesheetDetailDrawer from "../drawer/TimesheetDetailDrawer";
import {
  openAdminTimesheetFormModal,
  openEmployeeTimesheetFormModal,
} from "../../../../components/feature/project management/timesheet/timesheetForm.modal";
import TimesheetCalendar from "../components/TimesheetCalendar";
import type { TimesheetMode } from "../components/Viewtoggle";
import { openSendEmailModal } from "../../../../store/modalStore";
import type { MultiSelectOption } from "../../../../components/ui/modal/MultiSelectFilter";
import ViewSelector, {
  type ViewOption,
} from "../../../project_management/ViewSelector";

const TS_MODULE = "Timesheet";
const TITLE_MAX_LENGTH = 140;
const DRAFT_STATUS = "Draft";

const CONTENT_HEIGHT = "calc(85.5vh - 100px)";
const VIEW_OPTIONS: ViewOption<TimesheetMode>[] = [
  { value: "calendar", label: "Calendar" },
  { value: "table", label: "Table" },
];

const fetchUserOptions = (q: string): Promise<MultiSelectOption[]> =>
  searchEmployees(q);

const STATUS_OPTIONS = [
  { label: "Draft", value: "Draft" },
  { label: "Pending Approval", value: "Pending For Approval" },
  { label: "Approved", value: "Submitted" },
  { label: "Billed", value: "Billed" },
  { label: "Cancelled", value: "Cancelled" },
];

const STATUS_VARIANT: Record<
  TimesheetStatus,
  "draft" | "info" | "success" | "danger"
> = {
  Draft: "draft",
  "Pending For Approval": "info",
  Submitted: "success",
  Billed: "success",
  Cancelled: "danger",
};

interface EditableTitleProps {
  value: string;
  editable: boolean;
  onCommit: (next: string) => Promise<boolean>;
}

const EditableTitle: React.FC<EditableTitleProps> = ({
  value,
  editable,
  onCommit,
}) => {
  const [editing, setEditing] = useState(false);
  const safeValue = value ?? "";
  const hasTitle = safeValue.trim().length > 0;
  const [draft, setDraft] = useState(safeValue);
  const busyRef = useRef(false);

  if (!editable) {
    return hasTitle ? (
      <span className="font-bold text-main text-xs whitespace-normal break-words">
        {safeValue}
      </span>
    ) : (
      <span className="text-xs text-muted italic">—</span>
    );
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const startEdit = () => {
    setDraft(safeValue);
    setEditing(true);
  };

  const commit = async () => {
    if (busyRef.current) return;
    const next = draft.trim();
    if (!next || next === safeValue) {
      setEditing(false);
      return;
    }
    busyRef.current = true;
    try {
      await onCommit(next);
    } finally {
      busyRef.current = false;
      setEditing(false);
    }
  };

  const cancel = () => {
    busyRef.current = true;
    setEditing(false);
    setTimeout(() => {
      busyRef.current = false;
    }, 0);
  };

  return (
    <div onClick={stop} onDoubleClick={stop}>
      {editing ? (
        <input
          autoFocus
          value={draft}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="Enter title"
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") cancel();
          }}
          className="w-full bg-transparent text-xs font-bold text-main outline-none border-b border-primary"
        />
      ) : hasTitle ? (
        <span
          title="Click to rename"
          onClick={startEdit}
          className="font-bold text-main text-xs cursor-text whitespace-normal break-words hover:underline decoration-dotted underline-offset-2"
        >
          {safeValue}
        </span>
      ) : (
        <span
          title="Click to add a title"
          onClick={startEdit}
          className="text-xs italic text-muted cursor-text hover:underline decoration-dotted underline-offset-2"
        >
          + Add title
        </span>
      )}
    </div>
  );
};

const HrTimesheetView: React.FC = () => {
  const { can } = usePermission();
  const { viewMode } = useHRView();
  const isProfessional = viewMode === "professional";
  const statusOptions = isProfessional
    ? STATUS_OPTIONS.filter((o) => o.value !== DRAFT_STATUS)
    : STATUS_OPTIONS;

  const canCreate = can(TS_MODULE, "create");
  const canWrite = can(TS_MODULE, "write");
  const canSubmit = can(TS_MODULE, "submit");
  const canCancel = can(TS_MODULE, "cancel");
  const canDelete = can(TS_MODULE, "delete");

  const showFinancials = isProfessional;
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
  const [employeeFilter, setEmployeeFilter] = useState<string[]>([]);
  const [userFilterOptions, setUserFilterOptions] = useState<
    MultiSelectOption[]
  >([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<TimesheetDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [view, setView] = useState<TimesheetMode>("calendar");

  useEffect(() => {
    if (!isProfessional) {
      setEmployeeFilter((prev) => (prev.length ? [] : prev));
      return;
    }
    setStatusFilter((prev) =>
      prev.includes(DRAFT_STATUS)
        ? prev.filter((s) => s !== DRAFT_STATUS)
        : prev,
    );
    fetchUserOptions("")
      .then((list) => {
        if (mountedRef.current) setUserFilterOptions(list);
      })
      .catch(showApiError);
  }, [isProfessional]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, employeeFilter]);

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
        employeeFilter.length ? employeeFilter : undefined,
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
  }, [
    page,
    pageSize,
    searchTerm,
    statusFilter,
    employeeFilter,
    ,
    sortBy,
    sortOrder,
  ]);

  const fetchTimesheetsRef = useRef(fetchTimesheets);
  useEffect(() => {
    fetchTimesheetsRef.current = fetchTimesheets;
  }, [fetchTimesheets]);

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
  }, [
    page,
    pageSize,
    searchTerm,
    statusFilter,
    employeeFilter,
    isProfessional,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.TIMESHEET_LIST, () =>
      fetchTimesheetsRef.current(),
    );
    return unsubscribe;
  }, [subscribeToRefresh]);

  const openTimesheetForm = isProfessional
    ? openAdminTimesheetFormModal
    : openEmployeeTimesheetFormModal;

  const refreshList = () => triggerRefresh(REFRESH_KEYS.TIMESHEET_LIST);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerData(null);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    openTimesheetForm({ onSuccess: refreshList });
  };

  const handleEdit = (id: string) => {
    if (!canWrite) return;
    openTimesheetForm({ timesheetId: id, onSuccess: refreshList });
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

  const handleComposeEmail = async (t: TimesheetEntry) => {
    let contactEmail: string | null = null;
    let invoiceAttachments: { name: string; file_name: string }[] = [];
    try {
      const detail = await getTimesheetById(t.name);
      contactEmail = (detail as any)?.contact_email ?? null;
      invoiceAttachments = (detail as any)?.attachments ?? [];
    } catch {}

    openSendEmailModal({
      docType: "Timesheet",
      invoiceNumber: t.name,
      contactEmail,
      invoiceAttachments,
    });
  };

  const handleSendForApproval = async (id: string): Promise<boolean> => {
    if (!canWrite) return false;
    const result = await fireManagedSwal({
      icon: "question",
      title: "Submit for Approval?",
      text: `Timesheet ${id} will be sent for approval and can no longer be edited.`,
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return false;

    try {
      showLoading("Submitting for approval...");
      await sendTimesheetForApproval(id);
      closeSwal();
      showSuccess("Timesheet sent for approval");
      refreshList();
      return true;
    } catch (error) {
      closeSwal();
      showApiError(error);
      return false;
    }
  };

  const handleRename = async (
    t: TimesheetEntry,
    next: string,
  ): Promise<boolean> => {
    if (!canWrite) return false;

    const hadTitle = !!t.title?.trim();

    const result = await fireManagedSwal({
      icon: "question",
      title: hadTitle ? "Rename Timesheet?" : "Add Title?",
      text: hadTitle
        ? `"${t.title}" → "${next}"`
        : `Set the title of this timesheet to "${next}"?`,
      showCancelButton: true,
      confirmButtonText: hadTitle ? "Yes, Rename" : "Yes, Add",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return false;

    try {
      showLoading(hadTitle ? "Renaming timesheet..." : "Adding title...");
      await renameTimesheetTitle(t.name, next);
      closeSwal();
      showSuccess(hadTitle ? "Timesheet renamed" : "Title added");
      refreshList();
      return true;
    } catch (error) {
      closeSwal();
      showApiError(error);
      return false;
    }
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    if (!canDelete) return false;
    const result = await fireManagedSwal({
      title: "Delete Timesheet?",
      text: `Are you sure you want to permanently delete timesheet ${id}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return false;

    try {
      showLoading("Deleting timesheet...");
      await deleteTimesheetById(id);
      closeSwal();
      showSuccess("Timesheet deleted");
      refreshList();
      return true;
    } catch (error) {
      closeSwal();
      showApiError(error);
      return false;
    }
  };

  const handleSubmit = async (id: string): Promise<boolean> => {
    if (!canSubmit) return false;
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

    if (!result.isConfirmed) return false;

    try {
      showLoading("Approving timesheet...");
      await submitTimesheet(id);
      closeSwal();
      showSuccess("Timesheet approved");
      refreshList();
      return true;
    } catch (error) {
      closeSwal();
      showApiError(error);
      return false;
    }
  };

  const handleCancel = async (id: string): Promise<boolean> => {
    if (!canCancel) return false;
    const result = await fireManagedSwal({
      title: "Cancel Timesheet?",
      text: "This timesheet will be marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Cancel",
    });
    if (!result.isConfirmed) return false;
    try {
      showLoading("Cancelling...");
      await cancelTimesheet(id);
      closeSwal();
      showSuccess("Timesheet cancelled");
      refreshList();
      return true;
    } catch (error) {
      closeSwal();
      showApiError(error);
      return false;
    }
  };

  const handleDrawerApprove = async (id: string) => {
    setApproving(true);
    try {
      const ok = await handleSubmit(id);
      if (ok) closeDrawer();
    } finally {
      setApproving(false);
    }
  };

  const handleDrawerSendForApproval = async (id: string) => {
    setApproving(true);
    try {
      const ok = await handleSendForApproval(id);
      if (ok) closeDrawer();
    } finally {
      setApproving(false);
    }
  };

  const handleDrawerCancel = async (id: string) => {
    const ok = await handleCancel(id);
    if (ok) closeDrawer();
  };

  const handleDrawerEdit = (id: string) => {
    closeDrawer();
    handleEdit(id);
  };

  const columns: Column<TimesheetEntry>[] = [
    {
      key: "title",
      header: "Title",
      align: "left",
      width: "360px",
      sortable: true,
      render: (t) => (
        <EditableTitle
          value={t.title ?? ""}
          editable={canWrite && t.status !== "Cancelled"}
          onCommit={(next) => handleRename(t, next)}
        />
      ),
    },
    {
      key: "custom_timesheet_start_date",
      header: "Timesheet Period",
      align: "left",
      width: "280px",
      sortable: true,
      render: (t) => {
        const start = t.custom_timesheet_start_date;
        const end = t.custom_timesheet_end_date;
        if (!start) return <span className="text-xs text-muted">—</span>;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <DateDisplay date={start} className="text-xs text-muted" />
            {end && end !== start && (
              <>
                <span className="text-xs text-muted">→</span>
                <DateDisplay date={end} className="text-xs text-muted" />
              </>
            )}
          </div>
        );
      },
    },
    {
      key: "total_hours",
      header: "Total Hours",
      align: "right",
      width: "120px",
      sortable: true,
      render: (t) => (
        <span className="font-mono font-bold text-main whitespace-nowrap">
          {(t.total_hours || 0).toFixed(1)} hrs
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "130px",
      sortable: true,
      render: (t) => (
        <StatusBadge status={t.status} variant={STATUS_VARIANT[t.status]} />
      ),
    },
    ...(showFinancials
      ? [
          {
            key: "per_billed",
            header: "Billing %",
            align: "left" as const,
            width: "140px",
            render: (t: TimesheetEntry) => (
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
        ]
      : []),
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "120px",
      render: (t) => {
        const customActions = [];

        if (t.status === "Draft" && canWrite) {
          customActions.push({
            label: "Submit for Approval",
            icon: ACTION_ICONS.APPROVE,
            onClick: () => handleSendForApproval(t.name),
          });
        }
        if (t.status === "Pending For Approval" && canSubmit) {
          customActions.push({
            label: "Approve",
            icon: ACTION_ICONS.APPROVE,
            onClick: () => handleSubmit(t.name),
          });
        }
        if ((t.status === "Draft" || t.status === "Cancelled") && canDelete) {
          customActions.push({
            label: "Delete",
            icon: ACTION_ICONS.DELETE,
            danger: true,
            onClick: () => handleDelete(t.name),
          });
        }
        if (t.status === "Submitted" && canCancel) {
          customActions.push({
            label: "Cancel",
            icon: ACTION_ICONS.CANCEL,
            danger: true,
            onClick: () => handleCancel(t.name),
          });
        }
        if (t.status === "Submitted" || t.status === "Billed") {
          customActions.push({
            label: "Compose Email",
            icon: ACTION_ICONS.EMAIL,
            onClick: () => handleComposeEmail(t),
          });
        }

        const canEdit =
          (t.status === "Draft" || t.status === "Pending For Approval") &&
          canWrite;
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
  const viewSelector = (
    <ViewSelector value={view} options={VIEW_OPTIONS} onChange={setView} />
  );

  return (
    <HrTableFrame>
      <div className="px-1 pt-1 pb-2">
        <MetricsRow
          timesheets={timesheets}
          showFinancials={showFinancials}
          hideDraft={isProfessional}
        />
      </div>

      {view === "calendar" ? (
        <div
          className="app-surface overflow-hidden"
          style={{ height: CONTENT_HEIGHT }}
        >
          <TimesheetCalendar
            canViewAll={isProfessional}
            canEdit={canWrite}
            canCreate={canCreate}
            onSwitchToList={() => setView("table")}
            employeeFilter={employeeFilter}
            onEmployeeFilterChange={setEmployeeFilter}
            fetchEmployees={fetchUserOptions}
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
          enableAdd={canCreate}
          isFetching={isFetching}
          showToolbar
          toolbarPlaceholder="Search timesheet, employee..."
          searchValue={searchTerm}
          onSearch={(q) => setSearchTerm(q)}
          multiSelectFilters={[
            {
              key: "status",
              label: "Status",
              options: statusOptions,
              values: statusFilter,
              onChange: setStatusFilter,
            },
            ...(isProfessional
              ? [
                  {
                    key: "employee",
                    label: "Employee",
                    options: userFilterOptions,
                    values: employeeFilter,
                    onChange: setEmployeeFilter,
                    searchPlaceholder: "Search employee...",
                    onSearch: fetchUserOptions,
                  },
                ]
              : []),
          ]}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
            setPage(1);
          }}
          addLabel=" Add Timesheet"
          primaryAction={viewSelector}
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
        actionLoading={approving}
        canWrite={canWrite}
        canSubmit={canSubmit}
        canCancel={canCancel}
        showFinancials={showFinancials}
        showEmployeeCard={isProfessional}
        onClose={closeDrawer}
        onSendForApproval={handleDrawerSendForApproval}
        onApprove={handleDrawerApprove}
        onEdit={handleDrawerEdit}
        onCancel={handleDrawerCancel}
      />
    </HrTableFrame>
  );
};

export default HrTimesheetView;
