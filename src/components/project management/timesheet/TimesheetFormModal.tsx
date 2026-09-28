import React, { useCallback, useRef, useState ,useEffect} from "react";
import { Clock, Plus, Calendar, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { Popover } from "../../../components/common/Popover";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import { useCompanyDefaultsStore } from "../../../store/Companydefaultsstore";
import DateTimeRangePicker from "../../calendar/DateTimeRangePicker";
import TimesheetSummary from "./TimesheetSummary";
import UpdateRatesPanel from "./UpdateRatesPanel";
import {
  useTimesheetModal,
  fetchActivityTypeOptions,
  fetchProjectOptions,
  fetchEmployeeOptions,
  fetchTaskOptions,
  type TimesheetModalRestrictions,
} from "../../../hooks/project_management/timeheet/form/useTimesheetModal";
import CustomerSelect from "../../../../src/components/selects/CustomerSelect";
import { getTimesheetById } from "../../../api/project/timesheet/timesheet.api";
import { showApiError } from "../../../utils/alert";

interface PrefillTask {
  project: string;
  projectName: string;
  task: string;
  taskName: string;
}

interface TimesheetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  onSuccess?: () => void;
   mode?: "admin" | "employee";
prefillTask?: PrefillTask;
  // Multi-task prefill (e.g. bulk "Log Time" from the Task list): one row per entry.
  prefillTasks?: PrefillTask[];
  restrictions?: TimesheetModalRestrictions;
  title?: string;
  subtitle?: string;
   timesheetId?: string;
}

type RowActionsView = "menu" | "rates";

