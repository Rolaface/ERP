import React, { useEffect, useState } from "react";
import { Calendar, Save, X, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import {
  createHolidayList,
  updateHolidayList,
} from "../../../api/holidayListApi";
import type { HolidayList } from "../../../views/hr/tabs/leave-config/hooks/useHolidayLists";
import { showApiError, showSuccess, showValidationError } from "../../../utils/alert";
import DatePickerInput from "../../calendar/DatePickerInput";

const HL_STYLES = `
.hl-table-wrap {
  overflow-y: auto;
  overflow-x: hidden;
}
.hl-table-wrap::-webkit-scrollbar { width: 3px; }
.hl-table-wrap::-webkit-scrollbar-track { background: transparent; }
.hl-table-wrap::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

.hl-row {
  display: grid;
  grid-template-columns: 160px 1fr 100px 50px;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  min-height: 38px;
  transition: background 0.1s;
}
.hl-row:hover { background: rgba(0,0,0,0.015); }

.hl-cell {
  padding: 0 10px;
  display: flex;
  align-items: center;
  height: 100%;
  min-height: 38px;
}
.hl-cell-border { border-right: 1px solid rgba(0,0,0,0.06); }

.hl-col-header {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6b7280;
  white-space: nowrap;
}
`;

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: HolidayList | null;
  onSuccess?: () => void;
}

interface HolidayRow {
  id: string;
  holiday_date: string;
  description: string;
  is_half_day: boolean;
}

interface WeeklyOffDay {
  weekday: string;
  label: string;
  selected: boolean;
  is_half_day: boolean;
}

const DEFAULT_WEEKDAYS: WeeklyOffDay[] = [
  { weekday: "Monday", label: "Mon", selected: false, is_half_day: false },
  { weekday: "Tuesday", label: "Tue", selected: false, is_half_day: false },
  { weekday: "Wednesday", label: "Wed", selected: false, is_half_day: false },
  { weekday: "Thursday", label: "Thu", selected: false, is_half_day: false },
  { weekday: "Friday", label: "Fri", selected: false, is_half_day: false },
  { weekday: "Saturday", label: "Sat", selected: false, is_half_day: false },
  { weekday: "Sunday", label: "Sun", selected: false, is_half_day: false },
];

