import React, { useMemo } from "react";
import { Clock, ClipboardList } from "lucide-react";
import { ModalInput } from "../../../components/ui/modal/modalComponent";
import type { TimesheetLine } from "../../../types/Project_Management/Timesheet/form/Timesheetformmodal";
import { formatRangeLabel, getInitials } from "../../../utils/project_management/timehseet/Timesheetformmodal.utils";

interface EmployeeHeaderProps {
  employeeName: string;
  lines: TimesheetLine[];
  prefillDate?: string;
  title: string;
  totalHours: number;
  onTitleChange: (value: string) => void;
}

const STAT_TONE = "bg-primary/10 text-primary";

const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  employeeName,
  lines,
  prefillDate,
  title,
  totalHours,
  onTitleChange,
}) => {
  const rangeLabel = useMemo(
    () => formatRangeLabel(lines, prefillDate),
    [lines, prefillDate],
  );

  const stats = [
    { icon: ClipboardList, value: String(lines.length), label: "Entries" },
    { icon: Clock, value: `${totalHours.toFixed(1)}h`, label: "Total Hours" },
  ];

  return (
    <div className="bg-card border border-theme rounded-xl px-5 py-4 shrink-0 flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {getInitials(employeeName || "")}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-main">
            {employeeName || "Employee"}
          </div>
          <div className="text-xs text-muted">{rangeLabel}</div>
        </div>
      </div>

      <div className="min-w-[220px] max-w-md flex-1">
        <ModalInput
          label="Title"
          name="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Timesheet title"
        />
      </div>

      <div className="ml-auto flex items-center divide-x divide-theme">
        {stats.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-5 first:pl-0 last:pr-0"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${STAT_TONE}`}
            >
              <Icon size={18} />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight text-main">
                {value}
              </div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeHeader;