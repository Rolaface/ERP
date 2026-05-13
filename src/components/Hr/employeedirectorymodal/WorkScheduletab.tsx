import React from "react";
import { FaClock, FaCalendarAlt, FaSync, FaChartBar } from "react-icons/fa";
import { ModalSelect, ModalInput } from "../../ui/modal/modalComponent";

type WorkScheduleTabProps = {
  formData: any;
  handleInputChange: (field: string, value: string | boolean | any) => void;
};

const DAYS = [
  { key: "Monday",    label: "Mon", field: "weeklyScheduleMonday" },
  { key: "Tuesday",   label: "Tue", field: "weeklyScheduleTuesday" },
  { key: "Wednesday", label: "Wed", field: "weeklyScheduleWednesday" },
  { key: "Thursday",  label: "Thu", field: "weeklyScheduleThursday" },
  { key: "Friday",    label: "Fri", field: "weeklyScheduleFriday" },
  { key: "Saturday",  label: "Sat", field: "weeklyScheduleSaturday" },
  { key: "Sunday",    label: "Sun", field: "weeklyScheduleSunday" },
];

const TIME_SLOT_OPTIONS = [
  { label: "— Off —",    value: "Off" },
  { label: "08:00–17:00", value: "08:00-17:00" },
  { label: "09:00–18:00", value: "09:00-18:00" },
  { label: "07:00–16:00", value: "07:00-16:00" },
  { label: "10:00–19:00", value: "10:00-19:00" },
  { label: "Custom",      value: "Custom" },
];

export const WorkScheduleTab: React.FC<WorkScheduleTabProps> = ({
  formData,
  handleInputChange,
}) => {
  const handleQuickFill = (template: string) => {
    if (template === "standard") {
      DAYS.slice(0, 5).forEach((day) => handleInputChange(day.field, "08:00-17:00"));
      handleInputChange("weeklyScheduleSaturday", "Off");
      handleInputChange("weeklyScheduleSunday", "Off");
    } else if (template === "shift") {
      DAYS.forEach((day) => handleInputChange(day.field, "09:00-18:00"));
    }
  };

  const workingDays = DAYS.filter((d) => formData[d.field] && formData[d.field] !== "Off").length;

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">

        {/* Left: Schedule builder */}
        <div className="bg-card p-3 rounded-lg border border-theme space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider">
              Weekly Schedule
            </h4>
            <FaClock className="w-3.5 h-3.5 text-muted" />
          </div>

          {/* Quick-fill buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("standard")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/30 hover:bg-primary/20 transition"
            >
              <FaCalendarAlt className="w-2.5 h-2.5" />
              Standard (Mon–Fri)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("shift")}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-app text-main rounded border border-theme hover:bg-primary/5 transition"
            >
              <FaSync className="w-2.5 h-2.5 text-primary" />
              7-Day Shift
            </button>
          </div>

          {/* Day rows */}
          <div className="space-y-1.5">
            {DAYS.map((day) => {
              const val = formData[day.field] || "";
              const isOff = val === "Off";
              const isCustom = val === "Custom";
              return (
                <div key={day.key} className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold w-7 flex-shrink-0 ${
                      isOff ? "text-muted line-through" : "text-main"
                    }`}
                  >
                    {day.label}
                  </span>
                  <div className="flex-1">
                    <ModalSelect
                      label=""
                      name={day.field}
                      value={val}
                      onChange={(e) => handleInputChange(day.field, e.target.value)}
                      options={TIME_SLOT_OPTIONS}
                    />
                  </div>
                  {isCustom && (
                    <div className="w-28 flex-shrink-0">
                      <ModalInput
                        label="Custom Time"
                        name={`${day.field}Custom`}
                        value={formData[`${day.field}Custom`] || ""}
                        onChange={(e) => handleInputChange(`${day.field}Custom`, e.target.value)}
                        placeholder="HH:MM-HH:MM"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-3">
          {/* Stats */}
          <div className="bg-card p-3 rounded-lg border border-theme">
            <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FaChartBar className="w-3 h-3 text-primary" />
              Weekly Summary
            </h4>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-app rounded border border-theme p-2 text-center">
                <p className="text-xl font-bold text-primary">{workingDays}</p>
                <p className="text-[9px] text-muted uppercase tracking-wide">Working Days</p>
              </div>
              <div className="bg-app rounded border border-theme p-2 text-center">
                <p className="text-xl font-bold text-main">{7 - workingDays}</p>
                <p className="text-[9px] text-muted uppercase tracking-wide">Days Off</p>
              </div>
            </div>

            <div className="space-y-1">
              {DAYS.map((day) => {
                const schedule = formData[day.field];
                if (!schedule) return null;
                const isOff = schedule === "Off";
                return (
                  <div key={day.key} className="flex justify-between items-center py-0.5 border-b border-theme last:border-0">
                    <span className="text-[10px] text-muted">{day.key}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        isOff ? "text-danger" : "text-emerald-600"
                      }`}
                    >
                      {schedule === "Custom"
                        ? formData[`${day.field}Custom`] || "Custom"
                        : schedule}
                    </span>
                  </div>
                );
              })}
              {DAYS.every((d) => !formData[d.field]) && (
                <p className="text-[10px] text-muted italic text-center py-2">
                  No schedule configured yet
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkScheduleTab;