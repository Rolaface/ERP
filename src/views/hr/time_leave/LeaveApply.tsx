import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";

// Adjust these imports to match your actual file structure
import {
  getAllLeaveApplications,
  updateLeaveApplication,
} from "../../../api/leaveApplicationApi";
import { openLeaveApplyModal } from "../../../store/modalStore";
import { showApiError, showSuccess, showConfirm } from "../../../utils/alert";
import { PortalDropdown } from "../../../components/ui/Table/ExpandableTreeTable";

// ─── Dropdown Menu Component (Inspired by Memorized Code) ──────────────
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
    <div className="flex justify-start">
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
export default function LeaveApply() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllLeaveApplied();
  }, []);

  const getAllLeaveApplied = async () => {
    try {
      setIsLoading(true);
      const response = await getAllLeaveApplications();
      setData(response || []);
    } catch (err) {
      console.error("Failed to Fetch Transactions", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Status update handler for Approve, Reject, and Cancel
  const handleStatusUpdate = async (
    id: string,
    status: string,
    doc_type?: string,
  ) => {
    // Add confirmation for destructive/final actions
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
      if (doc_type) payload.doc_type = doc_type;

      // Note: Ensure `updateLeaveApplication` exists in your leaveApplicationApi
      await updateLeaveApplication(id, payload);

      showSuccess(
        `Leave application has been ${status.toLowerCase()} successfully.`,
      );
      getAllLeaveApplied();
    } catch (err: any) {
      showApiError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to update status.`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-sm text-gray-500">
            Manage and track your leave applications
          </p>
        </div>

        <button
          onClick={() => openLeaveApplyModal()}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Apply for Leave
        </button>
      </div>

      {/* Data Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-[350px] text-gray-400">
            Loading leave applications...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-gray-400">
            No leave applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm font-semibold text-gray-600 bg-gray-50/50">
                  <th className="p-4 rounded-tl-lg">Leave Type</th>
                  <th className="p-4">From Date</th>
                  <th className="p-4">To Date</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {data.map((leave, index) => {
                  const leaveId = leave.name || leave.id;

                  // Check if action is completed to lock down the edit feature
                  const isActionDone = [
                    "Approved",
                    "Rejected",
                    "Cancelled",
                  ].includes(leave.status);

                  return (
                    <tr
                      key={leaveId || index}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 font-medium">
                        {leave.leave_type || "-"}
                      </td>
                      <td className="p-4">{leave.from_date || "-"}</td>
                      <td className="p-4">
                        {leave.half_day === 1
                          ? "Half Day"
                          : leave.to_date || "-"}
                      </td>
                      <td
                        className="p-4 max-w-xs truncate"
                        title={leave.description}
                      >
                        {leave.description || "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-medium 
                          ${
                            leave.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : leave.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : leave.status === "Cancelled"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {leave.status || "Open"}
                        </span>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const actions: MenuAction[] = [];

                          // Show Edit, Approve, Reject ONLY if not already locked in a closed status
                          if (!isActionDone) {
                            actions.push({
                              label: "Edit",
                              icon: <Edit2 size={14} />,
                              onClick: () => openLeaveApplyModal(leave, true),
                            });
                            actions.push({
                              label: "Approve",
                              icon: (
                                <CheckCircle
                                  size={14}
                                  className="text-green-600"
                                />
                              ),
                              onClick: () =>
                                handleStatusUpdate(leaveId, "Approved", "1"),
                              dividerBefore: true,
                            });
                            actions.push({
                              label: "Reject",
                              icon: <XCircle size={14} />,
                              onClick: () =>
                                handleStatusUpdate(leaveId, "Rejected", "1"),
                              danger: true,
                            });
                          }

                          // Show Cancel for any document that isn't ALREADY cancelled
                          if (leave.status !== "Cancelled") {
                            actions.push({
                              label: "Cancel Leave",
                              icon: <Ban size={14} />,
                              onClick: () =>
                                handleStatusUpdate(leaveId, "Cancelled"),
                              danger: true,
                              dividerBefore: actions.length > 0,
                            });
                          }

                          return <RowActionMenu actions={actions} />;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
