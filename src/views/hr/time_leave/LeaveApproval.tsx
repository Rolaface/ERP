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
  // const [filters, setFilters] = useState({ from_date: "", to_date: "" });
  const [filters, setFilters] = useState({ from_date: "", to_date: "", status: "Open" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // useEffect(() => {
  //   getAllLeaveApplied();
  // // }, [showHistory, filters.from_date, filters.to_date]); 
  // }, [showHistory, filters.from_date, filters.to_date, filters.status]);
  useEffect(() => {
    getAllLeaveApplied();
  }, [showHistory, filters.from_date, filters.to_date, filters.status, page, pageSize, searchTerm]);

  const getAllLeaveApplied = async () => {
    try {
      setIsLoading(true);
      //    const apiFilters: any[] = [
      //   ["leave_approver", "=", user?.email], 
      // ];
      const apiFilters: any[] = [];
      const isAdmin = user?.roles?.includes("Administrator");
      if (!isAdmin) {
        apiFilters.push(["leave_approver", "=", user?.email]);
      }
      if (filters.status) {
        apiFilters.push(["status", "=", filters.status]);
      }
      // else if (showHistory) {
      //     apiFilters.push([
      //       "status",
      //       "in",
      //       ["Approved", "Rejected", "Open", "Cancelled"],
      //     ]);
      //   } else {
      //     apiFilters.push(["status", "=", "Open"]);
      //   }

      if (filters.from_date) {
        apiFilters.push(["from_date", ">=", filters.from_date]);
      }
      if (filters.to_date) {
        apiFilters.push(["from_date", "<=", filters.to_date]);
      }

      // const response = await getAllLeaveApplications(apiFilters);
      const limit_start = (page - 1) * pageSize;
      const limit_page_length = pageSize;

      // Pass the pagination params to your API call
      const response = await getAllLeaveApplications(apiFilters, limit_start, limit_page_length, searchTerm);
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

  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = [
      "JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC",
    ];

    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }

    // Date object — use local methods
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
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
    { key: "from_date", header: "From Date", align: "left",
      render: (e) => (formatDate(e.from_date) || "-"),
     },
    {
      key: "to_date",
      header: "To Date",
      align: "left",
      render: (e) => (e.half_day === 1 ? "Half Day" : formatDate(e.to_date) || "-"),
    },
    {
      key: "total_leave_days",
      header: "No of Days",
      align: "left",
      // render: (e) => calculateLeaveDays(e.from_date, e.to_date, e.half_day),
      render: (e) => <span className="font-medium">{e.total_leave_days || "—"}</span>,
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
        const isActionDone = ["Approved", "Rejected", "Cancelled"].includes(row.status);
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
        defaultVisibleCount={8}
        loading={isLoading}
        columns={columns}
        data={data}
        showToolbar
        searchValue={searchTerm}
        onSearch={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        enableColumnSelector
        currentPage={page}
        pageSize={pageSize}
        // totalItems={data.length}
        totalItems={(page - 1) * pageSize + data.length}
        // totalPages={Math.ceil(data.length / pageSize) || 1}
        totalPages={data.length === pageSize ? page + 1 : page}
        pageSizeOptions={[20, 50, 100,200]}

        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        onRowDoubleClick={(row) =>
          openLeaveApplyModal({ ...row, _isView: true } as any, true, { onSuccess: getAllLeaveApplied })
        }
      />
    </div>
  );
}