const TimesheetFormModal: React.FC<TimesheetFormModalProps> = ({
  isOpen,
  onClose,
  modalId,
  onSuccess, mode = "admin",
  prefillTask,
  prefillTasks,
  restrictions,
  title = "New Timesheet",
  subtitle = "Create employee timesheet allocation and track billable hours",
  timesheetId,
}) => {
  const {
    form,
    totals,
    isSaving,
    isEditMode,
    setProject,
    setCustomer,
    setEmployee,
    addLine,
    addLines,
    updateLine,
    setLineProject,
    setLineTask,
    setLineActivity,
    removeLine,
    duplicateLine,
    updateLineRates,
    loadFromDetail,
    reset,
    save,
  } = useTimesheetModal({ onSuccess, restrictions });

  const isEmployee = mode === "employee";

  const [isLoadingTimesheet, setIsLoadingTimesheet] = useState(false);

  // Edit mode: fetch the record and prefill the form the moment the modal
  // opens with a timesheetId. New-Timesheet flow (no id) is untouched.
  useEffect(() => {
    if (!isOpen || !timesheetId) return;
    let cancelled = false;

    (async () => {
      setIsLoadingTimesheet(true);
      try {
        const detail = await getTimesheetById(timesheetId);
        if (!cancelled && detail) loadFromDetail(detail);
      } catch (e) {
        if (!cancelled) showApiError(e);
      } finally {
        if (!cancelled) setIsLoadingTimesheet(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, timesheetId, loadFromDetail]);


  const prefillAppliedRef = useRef(false);

useEffect(() => {
  if (!isOpen) {
    prefillAppliedRef.current = false;
    return;
  }
  if (timesheetId || prefillAppliedRef.current) return;

  // prefillTasks (multi) wins; the single prefillTask flow keeps working.
  const items = prefillTasks?.length
    ? prefillTasks
    : prefillTask
      ? [prefillTask]
      : [];
  if (items.length === 0) return;

  prefillAppliedRef.current = true;
  addLines(
    items.map((p) => ({
      project: p.project,
      project_name: p.projectName,
      task: p.task,
      task_name: p.taskName,
    })),
  );
}, [isOpen, prefillTask, prefillTasks, timesheetId, addLines]);


  

  // Clear stale edit data when the modal closes, so the next "New Timesheet"
  // open doesn't accidentally reopen with a previous record's rows.
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const companyCurrency =
    useCompanyDefaultsStore.getState().defaults?.default_currency;

  
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [actionsView, setActionsView] = useState<RowActionsView>("menu");
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeTriggerRef = {
    current: openActionsId ? (triggerRefs.current[openActionsId] ?? null) : null,
  };

  const closeRowActions = useCallback(() => {
    setOpenActionsId(null);
    setActionsView("menu");
  }, []);

  const handleSave = async () => {
    const ok = await save();
    if (ok) onClose();
  };

  const fetchProjectOptionsRestricted = useCallback(
    (q: string) => fetchProjectOptions(q, restrictions?.allowedProjectIds),
    [restrictions?.allowedProjectIds],
  );

  const hasHeaderProject = Boolean(form.project);
  const activeLine = form.lines.find((l) => l.id === openActionsId) ?? null;

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        onClick={onClose}
        className="px-4 py-1.5 border border-theme text-main bg-app rounded-md text-xs font-medium hover:opacity-80 transition-opacity"
      >
        Cancel
      </button>
     <button
  onClick={handleSave}
  disabled={isSaving}
  className="inline-flex items-center gap-1.5 px-5 py-1.5 bg-primary hover:opacity-90 text-primary-foreground rounded-md text-xs font-semibold transition-opacity shadow-sm disabled:opacity-50"
>
  {isSaving ? "Saving..." : isEditMode ? "Update Timesheet" : "Save Timesheet"}
</button>
    </div>
  );

  return (
<MinimizableModal
  modalId={modalId || "timesheet-form"}
  isOpen={isOpen}
  onClose={onClose}
  title={isEditMode ? "Edit Timesheet" : title}
  subtitle={
    isEditMode
      ? "Update time entries and billing details"
      : subtitle
  }
  icon={Clock}
  footer={footer}
  customWidth="1400px"
  height="750px"
>
      <div className="flex gap-5 h-full min-h-0">
        {/* ── Left: main content area ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-auto">
          {/* Timesheet Information — no header date; date is per-row now */}
          {!isEmployee && (
          <div className="bg-card border border-theme rounded-xl p-4 shrink-0">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-theme">
              <span className="text-[11px] font-bold text-main uppercase tracking-wider">
                Timesheet Information
              </span>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr_110px_120px] gap-4 items-end">
              <SearchSelect2
                label="Project"
                value={form.project_name}
                fetchOptions={fetchProjectOptionsRestricted}
                onChange={setProject}
                placeholder="Search project..."
              />

              {restrictions?.lockCustomer ? (
                <ModalInput
                  label="Customer"
                  value={form.customer_name}
                  disabled
                  name="customer"
                />
              ) : (
                <CustomerSelect
                  label="Customer"
                  value={form.customer_name}
                  selectedId={form.customer}
                  onChange={(customer) => {
                    setCustomer(customer.id, {
                      label: customer.name,
                      value: customer.id,
                      meta: { currency: customer.currency },
                    });
                  }}
                  placeholder="Search customer..."
                />
              )}

              {restrictions?.employee ? (
                <ModalInput
                  label="Employee"
                  value={form.employee_name}
                  disabled
                  name="employee"
                />
              ) : (
                <SearchSelect2
                  label="Employee"
                  value={form.employee_name}
                  fetchOptions={fetchEmployeeOptions}
                  onChange={setEmployee}
                  placeholder="Search employee..."
                />
              )}

              <ModalInput
                label="Currency"
                value={form.currency || ""}
                disabled
                name="currency"
                placeholder="—"
                className="text-center font-mono font-semibold"
              />
              {form.currency && form.currency !== companyCurrency && (
                <ModalInput
                  label="Exchange Rate"
                  value={form.exchange_rate?.toFixed(4) ?? "1.0000"}
                  disabled
                  name="exchange_rate"
                  className="text-center font-mono font-semibold"
                />
              )}
            </div>
          </div>
          )}

          {/* Time entries */}
          <div className="flex-1 min-h-0 flex flex-col bg-card border border-theme rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-theme bg-app/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-primary" />
                <span className="text-[11px] font-bold text-main uppercase tracking-wider">
                  Time Entries
                </span>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {form.lines.length}{" "}
                  {form.lines.length === 1 ? "Entry" : "Entries"}
                </span>
              </div>
              <button
                 onClick={() => addLine()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-xs font-semibold transition-opacity"
              >
                <Plus size={12} /> Add Row
              </button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-app z-10">
                  <tr className="border-b border-theme text-[10px] text-muted font-semibold uppercase tracking-wider">
                    {!hasHeaderProject && (
                      <th className="p-2.5 min-w-[140px]">Project</th>
                    )}
                    <th
                      className={`p-2.5 ${
                        hasHeaderProject ? "min-w-[280px]" : "min-w-[150px]"
                      }`}
                    >
                      Task
                    </th>
                    <th className="p-2.5 min-w-[140px]">Summary</th>
                    <th className="p-2.5 min-w-[120px]">Activity Type</th>
                    <th className="p-2.5 min-w-[220px]">Date &amp; Time</th>
                    <th className="p-2.5 text-right">Hours</th>
                   {!isEmployee && (
  <th className="p-2.5 text-center">Billable</th>
)}
<th className="p-2.5 text-center">Done</th>
                    <th className="p-2.5 text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {form.lines.length === 0 && (
                    <tr>
                      <td
                        colSpan={hasHeaderProject ? 8 : 9}
                        className="p-10 text-center text-muted italic"
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-2xl">📁</span>
                          <span className="font-medium text-xs not-italic">
                            No time entries yet
                          </span>
                          <span className="text-[11px]">
                            Click "+ Add Row" above to log task hours directly
                            inline.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {form.lines.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-app/40 transition-colors"
                    >
                      {!hasHeaderProject && (
                        <td className="p-2">
                          <SearchSelect2
                            label=""
                            value={l.project_name}
                            fetchOptions={fetchProjectOptionsRestricted}
                            onChange={(val, opt) =>
                              setLineProject(l.id, val, opt)
                            }
                            placeholder="Project"
                          />
                        </td>
                      )}
                      <td
                        className={`p-2 ${
                          hasHeaderProject ? "min-w-[280px]" : ""
                        }`}
                      >
                        <SearchSelect2
                          label=""
                          value={l.task_name}
                          disabled={!l.project}
                          fetchOptions={(q) => fetchTaskOptions(l.project, q)}
                          onChange={(val, opt) => setLineTask(l.id, val, opt)}
                          placeholder={
                            l.project ? "Task" : "Select project first"
                          }
                        />
                      </td>
                      <td className="p-2 align-top">
                        <textarea
                          value={l.description}
                          onChange={(e) =>
                            updateLine(l.id, { description: e.target.value })
                          }
                          placeholder="What did you work on?"
                          rows={1}
                          className="w-full min-w-[140px] min-h-[32px] max-h-[200px] resize
               px-2 py-1.5 text-xs rounded-md border border-theme
               bg-app text-main placeholder:text-muted
               focus:outline-none focus:ring-1 focus:ring-primary
               overflow-auto"
                        />
                      </td>
                      <td className="p-2">
                        <SearchSelect2
                          label=""
                          value={l.activity_type}
                          fetchOptions={fetchActivityTypeOptions}
                          onChange={(value, opt) =>
                            setLineActivity(l.id, value, opt)
                          }
                          placeholder="Activity Type"
                        />
                      </td>
                      <td className="p-2">
                        <DateTimeRangePicker
                          date={l.date}
                          from_time={l.from_time}
                          to_time={l.to_time}
                          onApply={(date, from, to) =>
                            updateLine(l.id, {
                              date,
                              from_time: from,
                              to_time: to,
                            })
                          }
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-primary">
                        {l.hours.toFixed(1)}h
                      </td>
                     {!isEmployee && (
  <td className="p-2 text-center">
    <input
      type="checkbox"
      checked={l.is_billable}
      onChange={(e) =>
        updateLine(l.id, { is_billable: e.target.checked })
      }
    />
  </td>
)}
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={l.is_completed}
                          onChange={(e) =>
                            updateLine(l.id, { is_completed: e.target.checked })
                          }
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          ref={(el) => {
                            triggerRefs.current[l.id] = el;
                          }}
                          onClick={() => {
                            if (openActionsId === l.id) {
                              closeRowActions();
                            } else {
                              setOpenActionsId(l.id);
                              setActionsView("menu");
                            }
                          }}
                          className="p-1.5 hover:bg-app rounded border border-theme text-muted hover:text-main transition-colors"
                          title="Row actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right: billing summary sidebar (fixed, always visible) ── */}
     {!isEmployee && (
  <aside className="w-[240px] shrink-0 h-full overflow-auto">
    <TimesheetSummary
      totals={totals}
      currency={form.currency}
    />
  </aside>
)}
      </div>

      {/* Single shared popover per row: shows the actions menu, or — once
          "Update Rates" is picked — swaps in the rate editor in place. */}
      <Popover
        triggerRef={activeTriggerRef}
        open={openActionsId !== null}
        onClose={closeRowActions}
        placement="bottom-end"
        width={actionsView === "rates" ? 190 : 176}
        offset={4}
      >
        {openActionsId && actionsView === "menu" && (
          <div className="py-1">
           {!isEmployee && (
  <button
    onClick={() => setActionsView("rates")}
    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-main hover:bg-app/60 transition-colors"
  >
    <Pencil size={12} className="text-primary" />
    Update Rates
  </button>
)}
            <button
              onClick={() => {
                duplicateLine(openActionsId);
                closeRowActions();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-main hover:bg-app/60 transition-colors"
            >
              <Copy size={12} />
              Duplicate Row
            </button>
            <button
              onClick={() => {
                removeLine(openActionsId);
                closeRowActions();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 size={12} />
              Delete Row
            </button>
          </div>
        )}

        {openActionsId && actionsView === "rates" && activeLine && (
          <UpdateRatesPanel
            line={activeLine}
            currency={form.currency}
            onCancel={() => setActionsView("menu")}
            onSave={(billingRate, costingRate) => {
              updateLineRates(openActionsId, billingRate, costingRate);
              closeRowActions();
            }}
          />
        )}
      </Popover>
    </MinimizableModal>
  );
};

export default TimesheetFormModal;