import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Edit2,
  Loader2,
  Users,
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import type { PayrollEntry, Employee } from "../../../types/payrolltypes";
import { getPayrollEmployees } from "../../../api/utils/frappeUtilsApi";
import { getEmployeeById } from "../../../api/employeeapi";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import {
  getallbranches,
  getAllDepartments,
  getAllDesignations,
  getAllGrades,
} from "../../../api/utils/frappeUtilsApi";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type EnrichState = "idle" | "loading" | "done" | "error";
type SortKey =
  | "name"
  | "department"
  | "designation"
  | "employmentType"
  | "ctc"
  | "joiningDate";
type SortDir = "asc" | "desc";

interface RichEmployee extends Employee {
  ctc: number;
  salaryStructure: string;
  salaryMode: string;
  employmentType: string;
  holidayList: string;
  payrollCostCenter: string;
  status: string;
}

interface EmployeesTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  onEditEmployee?: (emp: RichEmployee) => void;
  /**
   * When true the tab is seeded from data.selectedEmployees (the IDs that came
   * back from the edit API) instead of calling getPayrollEmployees.
   * This prevents overwriting the record's actual employee list with every
   * employee that falls inside the date range.
   */
  isEditMode?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch-key: stringified params used to detect real filter changes vs re-mounts
// ─────────────────────────────────────────────────────────────────────────────
const buildFetchKey = (d: PayrollEntry) =>
  [
    d.startDate,
    d.endDate,
    d.payrollFrequency  || "",
    d.payrollPayableAccount || "",
    d.currency          || "",
    d.branch            || "",
    d.department        || "",
    d.designation       || "",
    d.grade             || "",
  ].join("|");

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal stub from a raw getPayrollEmployees result item. */
const toStub = (e: any): RichEmployee => ({
  id: e.value ?? "",
  name: e.label ?? "Unknown",
  email: "",
  department: "",
  designation: "",
  grade: "",
  joiningDate: "",
  bankAccount: "",
  ifscCode: "",
  pfNumber: "",
  panNumber: "",
  taxStatus: "",
  esiNumber: "",
  managerId: "",
  branch: "",
  basicSalary: 0,
  hra: 0,
  allowances: 0,
  isActive: true,
  ctc: 0,
  salaryStructure: "",
  salaryMode: "",
  employmentType: "",
  holidayList: "",
  payrollCostCenter: "",
  status: "Active",
});

/** Build a minimal stub directly from an employee ID (edit mode seed). */
const toStubFromId = (id: string): RichEmployee => ({
  id,
  name: id,           // will be overwritten by enrichment
  email: "",
  department: "",
  designation: "",
  grade: "",
  joiningDate: "",
  bankAccount: "",
  ifscCode: "",
  pfNumber: "",
  panNumber: "",
  taxStatus: "",
  esiNumber: "",
  managerId: "",
  branch: "",
  basicSalary: 0,
  hra: 0,
  allowances: 0,
  isActive: true,
  ctc: 0,
  salaryStructure: "",
  salaryMode: "",
  employmentType: "",
  holidayList: "",
  payrollCostCenter: "",
  status: "Active",
});

const mergeDetail = (stub: RichEmployee, d: any): RichEmployee => ({
  ...stub,
  name:             d.employee_name     ?? stub.name,
  email:            d.company_email     ?? d.prefered_email ?? stub.email,
  department:       d.department        ?? stub.department,
  designation:      d.designation       ?? stub.designation,
  grade:            d.grade             ?? stub.grade,
  branch:           d.branch            ?? stub.branch,
  joiningDate:      d.date_of_joining   ?? stub.joiningDate,
  ctc:              d.ctc               ?? stub.ctc,
  salaryStructure:  d.salary_structure  ?? stub.salaryStructure,
  salaryMode:       d.salary_mode       ?? stub.salaryMode,
  employmentType:   d.employment_type   ?? stub.employmentType,
  holidayList:      d.holiday_list      ?? stub.holidayList,
  payrollCostCenter:d.payroll_cost_center ?? stub.payrollCostCenter,
  status:           d.status            ?? stub.status,
  isActive:         d.status === "Active",
  basicSalary:      d.basic_salary      ?? stub.basicSalary,
  hra:              d.hra               ?? stub.hra,
  allowances:       d.allowances        ?? stub.allowances,
});

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";

