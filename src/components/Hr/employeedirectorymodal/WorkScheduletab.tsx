import React from "react";
import { Clock, Calendar, CalendarDays, RotateCw, BarChart3 } from "lucide-react";


type WorkScheduleTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean | any) => void;
};

const DAYS = [
  { key: "Monday", label: "Monday", field: "weeklyScheduleMonday" },
  { key: "Tuesday", label: "Tuesday", field: "weeklyScheduleTuesday" },
  { key: "Wednesday", label: "Wednesday", field: "weeklyScheduleWednesday" },
  { key: "Thursday", label: "Thursday", field: "weeklyScheduleThursday" },
  { key: "Friday", label: "Friday", field: "weeklyScheduleFriday" },
  { key: "Saturday", label: "Saturday", field: "weeklyScheduleSaturday" },
  { key: "Sunday", label: "Sunday", field: "weeklyScheduleSunday" },
];

const TIME_SLOTS = [
  "Off",
  "Half Day",
  "08:00-17:00",
  "09:00-18:00",
  "07:00-16:00",
  "10:00-19:00",
  "Custom",
];

export const WorkScheduleTab: React.FC<WorkScheduleTabProps> = ({
  formData,
  handleInputChange,
}) => {
  const handleQuickFill = (template: string) => {
    const schedules: Record<string, string> = {};

    if (template === "standard") {
      DAYS.slice(0, 5).forEach((day) => {
        schedules[day.field] = "08:00-17:00";
      });
      schedules["weeklyScheduleSaturday"] = "Off";
      schedules["weeklyScheduleSunday"] = "Off";
    } else if (template === "shift") {
      DAYS.forEach((day) => {
        schedules[day.field] = "09:00-18:00";
      });
    }

    Object.entries(schedules).forEach(([field, value]) => {
      handleInputChange(field, value);
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
            Weekly Work Schedule
          </h4>
          <Clock className="w-4 h-4 text-muted" />
        </div>

        {/* Quick Fill Templates */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill("standard")}
            className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded border border-primary/30 hover:bg-primary/20 transition flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Standard (Mon-Fri: 8am-5pm)</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("shift")}
            className="px-3 py-1.5 text-xs bg-app text-main rounded border border-theme hover:bg-primary/10 transition flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5 text-primary" />
            <span>Shift Work (9am-6pm)</span>
          </button>

        </div>

        {/* Day Schedule Inputs */}
        <div className="space-y-3">
          {DAYS.map((day) => (
            <div key={day.key} className="grid grid-cols-3 gap-3 items-center">
              <label className="text-sm font-medium text-main flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                {day.label}
              </label>
              <select
                value={formData[day.field] || ""}
                onChange={(e) => handleInputChange(day.field, e.target.value)}
                className="col-span-2 px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select schedule</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>

              {/* Show custom input if Custom selected */}
              {formData[day.field] === "Custom" && (
                <input
                  type="text"
                  placeholder="e.g., 10:00-14:00"
                  value={formData[`${day.field}Custom`] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      `${day.field}Custom`,
                      String(e.target.value ?? "").toUpperCase(),
                    )
                  }
                  className="col-span-2 px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-app rounded border border-theme">
          <p className="text-xs font-medium text-main mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span>Weekly Summary:</span>
          </p>

          <div className="text-xs text-muted">
            {DAYS.map((day) => {
              const schedule = formData[day.field];
              if (!schedule) return null;
              return (
                <div key={day.key} className="flex justify-between py-1">
                  <span>{day.label}:</span>
                  <span
                    className={
                      schedule === "Off"
                        ? "text-danger"
                        : "text-success font-medium"
                    }
                  >
                    {schedule}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
