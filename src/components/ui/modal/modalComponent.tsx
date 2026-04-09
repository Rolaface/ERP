import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  error?: string;
}

export const ModalSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, icon, options = [], children, className = "", error, ...props },
    ref,
  ) => (
    <label className="flex flex-col text-sm group min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        {icon && (
          <span className="text-muted group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </span>

      <select
        ref={ref}
        {...props}
        value={props.value ?? ""}
        className={[
          "py-1 px-2 border rounded text-[11px] text-main bg-card transition-all w-auto min-w-0",
          error
            ? "border-danger"
            : props.disabled
              ? "bg-app cursor-not-allowed opacity-60 border-theme"
              : "border-[var(--border)] hover:border-primary/40",
          className,
        ].join(" ")}
      >
        <option value="" disabled>
          {props.placeholder || "Select"}
        </option>
        {children ??
          options.map((opt, idx) => (
            <option key={`${opt.value}-${idx}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>

      {error && <span className="text-danger text-[10px] mt-1">{error}</span>}
    </label>
  ),
);
ModalSelect.displayName = "ModalSelect";

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Parse any of these formats into a JS Date (local time, no UTC shift):
 *   "05-Mar-2026"  ← display format
 *   "yyyy-mm-dd"   ← backend ISO / <input type="date">
 *   ISO strings    ← e.g. "2024-03-15T00:00:00.000Z"
 */
function parseDate(value: string): Date | null {
  if (!value) return null;

  // dd-MMM-yyyy  e.g. "05-Mar-2026"
  const dmonthY = value.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmonthY) {
    const [, dd, mon, yyyy] = dmonthY;
    const mm = MONTHS.findIndex((m) => m.toLowerCase() === mon.toLowerCase());
    if (mm !== -1) return new Date(Number(yyyy), mm, Number(dd));
  }

  // yyyy-mm-dd  (backend / HTML date input)
  const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, yyyy, mm, dd] = ymdMatch;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  // fallback — let the browser try (ISO timestamp, etc.)
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a Date → "05-Mar-2026" for display.
 */
function formatDisplay(date: Date): string {
  const dd   = String(date.getDate()).padStart(2, "0");
  const mon  = MONTHS[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${dd}-${mon}-${yyyy}`;
}

/**
 * Format a Date → "yyyy-mm-dd" for the backend / form value.
 */
function formatISO(date: Date): string {
  const dd   = String(date.getDate()).padStart(2, "0");
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

// ─── ModalInput ──────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

export const ModalInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, className = "", error, ...props }, ref) => {
    const inputClass = [
      "py-1 px-2 border rounded text-[11px] text-main bg-card transition-all w-auto min-w-0",
      error
        ? "border-danger focus:border-danger"
        : props.disabled
          ? "bg-app cursor-not-allowed opacity-60 border-theme"
          : "border-[var(--border)] hover:border-primary/40",
      className,
    ].join(" ");

    return (
      <label className="flex flex-col text-sm group min-w-0">
        {/* LABEL */}
        <span className="block text-[10px] font-medium text-main mb-1">
          {icon && (
            <span className="text-muted group-focus-within:text-primary transition-colors">
              {icon}
            </span>
          )}
          {label}
          {props.required && <span className="text-danger">*</span>}
        </span>

        {/* DATE PICKER */}
{/* DATE PICKER */}
{props.type === "date" ? (
 <div className="relative w-full min-w-[140px]">
    {/* visible text display */}
    <input
      type="text"
      readOnly
      value={props.value ? formatDisplay(parseDate(props.value as string)!) : ""}
      placeholder="DD-MMM-YYYY"
      disabled={props.disabled}
      className={
  inputClass +
  " cursor-pointer pr-7 w-full min-w-[140px] h-[28px] text-[11px]"
}
      onClick={() => {
        if (!props.disabled) {
          (document.getElementById(`date-hidden-${props.name}-${props.id ?? props.name}`) as HTMLInputElement)?.showPicker?.();
        }
      }}
    />
    {/* calendar icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
    {/* hidden native date input that drives the value */}
    <input
      id={`date-hidden-${props.name}-${props.id ?? props.name}`}
      type="date"
      name={props.name}
      value={props.value as string ?? ""}
      disabled={props.disabled}
      onChange={(e) => props.onChange?.(e)}
    className="absolute right-0 top-0 opacity-0 w-7 h-full cursor-pointer"
      tabIndex={-1}
    />
  </div>
) : (
          /* REGULAR INPUT */
          <input
            ref={ref}
            {...props}
            value={props.value ?? ""}
            className={inputClass}
            onFocus={(e) => {
              if (!props.disabled) {
                e.currentTarget.style.boxShadow = error
                  ? "0 0 0 3px rgba(239,68,68,0.18)"
                  : "0 0 0 3px rgba(37,99,235,0.16)";
              }
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "";
              props.onBlur?.(e);
            }}
          />
        )}

        {error && <span className="text-[10px] text-danger mt-1">{error}</span>}
      </label>
    );
  },
);
ModalInput.displayName = "ModalInput";

// ─── ModalTextarea ───────────────────────────────────────────────────────────

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: React.ReactNode;
}

export const ModalTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ label, icon, className = "", ...props }, ref) => (
  <label className="flex flex-col text-sm w-full group">
    <span className="block text-[10px] font-medium text-main mb-1">
      {icon && (
        <span className="text-muted group-focus-within:text-primary transition-colors">
          {icon}
        </span>
      )}
      {label}
      {props.required && <span className="text-danger">*</span>}
    </span>

    <textarea
      ref={ref}
      {...props}
      className={[
        "w-full h-[30px] py-1 px-2 border rounded text-[11px] resize-none text-main bg-card transition-all",
        props.disabled
          ? "bg-app cursor-not-allowed opacity-60 border-theme"
          : "border-[var(--border)] hover:border-primary/40",
        className,
      ].join(" ")}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.16)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "";
        props.onBlur?.(e);
      }}
    />
  </label>
));
ModalTextarea.displayName = "ModalTextarea";

