import React, { useState, useEffect } from "react";
import { Edit2, Loader2 } from "lucide-react";
import type { PayrollEntry, Employee } from "../../../types/payrolltypes";
import { getPayrollEmployees } from "../../../api/utils/frappeUtilsApi";

// ── Primitives ────────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
    {children}
    {required && <span className="text-danger ml-0.5">*</span>}
  </label>
);

const inputCls =
  "w-full h-10 px-3 bg-card border border-theme rounded-xl text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition";


// ── API response → Employee shape mapper ──────────────────────────────────────
const mapApiToEmployee = (e: any): Employee => ({
  // Core — API deta hai
  id:          e.value ?? "",
  name:        e.label ?? "Unknown",

  // Required strings — API nahi deta toh ""
  email:       e.email       ?? "",
  department:  e.department  ?? "",
  designation: e.designation ?? "",
  grade:       e.grade       ?? "",
  joiningDate: e.joiningDate ?? "",
  bankAccount: e.bankAccount ?? "",
  ifscCode:    e.ifscCode    ?? "",
  pfNumber:    e.pfNumber    ?? "",
  panNumber:   e.panNumber   ?? "",
  taxStatus:   e.taxStatus   ?? "",

  // Optional strings
  esiNumber:   e.esiNumber   ?? "",
  managerId:   e.managerId   ?? "",
  branch:      e.branch      ?? "",

  // Salary numbers
  basicSalary: e.basicSalary ?? 0,
  hra:         e.hra         ?? 0,
  allowances:  e.allowances  ?? 0,

  // Boolean
  isActive: true,
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface EmployeesTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  onEditEmployee?: (emp: Employee) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  data,
  onChange,
  onEditEmployee,
}) => {
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExcelView, setShowExcelView] = useState(false);

  // ── Fetch employees from API ───────────────────────────────────────────────
  useEffect(() => {
    // start_date & end_date are required — don't call without them
    if (!data.startDate || !data.endDate) {
      setFilteredEmployees([]);
      return;
    }

    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const results = await getPayrollEmployees({
          // Required
          start_date: data.startDate,
          end_date:   data.endDate,
          // From OverviewTab
          payroll_frequency:       data.payrollFrequency      || undefined,
          payroll_payable_account: data.payrollPayableAccount || undefined,
          currency:                data.currency              || undefined,
          // From EmployeesTab filters
          branch:      data.branch      || undefined,
          department:  data.department  || undefined,
          designation: data.designation || undefined,
          grade:       data.grade       || undefined,
          page:      1,
          page_size: 50,
        });

        // ✅ Map API shape { value, label, ... } → Employee shape
        const mapped: Employee[] = (results ?? []).map(mapApiToEmployee);

        setFilteredEmployees(mapped);
        // Auto-select all fetched employees
        onChange("selectedEmployees", mapped.map((e) => e.id));
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        setFilteredEmployees([]);
        onChange("selectedEmployees", []);
      } finally {
        setLoading(false);
      }
    };

    // 400ms debounce — prevents API call on every keystroke
    const timer = setTimeout(fetchEmployees, 400);
    return () => clearTimeout(timer);
  }, [
    data.startDate,
    data.endDate,
    data.payrollFrequency,
    data.payrollPayableAccount,
    data.currency,
    data.branch,
    data.department,
    data.designation,
    data.grade,
  ]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleEmp = (id: string) => {
    const next = data.selectedEmployees.includes(id)
      ? data.selectedEmployees.filter((i) => i !== id)
      : [...data.selectedEmployees, id];
    onChange("selectedEmployees", next);
  };

  const selectAll = () => {
    const all = filteredEmployees.map((e) => e.id);
    onChange(
      "selectedEmployees",
      data.selectedEmployees.length === all.length ? [] : all
    );
  };

  const isAllSelected =
    filteredEmployees.length > 0 &&
    data.selectedEmployees.length === filteredEmployees.length;

  const getInitials = (name: string) =>
    (name ?? "")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-[fadeIn_0.2s_ease]">

      {/* ── Filter row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { field: "branch",      label: "Branch",      ph: "All branches"     },
          { field: "department",  label: "Department",  ph: "All departments"  },
          { field: "designation", label: "Designation", ph: "All designations" },
          { field: "grade",       label: "Grade",       ph: "All grades"       },
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

      {/* ── Select-all bar ── */}
      <div className="flex items-center justify-between py-2.5 px-4 bg-app border border-theme rounded-xl gap-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-main select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={selectAll}
            disabled={loading || filteredEmployees.length === 0}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          Select All Employees
        </label>

        <div className="flex items-center gap-3">
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted shrink-0" />
          )}
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {data.selectedEmployees.length}/{filteredEmployees.length} selected
          </span>
          <button
            type="button"
            onClick={() => setShowExcelView(true)}
            disabled={filteredEmployees.length === 0 || loading}
            className="h-9 px-4 rounded-lg border border-theme bg-card hover:bg-primary/5 hover:border-primary/40 text-xs font-bold text-main transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            View Excel
          </button>
        </div>
      </div>

      {/* ── Employee list ── */}
      <div className="border border-theme rounded-xl overflow-hidden">
        {loading ? (
          /* Skeleton loader */
          <div className="divide-y divide-theme">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 animate-pulse"
              >
                <div className="w-4 h-4 bg-app rounded shrink-0" />
                <div className="w-9 h-9 bg-app rounded-full shrink-0" />
                <div className="flex-1 grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-2 space-y-1.5">
                    <div className="h-3 bg-app rounded w-3/4" />
                    <div className="h-2.5 bg-app rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-app rounded w-2/3" />
                  <div className="h-3 bg-app rounded w-2/3" />
                  <div className="h-3 bg-app rounded w-1/2 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          /* Empty state */
          <div className="py-14 flex flex-col items-center gap-2 text-center px-4">
            {!data.startDate || !data.endDate ? (
              <>
                <p className="text-sm font-semibold text-main">
                  No employees loaded
                </p>
                <p className="text-xs text-muted max-w-xs">
                  Go to the{" "}
                  <span className="text-primary font-bold">Overview</span> tab
                  and set a{" "}
                  <span className="text-primary font-bold">Start Date</span> &{" "}
                  <span className="text-primary font-bold">End Date</span> to
                  load employees
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-main">
                  No employees found
                </p>
                <p className="text-xs text-muted">
                  Try clearing the filters above
                </p>
              </>
            )}
          </div>
        ) : (
          /* Employee rows */
          filteredEmployees.map((emp, i) => {
            const isSel = data.selectedEmployees.includes(emp.id);
            const gross = emp.basicSalary + emp.hra + emp.allowances;
            const initials = getInitials(emp.name);

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
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => {}}
                  className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                />

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 transition-colors ${
                    isSel ? "bg-primary text-white" : "bg-app text-muted"
                  }`}
                >
                  {initials}
                </div>

                {/* Info grid */}
                <div className="flex-1 min-w-0 grid grid-cols-5 gap-2 items-center">
                  {/* Name + ID */}
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm font-bold text-main leading-tight truncate">
                      {emp.name}
                    </p>
                    <p className="text-[10px] text-muted font-mono">
                      {emp.id}
                    </p>
                  </div>

                  {/* Department */}
                  <p className="text-xs text-muted truncate">
                    {emp.department || "—"}
                  </p>

                  {/* Designation */}
                  <p className="text-xs text-muted truncate">
                    {emp.designation || "—"}
                  </p>

                  {/* Gross salary */}
                  <div className="text-right">
                    {gross > 0 ? (
                      <>
                        <p className="text-sm font-extrabold text-main tabular-nums">
                          ₹{gross.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-muted">Gross</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted">—</p>
                    )}
                  </div>
                </div>

                {/* Edit button */}
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

      {/* ── Excel View Modal ── */}
      {showExcelView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[95vw] max-w-6xl h-[80vh] bg-card rounded-2xl border border-theme shadow-xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
              <div>
                <h2 className="text-lg font-extrabold text-main">
                  Employee Excel View
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Showing{" "}
                  <span className="text-primary font-bold">
                    {filteredEmployees.length}
                  </span>{" "}
                  employees
                </p>
              </div>
              <button
                onClick={() => setShowExcelView(false)}
                className="h-9 px-4 rounded-lg border border-theme text-sm font-semibold hover:bg-app transition"
              >
                Close
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b border-theme z-10">
                  <tr>
                    {["ID", "Employee", "Department", "Designation", "Gross"].map(
                      (h, idx) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-extrabold text-muted uppercase tracking-wider ${
                            idx === 4 ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp, i) => {
                    const gross = emp.basicSalary + emp.hra + emp.allowances;
                    return (
                      <tr
                        key={emp.id}
                        className={`border-b border-theme hover:bg-primary/3 transition-colors ${
                          i % 2 === 1 ? "bg-app" : "bg-card"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          {emp.id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-main">
                          {emp.name}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {emp.department || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {emp.designation || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold tabular-nums text-main">
                          {gross > 0
                            ? `₹${gross.toLocaleString("en-IN")}`
                            : "—"}
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