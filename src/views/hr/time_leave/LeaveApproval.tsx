import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaClipboardList } from "react-icons/fa";
import { getPendingLeaveRequests } from "../../../api/leaveApi";
import { updateLeaveStatus } from "../../../api/leaveApi";
import type { LeaveUI } from "../../../types/leave/uiLeave";
import { mapLeaveFromApi } from "../../../types/leave/leaveMapper";
import {
  closeSwal,
  showApiError,
  showLoading,
  showSuccess,
} from "../../../utils/alert";

/*  Component  */
const LeaveManagment: React.FC = () => {
  const [requests, setRequests] = useState<LeaveUI[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        const res = await getPendingLeaveRequests(1, 50);
        setRequests((res.data?.leaves || []).map(mapLeaveFromApi));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  const approveLeave = async (id: string) => {
    try {
      setActionLoadingId(id);

      showLoading("Approving Leave...");

      await updateLeaveStatus({
        leaveId: id,
        status: "Approved",
      });

      closeSwal();

      setRequests((prev) => prev.filter((r) => r.id !== id));

      showSuccess("Leave approved successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectLeave = async (id: string) => {
    try {
      setActionLoadingId(id);

      showLoading("Rejecting Leave...");

      await updateLeaveStatus({
        leaveId: id,
        status: "Rejected",
        rejectionReason,
      });

      closeSwal();

      setRequests((prev) => prev.filter((r) => r.id !== id));

      showSuccess("Leave rejected successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-app">
      <div className="max-w-7xl mx-auto bg-card border border-theme rounded-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full p-6">
            <h3 className="text-lg font-bold text-main flex items-center gap-2 mb-4">
              <FaClipboardList />
              Leave Requests
            </h3>

            <div className="space-y-4 max-h-[520px] overflow-auto">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-card border border-theme rounded-xl p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-main">
                        {req.employeeName}
                      </div>

                      <div className="text-sm text-muted">
                        {req.leaveType} • {req.startDate} → {req.endDate} (
                        {req.totalDays} days)
                      </div>
                    </div>

                    <span className="text-xs px-2 py-1 rounded-lg capitalize bg-app border border-theme">
                      {req.status}
                    </span>
                  </div>

                  <p className="italic text-sm mt-2">“{req.reason}”</p>

                  {req.status === "Pending" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        disabled={actionLoadingId === req.id}
                        onClick={() => approveLeave(req.id)}
                        className="px-4 py-2 bg-primary rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        <FaCheckCircle />
                        Approve
                      </button>

                      <button
                        disabled={actionLoadingId === req.id}
                        onClick={() => {
                          setRejectingLeaveId(req.id);
                          setRejectionReason("");
                          setShowRejectDialog(true);
                        }}
                        className="px-4 py-2 border border-theme rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        <FaTimesCircle />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-[420px] border border-theme">
            <h3 className="text-lg font-bold text-main mb-2">Reject Leave</h3>

            <p className="text-sm text-muted mb-3">
              Please provide a reason for rejecting this leave.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason"
              className="w-full p-3 text-sm rounded-lg bg-app border border-theme resize-none"
              rows={3}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-sm border border-theme rounded-lg"
              >
                Cancel
              </button>

              <button
                disabled={!rejectionReason.trim() || !rejectingLeaveId}
                onClick={async () => {
                  await rejectLeave(rejectingLeaveId!);
                  setShowRejectDialog(false);
                  setRejectingLeaveId(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg disabled:opacity-50"
              >
                Reject Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagment;