// ─── FilterSelect ────────────────────────────────────────────────────────────

interface FilterSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
}

export const FilterSelect = React.forwardRef<
  HTMLSelectElement,
  FilterSelectProps
>(({ options = [], className = "", ...props }, ref) => (
  <select
    ref={ref}
    {...props}
    value={props.value ?? ""}
    className={[
      "h-9 min-w-[60px] px-3 py-1",
      "bg-card border border-[var(--border)]",
      "rounded-xl text-xs font-medium text-main",
      "focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all",
      className,
    ].join(" ")}
  >
    <option value="">ALL</option>
    {options.map((opt, idx) => (
      <option key={`${opt.value}-${idx}`} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
));
FilterSelect.displayName = "FilterSelect";

// ─── YesNoCheckbox ───────────────────────────────────────────────────────────

interface YesNoCheckboxProps {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (name: string, value: string) => void;
}

export const YesNoCheckbox: React.FC<YesNoCheckboxProps> = ({
  name,
  label,
  value,
  required,
  disabled,
  onChange,
}) => {
  const normalizedValue = value === "Y" ? "Y" : "N";
  const checked = normalizedValue === "Y";

  return (
    <label className="flex flex-col min-w-0 w-fit">
      <span className="block text-[10px] font-medium text-main mb-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>

      <div className="flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => !disabled && onChange(name, checked ? "N" : "Y")}
          className={[
            "w-7 h-7 rounded-md border flex items-center justify-center transition-all",
            checked
              ? "bg-primary border-primary"
              : "bg-card border-theme hover:border-primary/60",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        >
          {checked && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span className="text-[11px] text-main">{checked ? "Yes" : "No"}</span>
      </div>

      <input type="hidden" name={name} value={normalizedValue} />
    </label>
  );
};



interface CreditDaysInputProps {
  value: string | number;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export const CreditDaysInput: React.FC<CreditDaysInputProps> = ({
  value,
  name,
  onChange,
  required,
  error,
  className,
}) => {
  return (
    <label className="flex flex-col text-sm group min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        Credit Days
        {required && <span className="text-danger">*</span>}
      </span>

      <div className="relative w-full">
        <input
          type="number"
          name={name}
          value={value ?? ""}
          min={0}
          onChange={onChange}
          className={[
            "py-1 pl-2 pr-10 border rounded text-[11px] text-main bg-card transition-all w-full min-w-0",
            error
              ? "border-danger focus:border-danger"
              : "border-[var(--border)] hover:border-primary/40",
              className,
          ].join(" ")}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(239,68,68,0.18)"
              : "0 0 0 3px rgba(37,99,235,0.16)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "";
          }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted pointer-events-none">
  Days
</span>
      </div>

      {error && <span className="text-[10px] text-danger mt-1">{error}</span>}
    </label>
  );
};