const fmtCurrency = (v: number) =>
  v > 0 ? `₹${v.toLocaleString("en-IN")}` : "—";

const fmtDate = (d: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
};

// ─────────────────────────────────────────────────────────────────────────────
// Excel export
// ─────────────────────────────────────────────────────────────────────────────
const exportXLSX = (employees: RichEmployee[], selectedIds: string[]) => {
  const rows = employees.filter((e) => selectedIds.includes(e.id));
  if (!rows.length) return;

  const wsData = [
    ["Employee ID","Name","Department","Designation","Grade","Employment Type",
     "Salary Structure","CTC (₹)","Salary Mode","Date of Joining","Holiday List",
     "Cost Center","Status","Email","Branch"],
    ...rows.map((e) => [
      e.id, e.name, e.department, e.designation, e.grade, e.employmentType,
      e.salaryStructure, e.ctc ?? 0, e.salaryMode, e.joiningDate,
      e.holidayList, e.payrollCostCenter, e.status, e.email, e.branch,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    {wch:14},{wch:24},{wch:18},{wch:20},{wch:10},{wch:16},{wch:22},
    {wch:14},{wch:14},{wch:16},{wch:20},{wch:20},{wch:10},{wch:28},{wch:16},
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payroll Employees");
  XLSX.writeFile(wb, `payroll_employees_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Small UI primitives
// ─────────────────────────────────────────────────────────────────────────────
const Shimmer: React.FC<{ w?: string }> = ({ w = "w-24" }) => (
  <span className={`inline-block h-3 ${w} rounded bg-muted/15 animate-pulse`} />
);

type BadgeVariant = "default" | "warn" | "ok" | "info";
const Badge: React.FC<{ label: string; variant?: BadgeVariant }> = ({ label, variant = "default" }) => {
  const cls: Record<BadgeVariant, string> = {
    default: "bg-muted/10 text-muted",
    warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ok: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    info: "bg-primary/10 text-primary",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cls[variant]}`}>
      {label}
    </span>
  );
};

const Th: React.FC<{
  label: string; sortKey?: SortKey; current: SortKey | null;
  dir: SortDir; onSort: (k: SortKey) => void; right?: boolean;
}> = ({ label, sortKey, current, dir, onSort, right }) => {
  const active = sortKey && current === sortKey;
  return (
    <th
      onClick={() => sortKey && onSort(sortKey)}
      className={`px-3 py-2.5 text-[10px] font-extrabold text-muted uppercase tracking-wider whitespace-nowrap select-none
        ${right ? "text-right" : "text-left"}
        ${sortKey ? "cursor-pointer hover:text-main transition-colors" : ""}`}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "justify-end w-full" : ""}`}>
        {label}
        {sortKey && (
          <span className={active ? "opacity-100" : "opacity-25"}>
            {active && dir === "desc"
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronUp className="w-3 h-3" />}
          </span>
        )}
      </span>
    </th>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  data,
  onChange,
  onEditEmployee,
  isEditMode = false,
}) => {
  const [employees, setEmployees]   = useState<RichEmployee[]>([]);
  const [enrichMap, setEnrichMap]   = useState<Record<string, EnrichState>>({});
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey | null>(null);
  const [sortDir, setSortDir]       = useState<SortDir>("asc");
  const abortRef  = useRef<AbortController | null>(null);

  /**
   * Tracks the last params we actually fetched for.
   * If params are the same as the last fetch → skip (handles any remaining
   * re-render scenarios even though tab keep-alive in the parent is the
   * primary guard against unmount resets).
   */
  const lastFetchKeyRef = useRef<string>("");

  /**
   * Tracks whether we have already seeded from edit data.
   * Without this, every formData update (e.g. user unchecks an employee)
   * would re-trigger the edit-mode seed and restore the original list.
   */
  const editSeededRef = useRef(false);

  // ── Effect: load employees ────────────────────────────────────────────────
  useEffect(() => {
    // ── EDIT MODE: seed from the IDs that came back from the API ───────────
    // We do this exactly once. After that the user is in full control of
    // selections and we only enrich the details via getEmployeeById.
    if (isEditMode && !editSeededRef.current) {
      const ids = data.selectedEmployees;
      if (!ids.length) return;

      editSeededRef.current = true;

      const stubs = ids.map(toStubFromId);
      setEmployees(stubs);

      // Mark all as loading so shimmers appear while we enrich
      const initMap: Record<string, EnrichState> = {};
      ids.forEach((id) => { initMap[id] = "loading"; });
      setEnrichMap(initMap);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Enrich each employee with their full details
      Promise.allSettled(
        stubs.map(async (stub) => {
          if (ctrl.signal.aborted) return;
          try {
            const raw    = await getEmployeeById(stub.id);
            const detail = raw?.message?.data ?? raw?.data ?? raw;
            if (ctrl.signal.aborted) return;
            setEmployees((prev) =>
              prev.map((e) => e.id === stub.id ? mergeDetail(e, detail) : e)
            );
            setEnrichMap((prev) => ({ ...prev, [stub.id]: "done" }));
          } catch {
            if (!ctrl.signal.aborted)
              setEnrichMap((prev) => ({ ...prev, [stub.id]: "error" }));
          }
        })
      );

      return () => ctrl.abort();
    }

    // ── CREATE MODE: fetch eligible employees by date range ────────────────
    if (isEditMode) return; // already seeded, nothing more to do

    if (!data.startDate || !data.endDate) {
      setEmployees([]);
      setEnrichMap({});
      lastFetchKeyRef.current = "";
      return;
    }

    const currentKey = buildFetchKey(data);

    // Same params + employees already loaded → tab switched back, skip fetch
    if (currentKey === lastFetchKeyRef.current && employees.length > 0) return;

    lastFetchKeyRef.current = currentKey;

    const run = async () => {
      setListLoading(true);
      setEmployees([]);
      setEnrichMap({});
      abortRef.current?.abort();

      try {
        const results = await getPayrollEmployees({
          start_date:              data.startDate,
          end_date:                data.endDate,
          payroll_frequency:       data.payrollFrequency       || undefined,
          payroll_payable_account: data.payrollPayableAccount  || undefined,
          currency:                data.currency               || undefined,
          branch:                  data.branch                 || undefined,
          department:              data.department             || undefined,
          designation:             data.designation            || undefined,
          grade:                   data.grade                  || undefined,
          page: 1,
          page_size: 200,
        });

        const stubs = (results ?? []).map(toStub);
        setEmployees(stubs);
        // Auto-select all on a fresh create-mode fetch
        onChange("selectedEmployees", stubs.map((e) => e.id));

        const initMap: Record<string, EnrichState> = {};
        stubs.forEach((e) => { initMap[e.id] = "loading"; });
        setEnrichMap(initMap);

        const ctrl = new AbortController();
        abortRef.current = ctrl;

        await Promise.allSettled(
          stubs.map(async (stub) => {
            if (ctrl.signal.aborted) return;
            try {
              const raw    = await getEmployeeById(stub.id);
              const detail = raw?.message?.data ?? raw?.data ?? raw;
              if (ctrl.signal.aborted) return;
              setEmployees((prev) =>
                prev.map((e) => e.id === stub.id ? mergeDetail(e, detail) : e)
              );
              setEnrichMap((prev) => ({ ...prev, [stub.id]: "done" }));
            } catch {
              if (!ctrl.signal.aborted)
                setEnrichMap((prev) => ({ ...prev, [stub.id]: "error" }));
            }
          })
        );
      } catch (err) {
        console.error("Payroll employee fetch failed:", err);
        setEmployees([]);
      } finally {
        setListLoading(false);
      }
    };

    const t = setTimeout(run, 400);
    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [
    isEditMode,
    data.startDate,
    data.endDate,
    data.payrollFrequency,
    data.payrollPayableAccount,
    data.currency,
    data.branch,
    data.department,
    data.designation,
    data.grade,
    // NOTE: data.selectedEmployees intentionally omitted — changing selection
    // must NOT re-trigger this effect or we'd loop on every checkbox click.
  ]);

  // ── Client-side filter + sort ─────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      list.sort((a, b) => {
        const av = (a as any)[sortKey] ?? "";
        const bv = (b as any)[sortKey] ?? "";
        const cmp = typeof av === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [employees, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleEmp = (id: string) =>
    onChange(
      "selectedEmployees",
      data.selectedEmployees.includes(id)
        ? data.selectedEmployees.filter((i) => i !== id)
        : [...data.selectedEmployees, id]
    );

  const visibleIds  = displayed.map((e) => e.id);
  const allVisSel   = visibleIds.length > 0 && visibleIds.every((id) => data.selectedEmployees.includes(id));
  const someVisSel  = visibleIds.some((id) => data.selectedEmployees.includes(id)) && !allVisSel;

  const toggleVisible = () => {
    if (allVisSel) {
      onChange("selectedEmployees", data.selectedEmployees.filter((id) => !visibleIds.includes(id)));
    } else {
      onChange("selectedEmployees", Array.from(new Set([...data.selectedEmployees, ...visibleIds])));
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const enrichedCount = Object.values(enrichMap).filter((s) => s === "done").length;
  const isEnriching   = employees.length > 0 && enrichedCount < employees.length && !listLoading;
  const selectedCTC   = employees
    .filter((e) => data.selectedEmployees.includes(e.id))
    .reduce((s, e) => s + (e.ctc ?? 0), 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 animate-[fadeIn_0.2s_ease]">
      {/* Filters */}
      <div className="grid grid-cols-4 gap-3">
        {/* Branch */}
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Branch</label>
          <SearchSelect2
            label=""
            value={data.branchLabel || ""}
            placeholder="Search branch..."
            fetchOptions={async (q) => {
              const res = await getallbranches(q);
              return (res || []).map((b: any) => ({ label: b.label, value: b.value }));
            }}
            onChange={(value, option) => {
              onChange("branch", value);
              onChange("branchLabel", option.label);
            }}
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Department</label>
          <SearchSelect2
            label=""
            value={data.departmentLabel || ""}
            placeholder="Search departments..."
            fetchOptions={async (q) => {
              const res = await getAllDepartments(q);
              return (res || []).map((d: any) => ({ label: d.label, value: d.value }));
            }}
            onChange={(value, option) => {
              onChange("department", value || "");
              onChange("departmentLabel", value ? option.label : "");
            }}
          />
        </div>

        {/* Designation */}
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Designation</label>
          <SearchSelect2
            label=""
            value={data.designationLabel || ""}
            placeholder="Search designations..."
            fetchOptions={async (q) => {
              const res = await getAllDesignations(q);
              return (res || []).map((d: any) => ({ label: d.label, value: d.value }));
            }}
            onChange={(value, option) => {
              onChange("designation", value || "");
              onChange("designationLabel", value ? option.label : "");
            }}
          />
        </div>

        {/* Grade */}
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Grade</label>
          <SearchSelect2
            label=""
            value={data.gradeLabel || ""}
            placeholder="Search grade..."
            fetchOptions={async (q) => {
              const res = await getAllGrades(q);
              return (res || []).map((g: any) => ({ label: g.label, value: g.value }));
            }}
            onChange={(value, option) => {
              onChange("grade", value || "");
              onChange("gradeLabel", value ? option.label : "");
            }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, department…"
            className="w-full h-9 pl-8 pr-7 bg-card border border-theme rounded-xl text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {listLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />}
          {isEnriching && !listLoading && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              Enriching {enrichedCount}/{employees.length}
            </span>
          )}
          {selectedCTC > 0 && (
            <span className="text-[11px] font-bold bg-app border border-theme px-3 py-1 rounded-full text-muted">
              CTC: <span className="text-primary">{fmtCurrency(selectedCTC)}</span>
            </span>
          )}
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {data.selectedEmployees.length}/{employees.length} selected
          </span>
          <button
            type="button"
            onClick={() => exportXLSX(employees, data.selectedEmployees)}
            disabled={data.selectedEmployees.length === 0}
            className="h-9 px-3.5 rounded-xl border border-theme bg-card hover:bg-emerald-500/5 hover:border-emerald-500/40 text-xs font-bold text-main transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Open in Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-theme rounded-xl overflow-hidden">
        {listLoading ? (
          <SkeletonRows />
        ) : employees.length === 0 ? (
          <EmptyState hasDateRange={!!(data.startDate && data.endDate)} isEditMode={isEditMode} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-app border-b border-theme">
                <tr>
                  <th className="w-10 px-3 py-2.5">
                    <button onClick={toggleVisible} className="text-muted hover:text-primary transition">
                      {allVisSel
                        ? <CheckSquare className="w-4 h-4 text-primary" />
                        : someVisSel
                        ? <CheckSquare className="w-4 h-4 text-muted/40" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <Th label="Employee"        sortKey="name"           current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="Department"      sortKey="department"     current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="Designation"     sortKey="designation"    current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="Type"            sortKey="employmentType" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="Salary Structure"                         current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="Joining"         sortKey="joiningDate"    current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="CTC"             sortKey="ctc"            current={sortKey} dir={sortDir} onSort={handleSort} right />
                  <Th label="Status"                                   current={sortKey} dir={sortDir} onSort={handleSort} />
                  {onEditEmployee && <th className="w-10 px-3 py-2.5" />}
                </tr>
              </thead>

              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-muted">
                      No results for &quot;{search}&quot;
                    </td>
                  </tr>
                ) : (
                  displayed.map((emp, i) => (
                    <EmployeeRow
                      key={emp.id}
                      emp={emp}
                      index={i}
                      isSelected={data.selectedEmployees.includes(emp.id)}
                      enrichState={enrichMap[emp.id] ?? "idle"}
                      onToggle={() => toggleEmp(emp.id)}
                      onEdit={onEditEmployee}
                    />
                  ))
                )}
              </tbody>

              {displayed.length > 0 && (
                <tfoot className="border-t border-theme bg-app">
                  <tr>
                    <td />
                    <td colSpan={6} className="px-3 py-2 text-[10px] text-muted font-bold uppercase tracking-wider">
                      {displayed.length} of {employees.length} employees{search && " · filtered"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {selectedCTC > 0 && (
                        <span className="text-xs font-extrabold text-main tabular-nums">
                          {fmtCurrency(selectedCTC)}
                          <span className="text-[10px] text-muted font-normal ml-1">total CTC</span>
                        </span>
                      )}
                    </td>
                    <td />
                    {onEditEmployee && <td />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Employee row
// ─────────────────────────────────────────────────────────────────────────────
interface RowProps {
  emp: RichEmployee; index: number; isSelected: boolean;
  enrichState: EnrichState; onToggle: () => void; onEdit?: (emp: RichEmployee) => void;
}

const EmployeeRow: React.FC<RowProps> = ({ emp, index, isSelected, enrichState, onToggle, onEdit }) => {
  const loading = enrichState === "loading";
  const failed  = enrichState === "error";
  const initials = getInitials(emp.name);
  const statusVariant: BadgeVariant = emp.status === "Active" ? "ok" : "warn";

  return (
    <tr
      onClick={onToggle}
      className={`border-b border-theme last:border-0 cursor-pointer transition-colors group ${
        isSelected
          ? "bg-primary/5 hover:bg-primary/8"
          : index % 2 === 1 ? "bg-app hover:bg-primary/3" : "bg-card hover:bg-app"
      }`}
    >
      <td className="px-3 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={isSelected} onChange={onToggle} className="w-4 h-4 accent-primary cursor-pointer" />
      </td>

      <td className="px-3 py-2.5 min-w-[180px]">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-white" : "bg-app text-muted"}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-main leading-tight truncate max-w-[150px]">{emp.name}</p>
            <p className="text-[10px] text-muted font-mono">{emp.id}</p>
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5 text-xs text-muted max-w-[130px]">
        {loading ? <Shimmer /> : <span className="truncate block">{emp.department || "—"}</span>}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted max-w-[140px]">
        {loading ? <Shimmer /> : <span className="truncate block">{emp.designation || "—"}</span>}
      </td>
      <td className="px-3 py-2.5">
        {loading ? <Shimmer w="w-16" /> : emp.employmentType
          ? <span className="text-xs text-main font-medium">{emp.employmentType}</span>
          : <span className="text-xs text-muted">—</span>}
      </td>
      <td className="px-3 py-2.5 text-xs max-w-[160px]">
        {loading ? <Shimmer w="w-28" /> : (
          <span className="truncate block text-primary/80 font-medium" title={emp.salaryStructure}>
            {emp.salaryStructure || "—"}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted whitespace-nowrap">
        {loading ? <Shimmer w="w-20" /> : fmtDate(emp.joiningDate)}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        {loading
          ? <Shimmer w="w-20 ml-auto" />
          : failed
          ? <AlertCircle className="w-3.5 h-3.5 text-muted/30 ml-auto" aria-label="Detail fetch failed" />
          : <span className="text-sm font-extrabold text-main tabular-nums">{fmtCurrency(emp.ctc ?? 0)}</span>}
      </td>
      <td className="px-3 py-2.5">
        {loading ? <Shimmer w="w-14" /> : <Badge label={emp.status || "Active"} variant={statusVariant} />}
      </td>

      {onEdit && (
        <td className="px-3 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(emp)}
            className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonRows: React.FC = () => (
  <div className="divide-y divide-theme">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
        <div className="w-4 h-4 bg-muted/10 rounded shrink-0" />
        <div className="w-8 h-8 bg-muted/10 rounded-full shrink-0" />
        <div className="flex-1 grid grid-cols-7 gap-3 items-center">
          <div className="col-span-1 space-y-1.5">
            <div className="h-3 bg-muted/10 rounded w-4/5" />
            <div className="h-2 bg-muted/10 rounded w-3/5" />
          </div>
          {Array.from({ length: 6 }).map((__, j) => (
            <div key={j} className="h-3 bg-muted/10 rounded w-3/4" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ hasDateRange: boolean; isEditMode?: boolean }> = ({
  hasDateRange, isEditMode,
}) => (
  <div className="py-16 flex flex-col items-center gap-2 text-center px-4">
    <Users className="w-9 h-9 text-muted/25 mb-1" />
    {isEditMode ? (
      <>
        <p className="text-sm font-semibold text-main">No employees on this payroll</p>
        <p className="text-xs text-muted">The saved record has no employee entries.</p>
      </>
    ) : !hasDateRange ? (
      <>
        <p className="text-sm font-semibold text-main">No employees loaded</p>
        <p className="text-xs text-muted max-w-xs">
          Set a <span className="text-primary font-bold">Start Date</span> &{" "}
          <span className="text-primary font-bold">End Date</span> in the Overview tab
        </p>
      </>
    ) : (
      <>
        <p className="text-sm font-semibold text-main">No employees found</p>
        <p className="text-xs text-muted">Try adjusting the filters</p>
      </>
    )}
  </div>
);