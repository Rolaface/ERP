import React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import DateRangeFilter from "../../../../components/ui/modal/DateRangeFilter";
import MultiSelectFilter, {
  type MultiSelectOption,
} from "../../../../components/ui/modal/MultiSelectFilter";
import ViewSelector from "../../../project_management/ViewSelector";
import { TIMESHEET_VIEW_OPTIONS } from "./timesheetViews";
import { formatHours, type DateRange, type ViewMode } from "./Calendarutils";

interface Props {
  title: string;
  loading: boolean;
  total: number;
  view: ViewMode;
  views: { label: string; value: ViewMode }[];
  range: DateRange | null;
  canViewAll: boolean;
  employeeFilter?: string[];
  onEmployeeFilterChange?: (values: string[]) => void;
  fetchEmployees?: (q: string) => Promise<MultiSelectOption[]>;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onViewChange: (v: ViewMode) => void;
  onRangeChange: (r: { from_date?: string; to_date?: string }) => void;
  onLog: () => void;
  onSwitchToList: () => void;
}

const EMPTY_OPTIONS: MultiSelectOption[] = [];

const ghostButton =
  "whitespace-nowrap rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-main transition-colors hover:bg-row-hover";
const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-full text-main transition-colors hover:bg-row-hover";
const primaryButton =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90";

const CalendarToolbar: React.FC<Props> = ({
  title,
  loading,
  total,
  view,
  views,
  range,
  canViewAll,
  employeeFilter = [],
  onEmployeeFilterChange,
  fetchEmployees,
  onToday,
  onPrev,
  onNext,
  onViewChange,
  onRangeChange,
  onLog,
  onSwitchToList,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-[var(--border)]/40 bg-card px-3 py-2">
    <div className="flex min-w-0 items-center gap-2">
      <button className={ghostButton} onClick={onToday}>
        Today
      </button>
      <div className="flex items-center">
        <button className={iconButton} onClick={onPrev} aria-label="Previous">
          <ChevronLeft size={18} />
        </button>
        <button className={iconButton} onClick={onNext} aria-label="Next">
          <ChevronRight size={18} />
        </button>
      </div>
      <span className="truncate text-lg font-semibold text-main">{title}</span>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs font-bold text-main">
        {loading ? "Loading..." : `Total: ${formatHours(total)}`}
      </span>
      <div className="flex overflow-hidden rounded-lg border border-[var(--border)]">
        {views.map((v) => (
          <button
            key={v.value}
            onClick={() => onViewChange(v.value)}
            className={[
              "px-3 py-1.5 text-xs font-semibold transition-colors",
              view === v.value && !range
                ? "bg-primary text-white"
                : "text-muted hover:text-main",
            ].join(" ")}
          >
            {v.label}
          </button>
        ))}
      </div>
      {canViewAll && onEmployeeFilterChange && fetchEmployees && (
        <MultiSelectFilter
          options={EMPTY_OPTIONS}
          values={employeeFilter}
          onChange={onEmployeeFilterChange}
          placeholder="Employee"
          panelTitle="Employee"
          searchPlaceholder="Search employee..."
          onSearch={fetchEmployees}
        />
      )}
      {canViewAll && (
        <DateRangeFilter
          from={range?.from}
          to={range?.to}
          onChange={onRangeChange}
        />
      )}
        <button className={primaryButton} onClick={onLog}>
        <Plus size={12} /> Log Time
      </button>
      <ViewSelector
        value="calendar"
        options={TIMESHEET_VIEW_OPTIONS}
        onChange={(m) => m === "table" && onSwitchToList()}
      />
    </div>
  </div>
);

export default CalendarToolbar;