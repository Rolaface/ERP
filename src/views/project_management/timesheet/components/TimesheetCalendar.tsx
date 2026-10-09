import React, { useEffect, useMemo, useState } from "react";
import { showApiError, showDayOffToast } from "../../../../utils/alert";
import {
  getCalendarDetails,
  getCalendarSummary,
} from "../../../../api/project/timesheet/timesheet.api";
import type {
  CalendarSummaryCell,
  TimesheetHoursEntry,
} from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";
import type { TimesheetModalRestrictions } from "../../../../hooks/project_management/timeheet/form/useTimesheetModal";
import { useDayOffs } from "../../../../hooks/project_management/timeheet/useDayOffs";
import type { MultiSelectOption } from "../../../../components/ui/modal/MultiSelectFilter";
import TimesheetMatrix from "./Timesheetmatrix";
import { DAY_OFF_TONE } from "./DayOffChip";
import { WEEKLY_OFF_COLOR } from "./Weeklyoff";
import {
  openAdminTimesheetFormModal,
  openEmployeeTimesheetFormModal,
} from "../../../../components/feature/project management/timesheet/timesheetForm.modal";
import CalendarToolbar from "./Calendartoolbar";
import MonthView from "./Monthview";
import WeekView from "./Weekview";
import { AgendaList, DayView } from "./Dayview";
import { LegendItem } from "./Calendarparts";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../../../store/dataRefreshStore";
import {
  ADMIN_VIEWS,
  APPROVED_TONE,
  DRAFT_TONE,
  MAX_RANGE_DAYS,
  MONTHS_IN_YEAR,
  VIEWS,
  addDays,
  buildEventsByDay,
  daysBetween,
  draftIds,
  fromYMD,
  getTitle,
  getVisibleDays,
  shiftAnchor,
  toYMD,
  type DateRange,
  type DayData,
  type DayEvent,
  type ViewMode,
} from "./Calendarutils";

interface Props {
  canViewAll: boolean;
  canEdit: boolean;
  canCreate?: boolean;
  onSwitchToList: () => void;
  restrictions?: TimesheetModalRestrictions;
  employeeFilter?: string[];
  onEmployeeFilterChange?: (values: string[]) => void;
  fetchEmployees?: (q: string) => Promise<MultiSelectOption[]>;
}

const WEEKLY_OFF_LABEL = "Weekly Off";
const NO_EMPLOYEES: string[] = [];

