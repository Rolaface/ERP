import { useCallback, useMemo, useState } from "react";
import {
  createTimesheet,
  updateTimesheetById,
} from "../../../../api/project/timesheet/timesheet.api";
import type {
  TimesheetFormState,
  TimesheetLineDraft,
  TimesheetCreatePayload,
} from "../../../../types/Project_Management/Timesheet/form/timesheetForm.types";
import type { TimesheetDetail } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import type { Option } from "../../../../components/ui/modal/SearchSelect2";
import { showApiError, showSuccess } from "../../../../utils/alert";
import { getEmployees } from "../../../../api/utils/frappeUtilsApi";
import { getAllProjects } from "../../../../api/project/projectapi/project.api";
import { getAllTasks } from "../../../../api/project/task/taskapi";
import { getAllActivityTypes } from "../../../../api/project/projectapi/Activity/activityType.api";
import { useCompanyDefaultsStore } from "../../../../store/Companydefaultsstore";
import { getExchangeRate } from "../../../../api/BankAccountApi";
import { fireManagedSwal } from "../../../../utils/swalManager";

export async function fetchActivityTypeOptions(
  search: string,
): Promise<Option[]> {
  const activityTypes = await getAllActivityTypes(search);

  return activityTypes
    .filter((activityType) => !activityType.disabled)
    .map((activityType) => ({
      label: activityType.activity_type || activityType.name,
      value: activityType.name,
      meta: {
        billing_rate: Number(activityType.billing_rate ?? 0),
        costing_rate: Number(activityType.costing_rate ?? 0),
      },
    }));
}

export type DuplicatePosition = "after" | "end";

export async function fetchProjectOptions(
  search: string,
  allowedProjectIds?: string[],
): Promise<Option[]> {
  const projects = await getAllProjects(search);

  const filtered =
    allowedProjectIds && allowedProjectIds.length > 0
      ? projects.filter((p) => allowedProjectIds.includes(p.name))
      : projects;

  return filtered.map((project) => ({
    label: project.project_name,
    value: project.name,
    subLabel: project.name,
  }));
}

export async function fetchCustomerOptions(_q: string): Promise<Option[]> {
  return [
    { label: "Rolaface Corp", value: "CUST-001", meta: { currency: "INR" } },
    { label: "Apex Health UK", value: "CUST-004", meta: { currency: "GBP" } },
    { label: "Global Academy", value: "CUST-002", meta: { currency: "USD" } },
  ];
}

export async function fetchEmployeeOptions(search: string): Promise<Option[]> {
  return getEmployees(search);
}

export async function fetchTaskOptions(
  projectId: string,
  search: string,
): Promise<Option[]> {
  if (!projectId) return [];

  const tasks = await getAllTasks(projectId, search, {
    excludeGroups: true,
    excludeStatuses: ["Cancelled"],
  });

  return tasks.map((task) => ({
    label: task.subject,
    value: task.name,
    subLabel: task.name,
  }));
}

interface InitialTask {
  project: string;
  project_name: string;
  task: string;
  task_name: string;
}

