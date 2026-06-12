import React, { useEffect, useState } from "react";
import { Calendar, Save, X, Plus, Trash2, Loader2 } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import {
  createHolidayList,
  updateHolidayList,
  getHolidayListByName,
} from "../../../api/holidayListApi";
import type { HolidayList } from "../../../views/hr/tabs/leave-config/hooks/useHolidayLists";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
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

.hl-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
}
.hl-input:focus {
  outline: none;
  box-shadow: none;
}
.hl-input::placeholder {
  color: #9ca3af;
}
`;

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: HolidayList | null;
  onSuccess?: () => void;
  isViewMode?: boolean;
}

interface HolidayRow {
  id: string;
  holiday_date: string;
  description: string;
  is_half_day: boolean;
}

interface WeeklyHolidayRow {
  id: string;
  holiday_date: string;
  description: string;
  is_half_day?: boolean;
}

interface WeeklyOffDay {
  weekday: string;
  label: string;
  selected: boolean;
  is_half_day: boolean;
}

const DEFAULT_WEEKDAYS: WeeklyOffDay[] = [
  { weekday: "Monday", label: "Monday", selected: false, is_half_day: false },
  { weekday: "Tuesday", label: "Tuesday", selected: false, is_half_day: false },
  {
    weekday: "Wednesday",
    label: "Wednesday",
    selected: false,
    is_half_day: false,
  },
  {
    weekday: "Thursday",
    label: "Thursday",
    selected: false,
    is_half_day: false,
  },
  { weekday: "Friday", label: "Friday", selected: false, is_half_day: false },
  {
    weekday: "Saturday",
    label: "Saturday",
    selected: false,
    is_half_day: false,
  },
  { weekday: "Sunday", label: "Sunday", selected: false, is_half_day: false },
];

// Helper to generate IDs safely (crypto.randomUUID fails in non-HTTPS local dev)
const generateId = () => Math.random().toString(36).substring(2, 9);

export const HolidayListModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
  isViewMode = false,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [weeklyOffs, setWeeklyOffs] = useState<WeeklyOffDay[]>(DEFAULT_WEEKDAYS);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [weeklyHolidays, setWeeklyHolidays] = useState<WeeklyHolidayRow[]>([]);
  
  const [activeTab, setActiveTab] = useState<"public" | "weekly">("public");

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
    if (!isOpen) return;

    if (initialData?.name) {
      fetchHolidayListDetails(initialData.name);
    } else {
      setName("");
      setFromDate("");
      setToDate("");
      setActiveTab("public");
      setWeeklyOffs(
        DEFAULT_WEEKDAYS.map((day) => ({
          ...day,
          selected: day.weekday === "Sunday" || day.weekday === "Saturday",
          is_half_day: day.weekday === "Saturday",
        })),
      );
      setWeeklyHolidays([]);
      setHolidays([
        {
          id: generateId(),
          holiday_date: "",
          description: "",
          is_half_day: false,
        },
      ]);
    }
  }, [isOpen, initialData]);

  const fetchHolidayListDetails = async (idName: string) => {
    try {
      setIsLoading(true);
      const res = await getHolidayListByName(idName);

      const data = res?.data || res?.message || res;

      setName(data.holiday_list_name || "");
      setFromDate(data.from_date || "");
      setToDate(data.to_date || "");

      const fetchedWeeklyOffs = data.weekly_offs || [];
      const mappedWeekdays = DEFAULT_WEEKDAYS.map((day) => {
        const matchedOff = fetchedWeeklyOffs.find(
          (off: any) => off.weekday === day.weekday,
        );
        if (matchedOff) {
          return {
            ...day,
            selected: true,
            is_half_day: !!matchedOff.is_half_day,
          };
        }
        return { ...day, selected: false, is_half_day: false };
      });
      setWeeklyOffs(mappedWeekdays);

      const fetchedHolidays = data.holidays || [];
      setHolidays(
        fetchedHolidays.map((h: any) => ({
          id: generateId(),
          holiday_date: h.holiday_date,
          description: h.description,
          is_half_day: !!h.is_half_day,
        })),
      );

      const fetchedWeeklyHolidays = data.weekly_holidays || [];
      setWeeklyHolidays(
        fetchedWeeklyHolidays.map((h: any) => ({
          id: generateId(),
          holiday_date: h.holiday_date,
          description: h.description,
          is_half_day: !!h.is_half_day,
        })),
      );
    } catch (error: any) {
      showApiError(error?.message || "Failed to fetch holiday list details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHolidayRow = () => {
    if (isViewMode) return;
    setHolidays((prev) => [
      ...prev,
      {
        id: generateId(),
        holiday_date: "",
        description: "",
        is_half_day: false,
      },
    ]);
  };

  const handleRemoveHolidayRow = (id: string) => {
    if (isViewMode) return;
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const handleRemoveWeeklyHolidayRow = (id: string) => {
    if (isViewMode) return;
    setWeeklyHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHoliday = (
    id: string,
    field: keyof HolidayRow,
    value: string | boolean,
  ) => {
    if (isViewMode) return;
    setHolidays((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    );
  };

  const toggleWeeklyOff = (index: number) => {
    if (isViewMode) return;

    const dayName = weeklyOffs[index].weekday;
    const willBeSelected = !weeklyOffs[index].selected;

    setWeeklyOffs((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected: willBeSelected,
        is_half_day: willBeSelected ? updated[index].is_half_day : false,
      };
      return updated;
    });

    // If a day is unchecked, automatically remove it from the weekly holidays list payload
    if (!willBeSelected) {
      setWeeklyHolidays((prev) => prev.filter((h) => h.description !== dayName));
    }
  };

  const toggleWeeklyOffHalfDay = (index: number) => {
    if (isViewMode) return;
    setWeeklyOffs((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        is_half_day: !updated[index].is_half_day,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    if (isViewMode) return;
    if (!name.trim())
      return showValidationError("Holiday List Name is required");
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
        weekly_holidays: weeklyHolidays
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
        disabled={isLoading || saving}
        className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
      >
        {isViewMode ? "Close" : "Cancel"}
      </button>
      {!isViewMode && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isLoading}
          className="rounded-lg bg-[#3F25C8] px-5 py-1.5 text-sm font-medium text-white transition hover:bg-[#321ca1] disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin text-white" />}
          {saving
            ? "Saving…"
            : isEdit
              ? "Update Holiday List"
              : "Create Holiday List"}
        </button>
      )}
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={
        isViewMode
          ? "View Holiday List"
          : isEdit
            ? "Edit Holiday List"
            : "Add Holiday List"
      }
      icon={Calendar}
      maxWidth="5xl"
      height="80vh"
      footer={footer}
    >
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center min-h-[300px]">
          <Loader2 size={32} className="animate-spin text-[#3F25C8]" />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(80vh - 130px)",
            overflowY: "auto",
            paddingRight: "4px",
          }}
          className="space-y-6"
        >
          <section>
            <h3 className="mb-2.5 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
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
                  disabled={isViewMode}
                  placeholder="e.g. India Holidays 2026"
                  className="w-full h-[28px] rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#3F25C8] focus:ring-1 focus:ring-[#3F25C8] disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="col-span-6 md:col-span-3">
                <DatePickerInput
                  label="From Date"
                  name="fromDate"
                  value={fromDate}
                  onChange={(_, v) => setFromDate(v)}
                  disabled={isViewMode}
                />
              </div>

              <div className="col-span-6 md:col-span-3">
                <DatePickerInput
                  label="To Date"
                  name="toDate"
                  value={toDate}
                  onChange={(_, v) => setToDate(v)}
                  disabled={isViewMode}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
              Weekly Offs
            </h3>
            <div className="grid grid-cols-7 gap-3 w-full">
              {weeklyOffs.map((day, idx) => (
                <div
                  key={day.weekday}
                  className={`flex h-[60px] w-full flex-col justify-between rounded-lg border p-2 transition-colors ${
                    day.selected
                      ? "border-[#D6D0F9] bg-[#F7F5FF]"
                      : "border-gray-200 bg-white"
                  } ${isViewMode ? "opacity-80" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold ${
                        day.selected ? "text-[#3F25C8]" : "text-gray-800"
                      }`}
                    >
                      {day.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={day.selected}
                      onChange={() => toggleWeeklyOff(idx)}
                      disabled={isViewMode}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[#3F25C8] focus:ring-[#3F25C8] cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold leading-none ${
                        day.selected ? "text-[#3F25C8]" : "text-gray-400"
                      }`}
                    >
                      HALF DAY
                    </span>
                    <label
                      className={`relative inline-flex items-center ${
                        !day.selected || isViewMode
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={day.is_half_day}
                        onChange={() => toggleWeeklyOffHalfDay(idx)}
                        disabled={!day.selected || isViewMode}
                      />
                      <div className="peer h-3.5 w-6 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-2.5 after:w-2.5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#3F25C8] peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div className="mb-2.5 flex items-center border-b border-gray-200">
              <button
                type="button"
                className={`py-2 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "public"
                    ? "border-b-2 border-[#3F25C8] text-[#3F25C8]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("public")}
              >
                Public Holidays
              </button>
              <button
                type="button"
                className={`py-2 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "weekly"
                    ? "border-b-2 border-[#3F25C8] text-[#3F25C8]"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                onClick={() => setActiveTab("weekly")}
              >
                Weekly Off Dates
              </button>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                borderTopLeftRadius: 0,
              }}
            >
              {activeTab === "public" ? (
                <>
                  <div
                    className="hl-row"
                    style={{
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      minHeight: 32,
                      gridTemplateColumns: isViewMode
                        ? "160px 1fr 100px"
                        : "160px 1fr 100px 50px",
                    }}
                  >
                    <div className="hl-cell hl-cell-border hl-col-header">Date</div>
                    <div className="hl-cell hl-cell-border hl-col-header">
                      Description
                    </div>
                    <div
                      className={`hl-cell hl-col-header ${!isViewMode ? "hl-cell-border" : ""}`}
                      style={{ justifyContent: "center" }}
                    >
                      Is Half Day
                    </div>
                    {!isViewMode && (
                      <div
                        className="hl-cell hl-col-header"
                        style={{ justifyContent: "center" }}
                      >
                        Action
                      </div>
                    )}
                  </div>

                  <div
                    className="hl-table-wrap"
                    style={{ flex: 1, minHeight: "150px" }}
                  >
                    {holidays.map((row) => (
                      <div
                        key={row.id}
                        className="hl-row"
                        style={{
                          gridTemplateColumns: isViewMode
                            ? "160px 1fr 100px"
                            : "160px 1fr 100px 50px",
                        }}
                      >
                        <div
                          className="hl-cell hl-cell-border"
                          style={{ padding: "0 8px" }}
                        >
                          <DatePickerInput
                            name={`date-${row.id}`}
                            value={row.holiday_date}
                            onChange={(_, v) =>
                              updateHoliday(row.id, "holiday_date", v)
                            }
                            disabled={isViewMode}
                          />
                        </div>

                        <div className="hl-cell hl-cell-border">
                          <input
                            type="text"
                            placeholder="E.g. Diwali Eve"
                            value={row.description}
                            onChange={(e) =>
                              updateHoliday(row.id, "description", e.target.value)
                            }
                            disabled={isViewMode}
                            className="w-full h-[26px] rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#3F25C8] focus:ring-1 focus:ring-[#3F25C8] disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>

                        <div
                          className={`hl-cell ${!isViewMode ? "hl-cell-border" : ""}`}
                          style={{ justifyContent: "center" }}
                        >
                          <label
                            className={`relative inline-flex items-center ${
                              isViewMode ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={row.is_half_day}
                              onChange={(e) =>
                                updateHoliday(
                                  row.id,
                                  "is_half_day",
                                  e.target.checked,
                                )
                              }
                              disabled={isViewMode}
                            />
                            <div className="peer h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#3F25C8] peer-checked:after:translate-x-full peer-focus:outline-none peer-disabled:opacity-50"></div>
                          </label>
                        </div>

                        {!isViewMode && (
                          <div
                            className="hl-cell"
                            style={{ justifyContent: "center" }}
                          >
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
                        )}
                      </div>
                    ))}

                    {holidays.length === 0 && (
                      <div
                        style={{
                          padding: "24px 0",
                          textAlign: "center",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        No public holidays added yet.
                        {!isViewMode && " Click Add Row to start."}
                      </div>
                    )}
                  </div>

                  {!isViewMode && (
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
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#ebe6ff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#F7F5FF")
                        }
                      >
                        <Plus style={{ width: 12, height: 12 }} />
                        Add Row
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    className="hl-row"
                    style={{
                      background: "#f9fafb",
                      borderBottom: "1px solid #e5e7eb",
                      minHeight: 32,
                      gridTemplateColumns: isViewMode
                        ? "160px 1fr 100px"
                        : "160px 1fr 100px 50px",
                    }}
                  >
                    <div className="hl-cell hl-cell-border hl-col-header">Date</div>
                    <div className="hl-cell hl-cell-border hl-col-header">
                      Description
                    </div>
                    <div
                      className={`hl-cell hl-col-header ${!isViewMode ? "hl-cell-border" : ""}`}
                      style={{ justifyContent: "center" }}
                    >
                      Is Half Day
                    </div>
                    {!isViewMode && (
                      <div
                        className="hl-cell hl-col-header"
                        style={{ justifyContent: "center" }}
                      >
                        Action
                      </div>
                    )}
                  </div>
                  <div
                    className="hl-table-wrap"
                    style={{ flex: 1, minHeight: "150px" }}
                  >
                    {weeklyHolidays.map((row) => (
                      <div
                        key={row.id}
                        className="hl-row hover:bg-gray-50"
                        style={{
                          gridTemplateColumns: isViewMode
                            ? "160px 1fr 100px"
                            : "160px 1fr 100px 50px",
                        }}
                      >
                        <div className="hl-cell hl-cell-border px-4 py-2 text-[11px] font-medium text-gray-800">
                          {row.holiday_date}
                        </div>
                        <div className="hl-cell hl-cell-border px-4 py-2 text-[11px] font-medium text-gray-800">
                          {row.description}
                        </div>
                        <div
                          className={`hl-cell ${!isViewMode ? "hl-cell-border" : ""}`}
                          style={{ justifyContent: "center" }}
                        >
                          <label className="relative inline-flex items-center cursor-default">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={!!row.is_half_day}
                              readOnly
                            />
                            <div className="peer h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#3F25C8] peer-checked:after:translate-x-full peer-focus:outline-none opacity-80"></div>
                          </label>
                        </div>
                        {!isViewMode && (
                          <div
                            className="hl-cell"
                            style={{ justifyContent: "center" }}
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveWeeklyHolidayRow(row.id)}
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
                        )}
                      </div>
                    ))}

                    {weeklyHolidays.length === 0 && (
                      <div
                        style={{
                          padding: "24px 0",
                          textAlign: "center",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        No weekly holidays generated yet.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </MinimizableModal>
  );
};