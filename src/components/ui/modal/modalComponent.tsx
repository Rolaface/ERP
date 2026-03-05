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
        {props.type === "date" ? (
          <DatePicker
            // ── display ──────────────────────────────────────────────────
            selected={parseDate(props.value as string)}
            dateFormat="dd-MMM-yyyy"
            placeholderText="05-Mar-2026"
             portalId="root"  

            // ── on calendar select ────────────────────────────────────────
            onChange={(date: Date | null) => {
              if (!date) return;
              props.onChange?.({
                target: { name: props.name, value: formatISO(date) },
              } as React.ChangeEvent<HTMLInputElement>);
            }}

            // ── when user finishes typing, parse dd-MMM-yyyy manually ─────
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              const typed = e.currentTarget.value;
              const parsed = parseDate(typed);
              if (parsed) {
                props.onChange?.({
                  target: { name: props.name, value: formatISO(parsed) },
                } as React.ChangeEvent<HTMLInputElement>);
              }
              props.onBlur?.(e as any);
            }}

            disabled={props.disabled}
            className={inputClass}
            // Keep the hidden input name so form libs (react-hook-form, etc.)
            // can still read the value by field name.
            name={props.name}
          />
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
    <label className="flex flex-col text-sm min-w-0 w-fit">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted mb-1">
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
}

export const CreditDaysInput: React.FC<CreditDaysInputProps> = ({
  value,
  name,
  onChange,
  required,
  error,
}) => {
  return (
    <label className="flex flex-col text-sm group min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        Credit Days
        {required && <span className="text-danger">*</span>}
      </span>

      <div className="relative flex items-center">
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
        <span className="absolute right-2 text-[11px] text-muted pointer-events-none">
          Days
        </span>
      </div>

      {error && <span className="text-[10px] text-danger mt-1">{error}</span>}
    </label>
  );
};