function calcHours(
  date: string,
  from: string,
  toDate: string,
  to: string,
): number {
  if (!date || !toDate || !from || !to) return 0;
  const start = new Date(`${date}T${from}:00`).getTime();
  const end = new Date(`${toDate}T${to}:00`).getTime();
  let diff = (end - start) / 60000;
  if (diff < 0 && toDate === date) diff += 24 * 60;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

type SlotFields = Pick<
  TimesheetLineDraft,
  "date" | "to_date" | "from_time" | "to_time"
>;

const DAY_MS = 24 * 60 * 60 * 1000;

export const OVERLAP_MSG =
  "This time slot overlaps with another entry. Please choose a different time.";

function lineRange(l: SlotFields): { s: number; e: number } | null {
  if (!l.date || !l.to_date || !l.from_time || !l.to_time) return null;
  const s = new Date(`${l.date}T${l.from_time}:00`).getTime();
  let e = new Date(`${l.to_date}T${l.to_time}:00`).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  if (e <= s && l.to_date === l.date) e += DAY_MS;
  return e > s ? { s, e } : null;
}

export function isSlotTaken(
  lines: TimesheetLineDraft[],
  excludeId: string,
  candidate: SlotFields,
): boolean {
  const c = lineRange(candidate);
  if (!c) return false;
  return lines.some((o) => {
    if (o.id === excludeId) return false;
    const r = lineRange(o);
    return r !== null && c.s < r.e && r.s < c.e;
  });
}

export function getConflictingLineIds(
  lines: TimesheetLineDraft[],
): Set<string> {
  const ids = new Set<string>();
  lines.forEach((l) => {
    if (isSlotTaken(lines, l.id, l)) ids.add(l.id);
  });
  return ids;
}

const DEFAULT_SLOT_MINUTES = 240;
const PREFERRED_START_MINUTES = 9 * 60;

const pad = (n: number) => String(n).padStart(2, "0");

const toDateStr = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimeStr = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function slotDurationMs(l: SlotFields): number {
  const r = lineRange(l);
  return r ? r.e - r.s : DEFAULT_SLOT_MINUTES * 60000;
}

function findFreeSlot(
  lines: TimesheetLineDraft[],
  date: string,
  durationMs: number,
): SlotFields | null {
  if (durationMs <= 0 || durationMs > DAY_MS) return null;
  const busy = lines
    .map(lineRange)
    .filter((r): r is { s: number; e: number } => r !== null);
  let dayStart = new Date(`${date}T00:00:00`).getTime();
  if (Number.isNaN(dayStart)) return null;

  for (let i = 0; i < 366; i++, dayStart += DAY_MS) {
    const dayEnd = dayStart + DAY_MS;
    const afterBusy = busy
      .map((r) => r.e)
      .filter((e) => e > dayStart && e < dayEnd)
      .sort((a, b) => a - b);
    const starts = [
      dayStart + PREFERRED_START_MINUTES * 60000,
      ...afterBusy,
      dayStart,
    ];
    for (const s of starts) {
      const e = s + durationMs;
      if (busy.some((r) => s < r.e && r.s < e)) continue;
      return {
        date: toDateStr(s),
        from_time: toTimeStr(s),
        to_date: toDateStr(e),
        to_time: toTimeStr(e),
      };
    }
  }
  return null;
}

function placeLine(
  line: TimesheetLineDraft,
  existing: TimesheetLineDraft[],
  durationMs: number = DEFAULT_SLOT_MINUTES * 60000,
): TimesheetLineDraft {
  const slot = findFreeSlot(existing, line.date, durationMs);
  if (!slot) return line;
  return {
    ...line,
    ...slot,
    hours: calcHours(slot.date, slot.from_time, slot.to_date, slot.to_time),
  };
}

const today = () => new Date().toISOString().slice(0, 10);

function splitDateTime(dt: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!dt) return { date: today(), time: "00:00" };
  const [date, time] = dt.split(" ");
  return { date: date || today(), time: time ? time.slice(0, 5) : "00:00" };
}

function emptyLine(
  headerProject?: { project: string; project_name: string },
  initialTask?: InitialTask,
  initialDate?: string,
): TimesheetLineDraft {
  const date = initialDate || today();
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    isEditing: true,
    project: initialTask?.project ?? headerProject?.project ?? "",
    project_name:
      initialTask?.project_name ?? headerProject?.project_name ?? "",
    projectManuallySet: Boolean(initialTask),
    task: initialTask?.task ?? "",
    task_name: initialTask?.task_name ?? "",
    activity_type: "",
    description: "",
    date,
    to_date: date,
    from_time: "09:00",
    to_time: "13:00",
    hours: calcHours(date, "09:00", date, "13:00"),
    is_completed: false,
    is_billable: true,
    billing_rate: 0,
    costing_rate: 0,
  };
}

function mapTimeLogToLine(
  log: TimesheetDetail["time_logs"][number],
): TimesheetLineDraft {
  const from = splitDateTime(log.from_time);
  const to = splitDateTime(log.to_time);
  return {
    id: `line-${log.name}`,
    isEditing: false,
    project: log.project,
    project_name: log.project_name ?? log.project,
    projectManuallySet: true,
    task: log.task ?? "",
    task_name: log.task_name ?? log.task ?? "",
    activity_type: log.activity_type,
    description: log.description ?? "",
    date: from.date,
    to_date: to.date,
    from_time: from.time,
    to_time: to.time,
    hours: log.hours,
    is_completed: Boolean(log.completed),
    is_billable: Boolean(log.is_billable),
    billing_rate: log.billing_rate ?? 0,
    costing_rate: log.costing_rate ?? 0,
    logName: log.name,
  };
}

