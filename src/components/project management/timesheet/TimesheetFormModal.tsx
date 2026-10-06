import React, { useCallback, useEffect } from "react";
import { Clock } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import {
  useTimesheetModal,
  fetchProjectOptions,
  isSlotTaken,
  OVERLAP_MSG,
} from "../../../hooks/project_management/timeheet/form/useTimesheetModal";
import { showApiError } from "../../../utils/alert";
import TimesheetSummary from "./TimesheetSummary";
import EmployeeHeader from "./Employeeheader";
import RowActionsPopover from "./Rowactionspopover";
import TimesheetEntriesTable from "./Timesheetentriestable";
import TimesheetFooter from "./Timesheetfooter";
import TimesheetInfoCard from "./Timesheetinfocard";
import { DateRangePicker } from "../../../components/calendar/DateTimeRangePicker";
import type {
  RowHandlers,
  TimesheetFormModalProps,
} from "../../../types/Project_Management/Timesheet/form/Timesheetformmodal";
import {
  MODAL_SIZE,
  SUMMARY_WIDTH_CLASS,
  TIMESHEET_FIELD_STYLES,
} from "../../../utils/project_management/timehseet/Timesheetformmodal.utils";
import { useTimesheetDayOffs } from "../../../hooks/project_management/timeheet/form/Usetimesheetdayoffs";
import {
  useTimesheetDetail,
  useTimesheetPrefill,
} from "../../../hooks/project_management/timeheet/form/Usetimesheetinit";
import {
  useDateSort,
  useLineSelection,
  useRowActions,
} from "../../../hooks/project_management/timeheet/form/Usetimesheettable";

const resolveSubtitle = (
  isEditMode: boolean,
  isEmployee: boolean,
  subtitle?: string,
) => {
  if (isEditMode) return "Update time entries and billing details";
  if (subtitle) return subtitle;
  return isEmployee
    ? "Log your work hours and track billable time"
    : "Create employee timesheet allocation and track billable hours";
};

const TimesheetFormModal: React.FC<TimesheetFormModalProps> = ({
  isOpen,
  onClose,
  modalId,
  onSuccess,
  context = "admin",
  prefillTask,
  prefillTasks,
  prefillDate,
  prefillEmployee,
  restrictions,
  title = "New Timesheet",
  subtitle,
  timesheetId,
}) => {
  const {
    form,
    title: timesheetTitle,
    totals,
    conflictIds,
    isSaving,
    isEditMode,
    setTitle,
    setProject,
    setCustomer,
    setEmployee,
    setTimesheetRange,
    addLine,
    addLines,
    updateLine,
    setLineProject,
    setLineTask,
    setLineActivity,
    removeLines,
    duplicateLine,
    sortLines,
    updateLineRates,
    loadFromDetail,
    reset,
    save,
  } = useTimesheetModal({ onSuccess, restrictions });

  const isEmployee = context === "employee";
  const hasHeaderProject = Boolean(form.project);

  const dayOffs = useTimesheetDayOffs({
    lines: form.lines,
    employee: form.employee,
    employeeName: form.employee_name,
    fallbackDate: prefillDate,
    isEmployee,
  });

  const isLoadingTimesheet = useTimesheetDetail(
    isOpen,
    timesheetId,
    loadFromDetail,
  );

  useTimesheetPrefill({
    isOpen,
    timesheetId,
    prefillTask,
    prefillTasks,
    prefillDate,
    prefillEmployee,
    addLine,
    addLines,
    setEmployee,
  });

  const selection = useLineSelection(form.lines, removeLines);
  const sort = useDateSort(sortLines, isOpen);
  const rowActions = useRowActions();

  const { resetPickerRange } = dayOffs;

  useEffect(() => {
    if (!isOpen) {
      reset();
      resetPickerRange();
    }
  }, [isOpen, reset, resetPickerRange]);

  const fetchProjects = useCallback(
    (q: string) =>
      fetchProjectOptions(
        q,
        restrictions?.allowedProjectIds,
        form.customer || undefined,
      ),
    [restrictions?.allowedProjectIds, form.customer],
  );

  const handleApplyTime: RowHandlers["onApplyTime"] = (
    id,
    date,
    from,
    to,
    toDate,
  ) => {
    const slot = { date, to_date: toDate, from_time: from, to_time: to };
    if (isSlotTaken(form.lines, id, slot)) {
      showApiError(OVERLAP_MSG);
      return;
    }
    dayOffs.warnIfDayOff(date, toDate);
    updateLine(id, slot);
  };

  const handleSave = async () => {
    if (await save()) onClose();
  };

  const rowHandlers: RowHandlers = {
    onUpdate: updateLine,
    onProject: setLineProject,
    onTask: setLineTask,
    onActivity: setLineActivity,
    onApplyTime: handleApplyTime,
    onToggleActions: rowActions.toggle,
    registerTrigger: rowActions.registerTrigger,
  };

  const activeLine = form.lines.find((l) => l.id === rowActions.openId) ?? null;

  const periodField = (
    <div className="min-w-0">
      <span className="mb-1 block text-[10px] font-medium text-main">
        Timesheet Period
      </span>
      <DateRangePicker
        start={form.custom_timesheet_start_date}
        end={form.custom_timesheet_end_date}
        onChange={setTimesheetRange}
      />
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId || "timesheet-form"}
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Timesheet" : title}
      subtitle={resolveSubtitle(isEditMode, isEmployee, subtitle)}
      icon={Clock}
      footer={
        <TimesheetFooter
          isSaving={isSaving}
          isLoading={isLoadingTimesheet}
          isEditMode={isEditMode}
          onClose={onClose}
          onSave={handleSave}
        />
      }
      customWidth={MODAL_SIZE.width}
      height={MODAL_SIZE.height}
    >
      <div className="flex h-full min-h-0 flex-col gap-5 lg:flex-row">
        <style>{TIMESHEET_FIELD_STYLES}</style>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5">
          <div className="shrink-0">
            {isEmployee ? (
              <EmployeeHeader
                employeeName={form.employee_name}
                lines={form.lines}
                prefillDate={prefillDate}
                title={timesheetTitle}
                totalHours={totals.totalHours}
                onTitleChange={setTitle}
                periodField={periodField}
              />
            ) : (
              <TimesheetInfoCard
                form={form}
                title={timesheetTitle}
                restrictions={restrictions}
                fetchProjects={fetchProjects}
                onTitleChange={setTitle}
                onProject={setProject}
                onCustomer={setCustomer}
                onEmployee={setEmployee}
                periodField={periodField}
              />
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <TimesheetEntriesTable
              lines={form.lines}
              conflictIds={conflictIds}
              isEmployee={isEmployee}
              hasHeaderProject={hasHeaderProject}
              selection={selection}
              sort={sort}
              dayOffs={dayOffs}
              fetchProjects={fetchProjects}
              handlers={rowHandlers}
              onAddRow={() => addLine(undefined, prefillDate)}
            />
          </div>
        </div>

        {!isEmployee && (
          <aside
            className={`${SUMMARY_WIDTH_CLASS} shrink-0 lg:h-full lg:overflow-auto`}
          >
            <TimesheetSummary totals={totals} currency={form.currency} />
          </aside>
        )}
      </div>

      <RowActionsPopover
        actions={rowActions}
        activeLine={activeLine}
        isEmployee={isEmployee}
        currency={form.currency}
        onDuplicate={duplicateLine}
        onSaveRates={updateLineRates}
      />
    </MinimizableModal>
  );
};

export default TimesheetFormModal;
