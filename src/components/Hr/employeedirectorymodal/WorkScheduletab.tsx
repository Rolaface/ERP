import React from "react";
import { Clock, Calendar, CalendarDays, BarChart3 } from "lucide-react";

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
  const DEFAULT_SATURDAY = "Half Day";
  const DEFAULT_SUNDAY = "Off";

  const applyPreset = (preset: string) => {
    if (!preset) return;

    const monToFri = DAYS.slice(0, 5);
    const schedules: Record<string, string> = {};

    if (preset === "standard") {
      monToFri.forEach((day) => {
        schedules[day.field] = "08:00-17:00";
      });

      // Standard: weekend off by default
      schedules.weeklyScheduleSaturday = "Off";
      schedules.weeklyScheduleSunday = "Off";
    }

    if (preset === "shift") {
      monToFri.forEach((day) => {
        schedules[day.field] = "09:00-18:00";
      });
    }

    // For non-standard presets, set weekend defaults only if blank so we don't overwrite edits.
    if (preset !== "standard") {
      if (!String(formData.weeklyScheduleSaturday ?? "").trim()) {
        schedules.weeklyScheduleSaturday = DEFAULT_SATURDAY;
      }
      if (!String(formData.weeklyScheduleSunday ?? "").trim()) {
        schedules.weeklyScheduleSunday = DEFAULT_SUNDAY;
      }
    }

    Object.entries(schedules).forEach(([field, value]) => {
      handleInputChange(field, value);
    });
  };

  React.useEffect(() => {
    if (!String(formData.weeklyScheduleSaturday ?? "").trim()) {
      handleInputChange("weeklyScheduleSaturday", DEFAULT_SATURDAY);
    }
    if (!String(formData.weeklyScheduleSunday ?? "").trim()) {
      handleInputChange("weeklyScheduleSunday", DEFAULT_SUNDAY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-card p-5 rounded-lg border border-theme space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-main uppercase tracking-wide">
            Weekly Work Schedule
          </h4>
          <Clock className="w-4 h-4 text-muted" />
        </div>

        {/* Preset Select */}
        <div className="grid grid-cols-3 gap-3 items-center">
          <div className="text-sm font-medium text-main flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted" />
            Preset
          </div>
          <select
            value={String(formData.weeklySchedulePreset ?? "")}
            onChange={(e) => {
              const preset = e.target.value;
              handleInputChange("weeklySchedulePreset", preset);
              applyPreset(preset);
            }}
            className="col-span-2 px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(204,0,0,0.2)] focus:border-[var(--primary)]"
          >
            <option value="">Select preset</option>
            <option value="standard">Standard (Mon-Fri: 08:00-17:00)</option>
            <option value="shift">Shift Work (Mon-Fri: 09:00-18:00)</option>
          </select>
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
                className="col-span-2 px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(204,0,0,0.2)] focus:border-[var(--primary)]"
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
                  className="col-span-2 px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(204,0,0,0.2)] focus:border-[var(--primary)]"
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
