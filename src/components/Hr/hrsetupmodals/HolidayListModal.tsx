import React, { useEffect, useState } from "react";
import { Calendar, Save, X, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";

import {
  createHolidayList,
  updateHolidayList,
} from "../../../api/holidayListApi";
import type { HolidayList } from "../../../views/hr/tabs/leave-config/hooks/useHolidayLists";
import { showApiError, showSuccess, showValidationError } from "../../../utils/alert";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: HolidayList | null;
  onSuccess?: () => void;
}

// UI Types
interface HolidayRow {
  id: string; // Unique ID for React rendering
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

  // Form State
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [country, setCountry] = useState("India");
  const [weeklyOffs, setWeeklyOffs] = useState<WeeklyOffDay[]>(DEFAULT_WEEKDAYS);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.holiday_list_name || "");
        setFromDate(initialData.from_date || "");
        setToDate(initialData.to_date || "");
        setCountry(initialData.country || "India");

        // Map initial Weekly Offs
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

        // Map initial Holidays
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
        // Reset to default
        setName("");
        setFromDate("");
        setToDate("");
        setCountry("India");
        setWeeklyOffs(
          DEFAULT_WEEKDAYS.map((day) => ({
            ...day,
            selected: day.weekday === "Sunday" || day.weekday === "Saturday",
            is_half_day: day.weekday === "Saturday" ? true : false,
          }))
        );
        setHolidays([{ id: crypto.randomUUID(), holiday_date: "", description: "", is_half_day: false }]);
      }
    }
  }, [isOpen, initialData]);

  // --- Handlers ---
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
        country: country,
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
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {saving ? "Saving…" : isEdit ? "Update List" : "Create Holiday List"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Holiday List" : "Add Holiday List"}
      subtitle="Manage company holidays and weekly off days"
      icon={Calendar}
      maxWidth="3xl"
      height="auto"
      footer={footer}
    >
      <div className="space-y-8 pb-2">
        {/* BASIC DETAILS */}
        <section>
          <h3 className="mb-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Basic Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-main">
                Holiday List Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. India Holidays 2026"
                className="w-full rounded-md border border-[var(--border)] bg-app px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-main">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-app px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-main">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-app px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-main">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-app px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>
          </div>
        </section>

        <hr className="border-[var(--border)]" />

        {/* WEEKLY OFFS */}
        <section>
          <h3 className="mb-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Weekly Offs
          </h3>
          <div className="flex flex-wrap gap-3">
            {weeklyOffs.map((day, idx) => (
              <div
                key={day.weekday}
                className={`flex w-24 flex-col justify-between rounded-lg border p-3 transition-colors ${
                  day.selected
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-[var(--border)] bg-app"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      day.selected ? "text-blue-700" : "text-main"
                    }`}
                  >
                    {day.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={day.selected}
                    onChange={() => toggleWeeklyOff(idx)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-sub">
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
                    <div className="peer h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-[var(--border)]" />

        {/* HOLIDAYS LIST */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Holidays List
            </h3>
            <button
              onClick={handleAddHolidayRow}
              className="flex items-center space-x-1 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              <Plus size={16} />
              <span>Add Row</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-app">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium text-sub uppercase">
                <tr>
                  <th className="px-4 py-3 w-40 border-b border-[var(--border)]">Date</th>
                  <th className="px-4 py-3 border-b border-[var(--border)]">Description</th>
                  <th className="px-4 py-3 w-32 text-center border-b border-[var(--border)]">Is Half Day</th>
                  <th className="px-4 py-3 w-20 text-center border-b border-[var(--border)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {holidays.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={row.holiday_date}
                        onChange={(e) => updateHoliday(row.id, "holiday_date", e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0 text-main"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="E.g. Diwali Eve"
                        value={row.description}
                        onChange={(e) => updateHoliday(row.id, "description", e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0 text-main"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={row.is_half_day}
                          onChange={(e) => updateHoliday(row.id, "is_half_day", e.target.checked)}
                        />
                        <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                      </label>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRemoveHolidayRow(row.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {holidays.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sub">
                      No holidays added yet. Click "Add Row" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MinimizableModal>
  );
};