import React, { useMemo, useRef, useState } from "react";

import { Download, Edit2, Eye } from "lucide-react";

import toast from "react-hot-toast";

import type { PayrollEntry, Employee } from "../../../types/payrolltypes";

import { runSingleEmployeePayroll } from "../../../api/singleEmployeePayrollApi";

import { createMultipleEmployeesPayroll } from "../../../api/multiplePayrollApi";

import { getSalarySlips } from "../../../api/salarySlipApi";

import { getSalaryStructureAssignments } from "../../../api/salaryStructureAssignmentApi";

import {
  getSalaryStructures,
  type SalaryStructureListItem,
} from "../../../api/salaryStructureApi";

import PayrollPreviewModal from "./payrollPreview";

import MultiPayrollPreviewModal from "./multiPayrollPreview";

const toCsv = (rows: Array<Record<string, any>>): string => {
  const colSet = new Set<string>();
  rows.forEach((r) => {
    Object.keys(r || {}).forEach((k) => colSet.add(k));
  });
  const cols = Array.from(colSet);

  const esc = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    const needs = /[\n\r,"]/g.test(s);
    const out = s.replace(/"/g, '""');
    return needs ? `"${out}"` : out;
  };

  const header = cols.map(esc).join(",");
  const lines = rows.map((r) =>
    cols.map((c) => esc((r as any)?.[c])).join(","),
  );
  return [header, ...lines].join("\n");
};

const downloadCsv = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

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
  "w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main placeholder:text-muted focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition";

const selectCls =
  "w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition cursor-pointer";

interface OverviewTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onChange }) => (
  <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
    <div className="grid grid-cols-3 gap-5">
      <div>
        <Label required>Payroll Name</Label>
        <input
          type="text"
          value={data.payrollName}
          onChange={(e) => onChange("payrollName", e.target.value)}
          placeholder="e.g. January 2026 Payroll"
          className={inputCls}
        />
      </div>
      <div>
        <Label required>Posting Date</Label>
        <input
          type="date"
          value={data.postingDate}
          onChange={(e) => onChange("postingDate", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <Label required>Payroll Frequency</Label>
        <select
          value={data.payrollFrequency}
          onChange={(e) => onChange("payrollFrequency", e.target.value)}
          className={selectCls}
        >
          <option value="">Select frequency</option>
          <option value="Monthly">Monthly</option>
          <option value="Biweekly">Biweekly</option>
          <option value="Weekly">Weekly</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-5">
      <div>
        <Label required>Currency</Label>
        <select
          value={data.currency}
          onChange={(e) => onChange("currency", e.target.value)}
          className={selectCls}
        >
          <option value="ZMW">ZMW — Zambian Kwacha</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
        </select>
      </div>
      <div>
        <Label required>Company</Label>
        <input
          type="text"
          value={data.company}
          onChange={(e) => onChange("company", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <Label required>Payroll Payable Account</Label>
        <select
          value={data.payrollPayableAccount}
          onChange={(e) => onChange("payrollPayableAccount", e.target.value)}
          className={selectCls}
        >
          <option value="Payroll Payable - Izyane - I">
            Payroll Payable - Izyane - I
          </option>
          <option value="Payroll Payable - I">Payroll Payable - I</option>
          <option value="Payroll Payable - II">Payroll Payable - II</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-5">
      <div>
        <Label required>Pay Period Start</Label>
        <input
          type="date"
          value={data.startDate}
          onChange={(e) => onChange("startDate", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <Label required>Pay Period End</Label>
        <input
          type="date"
          value={data.endDate}
          onChange={(e) => onChange("endDate", e.target.value)}
          className={inputCls}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      {[
        {
          field: "deductTaxForProof",

          label: "Deduct Tax for Proof Submission",

          desc: "Apply TDS based on submitted investment proofs",
        },

        {
          field: "salarySlipTimesheet",

          label: "Salary Slip Based on Timesheet",

          desc: "Calculate pay using logged timesheet hours",
        },
      ].map(({ field, label, desc }) => (
        <label
          key={field}
          className="flex items-start gap-3 p-4 bg-app border border-theme rounded-xl cursor-pointer hover:border-[var(--primary)]/40 transition"
        >
          <input
            type="checkbox"
            checked={!!(data as any)[field]}
            onChange={(e) => onChange(field, e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary cursor-pointer shrink-0"
          />
          <div>
            <p className="text-xs font-bold text-main">{label}</p>
            <p className="text-[10px] text-muted mt-0.5">{desc}</p>
          </div>
        </label>
      ))}
    </div>
  </div>
);

interface EmployeesTabProps {
  data: PayrollEntry;
  onChange: (field: string, value: any) => void;
  employees: Employee[];
  loading?: boolean;
  onEditEmployee?: (emp: Employee) => void;
  onViewEmployee?: (employeeId: string) => void;
  onCreatePayroll?: (empIds: string[]) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({
  data,
  onChange,
  employees,
  loading,
  onEditEmployee,
  onViewEmployee,
}) => {
  const active = useMemo(
    () => employees.filter((e) => e.isActive),
    [employees],
  );

  const isLoading = Boolean(loading);

  const [page, setPage] = useState(1);

  const pageSize = 10;

  const [singleSubmitting, setSingleSubmitting] = useState(false);

  const [multiSubmitting, setMultiSubmitting] = useState(false);

  const [singleModalOpen, setSingleModalOpen] = useState(false);

  const [multiModalOpen, setMultiModalOpen] = useState(false);

  const [multiSalaryStructureName, setMultiSalaryStructureName] =
    useState<string>("");
  const [salaryStructures, setSalaryStructures] = useState<
    SalaryStructureListItem[]
  >([]);
  const [salaryStructuresLoading, setSalaryStructuresLoading] = useState(false);

  const [multiStructureAssignments, setMultiStructureAssignments] = useState<
    any[]
  >([]);
  const [multiAssignmentsLoading, setMultiAssignmentsLoading] = useState(false);

  const lastAutoSelectedStructureRef = useRef<string>("");
  const lastAutoPreviewRef = useRef<string>("");

  const miniInputCls =
    "w-56 px-2.5 py-2 bg-app border border-theme rounded-lg text-xs text-main placeholder:text-muted focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition";

  const miniSelectCls =
    "w-56 px-2.5 py-2 bg-app border border-theme rounded-lg text-xs text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition cursor-pointer";

  const selectionMode: "single" | "multiple" =
    data.employeeSelectionMode || "multiple";

  const selectedSingleEmployeeId =
    selectionMode === "single" ? String(data.selectedEmployees?.[0] ?? "") : "";

  const selectedSingleEmployeeRow = useMemo(() => {
    if (!selectedSingleEmployeeId) return null;

    return (
      active.find((e) => String(e.id) === selectedSingleEmployeeId) ?? null
    );
  }, [active, selectedSingleEmployeeId]);

  const selectedSingleEmployeeCode = useMemo(() => {
    if (!selectedSingleEmployeeId) return "";

    const row = selectedSingleEmployeeRow;

    return String((row as any)?.employeeId ?? row?.id ?? "").trim();
  }, [selectedSingleEmployeeId, selectedSingleEmployeeRow]);

  const fallbackSalaryStructureName = "";

  const [singleSalaryStructureName, setSingleSalaryStructureName] =
    useState<string>("");
  const [singleAssignmentLoading, setSingleAssignmentLoading] = useState(false);

  React.useEffect(() => {
    if (selectionMode !== "single") {
      setSingleModalOpen(false);
      setSingleSalaryStructureName("");
      setSingleAssignmentLoading(false);
      return;
    }

    if (selectedSingleEmployeeId) {
      setSingleModalOpen(false);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
      onChange("startDate", toIso(start));
      onChange("endDate", toIso(end));
    }
  }, [selectedSingleEmployeeId, selectionMode]);

  React.useEffect(() => {
    if (selectionMode !== "single") return;
    if (!selectedSingleEmployeeCode) {
      setSingleSalaryStructureName("");
      setSingleAssignmentLoading(false);
      return;
    }

    let mounted = true;
    const run = async () => {
      try {
        setSingleAssignmentLoading(true);

        const rows = await getSalaryStructureAssignments({
          employee: selectedSingleEmployeeCode,
        });
        if (!mounted) return;
        let list = Array.isArray(rows) ? rows : [];

        if (list.length === 0) {
          const all = await getSalaryStructureAssignments();
          if (!mounted) return;
          const allList = Array.isArray(all) ? all : [];
          const code = String(selectedSingleEmployeeCode).trim();
          list = allList.filter(
            (r: any) => String(r?.employee ?? "").trim() === code,
          );
        }

        const payEnd = String(data.endDate ?? "").trim();
        const effective = /^\d{4}-\d{2}-\d{2}$/.test(payEnd)
          ? list.filter((r: any) => {
              const fd = String(r?.from_date ?? "");
              if (!/^\d{4}-\d{2}-\d{2}$/.test(fd)) return false;
              return fd <= payEnd;
            })
          : list;

        const best = (effective.length > 0 ? effective : list)
          .filter((r: any) => String(r?.salary_structure ?? "").trim())
          .sort((a: any, b: any) => {
            const ad = String(a?.from_date ?? "");
            const bd = String(b?.from_date ?? "");
            return bd.localeCompare(ad);
          })[0];

        setSingleSalaryStructureName(
          String(best?.salary_structure ?? "").trim(),
        );
      } catch (e: any) {
        if (!mounted) return;
        setSingleSalaryStructureName("");
        toast.error(e?.message || "Failed to load salary structure assignment");
      } finally {
        if (!mounted) return;
        setSingleAssignmentLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [data.endDate, selectedSingleEmployeeCode, selectionMode]);

  React.useEffect(() => {
    if (selectionMode !== "multiple") {
      setMultiModalOpen(false);
      setMultiSubmitting(false);
      return;
    }
  }, [selectionMode]);

  React.useEffect(() => {
    if (selectionMode !== "single") return;
    if (singleSubmitting || singleAssignmentLoading) return;
    if (!selectedSingleEmployeeId) return;
    if (!String(singleSalaryStructureName || "").trim()) return;
    if (singleModalOpen) return;

    const key = `single:${selectedSingleEmployeeId}:${String(singleSalaryStructureName).trim()}`;
    if (lastAutoPreviewRef.current === key) return;
    lastAutoPreviewRef.current = key;

    setSingleModalOpen(true);
  }, [
    selectionMode,
    selectedSingleEmployeeId,
    singleSalaryStructureName,
    singleSubmitting,
    singleAssignmentLoading,
    singleModalOpen,
  ]);

  React.useEffect(() => {
    if (selectionMode !== "multiple") return;
    if (multiSubmitting) return;
    if (multiModalOpen) return;
    if (data.selectedEmployees.length === 0) return;
    if (!String(multiSalaryStructureName || "").trim()) return;

    if (!String(data.startDate ?? "").trim() || !String(data.endDate ?? "").trim()) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
      onChange("startDate", toIso(start));
      onChange("endDate", toIso(end));
    }

    const key = `multi:${data.selectedEmployees.join(",")}:${String(multiSalaryStructureName).trim()}`;
    if (lastAutoPreviewRef.current === key) return;
    lastAutoPreviewRef.current = key;

    setMultiModalOpen(true);
  }, [
    selectionMode,
    data.selectedEmployees,
    data.startDate,
    data.endDate,
    multiSalaryStructureName,
    multiSubmitting,
    multiModalOpen,
    onChange,
  ]);

  React.useEffect(() => {
    if (selectionMode !== "multiple") return;
    let mounted = true;

    const run = async () => {
      try {
        setSalaryStructuresLoading(true);
        const list = await getSalaryStructures();
        if (!mounted) return;
        setSalaryStructures(Array.isArray(list) ? list : []);
      } catch {
        if (!mounted) return;
        setSalaryStructures([]);
      } finally {
        if (!mounted) return;
        setSalaryStructuresLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [selectionMode]);

  React.useEffect(() => {
    if (selectionMode !== "multiple") return;
    let mounted = true;
    const run = async () => {
      try {
        setMultiAssignmentsLoading(true);
        const rows = await getSalaryStructureAssignments();
        if (!mounted) return;
        setMultiStructureAssignments(Array.isArray(rows) ? rows : []);
      } catch {
        if (!mounted) return;
        setMultiStructureAssignments([]);
      } finally {
        if (!mounted) return;
        setMultiAssignmentsLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [selectionMode]);

  const effectiveStructureIndex = useMemo(() => {
    const byEmployee = new Map<string, string>();
    const byFullNameLower = new Map<string, string>();
    const list = Array.isArray(multiStructureAssignments)
      ? multiStructureAssignments
      : [];

    const effectiveStart = String(data.startDate ?? "").trim();
    const useDate = /^\d{4}-\d{2}-\d{2}$/.test(effectiveStart)
      ? effectiveStart
      : "";

    const byEmp = new Map<string, any[]>();
    list.forEach((r: any) => {
      const emp = String(r?.employee ?? "").trim();
      if (!emp) return;
      if (!byEmp.has(emp)) byEmp.set(emp, []);
      byEmp.get(emp)!.push(r);
    });

    byEmp.forEach((rows, emp) => {
      let eligible = rows;
      if (useDate) {
        eligible = rows.filter((r: any) => {
          const fd = String(r?.from_date ?? "");
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fd)) return false;
          return fd <= useDate;
        });
      }

      const best = (eligible.length > 0 ? eligible : rows)
        .filter((r: any) => String(r?.salary_structure ?? "").trim())
        .sort((a: any, b: any) =>
          String(b?.from_date ?? "").localeCompare(String(a?.from_date ?? "")),
        )[0];

      const structure = String(best?.salary_structure ?? "").trim();
      if (!structure) return;

      byEmployee.set(emp, structure);
      const fullName = String(best?.full_name ?? "")
        .trim()
        .toLowerCase();
      if (fullName) byFullNameLower.set(fullName, structure);
    });

    return { byEmployee, byFullNameLower };
  }, [data.startDate, multiStructureAssignments]);

  const getEffectiveStructureForEmployee = (emp: any): string => {
    const code = String(emp?.employeeId ?? "").trim();
    const id = String(emp?.id ?? "").trim();
    const nameLower = String(emp?.name ?? "")
      .trim()
      .toLowerCase();

    return (
      (code && effectiveStructureIndex.byEmployee.get(code)) ||
      (id && effectiveStructureIndex.byEmployee.get(id)) ||
      (nameLower && effectiveStructureIndex.byFullNameLower.get(nameLower)) ||
      ""
    );
  };

  const employeesMatchingSelectedStructure = useMemo(() => {
    if (selectionMode !== "multiple") return [] as Employee[];
    const selectedStructure = String(multiSalaryStructureName ?? "").trim();
    if (!selectedStructure) return [] as Employee[];

    return active.filter((emp: any) => {
      const eff = getEffectiveStructureForEmployee(emp);
      return Boolean(eff) && eff === selectedStructure;
    });
  }, [
    active,
    effectiveStructureIndex,
    multiSalaryStructureName,
    selectionMode,
  ]);

  React.useEffect(() => {
    if (selectionMode !== "multiple") return;
    const selectedStructure = String(multiSalaryStructureName ?? "").trim();
    if (!selectedStructure) return;
    if (multiAssignmentsLoading) return;

    if (lastAutoSelectedStructureRef.current === selectedStructure) return;

    const ids = employeesMatchingSelectedStructure
      .map((e) => String((e as any).id))
      .filter(Boolean);

    onChange("selectedEmployees", ids);
    lastAutoSelectedStructureRef.current = selectedStructure;
    setPage((p) => (p === 1 ? p : 1));
  }, [
    employeesMatchingSelectedStructure,
    multiAssignmentsLoading,
    multiSalaryStructureName,
    onChange,
    selectionMode,
  ]);

  React.useEffect(() => {
    if (selectionMode !== "multiple") return;
    const selectedStructure = String(multiSalaryStructureName ?? "").trim();
    if (!selectedStructure) {
      lastAutoSelectedStructureRef.current = "";
    }
  }, [multiSalaryStructureName, selectionMode]);

  const canRunSinglePayroll = useMemo(() => {
    if (selectionMode !== "single") return false;
    if (!selectedSingleEmployeeCode) return false;
    if (!String(singleSalaryStructureName ?? "").trim()) return false;
    if (!String(data.company ?? "").trim()) return false;
    if (!String(data.currency ?? "").trim()) return false;
    if (!String(data.payrollFrequency ?? "").trim()) return false;
    if (!String(data.payrollPayableAccount ?? "").trim()) return false;
    if (!String(data.startDate ?? "").trim()) return false;
    if (!String(data.endDate ?? "").trim()) return false;
    return true;
  }, [
    data.company,
    data.currency,
    data.endDate,
    data.payrollFrequency,
    data.payrollPayableAccount,
    data.startDate,
    selectedSingleEmployeeCode,
    singleSalaryStructureName,
    selectionMode,
  ]);

  const canRunMultiplePayroll = useMemo(() => {
    if (selectionMode !== "multiple") return false;
    if (
      !Array.isArray(data.selectedEmployees) ||
      data.selectedEmployees.length === 0
    )
      return false;
    if (!String(multiSalaryStructureName ?? "").trim()) return false;
    if (!String(data.company ?? "").trim()) return false;
    if (!String(data.currency ?? "").trim()) return false;
    if (!String(data.payrollFrequency ?? "").trim()) return false;
    if (!String(data.payrollPayableAccount ?? "").trim()) return false;
    if (!String(data.startDate ?? "").trim()) return false;
    if (!String(data.endDate ?? "").trim()) return false;
    return true;
  }, [
    multiSalaryStructureName,
    data.company,
    data.currency,
    data.endDate,
    data.payrollFrequency,
    data.payrollPayableAccount,
    data.selectedEmployees,
    data.startDate,
    selectionMode,
  ]);

  const runSinglePayroll = async () => {
    if (!canRunSinglePayroll) {
      if (!String(singleSalaryStructureName ?? "").trim()) {
        toast.error(
          "No salary structure assigned for this employee in the selected period",
        );
        return;
      }

      toast.error("Please fill required fields");
      return;
    }

    setSingleSubmitting(true);

    try {
      const postingDate = String(data.postingDate ?? "").trim();
      const payrollName = String(data.payrollName ?? "").trim();

      await runSingleEmployeePayroll({
        employee: selectedSingleEmployeeCode,
        company: String(data.company),
        ...(payrollName ? { payroll_name: payrollName } : {}),
        ...(postingDate ? { posting_date: postingDate } : {}),
        start_date: String(data.startDate),
        end_date: String(data.endDate),
        payroll_type: String(data.payrollFrequency),
        currency: String(data.currency),
        exchange_rate: 1,
        payroll_payable_account: String(data.payrollPayableAccount),
      });

      toast.success("Single payroll run created");
      setSingleModalOpen(false);
      onChange("selectedEmployees", []);
    } catch (e: any) {
      const serverMessage =
        e?.response?.data?.message ??
        e?.response?.data?.exc ??
        e?.response?.data?._server_messages ??
        e?.response?.data?.error?.message ??
        e?.message;

      const safeMessage = String(serverMessage ?? "").trim();

      toast.error(safeMessage || "Failed to run single payroll");
    } finally {
      setSingleSubmitting(false);
    }
  };

  const runMultiplePayroll = async () => {
    if (!canRunMultiplePayroll) {
      if (!String(multiSalaryStructureName ?? "").trim()) {
        toast.error("Please select a salary structure");
        return;
      }
      toast.error("Please select employees and fill required fields");
      return;
    }

    setMultiSubmitting(true);
    try {
      const selectedEmployeeData = active.filter((e) =>
        data.selectedEmployees.includes(e.id),
      );
      let employeeIds = selectedEmployeeData
        .map((e: any) => e.employeeId || e.id)
        .filter(Boolean);

      const employeeNameByCode = new Map<string, string>();
      selectedEmployeeData.forEach((e: any) => {
        const code = String(e?.employeeId || e?.id || "").trim();
        const name = String(e?.name || e?.employee_name || code).trim();
        if (code) employeeNameByCode.set(code, name || code);
      });

      const fmtNames = (ids: string[], limit = 5) => {
        const uniq = Array.from(
          new Set(ids.map((x) => String(x).trim()).filter(Boolean)),
        );
        const names = uniq.map((id) => employeeNameByCode.get(id) || id);
        const head = names.slice(0, limit);
        const rest = Math.max(0, names.length - head.length);
        return head.join(", ") + (rest > 0 ? ` +${rest} more` : "");
      };

      if (employeeIds.length === 0) {
        toast.error("No valid employee IDs found");
        return;
      }

      const startDate = String(data.startDate);
      const endDate = String(data.endDate);

      let skippedNoStructureCount = 0;
      let skippedDuplicateCount = 0;
      let skippedNoStructureIds: string[] = [];
      let skippedDuplicateIds: string[] = [];

      // Skip employees with no effective salary structure assignment
      const effectiveStart = String(startDate ?? "").trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(effectiveStart)) {
        const assignments = await getSalaryStructureAssignments();
        const list = Array.isArray(assignments) ? assignments : [];
        const hasEffective = (empCode: string) => {
          const code = String(empCode ?? "").trim();
          if (!code) return false;
          return list.some((r: any) => {
            if (String(r?.employee ?? "").trim() !== code) return false;
            const fd = String(r?.from_date ?? "");
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fd)) return false;
            return fd <= effectiveStart;
          });
        };

        const withStructure = employeeIds.filter((id: any) =>
          hasEffective(String(id)),
        );
        skippedNoStructureIds = employeeIds
          .filter((id: any) => !hasEffective(String(id)))
          .map(String);
        skippedNoStructureCount = skippedNoStructureIds.length;
        employeeIds = withStructure;

        if (employeeIds.length === 0) {
          toast.error(
            `No payroll created. Skipped ${skippedNoStructureCount} employee${skippedNoStructureCount === 1 ? "" : "s"} (no salary structure applicable on/before ${effectiveStart})${skippedNoStructureCount > 0 ? `: ${fmtNames(skippedNoStructureIds)}` : ""}`,
          );
          return;
        }
      }

      // Skip duplicates (month-normalized)
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
      const normalizeMonthRange = (
        iso: string,
      ): { start: string; end: string } | null => {
        const s = String(iso ?? "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
        const [y, m] = s.split("-").map((v) => Number(v));
        if (!y || !m) return null;
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0);
        return { start: toIso(start), end: toIso(end) };
      };

      const monthRange =
        normalizeMonthRange(startDate) ?? normalizeMonthRange(endDate);
      const checkStart = monthRange?.start ?? startDate;
      const checkEnd = monthRange?.end ?? endDate;

      const existing = await getSalarySlips({
        start_date: checkStart,
        end_date: checkEnd,
        page: 1,
        page_size: 2000,
      });

      const existingEmployees = new Set(
        (Array.isArray(existing?.salary_slips) ? existing.salary_slips : [])
          .map((s) => String(s.employee ?? "").trim())
          .filter(Boolean),
      );

      const toRun = employeeIds
        .filter((id: any) => !existingEmployees.has(String(id).trim()))
        .map(String);
      skippedDuplicateIds = employeeIds
        .filter((id: any) => existingEmployees.has(String(id).trim()))
        .map(String);
      skippedDuplicateCount = skippedDuplicateIds.length;

      if (toRun.length === 0) {
        const parts: string[] = [];
        if (skippedNoStructureCount > 0) {
          parts.push(
            `Skipped ${skippedNoStructureCount} (no salary structure): ${fmtNames(skippedNoStructureIds)}`,
          );
        }
        if (skippedDuplicateCount > 0) {
          parts.push(
            `Skipped ${skippedDuplicateCount} (already has payroll): ${fmtNames(skippedDuplicateIds)}`,
          );
        }
        toast.error(
          `No payroll created. ${parts.join(" | ") || "All selected employees were skipped."}`,
        );
        return;
      }

      const resp = await createMultipleEmployeesPayroll({
        salary_structure: String(multiSalaryStructureName).trim(),
        start_date: startDate,
        end_date: endDate,
      });

      const msg = String((resp as any)?.message ?? "").trim();
      const summaryParts: string[] = [];
      if (skippedNoStructureCount > 0) {
        summaryParts.push(
          `Skipped ${skippedNoStructureCount} (no salary structure): ${fmtNames(skippedNoStructureIds)}`,
        );
      }
      if (skippedDuplicateCount > 0) {
        summaryParts.push(
          `Skipped ${skippedDuplicateCount} (already has payroll): ${fmtNames(skippedDuplicateIds)}`,
        );
      }
      const summary = summaryParts.length
        ? ` | ${summaryParts.join(" | ")}`
        : "";

      toast.success(
        (msg ||
          `Multiple payroll created for ${toRun.length} employee${toRun.length > 1 ? "s" : ""}`) +
          summary,
      );
      setMultiModalOpen(false);
      onChange("selectedEmployees", []);
    } catch (e: any) {
      const serverMessage =
        e?.response?.data?.message ??
        e?.response?.data?.exc ??
        e?.response?.data?._server_messages ??
        e?.response?.data?.error?.message ??
        e?.message;

      const safeMessage = String(serverMessage ?? "").trim();
      toast.error(safeMessage || "Failed to run multiple payroll");
      setMultiSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = String((data as any).nameSearch ?? "")
      .trim()
      .toLowerCase();

    const selectedStructure =
      selectionMode === "multiple"
        ? String(multiSalaryStructureName ?? "").trim()
        : "";

    const canFilterByStructure =
      Boolean(selectedStructure) &&
      !multiAssignmentsLoading &&
      Array.isArray(multiStructureAssignments) &&
      multiStructureAssignments.length > 0;

    return active.filter((e) => {
      const name = String(e.name ?? "").toLowerCase();

      if (canFilterByStructure) {
        const eff = getEffectiveStructureForEmployee(e);
        if (!eff) return false;
        if (eff !== selectedStructure) return false;
      }

      if (q && !name.includes(q)) return false;
      return true;
    });
  }, [
    active,
    data,
    effectiveStructureIndex,
    multiAssignmentsLoading,
    multiSalaryStructureName,
    multiStructureAssignments,
    selectionMode,
  ]);

  const toggleEmp = (id: string) => {
    if (selectionMode === "single") {
      onChange(
        "selectedEmployees",
        data.selectedEmployees[0] === id ? [] : [id],
      );
      return;
    }

    const next = data.selectedEmployees.includes(id)
      ? data.selectedEmployees.filter((i) => i !== id)
      : [...data.selectedEmployees, id];

    onChange("selectedEmployees", next);
  };

  const updateFilter = (field: string, value: any) => {
    onChange(field, value);
    setPage(1);
  };

  const setSelectionMode = (mode: "single" | "multiple") => {
    onChange("employeeSelectionMode", mode);
    if (mode === "single" && data.selectedEmployees.length > 1) {
      onChange("selectedEmployees", data.selectedEmployees.slice(0, 1));
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageSafe = Math.min(page, totalPages);

  const pageEmployees = useMemo(
    () => filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize),
    [filtered, pageSafe],
  );

  return (
    <div className="flex flex-col gap-4 min-h-0 animate-[fadeIn_0.2s_ease]">
      <MultiPayrollPreviewModal
        open={multiModalOpen}
        employees={active}
        selectedEmployeeIds={data.selectedEmployees}
        structureName={String((fallbackSalaryStructureName || "").trim())}
        currency={String(data.currency ?? "")}
        payPeriodStart={String(data.startDate ?? "")}
        payPeriodEnd={String(data.endDate ?? "")}
        onPayPeriodStartChange={(v: string) => onChange("startDate", v)}
        onPayPeriodEndChange={(v: string) => onChange("endDate", v)}
        onClose={() => setMultiModalOpen(false)}
        onRunPayroll={runMultiplePayroll}
        runPayrollDisabled={!canRunMultiplePayroll || multiSubmitting}
        runPayrollLoading={multiSubmitting}
      />

      <PayrollPreviewModal
        open={singleModalOpen}
        structureName={String((singleSalaryStructureName || "").trim())}
        currency={String(data.currency ?? "")}
        payPeriodStart={String(data.startDate ?? "")}
        payPeriodEnd={String(data.endDate ?? "")}
        onPayPeriodStartChange={(v: string) => onChange("startDate", v)}
        onPayPeriodEndChange={(v: string) => onChange("endDate", v)}
        onClose={() => {
          setSingleModalOpen(false);
          onChange("selectedEmployees", []);
        }}
        onRunPayroll={runSinglePayroll}
        runPayrollDisabled={
          !canRunSinglePayroll || singleSubmitting || singleAssignmentLoading
        }
        runPayrollLoading={singleSubmitting}
      />

      <div className="border border-theme rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="shrink-0 px-4 py-3 bg-card border-b border-theme">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {isLoading ? (
                <div className="h-9 w-44 bg-theme/60 rounded-lg animate-pulse" />
              ) : (
                <div className="flex items-center gap-3 px-3 py-2 bg-app border border-theme rounded-lg">
                  <label
                    className={`inline-flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      selectionMode === "single" ? "text-primary" : "text-main"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payroll-selection-mode"
                      value="single"
                      checked={selectionMode === "single"}
                      onChange={() => setSelectionMode("single")}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Single
                  </label>
                  <label
                    className={`inline-flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      selectionMode === "multiple" ? "text-primary" : "text-main"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payroll-selection-mode"
                      value="multiple"
                      checked={selectionMode === "multiple"}
                      onChange={() => setSelectionMode("multiple")}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Multiple
                  </label>
                </div>
              )}

                {isLoading ? (
                <div className="h-4 w-24 bg-theme/60 rounded animate-pulse" />
              ) : (
                <div className="text-xs text-muted whitespace-nowrap">
                  {filtered.length} employees
                </div>
              )}

              {selectionMode === "multiple" && !isLoading && (
                <select
                  value={multiSalaryStructureName}
                  onChange={(e) => setMultiSalaryStructureName(e.target.value)}
                  className={miniSelectCls}
                  disabled={salaryStructuresLoading}
                >
                  <option value="">Salary structure</option>
                  {salaryStructures
                    .filter((s) => Boolean((s as any)?.is_active ?? true))
                    .map((s) => (
                      <option key={String(s.name)} value={String(s.name)}>
                        {String(s.name)}
                      </option>
                    ))}
                </select>
              )}

              {isLoading ? (
                <div className="h-9 w-56 bg-theme/60 rounded-lg animate-pulse" />
              ) : (
                <input
                  type="text"
                  value={(data as any).nameSearch ?? ""}
                  onChange={(e) => updateFilter("nameSearch", e.target.value)}
                  placeholder="Search name"
                  className={miniInputCls}
                />
              )}
            </div>

            <div className="flex items-center justify-end">
              {isLoading ? (
                <div className="h-6 w-24 bg-theme/60 rounded-full animate-pulse" />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rows = pageEmployees.map((e) => ({
                        id: e.id,
                        employee_id: (e as any).employeeId,
                        name: e.name,
                        job_title: (e as any).jobTitle,
                        department: (e as any).department,
                        status: (e as any).status,
                        gross_salary: (e as any).grossSalary,
                        email: (e as any).email,
                      }));
                      downloadCsv(
                        `employees_${new Date().toISOString().slice(0, 10)}.csv`,
                        toCsv(rows),
                      );
                    }}
                    disabled={pageEmployees.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-theme bg-card text-main hover:bg-app disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                    {data.selectedEmployees.length}/{filtered.length} selected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full">
            <thead className="bg-app border-b border-theme">
              <tr>
                {[
                  "",
                  "ID",
                  "Employee ID",
                  "Name",
                  "Job Title",
                  "Department",
                  "Work Location",
                  "Gross Salary",
                  "Status",
                  "",
                ].map((h, i) => (
                  <th
                    key={String(i)}
                    className={`px-4 py-3 text-[10px] font-extrabold text-muted uppercase tracking-wider whitespace-nowrap ${
                      i >= 7 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, skIdx) => (
                  <tr
                    key={`sk-${skIdx}`}
                    className={skIdx % 2 === 1 ? "bg-app" : "bg-card"}
                  >
                    {Array.from({ length: 10 }).map((__, cIdx) => (
                      <td key={String(cIdx)} className="px-4 py-3">
                        <div
                          className={`h-3 bg-theme/60 rounded animate-pulse ${
                            cIdx === 0 ? "w-4" : cIdx === 3 ? "w-32" : "w-20"
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    Doesn't exist
                  </td>
                </tr>
              ) : (
                pageEmployees.map((emp, i) => {
                  const isSel = data.selectedEmployees.includes(emp.id);

                  const gross = Number(emp.grossSalary ?? 0);

                  const statusLabel = String(
                    emp.status ?? (emp.isActive ? "Active" : "Inactive"),
                  );

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => toggleEmp(emp.id)}
                      className={`border-b border-theme last:border-0 cursor-pointer transition-colors ${
                        isSel
                          ? "bg-primary/5"
                          : i % 2 === 1
                            ? "bg-app hover:bg-primary/3"
                            : "bg-card hover:bg-app"
                      }`}
                    >
                      <td
                        className="px-4 py-3 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleEmp(emp.id)}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-main whitespace-nowrap">
                        {emp.id}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {emp.employeeId || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-main whitespace-nowrap">
                        {emp.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {emp.jobTitle || emp.designation || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {emp.department || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        {emp.workLocation || emp.branch || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-extrabold text-main tabular-nums whitespace-nowrap">
                        ZMW {gross.toLocaleString("en-ZM")}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            statusLabel.toLowerCase() === "active"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewEmployee?.(emp.id)}
                            className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition shrink-0"
                            aria-label="View employee details"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onEditEmployee && (
                            <button
                              onClick={() => onEditEmployee(emp)}
                              className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition shrink-0"
                              aria-label="Edit employee"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-app border-t border-theme">
            <div className="text-xs text-muted">
              Page {pageSafe} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-theme bg-card text-main disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-theme bg-card text-main disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AccountingTabProps {
  data: PayrollEntry;

  onChange: (field: string, value: any) => void;

  employees: Employee[];
}

export const AccountingTab: React.FC<AccountingTabProps> = ({
  data,
  onChange,
  employees,
}) => {
  const selectedEmps = employees.filter((e) =>
    data.selectedEmployees.includes(e.id),
  );

  const totalGross = selectedEmps.reduce(
    (s, e) => s + Number(e.grossSalary ?? 0),
    0,
  );

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease]">
      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label>Payment Account</Label>

          <select
            value={(data as any).paymentAccount ?? ""}
            onChange={(e) => onChange("paymentAccount", e.target.value)}
            className={selectCls}
          >
            <option value="">Select account</option>

            <option value="current">Current Account</option>

            <option value="salary">Salary Account</option>
          </select>
        </div>

        <div>
          <Label>Cost Center</Label>

          <input
            type="text"
            value={(data as any).costCenter ?? ""}
            onChange={(e) => onChange("costCenter", e.target.value)}
            placeholder="e.g. HQ-Operations"
            className={inputCls}
          />
        </div>

        <div>
          <Label>Project</Label>

          <input
            type="text"
            value={(data as any).project ?? ""}
            onChange={(e) => onChange("project", e.target.value)}
            placeholder="e.g. Internal Payroll"
            className={inputCls}
          />
        </div>

        <div>
          <Label>Letter Head</Label>

          <input
            type="text"
            value={(data as any).letterHead ?? ""}
            onChange={(e) => onChange("letterHead", e.target.value)}
            placeholder="e.g. Company Letterhead"
            className={inputCls}
          />
        </div>
      </div>

      {data.selectedEmployees.length > 0 && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-5">
          <p className="text-xs font-extrabold text-success uppercase tracking-wider mb-4">
            Payroll Summary
          </p>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Employees", value: data.selectedEmployees.length },

              {
                label: "Est. Gross",
                value: `ZMW ${totalGross.toLocaleString("en-ZM")}`,
              },

              { label: "Currency", value: (data as any).currency || "—" },

              {
                label: "Frequency",
                value: (data as any).payrollFrequency || "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-success/70 uppercase tracking-wider">
                  {label}
                </p>

                <p className="text-lg font-extrabold text-success mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
