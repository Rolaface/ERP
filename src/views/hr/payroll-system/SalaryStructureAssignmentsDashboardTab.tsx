import { useEffect, useMemo, useState } from "react";
import { Pencil, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import SalaryStructureAssignmentTab from "./SalaryStructureAssignmentTab";
import {
  getSalaryStructureAssignments,
  type SalaryStructureAssignmentListItem,
} from "../../../api/salaryStructureAssignmentApi";

const Btn: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "primary" | "outline";
}> = ({ onClick, disabled, children, icon, variant = "outline" }) => {
  const cls =
    variant === "primary"
      ? "bg-primary text-white border border-[var(--primary)]"
      : "bg-card text-main border border-theme hover:bg-app";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      {icon}
      {children}
    </button>
  );
};

export default function SalaryStructureAssignmentsDashboardTab() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SalaryStructureAssignmentListItem[]>([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<SalaryStructureAssignmentListItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSalaryStructureAssignments();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setItems([]);
      toast.error(e?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    return (Array.isArray(items) ? items : []).slice().sort((a, b) => {
      return String(b.from_date ?? "").localeCompare(String(a.from_date ?? ""));
    });
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="bg-card border border-theme rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold text-main uppercase tracking-wider">
              Salary Structure Assignments
            </div>
            <div className="text-[11px] text-muted mt-1">
              Search, view and create assignments
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Btn
              variant="primary"
              onClick={() => {
                setEditingAssignment(null);
                setAssignOpen(true);
              }}
            >
              Assign Salary Structure
            </Btn>
            <Btn
              onClick={load}
              disabled={loading}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Btn>
          </div>
        </div>

        <div className="p-6">
          <div className="border border-theme rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-app border-b border-theme flex items-center justify-between">
              <div className="text-xs font-extrabold text-main uppercase tracking-wide">
                Assignments
              </div>
              <div className="text-xs text-muted">
                {loading ? "Loading..." : `Showing ${rows.length}`}
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-card border-b border-theme">
                  <tr>
                    {[
                      "Employee ID",
                      "Full Name",
                      "Structure",
                      "Date",
                      "Department",
                      "Currency",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider text-left whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted"
                      >
                        Loading assignments...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-muted"
                      >
                        No assignments found
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr
                        key={r.name}
                        className={`border-b border-theme last:border-0 ${idx % 2 === 1 ? "bg-app" : "bg-card"}`}
                      >
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                          {r.employee}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted break-words">
                          {r.full_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted break-words">
                          {r.salary_structure}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                          {r.from_date}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                          {r.department || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                          {r.currency || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAssignment(r);
                              setAssignOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-card text-main hover:bg-app transition font-bold"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-theme rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-app border-b border-theme flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-main">
                  {editingAssignment
                    ? "Edit Salary Structure Assignment"
                    : "Assign Salary Structure"}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {editingAssignment
                    ? "Update the selected assignment"
                    : "Create a new salary structure assignment"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAssignOpen(false);
                  setEditingAssignment(null);
                }}
                className="p-2 rounded-lg hover:bg-card text-muted hover:text-main transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <SalaryStructureAssignmentTab
                editableEmployee
                editingAssignment={editingAssignment}
                onAssigned={() => {
                  setAssignOpen(false);
                  setEditingAssignment(null);
                  load();
                }}
              />
            </div>

            <div className="px-6 py-4 border-t border-theme bg-app flex justify-end">
              <Btn
                onClick={() => {
                  setAssignOpen(false);
                  setEditingAssignment(null);
                }}
              >
                Close
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
