import React, { useState, useEffect } from "react";
import { MoreHorizontal, CheckCircle, XCircle } from "lucide-react";

import {
  getAllLeaveApplications,
  updateLeaveApplication,
} from "../../../api/leaveApplicationApi";
import { showApiError, showSuccess, showConfirm } from "../../../utils/alert";
import { PortalDropdown } from "../../../components/ui/Table/ExpandableTreeTable";
import Table from "../../../components/ui/Table/Table";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import type { Column } from "../../../components/ui/Table/type";
import DateRangeFilter from "../../../components/ui/modal/DateRangeFilter";
import { usePermission } from "../../../hooks/permission/usePermission";
import { useAuth } from "../../../context/AuthContext";
import { parseFrappeError } from "../tabs/leave-config/hooks/parseFrappeError";
import ActionButton, { ActionGroup, ActionMenu } from "../../../components/ui/Table/ActionButton";
import { openLeaveApplyModal } from "../../../store/modalStore";

interface MenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
}

const RowActionMenu: React.FC<{ actions: MenuAction[] }> = ({ actions }) => {
  if (actions.length === 0)
    return <span className="text-gray-400 pl-2">-</span>;

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
                ${
                  action.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span
                className={action.danger ? "text-red-600" : "text-gray-500"}
              >
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

// ─── Main Component ────────────────────────────────────────────────────────
export default function LeaveApproval() {
  const { can } = usePermission();
  const { user } = useAuth();
  console.log("Current User:", user);

  // Permission flag — Approve / Reject require write on Leave Application
  const canApproveReject = can("Leave Application", "write");

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [filters, setFilters] = useState({ from_date: "", to_date: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    getAllLeaveApplied();
  }, [showHistory, filters.from_date, filters.to_date]); 

  const getAllLeaveApplied = async () => {
    try {
      setIsLoading(true);
       const apiFilters: any[] = [
      ["leave_approver", "=", user?.email], 
    ];
      if (showHistory) {
      apiFilters.push([
        "status",
        "in",
        ["Approved", "Rejected", "Open", "Cancelled"],
      ]);
    } else {
      apiFilters.push(["status", "=", "Open"]);
    }

      if (filters.from_date) {
        apiFilters.push(["from_date", ">=", filters.from_date]);
      }
      if (filters.to_date) {
        apiFilters.push(["from_date", "<=", filters.to_date]);
      }

      const response = await getAllLeaveApplications(apiFilters);
      console.log("API Response:", response);
      setData(response || []);
    } catch (err) {
      showApiError(parseFrappeError(err) || "Failed to fetch leave applications.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: string,
    docstatus?: string,
  ) => {
    if (status === "Cancelled" || status === "Rejected") {
      const isConfirmed = await showConfirm(
        `Are you sure you want to ${status.toLowerCase()} this leave application?`,
        {
          title: `${status === "Cancelled" ? "Cancel" : "Reject"} Leave`,
          confirmButtonText: `Yes, ${status === "Cancelled" ? "Cancel" : "Reject"}`,
          confirmButtonColor: "#ef4444",
        },
      );
      if (!isConfirmed) return;
    }

    try {
      setIsLoading(true);
      const payload: any = { status };
      if (docstatus) payload.docstatus = docstatus;

      await updateLeaveApplication(id, payload);

      showSuccess(
        `Leave application has been ${status.toLowerCase()} successfully.`,
      );
      getAllLeaveApplied();
    } catch (err: any) {
      showApiError(
        parseFrappeError(err) ||
          err?.message ||
          `Failed to update status.`,
      );
      setIsLoading(false);
    }
  };

  const columns: Column<any>[] = [
     {
      key: "employee_name",
      header: "Employee Name",
      align: "left",
      render: (e) => <span className=" font-base">{e.employee_name || "-"}</span>,
    },
    {
      key: "leave_type",
      header: "Leave Type",
      align: "left",
      render: (e) => <span className="font-base">{e.leave_type || "-"}</span>,
    },
    { key: "from_date", header: "From Date", align: "left" },
    {
      key: "to_date",
      header: "To Date",
      align: "left",
      render: (e) => (e.half_day === 1 ? "Half Day" : e.to_date || "-"),
    },
    {
      key: "description",
      header: "Reason",
      align: "left",
      render: (e) => (
        <div className=" font-base" title={e.description}>
          {e.description || "-"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (e) => {
        let displayStatus = e.status ?? "Open";
        
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
      // render: (e) => {
      //   const leaveId = e.name || e.id;
      //   const isActionDone = ["Approved", "Rejected"].includes(e.status);
      render: (row) => {
       const leaveId = row.name || row.id;
       const isActionDone = ["Approved", "Rejected"].includes(row.status);
        // const actions: MenuAction[] = [];

        // if (canApproveReject && !isActionDone) {
        //   actions.push({
        const customMenuActions: MenuAction[] = [];

if (canApproveReject && !isActionDone) {
  customMenuActions.push({
            label: "Approve",
            icon: <CheckCircle size={14} className="text-green-600" />,
            onClick: () => handleStatusUpdate(leaveId, "Approved", "1"),
            dividerBefore: true,
          });
          // actions.push({
          customMenuActions.push({
  label: "Reject",
            // label: "Reject",
            icon: <XCircle size={14} />,
            onClick: () => handleStatusUpdate(leaveId, "Rejected", "1"),
            danger: true,
          });
        }

        // return <RowActionMenu actions={actions} />;
        return(
        <ActionGroup>
                    {/* View is typically always available */}
                    <ActionButton
                      type="view"
                      iconOnly
                      onClick={() =>
                        openLeaveApplyModal(
                          { ...row, _isView: true } as any,
                          true,
                          { onSuccess: getAllLeaveApplied }
                        )
                      }
                    />
                    {customMenuActions.length > 0 && (
                      <ActionMenu customActions={customMenuActions} />
                    )}
                  </ActionGroup>
        );
      },
    },
  ];

  return (
    <div className="space-y-2">
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
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showHistory}
                onChange={(e) => setShowHistory(e.target.checked)}
                className="cursor-pointer"
              />
              Show Leave History
            </label>
          </>
        }
        defaultVisibleCount={7}
        loading={isLoading}
        columns={columns}
        data={data}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableColumnSelector
        currentPage={page}
        pageSize={pageSize}
        totalItems={data.length}
        totalPages={Math.ceil(data.length / pageSize) || 1}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
      />
    </div>
  );
}