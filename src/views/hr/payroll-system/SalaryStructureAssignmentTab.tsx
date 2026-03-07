import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import {
  createSalaryStructureAssignment,
  getSalaryStructureAssignments,
  replaceSalaryStructureAssignment,
  type SalaryStructureAssignmentListItem,
} from "../../../api/salaryStructureAssignmentApi";
import {
  getSalaryStructures,
  type SalaryStructureListItem,
} from "../../../api/salaryStructureApi";
import { getAllEmployees } from "../../../api/employeeapi";

type Props = {
  employeeId?: string;
  editableEmployee?: boolean;
  editingAssignment?: SalaryStructureAssignmentListItem | null;
  onAssigned?: () => void;
};

type EmployeeOption = {
  value: string;
  label: string;
  joiningDate?: string;
};

const inputCls =
  "w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main placeholder:text-muted focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition";
const selectCls =
  "w-full px-3 py-2.5 bg-app border border-theme rounded-lg text-sm text-main focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(204,0,0,0.12)] transition cursor-pointer";

const getFriendlyErrorMessage = (e: any) => {
  const data = e?.response?.data;
  const status = Number(e?.response?.status ?? data?.status_code ?? 0) || 0;
  const backendMsg =
    data?.message ??
    data?.error?.message ??
    data?.exc ??
    data?._server_messages ??
    e?.message;
  const msg = String(backendMsg ?? "").trim();

  if (status === 409) {
    return "This salary structure is already assigned to the employee.";
  }

  return msg || "Request failed";
};

