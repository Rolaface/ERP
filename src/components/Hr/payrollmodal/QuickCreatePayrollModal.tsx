// QuickCreatePayrollModal.tsx
import React from "react";
import { X, CheckCircle } from "lucide-react";
import type { Employee } from "../../../types/payrolltypes";

interface QuickCreateModalProps {
  show: boolean;
  onClose: () => void;
  employees: Employee[];
  selectedEmployees: string[];
  onToggleEmployee: (id: string) => void;
  onSelectAll: () => void;
  onCreate: () => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  show,
  onClose,
  employees,
  selectedEmployees,
  onToggleEmployee,
  onSelectAll,
  onCreate,
}) => {
  if (!show) return null;

  const active = employees.filter((e) => e.isActive);
  const allSelected = selectedEmployees.length === active.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-theme overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary px-6 py-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold">Quick Create Payroll</h2>
              <p className="text-xs text-white/70 mt-0.5">
                Select employees to include in this run
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/15 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Select-all bar */}
        <div className="shrink-0 px-5 py-3 border-b border-theme bg-app flex items-center justify-between">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 text-sm font-semibold text-main"
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {}}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            {allSelected ? "Deselect All" : "Select All"}
            <span className="text-xs text-muted font-normal">
              ({active.length} employees)
            </span>
          </button>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {selectedEmployees.length} selected
          </span>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto">
          {active.map((emp) => {
            const isSel = selectedEmployees.includes(emp.id);
            const gross = emp.basicSalary + emp.hra + emp.allowances;
            const initials = emp.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={emp.id}
                onClick={() => onToggleEmployee(emp.id)}
                className={`flex items-center gap-3 px-5 py-3.5 border-b border-theme cursor-pointer transition-colors ${
                  isSel ? "bg-primary/5" : "hover:bg-app"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => {}}
                  className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                />
                <div
                  className={`w-8 h-8 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 transition-colors ${
                    isSel ? "bg-primary text-white" : "bg-app text-muted"
                  }`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-main leading-tight truncate">
                    {emp.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {emp.id} · {emp.designation}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-main tabular-nums">
                    ₹{gross.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted">Gross/month</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-theme px-5 py-4 bg-app flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-theme text-main rounded-xl text-sm font-semibold hover:bg-card transition"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={selectedEmployees.length === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition ${
              selectedEmployees.length === 0
                ? "bg-app text-muted cursor-not-allowed"
                : "bg-primary text-white hover:opacity-90 shadow-sm shadow-primary/30"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Create ({selectedEmployees.length})
          </button>
        </div>
      </div>
    </div>
  );
};
