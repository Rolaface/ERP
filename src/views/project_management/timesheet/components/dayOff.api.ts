import { createAxiosInstance } from "../../../../api/axiosInstance";
import { API, ERP_BASE } from "../../../../config/api";
import type { DayOff } from "./dayOff.types";

const api = createAxiosInstance(ERP_BASE);

interface HolidayRow {
  holiday_date: string;
  description: string;
  weekly_off?: 0 | 1;
  is_half_day?: 0 | 1;
}

interface LeaveRow {
  employee: string;
  employee_name?: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  half_day?: 0 | 1;
  half_day_date?: string;
}

const LEAVE_FIELDS = [
  "employee",
  "employee_name",
  "leave_type",
  "from_date",
  "to_date",
  "half_day",
  "half_day_date",
];
const APPROVED = "Approved";

const pad = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const nextDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

export const getHolidayDayOffs = async (listName: string): Promise<DayOff[]> => {
  const url = `${API.holidayList.getByName}?name=${encodeURIComponent(listName)}`;
  const resp = await api.get(url);
  const rows: HolidayRow[] = resp.data?.data?.holidays ?? [];
  return rows.map((h) => ({
    date: h.holiday_date,
    kind: h.weekly_off ? "weekly_off" : "company_holiday",
    label: h.description,
    halfDay: Boolean(h.is_half_day),
  }));
};

const expandLeave = (l: LeaveRow, from: string, to: string): DayOff[] => {
  const start = fromYMD(l.from_date > from ? l.from_date : from);
  const end = fromYMD(l.to_date < to ? l.to_date : to);
  const days: DayOff[] = [];
  for (let d = start; d <= end; d = nextDay(d)) {
    const date = toYMD(d);
    days.push({
      date,
      kind: "leave",
      label: l.leave_type,
      employee: l.employee,
      employeeName: l.employee_name,
      halfDay: Boolean(l.half_day) && date === l.half_day_date,
    });
  }
  return days;
};

export const getLeaveDayOffs = async (
  from: string,
  to: string,
  employee?: string,
): Promise<DayOff[]> => {
  const filters: unknown[][] = [
    ["status", "=", APPROVED],
    ["from_date", "<=", to],
    ["to_date", ">=", from],
  ];
  if (employee) filters.push(["employee", "=", employee]);

  const resp = await api.get(API.leaveApplication.getAll, {
    params: {
      fields: JSON.stringify(LEAVE_FIELDS),
      filters: JSON.stringify(filters),
      limit_page_length: 0,
    },
  });
  const rows: LeaveRow[] = resp.data?.data ?? [];
  return rows.flatMap((l) => expandLeave(l, from, to));
};