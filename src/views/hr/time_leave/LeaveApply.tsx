import React, { useState, useEffect } from "react";
import {
  Edit2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";

import {
  getAllLeaveApplications,
  updateLeaveApplication,
  deleteLeaveApplication
} from "../../../api/leaveApplicationApi";
import { openLeaveApplyModal } from "../../../store/modalStore";
import { showApiError, showSuccess, showConfirm } from "../../../utils/alert";
import { PortalDropdown } from "../../../components/ui/Table/ExpandableTreeTable";
import Table        from "../../../components/ui/Table/Table";
import StatusBadge  from "../../../components/ui/Table/StatusBadge";
import type { Column } from "../../../components/ui/Table/type";
import DateRangeFilter from "../../../components/ui/modal/DateRangeFilter";
import ActionButton, { ActionGroup, ActionMenu } from "../../../components/ui/Table/ActionButton";
import { parseFrappeError } from "../tabs/leave-config/hooks/parseFrappeError";
import { useAuth } from "../../../context/AuthContext";
interface MenuAction {
  label:        string;
  icon:         React.ReactNode;
  onClick:      () => void;
  danger?:      boolean;
  dividerBefore?: boolean;
}

const RowActionMenu: React.FC<{ actions: MenuAction[] }> = ({ actions }) => {
  if (actions.length === 0) return <span className="text-gray-400 pl-2">-</span>;

  return (
    <div className="flex justify-center">
      <PortalDropdown
        align="right"
        trigger={
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-md transition text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <MoreHorizontal size={15} />
          </button>
        }
      >
        {actions.map((action, i) => (
          <React.Fragment key={i}>
            {action.dividerBefore && (
              <div className="border-t border-gray-200 my-1" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={`
                w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition
                ${action.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span className={action.danger ? "text-red-600" : "text-gray-500"}>
                {action.icon}
              </span>
              {action.label}
            </button>
          </React.Fragment>
        ))}
      </PortalDropdown>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeaveApplyTableProps {
  onAfterApply?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LeaveApplyTable: React.FC<LeaveApplyTableProps> = ({ onAfterApply }) => {
  const { user } = useAuth();
  const [data,       setData]       = useState<any[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  // const [filters, setFilters] = useState({ from_date: "", to_date: "" });
  const [filters, setFilters] = useState({ from_date: "", to_date: "", status: "Open" });
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaves();
  // }, [showHistory, filters.from_date, filters.to_date]);
  }, [showHistory, filters.from_date, filters.to_date, filters.status, page, pageSize]);

  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
       const apiFilters: any[] = [
      ["employee", "=", user?.employeeId], 
    ];
    //    if (showHistory) {
    //   apiFilters.push([
    //     "status",
    //     "in",
    //     ["Approved", "Rejected", "Open", "Cancelled"],
    //   ]);
    // } else {
    //   apiFilters.push(["status", "=", "Open"]);
    // }
    if (filters.status) {
        apiFilters.push(["status", "=", filters.status]);
      } 
      // else if (showHistory) {
      //   apiFilters.push([
      //     "status",
      //     "in",
      //     ["Approved", "Rejected", "Open", "Cancelled"],
      //   ]);
      // } else {
      //   apiFilters.push(["status", "=", "Open"]);
      // }

      if (filters.from_date) {
        apiFilters.push(["from_date", ">=", filters.from_date]);
      }
      if (filters.to_date) {
        apiFilters.push(["from_date", "<=", filters.to_date]);
      }
      // const response = await getAllLeaveApplications(apiFilters);
      const limit_start = (page - 1) * pageSize;
      const limit_page_length = pageSize;

      const response = await getAllLeaveApplications(apiFilters, limit_start, limit_page_length);
      setData(response || []);
    } catch (err) {
      console.error("Failed to fetch leave applications", err);
    } finally {
      setIsLoading(false);
    }
  };

const handleStatusUpdate = async (
    id:       string,
    status:   string,
    doc_type?: string,
  ) => {
    if (status === "Delete" || status === "Cancelled") {
      const actionName = status === "Delete" ? "delete" : "cancel";
      const isConfirmed = await showConfirm(
        `Are you sure you want to ${actionName} this leave application?`,
        {
          title: `${status} Leave`,
          confirmButtonText: `Yes, ${status}`,
          confirmButtonColor: "#ef4444",
        },
      );
      if (!isConfirmed) return;
    }

    try {
      if (status === "Delete") {
        setActionLoadingId(id);
        await deleteLeaveApplication(id);
        showSuccess("Leave application has been deleted successfully.");
        
        await fetchLeaves();
        onAfterApply?.();
        
        setActionLoadingId(null);
        return; 
      }

      setActionLoadingId(id);
      const payload: any = { status };
      if (doc_type) payload.doc_type = doc_type;
      
      // If cancelling an approved leave, set docstatus to 2 (Cancelled in Frappe)
      if (status === "Cancelled") payload.docstatus = 2;

      await updateLeaveApplication(id, payload);
      showSuccess(`Leave application has been ${status.toLowerCase()} successfully.`);

      await fetchLeaves();
      onAfterApply?.();
      setActionLoadingId(null);
    } catch (err: any) {
      showApiError(
        parseFrappeError(err) || "Failed to update status."
      );
      setIsLoading(false);
      setActionLoadingId(null);
    }
  };

  const handleAdd = () => {
    openLeaveApplyModal(null, false, {
      onSuccess: async () => {
        await fetchLeaves();
        onAfterApply?.();  // ← notify parent
      },
    });
  };
const calculateLeaveDays = (fromDateStr: string, toDateStr: string, isHalfDay: number) => {
  if (isHalfDay === 1) return "Half Day";
  if (!fromDateStr || !toDateStr) return "-";

  // Parse API strings into Date objects
  const date1 = new Date(fromDateStr);
  const date2 = new Date(toDateStr);

  // Set time to midnight to avoid Daylight Saving Time (DST) shift bugs
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  const differenceInMs = date2.getTime() - date1.getTime();
  const millisecondsInDay = 1000 * 60 * 60 * 24;

  // Use Math.round() instead of floor() to be safe against minor hour shifts
  // Add + 1 because leave is inclusive (e.g., May 1 to May 1 = 1 day)
  const days = Math.round(differenceInMs / millisecondsInDay) + 1;

  return days > 0 ? days : 0; 
};
  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<any>[] = [
    {
      key:    "leave_type",
      header: "Leave Type",
      align:  "left",
      render: (e) => <span className="font-medium">{e.leave_type || "—"}</span>,
    },
    { key: "from_date", header: "From Date", align: "left" },
    {
      key:    "to_date",
      header: "To Date",
      align:  "left",
      render: (e) => (e.half_day === 1 ? "Half Day" : e.to_date || "—"),
    },
    {
    key: "no_of_days",
    header: "No of Days",
    align: "left",
    render: (e) => calculateLeaveDays(e.from_date, e.to_date, e.half_day),
  },
    {
      key:    "description",
      header: "Reason",
      align:  "left",
      render: (e) => (
        <div className="max-w-xs truncate" title={e.description}>
          {e.description || "—"}
        </div>
      ),
    },
    {
      key:    "status",
      header: "Status",
      align:  "left",
      render: (e) => {
        let displayStatus = e.status || "Open";
        
        if (displayStatus === "Open") {
          displayStatus = "Pending Approval";
        } 

        return <StatusBadge status={displayStatus} />;
      },
    },
   {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => {
        const leaveId = row.name || row.id;
        const isActionDone = ["Approved", "Rejected", "Cancelled"].includes(row.status);
        const isApproved = row.status === "Approved";

        // Dynamically build the menu actions
        const customMenuActions = [];

        if (!isActionDone) {
          customMenuActions.push({
            label: "Delete",
            danger: true,
            onClick: () => handleStatusUpdate(leaveId, "Delete"),
            disabled: actionLoadingId === leaveId,
          });
        }
        if (isApproved) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const fromDate = new Date(row.from_date);
          fromDate.setHours(0, 0, 0, 0);

          if (today < fromDate) {
            customMenuActions.push({
              label: "Cancel Leave",
              danger: true,
              onClick: () => handleStatusUpdate(leaveId, "Cancelled"),
              disabled: actionLoadingId === leaveId,
            });
          }
        }

        return (
          <ActionGroup>
            {/* View is typically always available */}
            <ActionButton
              type="view"
              iconOnly
              onClick={() =>
                openLeaveApplyModal(
                  { ...row, _isView: true } as any,
                  true,
                  { onSuccess: fetchLeaves }
                )
              }
            />

            {!isActionDone && (
              <ActionButton
                type="edit"
                iconOnly
                onClick={() =>
                  openLeaveApplyModal(row, true, { onSuccess: fetchLeaves })
                }
                disabled={actionLoadingId === leaveId}
              />
            )}

            {/* Render action menu if there are options available */}
            {customMenuActions.length > 0 && (
              <ActionMenu customActions={customMenuActions} />
            )}
          </ActionGroup>
        );
      },
    }
  ];


  return (
    <Table
     extraFilters={
              <>
              <DateRangeFilter
                  from={filters.from_date}
                  to={filters.to_date}
                  onChange={(range) => {
                    setFilters((prev) => ({ ...prev, ...range }));
                    setPage(1);
                  }}
                />
                <select
            value={filters.status}
            // disabled={!showHistory} 
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value }));
              setPage(1);
            }}
            className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1 px-2 border outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Open">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
                {/* <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHistory}
                    onChange={(e) => setShowHistory(e.target.checked)}
                    className="cursor-pointer"
                  />
                  Show Leave History
                </label> */}
              </>
            }
      loading={isLoading}
      defaultVisibleCount={8}
      columns={columns}
      data={data}
      showToolbar
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      enableAdd
      addLabel="Apply for Leave"
      onAdd={handleAdd}
      enableColumnSelector
      currentPage={page}
      pageSize={pageSize}
      totalItems={(page - 1) * pageSize + data.length}
      totalPages={data.length === pageSize ? page + 1 : page}
      pageSizeOptions={[10, 25, 50]}
      onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      onPageChange={setPage}
    />
  );
};

export default LeaveApplyTable;