const TimesheetCalendar: React.FC<Props> = ({
  canViewAll,
  canEdit,
  canCreate = true,
  onSwitchToList,
  restrictions,
  employeeFilter = NO_EMPLOYEES,
  onEmployeeFilterChange,
  fetchEmployees,
}) => {
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [range, setRange] = useState<DateRange | null>(null);
  const [entries, setEntries] = useState<TimesheetHoursEntry[]>([]);
  const [summary, setSummary] = useState<CalendarSummaryCell[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);
  const openTimesheetForm = canViewAll
    ? openAdminTimesheetFormModal
    : openEmployeeTimesheetFormModal;

  const activeEmployees = canViewAll ? employeeFilter : NO_EMPLOYEES;
  const employeeKey = activeEmployees.join(",");

  const visibleDays = useMemo(
    () =>
      range
        ? daysBetween(fromYMD(range.from), fromYMD(range.to))
        : getVisibleDays(view, anchor),
    [view, anchor, range],
  );

  const matrixDays = useMemo(() => {
    if (!range && view === "year") {
      return Array.from(
        { length: MONTHS_IN_YEAR },
        (_, i) => new Date(anchor.getFullYear(), i, 1),
      );
    }
    return range || view !== "month"
      ? visibleDays
      : getVisibleDays("list", anchor);
  }, [view, anchor, range, visibleDays]);

  const matrixGranularity: "day" | "month" =
    view === "year" && !range ? "month" : "day";

  const fromDate = toYMD(visibleDays[0]);
  const toDate = toYMD(visibleDays[visibleDays.length - 1]);
  const todayKey = toYMD(new Date());
  const showMatrix = canViewAll && view !== "list";

  const dayOffs = useDayOffs(fromDate, toDate, canViewAll);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = canViewAll
      ? getCalendarSummary(
          fromDate,
          toDate,
          matrixGranularity,
          activeEmployees.length ? activeEmployees : undefined,
          canViewAll,
          { project: projectFilter, activityType: activityFilter },
        ).then((data) => {
          if (!cancelled) setSummary(data);
        })
      : getCalendarDetails(fromDate, toDate, true).then((data) => {
          if (!cancelled) setEntries(data);
        });

    load.catch(showApiError).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    fromDate,
    toDate,
    matrixGranularity,
    reloadKey,
    employeeKey,
    canViewAll,
    projectFilter,
    activityFilter,
  ]);

  const eventsByDay = useMemo(() => buildEventsByDay(entries), [entries]);

  const rangeTotal = useMemo(
    () =>
      canViewAll
        ? summary.reduce((sum, c) => sum + c.approved_hours + c.draft_hours, 0)
        : entries.reduce((sum, e) => sum + e.hours, 0),
    [canViewAll, summary, entries],
  );

  const dayData: DayData = {
    eventsByDay,
    dayTotal: (key) =>
      (eventsByDay[key] ?? []).reduce((sum, ev) => sum + ev.hours, 0),
    dayOffOn: (key) => dayOffs.holidayOn(key) ?? dayOffs.leaveOn(key),
    isDayOff: (key) => {
      const off = dayOffs.holidayOn(key) ?? dayOffs.leaveOn(key);
      return Boolean(off && !off.halfDay);
    },
  };

  const title = range
    ? [visibleDays[0], visibleDays[visibleDays.length - 1]]
        .map((d) =>
          d.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        )
        .join(" – ")
    : getTitle(view, visibleDays, anchor);

  const shift = (dir: 1 | -1) => {
    if (!range) {
      setAnchor(shiftAnchor(view, anchor, dir));
      return;
    }
    const span = visibleDays.length;
    setRange({
      from: toYMD(addDays(fromYMD(range.from), dir * span)),
      to: toYMD(addDays(fromYMD(range.to), dir * span)),
    });
  };

  const goToday = () => {
    setRange(null);
    setAnchor(new Date());
  };

  const changeView = (v: ViewMode) => {
    setRange(null);
    setView(v);
  };

  const openDay = (dateKey: string) => {
    setRange(null);
    setAnchor(fromYMD(dateKey));
    setView("day");
  };

  const handleRangeChange = ({
    from_date,
    to_date,
  }: {
    from_date?: string;
    to_date?: string;
  }) => {
    if (!from_date) {
      setRange(null);
      return;
    }
    const start = fromYMD(from_date);
    const end = fromYMD(to_date ?? from_date);
    const lastAllowed = addDays(start, MAX_RANGE_DAYS - 1);
    setRange({
      from: toYMD(start),
      to: toYMD(end > lastAllowed ? lastAllowed : end),
    });
    setAnchor(start);
  };

  const reload = () => {
    setReloadKey((k) => k + 1);
    triggerRefresh(REFRESH_KEYS.TIMESHEET_LIST);
  };

  const warnIfDayOff = (dateKey: string, employeeName?: string) => {
    const off = employeeName
      ? (dayOffs.holidayOn(dateKey) ?? dayOffs.leaveOn(dateKey, employeeName))
      : dayData.dayOffOn(dateKey);
    if (!off) return;

    showDayOffToast({
      dateLabel: fromYMD(dateKey).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      kind: off.kind,
      label: off.kind === "weekly_off" ? WEEKLY_OFF_LABEL : off.label,
      halfDay: off.halfDay,
      who: employeeName,
    });
  };

  const openLogModal = (
    date: string,
    employee?: { id: string; name: string },
  ) => {
    if (!canCreate) return;
    warnIfDayOff(date, employee?.name);
    openTimesheetForm({
      prefillDate: date,
      prefillEmployee: employee,
      restrictions,
      onSuccess: reload,
    });
  };

  const openEditModal = (timesheetId: string) => {
    openTimesheetForm({ timesheetId, onSuccess: reload });
  };

  const handleServerFilters = (project: string, activityType: string) => {
    setProjectFilter(project);
    setActivityFilter(activityType);
  };

  const handleMatrixCellClick = (
    employeeId: string,
    employeeName: string,
    dateKey: string,
  ) => {
    openLogModal(dateKey, { id: employeeId, name: employeeName });
  };

  const chipEdit = (ev: DayEvent) => {
    const ids = draftIds(ev.items);
    return canEdit && ids.length === 1
      ? () => openEditModal(ids[0])
      : undefined;
  };

  const logButtonDate = view === "day" ? toYMD(anchor) : todayKey;

  const scrolls = !showMatrix && (view === "day" || view === "list");

  const renderBody = () => {
    if (showMatrix) {
      return (
        <TimesheetMatrix
          days={matrixDays}
          cells={summary}
          todayKey={todayKey}
          granularity={matrixGranularity}
          onCellClick={handleMatrixCellClick}
          onEditDraft={canEdit ? openEditModal : undefined}
          onFiltersChange={handleServerFilters}
          dayOffs={dayOffs}
        />
      );
    }
    if (view === "month") {
      return (
        <MonthView
          {...dayData}
          days={visibleDays}
          anchor={anchor}
          todayKey={todayKey}
          onLog={openLogModal}
          onOpenDay={openDay}
          chipEdit={chipEdit}
        />
      );
    }
    if (view === "week") {
      return (
        <WeekView
          {...dayData}
          days={visibleDays}
          todayKey={todayKey}
          onLog={openLogModal}
          chipEdit={chipEdit}
        />
      );
    }
    if (view === "day") {
      return (
        <DayView
          {...dayData}
          date={anchor}
          canViewAll={canViewAll}
          onLog={openLogModal}
          onEdit={canEdit ? openEditModal : undefined}
        />
      );
    }
    return (
      <AgendaList
        {...dayData}
        days={visibleDays}
        canViewAll={canViewAll}
        onLog={openLogModal}
        onEdit={canEdit ? openEditModal : undefined}
      />
    );
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
      <CalendarToolbar
        title={title}
        loading={loading}
        total={rangeTotal}
        view={view}
        views={canViewAll ? ADMIN_VIEWS : VIEWS}
        range={range}
        canViewAll={canViewAll}
        employeeFilter={activeEmployees}
        onEmployeeFilterChange={canViewAll ? onEmployeeFilterChange : undefined}
        fetchEmployees={fetchEmployees}
        onToday={goToday}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onViewChange={changeView}
        onRangeChange={handleRangeChange}
        onLog={() => openLogModal(logButtonDate)}
        onSwitchToList={onSwitchToList}
      />

      <div
        className={[
          "custom-scrollbar min-h-0 min-w-0 flex-1",
          scrolls ? "overflow-y-auto" : "overflow-hidden",
          loading ? "opacity-60" : "",
        ].join(" ")}
      >
        {renderBody()}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4 text-[10px] font-semibold text-muted">
        <LegendItem color={`var(${APPROVED_TONE})`} label="Approved" />
        <LegendItem
          color={`var(${DRAFT_TONE})`}
          label={canEdit ? "Draft · click to edit" : "Includes draft"}
        />
        <LegendItem
          color={`var(${DAY_OFF_TONE.company_holiday})`}
          label="Company Holiday"
        />
        <LegendItem color={`var(${DAY_OFF_TONE.leave})`} label="Leave" />
        <LegendItem color={WEEKLY_OFF_COLOR} label={WEEKLY_OFF_LABEL} />
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
          No Entry
        </span>
      </div>
    </div>
  );
};

export default TimesheetCalendar;