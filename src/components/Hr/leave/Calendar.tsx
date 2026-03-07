import React, { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

type LeaveStatus = "approved" | "pending" | "rejected" | "cancelled";

interface CalendarLeave {
  start: Date;
  end: Date;
  status: LeaveStatus;
}

interface AdvancedCalendarProps {
  leaves: CalendarLeave[];
  selectedRange?: DateRange;
  onRangeSelect: (range: DateRange | undefined) => void;
}

const expandDateRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const AdvancedCalendar: React.FC<AdvancedCalendarProps> = ({
  leaves,
  selectedRange,
  onRangeSelect,
}) => {
  const modifiers = useMemo(() => {
    const result: Record<LeaveStatus, Date[]> = {
      approved: [],
      pending: [],
      rejected: [],
      cancelled: [],
    };

    leaves.forEach((leave) => {
      expandDateRange(leave.start, leave.end).forEach((d) =>
        result[leave.status].push(d),
      );
    });

    return result;
  }, [leaves]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      {/* ---- CALENDAR ---- */}
      <DayPicker
        mode="range"
        fixedWeeks
        selected={selectedRange}
        onSelect={onRangeSelect}
        modifiers={modifiers}
        disabled={{ before: today }}
        modifiersClassNames={{
          approved: "bg-red-500/10 text-red-700",
          pending: "bg-blue-500/10 text-blue-700",
          rejected: "bg-muted/20 text-muted",
        }}
        classNames={{
          months: "flex justify-center",
          caption: "text-lg font-bold text-main",
          table: "w-full",
          head_cell: "text-muted text-xs font-semibold",
          cell: "h-10 w-10 text-center rounded-lg border border-theme hover:bg-app",
          day_today: "border-primary",
          day_selected: "bg-primary text-white",
          day_range_middle: "bg-primary/10",
        }}
      />

      {/* ---- LEGEND (moved INSIDE calendar) ---- */}
      <div className="mt-2 pt-2 border-t border-theme flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-primary" />
          <span className="text-muted">Selected</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
          <span className="text-muted">Approved</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/40" />
          <span className="text-muted">Pending</span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCalendar;
