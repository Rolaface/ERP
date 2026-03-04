import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { createLeaveAllocation } from "../../../../api/leaveApi";
import { getAllEmployees } from "../../../../api/employeeapi";
import HrDateInput from "../../HrDateInput";

interface Props {
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Privilege Leave",
  "Maternity Leave",
  "Compensatory Off",
];

const LeaveAllocationForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "",
    fromDate: "",
    toDate: "",
    totalLeavesAllocated: 0,
    addUnusedLeaves: false,
    notes: "",
  });

  /*
     Fetch Employees
     */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getAllEmployees(1, 200);
        setEmployees(res.employees || []);
      } catch {
        toast.error("Failed to load employees");
      }
    };

    fetchEmployees();
  }, []);

  /*
     Helpers
     */
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!formData.employeeId) {
      toast.error("Employee is required");
      return false;
    }
    if (!formData.leaveType) {
      toast.error("Leave type is required");
      return false;
    }
    if (!formData.fromDate || !formData.toDate) {
      toast.error("From and To dates are required");
      return false;
    }

    return true;
  };

  /*
     Submit
     */
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await createLeaveAllocation({
        employeeId: formData.employeeId,
        leaveType: formData.leaveType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        totalLeavesAllocated: Number(formData.totalLeavesAllocated),
        addUnusedLeaves: formData.addUnusedLeaves,
        notes: formData.notes,
      });

      toast.success("Leave allocation created successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Failed to create leave allocation";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-theme rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-theme">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-muted hover:text-main transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-main">
              New Leave Allocation
            </h2>
            <span className="text-xs font-medium text-orange-600">
              Not Saved
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-primary rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Leave Type + Employee */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-main mb-2 block">
              Leave Type *
            </label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border bg-app"
            >
              <option value="">Select Leave Type</option>
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-main mb-2 block">
              Employee *
            </label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border bg-app"
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-main mb-2 block">
              From Date *
            </label>
            <HrDateInput
              name="fromDate"
              value={formData.fromDate}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  fromDate: v,
                }))
              }
              placeholder="DD/MM/YYYY"
              inputClassName="px-4 py-3 rounded-xl border bg-app"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-main mb-2 block">
              To Date *
            </label>
            <HrDateInput
              name="toDate"
              value={formData.toDate}
              onChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  toDate: v,
                }))
              }
              placeholder="DD/MM/YYYY"
              inputClassName="px-4 py-3 rounded-xl border bg-app"
            />
          </div>
        </div>

        {/* Allocation */}
        <div className="pt-4 border-t border-theme space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="addUnusedLeaves"
              checked={formData.addUnusedLeaves}
              onChange={handleChange}
              className="accent-primary"
            />
            Add unused leaves from previous allocations
          </label>
        </div>

        {/* Notes */}
        <div className="pt-4 border-t border-theme">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-lg font-bold text-main">Notes</h3>
            <ChevronDown
              size={20}
              className={`transition ${showNotes ? "rotate-180" : ""}`}
            />
          </button>

          {showNotes && (
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-4 w-full px-4 py-3 rounded-xl border bg-app"
              placeholder="Optional notes..."
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-theme">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-theme rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-primary rounded-xl font-semibold disabled:opacity-50"
          >
            Save Allocation
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveAllocationForm;