export interface TimesheetModalRestrictions {
  employee?: { id: string; name: string };
  allowedProjectIds?: string[];
  lockCustomer?: { id: string; name: string; currency?: string };
}

export interface UseTimesheetModalOptions {
  onSuccess?: () => void;
  restrictions?: TimesheetModalRestrictions;
}

function emptyForm(
  restrictions?: TimesheetModalRestrictions,
): TimesheetFormState {
  return {
    project: "",
    project_name: "",
    customer: restrictions?.lockCustomer?.id ?? "",
    customer_name: restrictions?.lockCustomer?.name ?? "",
    employee: restrictions?.employee?.id ?? "",
    employee_name: restrictions?.employee?.name ?? "",
    department: "",
    currency: restrictions?.lockCustomer?.currency ?? "",
    exchange_rate: 1,
    start_date: today(),
    lines: [],
  };
}

export function useTimesheetModal(
  onSuccessOrOptions?: (() => void) | UseTimesheetModalOptions,
) {
  const opts: UseTimesheetModalOptions =
    typeof onSuccessOrOptions === "function"
      ? { onSuccess: onSuccessOrOptions }
      : (onSuccessOrOptions ?? {});
  const { onSuccess, restrictions } = opts;

  const [form, setForm] = useState<TimesheetFormState>(() =>
    emptyForm(restrictions),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editingName, setEditingName] = useState<string | undefined>(
    undefined,
  );

  const reset = useCallback(() => {
    setForm(emptyForm(restrictions));
    setEditingName(undefined);
  }, [restrictions]);

  const loadFromDetail = useCallback((detail: TimesheetDetail) => {
    setEditingName(detail.name);
    setForm({
      project: "",
      project_name: "",
      customer: detail.customer ?? "",
      customer_name: detail.customer ?? "",
      employee: detail.employee,
      employee_name: detail.employee_name,
      department: detail.department ?? "",
      currency: detail.currency,
      exchange_rate: detail.exchange_rate ?? 1,
      start_date: detail.start_date,
      lines: detail.time_logs.map(mapTimeLogToLine),
    });
  }, []);

  const isEditMode = Boolean(editingName);

  const setProject = useCallback((value: string, opt: Option) => {
    setForm((f) => ({
      ...f,
      project: value,
      project_name: opt.label,
      lines: f.lines.map((l) =>
        l.projectManuallySet
          ? l
          : {
              ...l,
              project: value,
              project_name: opt.label,
              task: "",
              task_name: "",
            },
      ),
    }));
  }, []);

  const setCustomer = useCallback(
    async (value: string, opt: Option) => {
      if (restrictions?.lockCustomer) return;

      const meta = opt.meta as { currency?: string } | undefined;
      const customerCurrency = meta?.currency ?? "";

      const companyCurrency =
        useCompanyDefaultsStore.getState().defaults?.default_currency;

      let exchangeRate = 1;

      if (
        companyCurrency &&
        customerCurrency &&
        companyCurrency !== customerCurrency
      ) {
        const result = await getExchangeRate(
          customerCurrency,
          companyCurrency,
          today(),
          "for_selling",
        );

        if (result.error || result.rate == null) {
          showApiError(result.error || "Failed to fetch exchange rate.");
          return;
        }

        exchangeRate = result.rate;
      }

      setForm((f) => ({
        ...f,
        customer: value,
        customer_name: opt.label,
        currency: customerCurrency,
        exchange_rate: exchangeRate,
      }));
    },
    [restrictions?.lockCustomer],
  );

  const setEmployee = useCallback(
    (value: string, opt: Option) => {
      if (restrictions?.employee) return;
      setForm((f) => ({ ...f, employee: value, employee_name: opt.label }));
    },
    [restrictions?.employee],
  );

  const setStartDate = useCallback((date: string) => {
    setForm((f) => ({ ...f, start_date: date }));
  }, []);

  const addLine = useCallback(
    (initialTask?: InitialTask, initialDate?: string) => {
      setForm((f) => ({
        ...f,
        lines: [
          ...f.lines,
          placeLine(
            emptyLine(
              f.project
                ? { project: f.project, project_name: f.project_name }
                : undefined,
              initialTask,
              initialDate,
            ),
            f.lines,
          ),
        ],
      }));
    },
    [],
  );

  const addLines = useCallback(
    (tasks: InitialTask[], initialDate?: string) => {
      if (tasks.length === 0) return;
      setForm((f) => {
        const lines = [...f.lines];
        tasks.forEach((t) =>
          lines.push(placeLine(emptyLine(undefined, t, initialDate), lines)),
        );
        return { ...f, lines };
      });
    },
    [],
  );

  const updateLine = useCallback(
    (id: string, patch: Partial<TimesheetLineDraft>) => {
      setForm((f) => ({
        ...f,
        lines: f.lines.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l, ...patch };
          if (patch.date !== undefined && patch.to_date === undefined) {
            if (next.to_date < next.date) next.to_date = next.date;
          }
          if (
            patch.date !== undefined ||
            patch.to_date !== undefined ||
            patch.from_time !== undefined ||
            patch.to_time !== undefined
          ) {
            next.hours = calcHours(
              next.date,
              next.from_time,
              next.to_date,
              next.to_time,
            );
          }
          return next;
        }),
      }));
    },
    [],
  );

  const setLineProject = useCallback(
    (id: string, value: string, opt: Option) => {
      updateLine(id, {
        project: value,
        project_name: opt.label,
        projectManuallySet: true,
        task: "",
        task_name: "",
      });
    },
    [updateLine],
  );

  const setLineTask = useCallback(
    (id: string, value: string, opt: Option) => {
      updateLine(id, { task: value, task_name: opt.label });
    },
    [updateLine],
  );

  const setLineActivity = useCallback(
    (id: string, value: string, opt: Option) => {
      updateLine(id, {
        activity_type: value,
        billing_rate: Number(opt.meta?.billing_rate ?? 0),
        costing_rate: Number(opt.meta?.costing_rate ?? 0),
      });
    },
    [updateLine],
  );

  const confirmLine = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l) => (l.id === id ? { ...l, isEditing: false } : l)),
    }));
  }, []);

  const editLine = useCallback((id: string) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l) => (l.id === id ? { ...l, isEditing: true } : l)),
    }));
  }, []);

  const removeLine = useCallback((id: string) => {
    setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.id !== id) }));
  }, []);

  const removeLines = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setForm((f) => ({ ...f, lines: f.lines.filter((l) => !idSet.has(l.id)) }));
  }, []);

  const duplicateLine = useCallback(
    (id: string, position: DuplicatePosition = "after") => {
      setForm((f) => {
        const idx = f.lines.findIndex((l) => l.id === id);
        if (idx === -1) return f;
        const src = f.lines[idx];
        const copy = placeLine(
          {
            ...src,
            id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            logName: undefined,
          },
          f.lines,
          slotDurationMs(src),
        );
        const lines = [...f.lines];
        lines.splice(position === "end" ? lines.length : idx + 1, 0, copy);
        return { ...f, lines };
      });
    },
    [],
  );

  const sortLines = useCallback((direction: "asc" | "desc") => {
    setForm((f) => {
      const key = (l: TimesheetLineDraft) =>
        `${l.date} ${l.from_time} ${l.to_date} ${l.to_time}`;
      const lines = [...f.lines].sort((a, b) => {
        const c = key(a).localeCompare(key(b));
        return direction === "asc" ? c : -c;
      });
      return { ...f, lines };
    });
  }, []);

  const updateLineRates = useCallback(
    (id: string, billingRate: number, costingRate: number) => {
      updateLine(id, { billing_rate: billingRate, costing_rate: costingRate });
    },
    [updateLine],
  );

  const totals = useMemo(() => {
    let totalHours = 0;
    let billableHours = 0;
    let billableAmount = 0;
    let costingAmount = 0;

    form.lines.forEach((l) => {
      totalHours += l.hours;
      costingAmount += l.hours * l.costing_rate;
      if (l.is_billable) {
        billableHours += l.hours;
        billableAmount += l.hours * l.billing_rate;
      }
    });

    return {
      totalHours,
      billableHours,
      billableAmount,
      costingAmount,
      billedAmount: 0,
      percentBilled: 0,
    };
  }, [form.lines]);

  const conflictIds = useMemo(
    () => getConflictingLineIds(form.lines),
    [form.lines],
  );

  const buildPayload = useCallback(
    (exchangeRate: number): TimesheetCreatePayload => {
      const rowStarts = form.lines
        .map((l) => l.date)
        .filter(Boolean)
        .sort();
      const rowEnds = form.lines
        .map((l) => l.to_date)
        .filter(Boolean)
        .sort();
      const derivedStart = rowStarts[0] || today();
      const derivedEnd = rowEnds[rowEnds.length - 1] || today();

      return {
        ...(editingName ? { name: editingName } : {}),
        doctype: "Timesheet",
        employee: form.employee || restrictions?.employee?.id || "",
        employee_name: form.employee_name || restrictions?.employee?.name || "",
        customer: form.customer || undefined,
        department: form.department || undefined,
        currency: form.currency,
        exchange_rate: exchangeRate,
        start_date: derivedStart,
        end_date: derivedEnd,
        time_logs: form.lines.map((l) => ({
          ...(l.logName ? { name: l.logName } : {}),
          doctype: "Timesheet Detail",
          activity_type: l.activity_type,
          project: l.project,
          project_name: l.project_name,
          task: l.task,
          description: l.description,
          from_time: `${l.date} ${l.from_time}:00`,
          to_time: `${l.to_date} ${l.to_time}:00`,
          hours: l.hours,
          billing_hours: l.is_billable ? l.hours : 0,
          is_billable: l.is_billable ? 1 : 0,
          completed: l.is_completed ? 1 : 0,
          billing_rate: l.billing_rate,
          costing_rate: l.costing_rate,
          billing_amount: l.is_billable ? l.hours * l.billing_rate : 0,
          costing_amount: l.hours * l.costing_rate,
        })),
      };
    },
    [form, editingName, restrictions?.employee],
  );

  const validate = useCallback((): string | null => {
    if (form.lines.length === 0) return "Add at least one time entry.";
    if (form.lines.some((l) => l.hours <= 0))
      return "Check from/to times — some rows compute to 0 hours.";
    if (getConflictingLineIds(form.lines).size > 0) return OVERLAP_MSG;
    return null;
  }, [form]);

  const save = useCallback(async (): Promise<boolean> => {
    const err = validate();

    if (err) {
      showApiError(err);
      return false;
    }

    let exchangeRate = form.exchange_rate;

    if (editingName) {
      const companyCurrency =
        useCompanyDefaultsStore.getState().defaults?.default_currency;

      if (
        form.currency &&
        companyCurrency &&
        form.currency !== companyCurrency
      ) {
        const choice = await fireManagedSwal({
          icon: "question",
          title: "Exchange rate may be outdated",
          text: `This timesheet's exchange rate (${form.exchange_rate}) was set earlier and you're editing it now. Keep the existing rate, or refetch today's rate?`,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Refetch today's rate",
          denyButtonText: "Keep existing rate",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#2563eb",
          denyButtonColor: "#6b7280",
        });

        if (choice.isDismissed) {
          return false;
        }

        if (choice.isConfirmed) {
          const result = await getExchangeRate(
            form.currency,
            companyCurrency,
            today(),
            "for_selling",
          );

          if (result.error || result.rate == null) {
            showApiError(result.error || "Failed to fetch exchange rate.");
            return false;
          }

          exchangeRate = result.rate;
          setForm((f) => ({ ...f, exchange_rate: exchangeRate }));
        }
      }
    }

    setIsSaving(true);

    try {
      const payload = buildPayload(exchangeRate);

      if (editingName) {
        await updateTimesheetById(payload);
        showSuccess(`Timesheet ${editingName} updated successfully.`);
      } else {
        const response = await createTimesheet(payload);
        showSuccess(`Timesheet ${response.data.name} created successfully.`);
      }

      reset();
      onSuccess?.();

      return true;
    } catch (e) {
      showApiError(e);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [validate, buildPayload, reset, onSuccess, form, editingName]);

  return {
    form,
    totals,
    conflictIds,
    isSaving,
    isEditMode,
    restrictions,
    setProject,
    setCustomer,
    setEmployee,
    setStartDate,
    addLine,
    addLines,
    updateLine,
    setLineProject,
    setLineTask,
    setLineActivity,
    confirmLine,
    editLine,
    removeLine,
    removeLines,
    sortLines,
    duplicateLine,
    updateLineRates,
    loadFromDetail,
    save,
    reset,
  };
}