export default function SalaryStructureAssignmentTab({
  employeeId,
  editableEmployee,
  editingAssignment,
  onAssigned,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [salaryStructuresLoading, setSalaryStructuresLoading] = useState(false);
  const [salaryStructures, setSalaryStructures] = useState<
    SalaryStructureListItem[]
  >([]);

  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [assignedEmployees, setAssignedEmployees] = useState<Set<string>>(
    new Set(),
  );

  const [form, setForm] = useState({
    employee: employeeId || "",
    salary_structure: "",
    basic: "",
  });

  const isEditing = Boolean(editingAssignment?.name);

  useEffect(() => {
    if (!editingAssignment) return;
    setForm((p) => ({
      ...p,
      employee: String(editingAssignment.employee ?? p.employee ?? ""),
      salary_structure: String(
        editingAssignment.salary_structure ?? p.salary_structure ?? "",
      ),
      basic: String((editingAssignment as any)?.basic ?? p.basic ?? ""),
    }));
  }, [editingAssignment]);

  useEffect(() => {
    if (!employeeId) return;
    setForm((p) => ({ ...p, employee: employeeId }));
  }, [employeeId]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setSalaryStructuresLoading(true);
      try {
        const data = await getSalaryStructures();
        if (!mounted) return;
        setSalaryStructures(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setSalaryStructures([]);
      } finally {
        if (!mounted) return;
        setSalaryStructuresLoading(false);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!editableEmployee) return;

    let mounted = true;

    const run = async () => {
      setEmployeesLoading(true);
      try {
        const resp = await getAllEmployees({ page: 1, page_size: 500 });
        if (!mounted) return;
        const list = Array.isArray(resp?.employees) ? resp.employees : [];
        setEmployees(list);
      } catch {
        if (!mounted) return;
        setEmployees([]);
      } finally {
        if (!mounted) return;
        setEmployeesLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [editableEmployee]);

  useEffect(() => {
    if (!editableEmployee) return;

    let mounted = true;

    const run = async () => {
      try {
        const rows = await getSalaryStructureAssignments();
        if (!mounted) return;
        const set = new Set<string>();
        (Array.isArray(rows) ? rows : []).forEach((r: any) => {
          const emp = String(r?.employee ?? "").trim();
          if (emp) set.add(emp);
        });
        setAssignedEmployees(set);
      } catch {
        if (!mounted) return;
        setAssignedEmployees(new Set());
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [editableEmployee]);

  const structureOptions = useMemo(() => {
    const items = Array.isArray(salaryStructures) ? salaryStructures : [];
    return items
      .map((s) => ({
        value: String(s.name || s.id),
        label: String(s.name || s.id),
        company: String(s.company || ""),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [salaryStructures]);

  const employeeOptions = useMemo<EmployeeOption[]>(() => {
    const items = Array.isArray(employees) ? employees : [];
    const selectedEmployeeCode = String(
      form.employee ?? employeeId ?? "",
    ).trim();
    const allowEmployee = (code: string) => {
      if (!code) return false;
      if (code === selectedEmployeeCode) return true;
      return !assignedEmployees.has(code);
    };

    return items
      .map((e: any) => {
        const code = String(
          e?.employeeId ?? e?.employee_id ?? e?.id ?? "",
        ).trim();
        const fullName = String(e?.name ?? e?.employeeName ?? "").trim();
        const joiningDate = String(
          e?.joiningDate ??
            e?.engagementDate ??
            e?.employmentInfo?.joiningDate ??
            "",
        ).trim();
        return {
          value: code,
          label: fullName ? `${code} — ${fullName}` : code,
          joiningDate,
        };
      })
      .filter((o) => allowEmployee(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employees, assignedEmployees, employeeId, form.employee]);

  const canSubmit = useMemo(() => {
    const basicNum = Number(form.basic);
    const basicOk = Number.isFinite(basicNum) && basicNum > 0;
    if (isEditing) {
      return Boolean(
        form.employee?.trim() && form.salary_structure?.trim() && basicOk,
      );
    }
    return Boolean(
      form.employee?.trim() && form.salary_structure?.trim() && basicOk,
    );
  }, [form]);

  const handleAssign = async () => {
    if (!canSubmit) {
      toast.error("Please fill all required fields");
      return;
    }

    const basicAmount = Number(form.basic);
    if (!Number.isFinite(basicAmount)) {
      toast.error("Please enter a valid basic salary");
      return;
    }

    setLoading(true);
    try {
      const basicNum = Number(form.basic) || 0;
      if (isEditing && editingAssignment?.name) {
        await replaceSalaryStructureAssignment({
          name: String(editingAssignment.name).trim(),
          salary_structure: form.salary_structure.trim(),
          basic: Number.isFinite(basicNum) ? basicNum : 0,
        });
        toast.success("Salary structure assignment updated");
      } else {
        await createSalaryStructureAssignment({
          employee: form.employee.trim(),
          salary_structure: form.salary_structure.trim(),
          basic: Number.isFinite(basicNum) ? basicNum : 0,
        });
        toast.success("Salary structure assigned");
      }
      onAssigned?.();
    } catch (e: any) {
      const friendly = getFriendlyErrorMessage(e);
      toast.error(
        friendly ||
          (isEditing
            ? "Failed to update assignment"
            : "Failed to assign salary structure"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-extrabold text-main">
          Salary Structure Assignment
        </div>
        <div className="text-xs text-muted mt-1">
          Assign a salary structure and basic salary to this employee
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
            Employee
            <span className="text-danger ml-0.5">*</span>
          </label>
          {editableEmployee ? (
            <select
              value={form.employee}
              onChange={(e) =>
                setForm((p) => ({ ...p, employee: e.target.value }))
              }
              aria-label="Employee"
              title="Employee"
              className={selectCls}
              disabled={employeesLoading || isEditing}
            >
              <option value="">
                {employeesLoading ? "Loading..." : "Select employee"}
              </option>
              {employeeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={form.employee}
              readOnly
              aria-label="Employee"
              title="Employee"
              className={`${inputCls} opacity-80`}
            />
          )}
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
            Salary Structure
            <span className="text-danger ml-0.5">*</span>
          </label>
          <select
            value={form.salary_structure}
            onChange={(e) =>
              setForm((p) => ({ ...p, salary_structure: e.target.value }))
            }
            aria-label="Salary Structure"
            title="Salary Structure"
            className={selectCls}
            disabled={salaryStructuresLoading}
          >
            <option value="">
              {salaryStructuresLoading
                ? "Loading..."
                : "Select salary structure"}
            </option>
            {structureOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.company ? `${o.label} (${o.company})` : o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-muted mb-1.5 uppercase tracking-wider">
            Basic Salary
            <span className="text-danger ml-0.5">*</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={form.basic}
            onChange={(e) => setForm((p) => ({ ...p, basic: e.target.value }))}
            placeholder="e.g. 4000"
            className={inputCls}
            min={0}
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleAssign}
          disabled={!canSubmit || loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-extrabold shadow-sm hover:opacity-95 active:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgba(204,0,0,0.18)] disabled:opacity-40 disabled:cursor-not-allowed min-w-40"
        >
          <Save className="w-4 h-4" />
          {loading
            ? isEditing
              ? "Updating..."
              : "Assigning..."
            : isEditing
              ? "Update"
              : "Assign"}
        </button>
      </div>
    </div>
  );
}