export const HolidayListModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [weeklyOffs, setWeeklyOffs] = useState<WeeklyOffDay[]>(DEFAULT_WEEKDAYS);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);

  useEffect(() => {
    const id = "hl-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = HL_STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.holiday_list_name || "");
        setFromDate(initialData.from_date || "");
        setToDate(initialData.to_date || "");

        const initialWeeklyOffs = initialData.weekly_offs || [];
        const mappedWeekdays = DEFAULT_WEEKDAYS.map((day) => {
          const matchedOff = initialWeeklyOffs.find(
            (off) => off.weekday === day.weekday
          );
          if (matchedOff) {
            return { ...day, selected: true, is_half_day: !!matchedOff.is_half_day };
          }
          return { ...day, selected: false, is_half_day: false };
        });
        setWeeklyOffs(mappedWeekdays);

        const initialHolidays = initialData.holidays || [];
        setHolidays(
          initialHolidays.map((h) => ({
            id: crypto.randomUUID(),
            holiday_date: h.holiday_date,
            description: h.description,
            is_half_day: !!h.is_half_day,
          }))
        );
      } else {
        setName("");
        setFromDate("");
        setToDate("");
        setWeeklyOffs(
          DEFAULT_WEEKDAYS.map((day) => ({
            ...day,
            selected: day.weekday === "Sunday" || day.weekday === "Saturday",
            is_half_day: day.weekday === "Saturday",
          }))
        );
        setHolidays([{ id: crypto.randomUUID(), holiday_date: "", description: "", is_half_day: false }]);
      }
    }
  }, [isOpen, initialData]);

  const handleAddHolidayRow = () => {
    setHolidays([
      ...holidays,
      { id: crypto.randomUUID(), holiday_date: "", description: "", is_half_day: false },
    ]);
  };

  const handleRemoveHolidayRow = (id: string) => {
    setHolidays(holidays.filter((h) => h.id !== id));
  };

  const updateHoliday = (id: string, field: keyof HolidayRow, value: string | boolean) => {
    setHolidays(holidays.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const toggleWeeklyOff = (index: number) => {
    const updated = [...weeklyOffs];
    updated[index].selected = !updated[index].selected;
    if (!updated[index].selected) updated[index].is_half_day = false;
    setWeeklyOffs(updated);
  };

  const toggleWeeklyOffHalfDay = (index: number) => {
    const updated = [...weeklyOffs];
    updated[index].is_half_day = !updated[index].is_half_day;
    setWeeklyOffs(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) return showValidationError("Holiday List Name is required");
    if (!fromDate) return showValidationError("From Date is required");
    if (!toDate) return showValidationError("To Date is required");

    try {
      setSaving(true);
      
      const payload = {
        holiday_list_name: name,
        from_date: fromDate,
        to_date: toDate,
        weekly_offs: weeklyOffs
          .filter((w) => w.selected)
          .map((w) => ({
            weekday: w.weekday,
            ...(w.is_half_day ? { is_half_day: true } : {}),
          })),
        holidays: holidays
          .filter((h) => h.holiday_date && h.description)
          .map((h) => ({
            holiday_date: h.holiday_date,
            description: h.description,
            ...(h.is_half_day ? { is_half_day: true } : {}),
          })),
      };

      if (isEdit && initialData?.name) {
        await updateHolidayList(initialData.name, payload);
        showSuccess("Holiday List updated successfully");
      } else {
        await createHolidayList(payload);
        showSuccess("Holiday List created successfully");
      }
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showApiError(err?.message || "Failed to save holiday list");
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex w-full items-center justify-end gap-3 pt-1">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-[#3F25C8] px-5 py-1.5 text-sm font-medium text-white transition hover:bg-[#321ca1] disabled:opacity-60 flex items-center gap-2"
      >
        {saving && <span className="animate-spin text-white">⟳</span>}
        {saving ? "Saving…" : isEdit ? "Update Holiday List" : "Create Holiday List"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Holiday List" : "Add Holiday List"}
      icon={Calendar}
      maxWidth="4xl"
      height="80vh"
      footer={footer}
    >
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          maxHeight: "calc(80vh - 130px)", 
          overflowY: "auto",
          paddingRight: "4px"
        }}
        className="space-y-6"
      >
        
        <section>
          <h3 className="mb-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            Basic Details
          </h3>
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-[10px] font-medium text-gray-700">
                Holiday List Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. India Holidays 2026"
                className="w-full h-[28px] rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#3F25C8] focus:ring-1 focus:ring-[#3F25C8]"
              />
            </div>

            <div className="col-span-6 md:col-span-3">
              <DatePickerInput
                label="From Date"
                name="fromDate"
                value={fromDate}
                onChange={(_, v) => setFromDate(v)}
              />
            </div>
            
            <div className="col-span-6 md:col-span-3">
              <DatePickerInput
                label="To Date"
                name="toDate"
                value={toDate}
                onChange={(_, v) => setToDate(v)}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            Weekly Offs
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {weeklyOffs.map((day, idx) => (
              <div
                key={day.weekday}
                className={`flex h-[72px] w-[100px] flex-col justify-between rounded-lg border p-2.5 transition-colors ${
                  day.selected
                    ? "border-[#D6D0F9] bg-[#F7F5FF]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      day.selected ? "text-[#3F25C8]" : "text-gray-800"
                    }`}
                  >
                    {day.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={day.selected}
                    onChange={() => toggleWeeklyOff(idx)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#3F25C8] focus:ring-[#3F25C8] cursor-pointer"
                  />
                </div>
                <div className="flex items-end justify-between">
                  <span className={`text-[9px] font-bold leading-tight ${day.selected ? 'text-[#3F25C8]' : 'text-gray-400'}`}>
                    HALF<br />DAY
                  </span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={day.is_half_day}
                      onChange={() => toggleWeeklyOffHalfDay(idx)}
                      disabled={!day.selected}
                    />
                    <div className="peer h-3.5 w-6 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-2.5 after:w-2.5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#3F25C8] peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              Holidays List
            </h3>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              flex: 1
            }}
          >
            <div
              className="hl-row"
              style={{
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                minHeight: 32,
              }}
            >
              <div className="hl-cell hl-cell-border hl-col-header">Date</div>
              <div className="hl-cell hl-cell-border hl-col-header">Description</div>
              <div className="hl-cell hl-cell-border hl-col-header" style={{ justifyContent: "center" }}>Is Half Day</div>
              <div className="hl-cell hl-col-header" style={{ justifyContent: "center" }}>Action</div>
            </div>

            <div className="hl-table-wrap" style={{ flex: 1, minHeight: "150px" }}>
              {holidays.map((row) => (
                <div key={row.id} className="hl-row">
                  <div className="hl-cell hl-cell-border" style={{ padding: "0 8px" }}>
                    <DatePickerInput
                      name={`date-${row.id}`}
                      value={row.holiday_date}
                      onChange={(_, v) => updateHoliday(row.id, "holiday_date", v)}
                    />
                  </div>

                  {/* Wrapped the input in a hl-cell to respect the grid columns properly */}
                  <div className="hl-cell hl-cell-border">
                    <input
                      type="text"
                      placeholder="E.g. Diwali Eve"
                      value={row.description}
                      onChange={(e) => updateHoliday(row.id, "description", e.target.value)}
                      className="w-full h-[26px] rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#3F25C8] focus:ring-1 focus:ring-[#3F25C8]"
                    />
                  </div>

                  <div className="hl-cell hl-cell-border" style={{ justifyContent: "center" }}>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={row.is_half_day}
                        onChange={(e) => updateHoliday(row.id, "is_half_day", e.target.checked)}
                      />
                      <div className="peer h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#3F25C8] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                    </label>
                  </div>

                  <div className="hl-cell" style={{ justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveHolidayRow(row.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#9ca3af",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#9ca3af";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              ))}

              {holidays.length === 0 && (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "#6b7280" }}>
                  No holidays added yet. Click Add Row to start.
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                borderTop: "1px solid #e5e7eb",
                background: "#fff",
              }}
            >
              <button
                type="button"
                onClick={handleAddHolidayRow}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: "#F7F5FF",
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#3F25C8",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ebe6ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F7F5FF")}
              >
                <Plus style={{ width: 12, height: 12 }} />
                Add Row
              </button>
            </div>
          </div>
        </section>
      </div>
    </MinimizableModal>
  );
};