import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Edit2,
  Loader2,
  Users,
  AlertCircle,
  FileSpreadsheet,
  Search,
  X,
} from "lucide-react";
import type { PayrollEntry, Employee } from "../../../types/Payroll/payrolltypes";
import { getPayrollEmployees } from "../../../api/utils/frappeUtilsApi";
import { getEmployeeById } from "../../../api/employeeapi";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import {
  getallbranches,
  getAllDepartments,
  getAllDesignations,
  getAllGrades,
} from "../../../api/utils/frappeUtilsApi";
import EmployeeNameCell from "../../../components/ui/Table/Employeenamecell";

// ─── Types ────────────────────────────────────────────────────────────────────

type EnrichState = "idle" | "loading" | "done" | "error";

interface RichEmployee extends Employee {
  ctc: number;
  salaryStructure: string;
  salaryMode: string;
  employmentType: string;
  holidayList: string;
  payrollCostCenter: string;
  status: string;
  image: string;
}

interface EmployeesTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  onEditEmployee?: (emp: RichEmployee) => void;
  onDirty?: () => void;
  isEditMode?: boolean;
}

// ─── Fetch-key ────────────────────────────────────────────────────────────────

const buildFetchKey = (d: PayrollEntry) =>
  [
    d.startDate, d.endDate,
    d.payrollFrequency || "", d.payrollPayableAccount || "",
    d.currency || "", d.branch || "", d.department || "",
    d.designation || "", d.grade || "",
  ].join("|");

// ─── Mappers ──────────────────────────────────────────────────────────────────

const toStub = (e: any): RichEmployee => ({
  id: e.value ?? "", name: e.label ?? "Unknown", email: "",
  department: "", designation: "", grade: "", joiningDate: "",
  bankAccount: "", ifscCode: "", pfNumber: "", panNumber: "",
  taxStatus: "", esiNumber: "", managerId: "", branch: "",
  basicSalary: 0, hra: 0, allowances: 0, isActive: true,
  ctc: 0, salaryStructure: "", salaryMode: "", employmentType: "",
  holidayList: "", payrollCostCenter: "", status: "Active", image: "",
});

const toStubFromId = (id: string): RichEmployee => ({
  id, name: id, email: "", department: "", designation: "", grade: "",
  joiningDate: "", bankAccount: "", ifscCode: "", pfNumber: "", panNumber: "",
  taxStatus: "", esiNumber: "", managerId: "", branch: "",
  basicSalary: 0, hra: 0, allowances: 0, isActive: true,
  ctc: 0, salaryStructure: "", salaryMode: "", employmentType: "",
  holidayList: "", payrollCostCenter: "", status: "Active", image: "",
});

const mergeDetail = (stub: RichEmployee, d: any): RichEmployee => ({
  ...stub,
  name: d.employee_name ?? stub.name,
  email: d.company_email ?? d.prefered_email ?? stub.email,
  department: d.department ?? stub.department,
  designation: d.designation ?? stub.designation,
  grade: d.grade ?? stub.grade,
  branch: d.branch ?? stub.branch,
  joiningDate: d.date_of_joining ?? stub.joiningDate,
  ctc: d.ctc ?? stub.ctc,
  salaryStructure: d.salary_structure ?? stub.salaryStructure,
  salaryMode: d.salary_mode ?? stub.salaryMode,
  employmentType: d.employment_type ?? stub.employmentType,
  holidayList: d.holiday_list ?? stub.holidayList,
  payrollCostCenter: d.payroll_cost_center ?? stub.payrollCostCenter,
  status: d.status ?? stub.status,
  isActive: d.status === "Active",
  basicSalary: d.basic_salary ?? stub.basicSalary,
  hra: d.hra ?? stub.hra,
  allowances: d.allowances ?? stub.allowances,
  image: d.image ?? stub.image,
});

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) => v > 0 ? v.toLocaleString("en-IN") : "—";

const fmtDate = (d: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
};

