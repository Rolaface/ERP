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

// interface AdvancedCalendarProps {
//   leaves: CalendarLeave[];
//   selectedRange?: DateRange;
//   onRangeSelect: (range: DateRange | undefined) => void;
//   month?: Date;                           // <-- Add this
//   onMonthChange?: (month: Date) => void;
// }
interface AdvancedCalendarProps {
  leaves: CalendarLeave[];
  holidays: Date[]; // <-- ADD THIS
  selectedRange?: DateRange;
  onRangeSelect: (range: DateRange | undefined) => void;
  month?: Date;                           
  onMonthChange?: (month: Date) => void;
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
  holidays, // <-- DESTRUCTURE THIS
  selectedRange,
  onRangeSelect,
  month,
  onMonthChange,
}) => {
  const modifiers = useMemo(() => {
    const result: Record<string, Date[]> = {
      approved: [],
      pending: [],
      rejected: [],
      cancelled: [],
      holiday: holidays, // <-- ADD HOLIDAY MODIFIER
    };

    leaves.forEach((leave) => {
      expandDateRange(leave.start, leave.end).forEach((d) =>
        result[leave.status].push(d),
      );
    });

    return result;
  }, [leaves, holidays]);

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
        month={month}                  
        onMonthChange={onMonthChange}
        modifiers={modifiers}
        modifiersClassNames={{
          // approved: "bg-green-500/10 text-green-700",
          // pending: "bg-yellow-500/10 text-yellow-700",
          // rejected: "bg-red-500/10 text-red-700",
          holiday: "bg-red-300 text-indigo-700 font-medium", 
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

        {/* <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
          <span className="text-muted">Approved</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/40" />
          <span className="text-muted">Pending</span>
        </div> */}
         <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-red-300 border border-indigo-500/40" />
          <span className="text-muted">Holiday</span>
        </div>
      </div>

     
    </div>
  );
};

export default AdvancedCalendar;
