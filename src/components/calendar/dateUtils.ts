export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface QuickDuration {
  label: string;
  minutes: number;
}

export const DEFAULT_QUICK_DURATIONS: QuickDuration[] = [
  { label: "0.5h", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "6h", minutes: 360 },
  { label: "8h", minutes: 480 },
];

const pad = (n: number) => String(n).padStart(2, "0");

export const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseYMD = (s: string) => new Date(`${s}T00:00:00`);

export const sortRange = (a: string, b: string): [string, string] =>
  a <= b ? [a, b] : [b, a];

export interface CalCell {
  ymd: string;
  day: number;
  inMonth: boolean;
}

export function calCells(year: number, month: number): CalCell[] {
  const first = new Date(year, month, 1).getDay();
  const total =
    Math.ceil((first + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(year, month, 1 - first + i);
    return { ymd: toYMD(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

export function fmtDate(s?: string) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d} ${MONTHS[+m - 1].slice(0, 3)} ${y}`;
}

export function fmtShortDate(s?: string) {
  if (!s) return "";
  const [, m, d] = s.split("-");
  return `${d} ${MONTHS[+m - 1].slice(0, 3)}`;
}

export function daysBetween(from: string, to: string) {
  if (!from || !to) return 1;
  return (
    Math.round((parseYMD(to).getTime() - parseYMD(from).getTime()) / 86400000) +
    1
  );
}

export function calcDurationHours(from: string, to: string): number {
  if (!from || !to) return 0;
  const [h1, m1] = from.split(":").map(Number);
  const [h2, m2] = to.split(":").map(Number);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

export function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${pad(h)}:${pad(Number(mStr ?? 0))} ${period}`;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function addMinutes(time24: string, minutes: number): string {
  const total = Math.max(
    0,
    Math.min(23 * 60 + 59, toMinutes(time24) + minutes),
  );
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function buildTimeOptions(intervalMinutes: number): string[] {
  const count = Math.floor((24 * 60) / intervalMinutes);
  return Array.from({ length: count }, (_, i) => {
    const total = i * intervalMinutes;
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  });
}

export function draftRange(
  date: string,
  from: string,
  toDate: string,
  to: string,
) {
  if (!date || !toDate || !from || !to) return { invalid: true, hours: 0 };
  const s = new Date(`${date}T${from}:00`).getTime();
  const e = new Date(`${toDate}T${to}:00`).getTime();
  if (!(e > s)) return { invalid: true, hours: 0 };
  return { invalid: false, hours: Math.round(((e - s) / 3600000) * 100) / 100 };
}