import React, { useMemo, useState } from "react";
import { Edit2 } from "lucide-react";
import type { PayrollEntry, Employee } from "../../../types/payrolltypes";

const Label: React.FC<{
  children: React.ReactNode;
  required?: boolean;
}> = ({ children, required }) => (
  <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
    {children}
    {required && <span className="text-danger ml-0.5">*</span>}
  </label>
);
const inputCls =
  "w-full h-10 px-3 bg-card border border-theme rounded-xl text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition";

interface EmployeesTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  employees: Employee[];
  onEditEmployee?: (emp: Employee) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  data,
  onChange,
  employees,
  onEditEmployee,
}) => {
  const active = employees.filter((e) => e.isActive);
  const toggleEmp = (id: string) => {
    const next = data.selectedEmployees.includes(id)
      ? data.selectedEmployees.filter((i) => i !== id)
      : [...data.selectedEmployees, id];
    onChange("selectedEmployees", next);
  };
  const selectAll = () => {
    const all = active.map((e) => e.id);
    onChange(
      "selectedEmployees",
      data.selectedEmployees.length === all.length ? [] : all,
    );
  };
  const [showExcelView, setShowExcelView] = useState(false);

  const filteredEmployees = useMemo(() => {
    return active.filter((emp) => {
      const branchMatch =
        !data.branch ||
        emp.branch?.toLowerCase().includes(data.branch.toLowerCase());

      const deptMatch =
        !data.department ||
        emp.department?.toLowerCase().includes(data.department.toLowerCase());

      const designationMatch =
        !data.designation ||
        emp.designation?.toLowerCase().includes(data.designation.toLowerCase());

      const gradeMatch =
        !data.grade ||
        emp.grade?.toLowerCase().includes(data.grade.toLowerCase());

      return branchMatch && deptMatch && designationMatch && gradeMatch;
    });
  }, [active, data]);

  return (
    <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
      {/* Filter row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { field: "branch", label: "Branch", ph: "All branches" },
          { field: "department", label: "Department", ph: "All departments" },
          {
            field: "designation",
            label: "Designation",
            ph: "All designations",
          },
          { field: "grade", label: "Grade", ph: "All grades" },
        ].map(({ field, label, ph }) => (
          <div key={field}>
            <Label>{label}</Label>
            <input
              type="text"
              value={(data as any)[field] ?? ""}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={ph}
              className={inputCls}
            />
          </div>
        ))}
      </div>

      {/* Select-all bar */}
      <div className="flex items-center justify-between py-2.5 px-4 bg-app border border-theme rounded-xl gap-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-main">
          <input
            type="checkbox"
            checked={
              data.selectedEmployees.length === active.length &&
              active.length > 0
            }
            onChange={selectAll}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          Select All Employees
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {data.selectedEmployees.length}/{active.length} selected
          </span>

          <button
            type="button"
            onClick={() => setShowExcelView(true)}
            className="h-9 px-4 rounded-lg border border-theme bg-card hover:bg-primary/5 hover:border-primary/40 text-xs font-bold text-main transition"
          >
            View Excel
          </button>
        </div>
      </div>

      {/* Employee list */}
      <div className="border border-theme rounded-xl overflow-hidden">
        {active.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">
            No active employees found
          </div>
        ) : (
          active.map((emp, i) => {
            const isSel = data.selectedEmployees.includes(emp.id);
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
                onClick={() => toggleEmp(emp.id)}
                className={`flex items-center gap-4 p-4 border-b border-theme last:border-0 cursor-pointer transition-colors ${
                  isSel
                    ? "bg-primary/5"
                    : i % 2 === 1
                      ? "bg-app hover:bg-primary/3"
                      : "bg-card hover:bg-app"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => {}}
                  className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                />

                <div
                  className={`w-9 h-9 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 transition-colors ${
                    isSel ? "bg-primary text-white" : "bg-app text-muted"
                  }`}
                >
                  {initials}
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-main leading-tight">
                      {emp.name}
                    </p>
                    {/* This is the value sent as employees[].employee in the payload */}
                    <p className="text-[10px] text-muted font-mono">{emp.id}</p>
                  </div>
                  <p className="text-xs text-muted">{emp.department}</p>
                  <p className="text-xs text-muted">{emp.designation}</p>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-main tabular-nums">
                      ₹{gross.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-muted">Gross</p>
                  </div>
                </div>

                {onEditEmployee && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEmployee(emp);
                    }}
                    className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
      {showExcelView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[95vw] max-w-6xl h-[80vh] bg-card rounded-2xl border border-theme shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
              <div>
                <h2 className="text-lg font-extrabold text-main">
                  Employee Excel View
                </h2>
                <p className="text-xs text-muted">
                  Showing {filteredEmployees.length} employees
                </p>
              </div>

              <button
                onClick={() => setShowExcelView(false)}
                className="h-9 px-4 rounded-lg border border-theme text-sm font-semibold hover:bg-app"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b border-theme">
                  <tr>
                    <th className="text-left px-4 py-3">ID</th>
                    <th className="text-left px-4 py-3">Employee</th>
                    <th className="text-left px-4 py-3">Department</th>
                    <th className="text-left px-4 py-3">Designation</th>
                    <th className="text-right px-4 py-3">Gross</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((emp) => {
                    const gross = emp.basicSalary + emp.hra + emp.allowances;

                    return (
                      <tr
                        key={emp.id}
                        className="border-b border-theme hover:bg-app"
                      >
                        <td className="px-4 py-3">{emp.id}</td>
                        <td className="px-4 py-3">{emp.name}</td>
                        <td className="px-4 py-3">{emp.department}</td>
                        <td className="px-4 py-3">{emp.designation}</td>
                        <td className="px-4 py-3 text-right">
                          ₹{gross.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

("w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition");
