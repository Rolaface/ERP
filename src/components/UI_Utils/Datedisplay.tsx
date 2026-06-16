
const MONTHS = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC",
];

export function formatDate(date?: string | Date | null): string {
  if (!date) return "—";

  if (typeof date === "string") {
  const datePart = date.split("T")[0].split(" ")[0];
  const [year, month, day] = datePart.split("-").map(Number); 
  if (!year || !month || !day) return "—";
  return `${String(day).padStart(2, "0")}-${MONTHS[month - 1]}-${year}`;
}

  // Date object
  return `${String(date.getDate()).padStart(2, "0")}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────


interface DateDisplayProps {
  date?: string | Date | null;
  className?: string;
}

export function DateDisplay({ date, className = "text-sm text-sub whitespace-nowrap" }: DateDisplayProps) {
  return <span className={className}>{formatDate(date)}</span>;
}

export default DateDisplay;