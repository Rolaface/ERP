import { useState, useEffect, useCallback } from "react";
import { getAllEmployees } from "../../api/employeeapi";
import { getTemplateList, type TemplateItem } from "../../api/Appraisalapi/templeteApi";
import { getallbranches, getAllDesignations, getAllDepartments } from "../../api/utils/frappeUtilsApi";
import type { AppraiseeRow, CycleItem } from "../../api/Appraisalapi/performanceCycleApi";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewCyclePayload {
  cycle_name: string;
  start_date: string;
  end_date: string;
  appraisees: AppraiseeRow[];
}

interface FormState {
  cycle_name: string;
  start_date: string;
  end_date: string;
}

interface Errors {
  cycle_name?: string;
  start_date?: string;
  end_date?: string;
}

export interface SSOption {
  label: string;
  value: string;
}

// ─── Empty row factory ────────────────────────────────────────────────────────

export const makeEmptyRow = (): AppraiseeRow => ({
  employee:           "",
  employee_name:      "",
  appraisal_template: "",
  department:         "",
  designation:        "",
  branch:             "",
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCycleModal(
  isOpen: boolean,
  onSave: (payload: NewCyclePayload) => void,
  onClose: () => void,
  modalId: string,
  viewData?: CycleItem | null,
  isViewMode?: boolean,
) {
  const [activeTab, setActiveTab] = useState<"overview" | "applicable">("overview");

  // ── Form ──
  const [form, setForm]       = useState<FormState>({ cycle_name: "", start_date: "", end_date: "" });
  const [errors, setErrors]   = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // ── Filters ──
  const [filterBranch,      setFilterBranch]      = useState("");
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterDepartment,  setFilterDepartment]  = useState("");

  // ── Appraisees──
  const [appraisees,  setAppraisees]  = useState<AppraiseeRow[]>([makeEmptyRow()]);
  const [loadingEmps, setLoadingEmps] = useState(false);
  const [empError,    setEmpError]    = useState<string | null>(null);

  // ── Templates cache ──
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  // ── Unsaved changes ──
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  // ── Fetch templates once when modal opens ──
  useEffect(() => {
    if (!isOpen) return;
    getTemplateList({ pageSize: 200 })
      .then((r) => setTemplates(r.data))
      .catch(() => setTemplates([]));
  }, [isOpen]);

  // ── Populate form when opening in view mode ──
  useEffect(() => {
    if (isOpen && isViewMode && viewData) {
      setForm({
        cycle_name: viewData.cycle_name,
        start_date: viewData.start_date,
        end_date:   viewData.end_date,
      });
    }
  }, [isOpen, isViewMode, viewData]);

  // ── Populate appraisees when viewData changes (getCycleById hydrates it) ──
  useEffect(() => {
    if (isViewMode && viewData?.appraisees) {
      setAppraisees(viewData.appraisees);
    }
  }, [isViewMode, viewData]);

  // ── Reset to one empty row when create modal opens ──
  useEffect(() => {
    if (isOpen && !isViewMode) {
      setAppraisees([makeEmptyRow()]);
      setForm({ cycle_name: "", start_date: "", end_date: "" });
      setErrors({});
      setTouched(new Set());
      setActiveTab("overview");
      setFilterBranch("");
      setFilterDesignation("");
      setFilterDepartment("");
      setEmpError(null);
    }
  }, [isOpen, isViewMode]);

  // ── SearchSelect fetch functions ──────────────────────────────────────────

  const fetchBranches = useCallback(async (q: string): Promise<SSOption[]> => {
    try {
      const data = await getallbranches(q || undefined);
      return data.map((b: any) => ({
        label: b.label ?? b.name ?? String(b),
        value: b.value ?? b.name ?? String(b),
      }));
    } catch { return []; }
  }, []);

  const fetchDesignations = useCallback(async (q: string): Promise<SSOption[]> => {
    try {
      const data = await getAllDesignations(q || undefined);
      return data.map((d: any) => ({
        label: d.label ?? d.designation_name ?? d.name ?? String(d),
        value: d.value ?? d.name ?? String(d),
      }));
    } catch { return []; }
  }, []);

  const fetchDepartments = useCallback(async (q: string): Promise<SSOption[]> => {
    try {
      const data = await getAllDepartments(q || undefined);
      return data.map((d: any) => ({
        label: d.label ?? d.department_name ?? d.name ?? String(d),
        value: d.value ?? d.name ?? String(d),
      }));
    } catch { return []; }
  }, []);

  const fetchTemplates = useCallback(async (q: string): Promise<SSOption[]> => {
    try {
      const r = await getTemplateList({ search: q, pageSize: 50 });
      return r.data.map((t) => ({ label: t.template_title, value: t.name }));
    } catch { return []; }
  }, []);

  const fetchEmployees = useCallback(async (q: string): Promise<SSOption[]> => {
    try {
      const resp = await getAllEmployees(1, 50, "Active", q || undefined);
      const list: any[] = resp?.data ?? resp ?? [];
      return list.map((e) => ({
        label: e.employee_name ?? e.full_name ?? e.name,
        value: e.name,
      }));
    } catch { return []; }
  }, []);

  // ── Form field setter ─────────────────────────────────────────────────────

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => new Set(prev).add(field));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    markDirty();
  };

  const getError = (field: keyof Errors): string | undefined =>
    touched.has(field) ? errors[field] : undefined;

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.cycle_name.trim()) e.cycle_name = "Cycle name is required";
    if (!form.start_date)        e.start_date = "Start date is required";
    if (!form.end_date)          e.end_date   = "End date is required";
    if (form.start_date && form.end_date && form.end_date <= form.start_date)
      e.end_date = "End date must be after start date";
    return e;
  };

  // ── Get Employees (replaces current list) ─────────────────────────────────

  const handleGetEmployees = useCallback(async () => {
    setLoadingEmps(true);
    setEmpError(null);
    try {
      const resp = await getAllEmployees(1, 200, "Active");
      let employees: any[] = resp?.data ?? resp ?? [];

      if (filterBranch)       employees = employees.filter((e) => e.branch       === filterBranch);
      if (filterDesignation)  employees = employees.filter((e) => e.designation  === filterDesignation);
      if (filterDepartment)   employees = employees.filter((e) => e.department   === filterDepartment);

      const defaultTemplate = templates[0]?.name ?? "";

      setAppraisees(
        employees.map((e) => ({
          employee:           e.name,
          employee_name:      e.employee_name ?? e.full_name ?? "",
          appraisal_template: defaultTemplate,
          department:         e.department  ?? "",
          designation:        e.designation ?? "",
          branch:             e.branch      ?? "",
        }))
      );
      markDirty();
    } catch {
      setEmpError("Failed to fetch employees. Please try again.");
    } finally {
      setLoadingEmps(false);
    }
  }, [filterBranch, filterDesignation, filterDepartment, templates, markDirty]);

  // ── Appraisee helpers ─────────────────────────────────────────────────────

  /** Add a new empty row (or a pre-built row) to the bottom of the list */
  const addAppraisee = useCallback((row?: AppraiseeRow) => {
    setAppraisees((prev) => [...prev, row ?? makeEmptyRow()]);
    markDirty();
  }, [markDirty]);

  /** Update template for a row identified by employeeId */
  const updateAppraiseeTemplate = useCallback((employeeId: string, templateName: string) => {
    setAppraisees((prev) =>
      prev.map((a) =>
        a.employee === employeeId ? { ...a, appraisal_template: templateName } : a
      )
    );
    markDirty();
  }, [markDirty]);

  /**
   * Update the employee field of an existing row.
   * Uses "first match" so multiple empty rows (employee === "") are handled correctly.
   */
  const updateAppraiseeEmployee = useCallback(
    (oldId: string, newId: string, newName: string) => {
      setAppraisees((prev) => {
        let updated = false;
        return prev.map((a) => {
          if (!updated && a.employee === oldId) {
            updated = true;
            return { ...a, employee: newId, employee_name: newName };
          }
          return a;
        });
      });
      markDirty();
    },
    [markDirty],
  );

  /** Remove a row — first match by employeeId */
  const removeAppraisee = useCallback((employeeId: string) => {
    setAppraisees((prev) => {
      let removed = false;
      return prev.filter((a) => {
        if (!removed && a.employee === employeeId) {
          removed = true;
          return false;
        }
        return true;
      });
    });
    markDirty();
  }, [markDirty]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setTouched(new Set(Object.keys(form)));
      setActiveTab("overview");
      return;
    }
    // Strip completely blank rows before sending to API
    const validAppraisees = appraisees.filter((a) => a.employee.trim() !== "");
    onSave({
      cycle_name: form.cycle_name,
      start_date: form.start_date,
      end_date:   form.end_date,
      appraisees: validAppraisees,
    });
    resetDirty();
    resetAll();
  };

  // ── Close / Reset ─────────────────────────────────────────────────────────

  const resetAll = () => {
    setForm({ cycle_name: "", start_date: "", end_date: "" });
    setErrors({});
    setTouched(new Set());
    setActiveTab("overview");
    setAppraisees([makeEmptyRow()]);
    setFilterBranch("");
    setFilterDesignation("");
    setFilterDepartment("");
    setEmpError(null);
  };

  const handleClose = () => {
    handleCloseWithConfirm(() => {
      resetDirty();
      resetAll();
      onClose();
    }, modalId);
  };

  // ── Date range display ────────────────────────────────────────────────────

  const dateRangeMonths =
    form.start_date && form.end_date && !errors.end_date
      ? Math.round(
          (new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
        )
      : null;

  const formatDateDisplay = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  return {
    // Tab
    activeTab, setActiveTab,

    // Form
    form, setField, getError,

    // Filters
    filterBranch,      setFilterBranch,
    filterDesignation, setFilterDesignation,
    filterDepartment,  setFilterDepartment,

    // Fetch fns for SearchSelect2
    fetchBranches,
    fetchDesignations,
    fetchDepartments,
    fetchTemplates,
    fetchEmployees,

    // Templates
    templates,

    // Appraisees
    appraisees,
    loadingEmps,
    empError,
    handleGetEmployees,
    addAppraisee,
    updateAppraiseeTemplate,
    updateAppraiseeEmployee,
    removeAppraisee,

    // Actions
    handleSave,
    handleClose,

    // Derived
    dateRangeMonths,
    formatDateDisplay,

    // Unsaved changes
    markDirty,
    resetDirty,
  };
}