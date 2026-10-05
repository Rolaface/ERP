import React from "react";
import { Calendar } from "lucide-react";
import DayOffBadge from "./Dayoffbadge";
import { DAY_OFF_LEGEND } from "../../../utils/project_management/timehseet/Timesheetformmodal.utils";

interface EntriesToolbarProps {
  count: number;
  showLegend: boolean;
}

const EntriesToolbar: React.FC<EntriesToolbarProps> = ({
  count,
  showLegend,
}) => (
  <div className="px-4 py-3 border-b border-theme bg-app/50 flex items-center justify-between shrink-0">
    <div className="flex items-center gap-2">
      <Calendar size={13} className="text-primary" />
      <span className="text-sm font-bold text-main">Time Entries</span>
      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
        {count} {count === 1 ? "Entry" : "Entries"}
      </span>
    </div>

    {showLegend && (
      <div className="flex items-center gap-3 text-[10px] font-semibold text-muted">
        {DAY_OFF_LEGEND.map((item) => (
          <span key={item.letter} className="inline-flex items-center gap-1">
            <DayOffBadge
              letter={item.letter}
              color={item.color}
              title={item.label}
            />
            {item.label}
          </span>
        ))}
      </div>
    )}
  </div>
);

export default EntriesToolbar;