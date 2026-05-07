import React, { useState, useEffect } from "react";
import { Plus, Edit2 } from "lucide-react";
import { getAllLeaveApplications } from "../../../api/leaveApplicationApi";
import { openLeaveApplyModal } from "../../../store/modalStore";

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
                {data.map((leave, index) => (
                  <tr
                    key={leave.name || leave.id || index}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 font-medium">
                      {leave.leave_type || "-"}
                    </td>
                    <td className="p-4">{leave.from_date || "-"}</td>
                    <td className="p-4">
                      {leave.half_day === 1 ? "Half Day" : leave.to_date || "-"}
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
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {leave.status || "Open"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openLeaveApplyModal(leave, true)}
                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="Edit Leave"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