// ─── Search logic ─────────────────────────────────────────────────────────────
// Scoring:
//   3 — exact match on id or name
//   2 — starts-with on name or id
//   1 — contains anywhere (name, id, dept, designation, structure, employment type)
// Employees with score 0 are excluded. Results are sorted by score desc.

function scoreEmployee(emp: RichEmployee, q: string): number {
  if (!q) return 1;
  const query = q.toLowerCase().trim();
  if (!query) return 1;

  const name = emp.name?.toLowerCase() ?? "";
  const id = emp.id?.toLowerCase() ?? "";
  const dept = emp.department?.toLowerCase() ?? "";
  const desig = emp.designation?.toLowerCase() ?? "";
  const structure = emp.salaryStructure?.toLowerCase() ?? "";
  const empType = emp.employmentType?.toLowerCase() ?? "";

  // Exact
  if (name === query || id === query) return 3;
  // Starts with
  if (name.startsWith(query) || id.startsWith(query)) return 2;
  // Contains
  if (
    name.includes(query) ||
    id.includes(query) ||
    dept.includes(query) ||
    desig.includes(query) ||
    structure.includes(query) ||
    empType.includes(query)
  ) return 1;

  return 0;
}

// ─── Excel export ─────────────────────────────────────────────────────────────

const exportXLSX = (employees: RichEmployee[], selectedIds: string[]) => {
  const rows = employees.filter((e) => selectedIds.includes(e.id));
  if (!rows.length) return;
  const wsData = [
    ["Employee ID","Name","Department","Designation","Grade","Employment Type",
     "Salary Structure","CTC","Salary Mode","Date of Joining","Holiday List",
     "Cost Center","Status","Email","Branch"],
    ...rows.map((e) => [
      e.id, e.name, e.department, e.designation, e.grade, e.employmentType,
      e.salaryStructure, e.ctc ?? 0, e.salaryMode, e.joiningDate, e.holidayList,
      e.payrollCostCenter, e.status, e.email, e.branch,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    {wch:14},{wch:24},{wch:18},{wch:20},{wch:10},{wch:16},{wch:22},
    {wch:14},{wch:14},{wch:16},{wch:20},{wch:20},{wch:10},{wch:28},{wch:16},
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payroll Employees");
  XLSX.writeFile(wb, `payroll_employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// ─── Small UI primitives ──────────────────────────────────────────────────────

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

// ─── Column helper ────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<RichEmployee>();

// ─── Main component ───────────────────────────────────────────────────────────

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  data, onChange, onEditEmployee, isEditMode = false,
}) => {
  const [employees, setEmployees] = useState<RichEmployee[]>([]);
  const [enrichMap, setEnrichMap] = useState<Record<string, EnrichState>>({});
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const abortRef = useRef<AbortController | null>(null);
  const lastFetchKeyRef = useRef<string>("");
  const editSeededRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Sync rowSelection with parent selectedEmployees ─────────────────────

  useEffect(() => {
    const next: RowSelectionState = {};
    filteredEmployees.forEach((emp, idx) => {
      if (data.selectedEmployees.includes(emp.id)) next[idx] = true;
    });
    setRowSelection(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, data.selectedEmployees, searchQuery]);

  // ─── Frontend search with scoring ────────────────────────────────────────

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return employees;
    return employees
      .map((emp) => ({ emp, score: scoreEmployee(emp, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ emp }) => emp);
  }, [employees, searchQuery]);

  // ─── Load employees ───────────────────────────────────────────────────────

  useEffect(() => {
    if (isEditMode && !editSeededRef.current && data.selectedEmployees.length > 0) {
      const ids = data.selectedEmployees;
      editSeededRef.current = true;

      const stubs = ids.map((id) => {
        const pre = (data as any).employeeStubs?.find((s: any) => s.id === id);
        return {
          ...toStubFromId(id),
          ...(pre ? { name: pre.name, department: pre.department, designation: pre.designation } : {}),
        };
      });
      setEmployees(stubs);

      const initMap: Record<string, EnrichState> = {};
      ids.forEach((id) => { initMap[id] = "loading"; });
      setEnrichMap(initMap);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      Promise.allSettled(
        stubs.map(async (stub) => {
          if (ctrl.signal.aborted) return;
          try {
            const raw = await getEmployeeById(stub.id);
            const detail = raw?.message?.data ?? raw?.data ?? raw;
            if (ctrl.signal.aborted) return;
            setEmployees((prev) => prev.map((e) => e.id === stub.id ? mergeDetail(e, detail) : e));
            setEnrichMap((prev) => ({ ...prev, [stub.id]: "done" }));
          } catch {
            if (!ctrl.signal.aborted)
              setEnrichMap((prev) => ({ ...prev, [stub.id]: "error" }));
          }
        }),
      );
      return;
    }

    if (isEditMode) return;

    if (!data.startDate || !data.endDate) {
      setEmployees([]);
      setEnrichMap({});
      lastFetchKeyRef.current = "";
      return;
    }

    const currentKey = buildFetchKey(data);
    if (currentKey === lastFetchKeyRef.current && employees.length > 0) return;
    lastFetchKeyRef.current = currentKey;

    const run = async () => {
      setListLoading(true);
      setEmployees([]);
      setEnrichMap({});
      abortRef.current?.abort();

      try {
        const results = await getPayrollEmployees({
          start_date: data.startDate, end_date: data.endDate,
          payroll_frequency: data.payrollFrequency || undefined,
          payroll_payable_account: data.payrollPayableAccount || undefined,
          currency: data.currency || undefined,
          branch: data.branch || undefined, department: data.department || undefined,
          designation: data.designation || undefined, grade: data.grade || undefined,
          page: 1, page_size: 200,
        });

        const stubs = (results ?? []).map(toStub);
        setEmployees(stubs);
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
              const raw = await getEmployeeById(stub.id);
              const detail = raw?.message?.data ?? raw?.data ?? raw;
              if (ctrl.signal.aborted) return;
              setEmployees((prev) => prev.map((e) => e.id === stub.id ? mergeDetail(e, detail) : e));
              setEnrichMap((prev) => ({ ...prev, [stub.id]: "done" }));
            } catch {
              if (!ctrl.signal.aborted)
                setEnrichMap((prev) => ({ ...prev, [stub.id]: "error" }));
            }
          }),
        );
      } catch (err) {
        console.error("Payroll employee fetch failed:", err);
        setEmployees([]);
      } finally {
        setListLoading(false);
      }
    };

    const t = setTimeout(run, 400);
    return () => { clearTimeout(t); abortRef.current?.abort(); };
  }, [
    isEditMode,
    data.startDate, data.endDate, data.payrollFrequency,
    data.payrollPayableAccount, data.currency, data.branch,
    data.department, data.designation, data.grade,
  ]);

  // ─── Columns ──────────────────────────────────────────────────────────────

  const columns = useMemo(() => {
    const cols = [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected(); }}
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        ),
      }),

      columnHelper.accessor("name", {
        header: "Employee",
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <EmployeeNameCell
              name={emp.name}
              employeeId={emp.id}
              image={emp.image}
              subLabel={emp.id}
            />
          );
        },
      }),

      columnHelper.accessor("department", {
        header: "Department",
        cell: ({ row }) => {
          const emp = row.original;
          const loading = enrichMap[emp.id] === "loading";
          return loading && !emp.department
            ? <Shimmer />
            : <span className="truncate block text-xs text-muted">{emp.department || "—"}</span>;
        },
      }),

      columnHelper.accessor("designation", {
        header: "Designation",
        cell: ({ row }) => {
          const emp = row.original;
          const loading = enrichMap[emp.id] === "loading";
          return loading && !emp.designation
            ? <Shimmer />
            : <span className="truncate block text-xs text-muted">{emp.designation || "—"}</span>;
        },
      }),

      columnHelper.accessor("employmentType", {
        header: "Type",
        cell: ({ row }) => {
          const emp = row.original;
          const loading = enrichMap[emp.id] === "loading";
          if (loading) return <Shimmer w="w-16" />;
          return emp.employmentType
            ? <span className="text-xs text-main font-medium">{emp.employmentType}</span>
            : <span className="text-xs text-muted">—</span>;
        },
      }),

      columnHelper.accessor("salaryStructure", {
        header: "Salary Structure",
        cell: ({ row }) => {
          const emp = row.original;
          const loading = enrichMap[emp.id] === "loading";
          return loading
            ? <Shimmer w="w-28" />
            : <span className="truncate block text-xs text-primary/80 font-medium max-w-[160px]" title={emp.salaryStructure}>{emp.salaryStructure || "—"}</span>;
        },
      }),

      columnHelper.accessor("joiningDate", {
        header: "Joining",
        cell: ({ row }) => {
          const emp = row.original;
          const loading = enrichMap[emp.id] === "loading";
          return loading
            ? <Shimmer w="w-20" />
            : <span className="text-xs text-muted whitespace-nowrap">{fmtDate(emp.joiningDate)}</span>;
        },
      }),

      columnHelper.accessor("ctc", {
        header: "CTC",
        meta: { align: "right" },
        cell: ({ row }) => {
          const emp = row.original;
          const loading = enrichMap[emp.id] === "loading";
          const failed = enrichMap[emp.id] === "error";
          if (loading) return <Shimmer w="w-20 ml-auto" />;
          if (failed) return <AlertCircle className="w-3.5 h-3.5 text-muted/30 ml-auto" aria-label="Detail fetch failed" />;
          return <span className="text-sm font-extrabold text-main tabular-nums">{fmtCurrency(emp.ctc ?? 0)}</span>;
        },
      }),

      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => {
          const emp = row.original;
          const loading = enrichMap[emp.id] === "loading";
          return loading
            ? <Shimmer w="w-14" />
            : <Badge label={emp.status || "Active"} variant={emp.status === "Active" ? "ok" : "warn"} />;
        },
      }),
    ];

    if (onEditEmployee) {
      cols.push(
        columnHelper.display({
          id: "actions",
          header: "",
          cell: ({ row }) => (
            <button
              onClick={(e) => { e.stopPropagation(); onEditEmployee(row.original); }}
              className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition opacity-0 group-hover:opacity-100"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          ),
        }) as any,
      );
    }

    return cols;
  }, [enrichMap, onEditEmployee]);

  // ─── Table instance (no TanStack filtering — we do it ourselves) ──────────

  const table = useReactTable({
    data: filteredEmployees,
    columns,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      const selectedIds = filteredEmployees.filter((_, idx) => next[idx]).map((e) => e.id);
      onChange("selectedEmployees", selectedIds);
    },
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  // ─── Derived stats ────────────────────────────────────────────────────────

  const rows = table.getRowModel().rows;
  const enrichedCount = Object.values(enrichMap).filter((s) => s === "done").length;
  const isEnriching = employees.length > 0 && enrichedCount < employees.length && !listLoading;
  const selectedCTC = employees
    .filter((e) => data.selectedEmployees.includes(e.id))
    .reduce((s, e) => s + (e.ctc ?? 0), 0);

  const isFiltered = searchQuery.trim().length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 animate-[fadeIn_0.2s_ease]">

      {/* Filter dropdowns */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Branch</label>
          <SearchSelect2
            label="" value={data.branchLabel || ""} placeholder="Search branch..."
            fetchOptions={async (q) => { const res = await getallbranches(q); return (res || []).map((b: any) => ({ label: b.label, value: b.value })); }}
            onChange={(value, option) => { onChange("branch", value); onChange("branchLabel", option.label); }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Department</label>
          <SearchSelect2
            label="" value={data.departmentLabel || ""} placeholder="Search departments..."
            fetchOptions={async (q) => { const res = await getAllDepartments(q); return (res || []).map((d: any) => ({ label: d.label, value: d.value })); }}
            onChange={(value, option) => { onChange("department", value || ""); onChange("departmentLabel", value ? option.label : ""); }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Designation</label>
          <SearchSelect2
            label="" value={data.designationLabel || ""} placeholder="Search designations..."
            fetchOptions={async (q) => { const res = await getAllDesignations(q); return (res || []).map((d: any) => ({ label: d.label, value: d.value })); }}
            onChange={(value, option) => { onChange("designation", value || ""); onChange("designationLabel", value ? option.label : ""); }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">Grade</label>
          <SearchSelect2
            label="" value={data.gradeLabel || ""} placeholder="Search grade..."
            fetchOptions={async (q) => { const res = await getAllGrades(q); return (res || []).map((g: any) => ({ label: g.label, value: g.value })); }}
            onChange={(value, option) => { onChange("grade", value || ""); onChange("gradeLabel", value ? option.label : ""); }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, ID, dept, designation…"
            className="w-full h-9 pl-8 pr-7 bg-card border border-theme rounded-xl text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right side stats + actions */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {listLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />}
          {isEnriching && !listLoading && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              Enriching {enrichedCount}/{employees.length}
            </span>
          )}
          {isFiltered && (
            <span className="text-[11px] font-bold bg-primary/5 border border-primary/20 px-3 py-1 rounded-full text-primary">
              {filteredEmployees.length} result{filteredEmployees.length !== 1 ? "s" : ""}
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
      <div className="border border-theme rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        {listLoading ? (
          <SkeletonRows />
        ) : employees.length === 0 ? (
          <EmptyState hasDateRange={!!(data.startDate && data.endDate)} isEditMode={isEditMode} />
        ) : (
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-app border-b border-theme sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isRight = (header.column.columnDef.meta as any)?.align === "right";
                      return (
                        <th
                          key={header.id}
                          className={`px-3 py-2.5 text-[10px] font-extrabold text-muted uppercase tracking-wider whitespace-nowrap select-none ${isRight ? "text-right" : "text-left"}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted">
                        <Search className="w-6 h-6 opacity-30" />
                        <p className="text-sm font-semibold text-main">No results</p>
                        <p className="text-xs">No employees match &quot;{searchQuery}&quot;</p>
                        <button
                          onClick={() => setSearchQuery("")}
                          className="mt-1 text-xs text-primary hover:underline"
                        >
                          Clear search
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr
                      key={row.id}
                      onClick={row.getToggleSelectedHandler()}
                      className={`border-b border-theme last:border-0 cursor-pointer transition-colors group ${
                        row.getIsSelected()
                          ? "bg-primary/5 hover:bg-primary/8"
                          : i % 2 === 1
                            ? "bg-app hover:bg-primary/3"
                            : "bg-card hover:bg-app"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isRight = (cell.column.columnDef.meta as any)?.align === "right";
                        const isCheckbox = cell.column.id === "select";
                        const isActions = cell.column.id === "actions";
                        return (
                          <td
                            key={cell.id}
                            className={`px-3 py-2.5 ${isCheckbox || isActions ? "w-10" : ""} ${isRight ? "text-right whitespace-nowrap" : ""}`}
                            onClick={isCheckbox || isActions ? (e) => e.stopPropagation() : undefined}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot className="border-t border-theme bg-app sticky bottom-0 z-10">
                  <tr>
                    <td />
                    <td colSpan={6} className="px-3 py-2 text-[10px] text-muted font-bold uppercase tracking-wider">
                      {isFiltered
                        ? `${filteredEmployees.length} of ${employees.length} employees · filtered`
                        : `${employees.length} employees`}
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ hasDateRange: boolean; isEditMode?: boolean }> = ({ hasDateRange, isEditMode }) => (
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