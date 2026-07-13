import React from "react";
import { NumericFormat } from "react-number-format";
import { showValidationError } from "../../../utils/alert";

interface SelectOption {
  label: string;
  value: string | number;
}

// ─── Shared number input helpers ─────────────────────────────────────────────

const numberInputProps = {
  onWheel: (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur(),
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
  },
};

// ─── ModalSelect ─────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  error?: string;
}

export const ModalSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, options = [], children, className = "", error, ...props }, ref) => (
    <label className="flex flex-col text-sm group min-w-0">
      <span className="block text-[10px] font-medium text-main mb-1">
        {icon && (
          <span className="text-muted group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        {label}
        {props.required && <span className="text-danger">*</span>}
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDate(value: string): Date | null {
  if (!value) return null;
  const dmonthY = value.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmonthY) {
    const [, dd, mon, yyyy] = dmonthY;
    const mm = MONTHS.findIndex((m) => m.toLowerCase() === mon.toLowerCase());
    if (mm !== -1) return new Date(Number(yyyy), mm, Number(dd));
  }
  const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, yyyy, mm, dd] = ymdMatch;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mon = MONTHS[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${dd}-${mon}-${yyyy}`;
}

// ─── ModalInput ──────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  /**
   * Optional button/icon rendered inside the input box, right-aligned and
   * vertically centered against the input itself (not the label above it).
   * Use for inline actions like "open a picker" or "search this field".
   * Pass a fully-formed <button> (or similar) — ModalInput only positions it.
   */
  trailingIcon?: React.ReactNode;
}

export const ModalInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, className = "", error, trailingIcon, ...props }, ref) => {
    const isNumber = props.type === "number";

    const inputClass = [
      "py-1 px-2 border rounded text-[11px] text-main bg-card transition-all w-auto min-w-0",
      isNumber ? "no-spinner" : "",
      trailingIcon ? "pr-7" : "",
      error
        ? "border-danger focus:border-danger"
        : props.disabled
          ? "bg-app cursor-not-allowed opacity-60 border-theme"
          : "border-[var(--border)] hover:border-primary/40",
      className,
    ].join(" ");

    return (
      <label className="flex flex-col text-sm group min-w-0">
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
          <div className="relative w-full min-w-[140px]">
            <input
              type="text"
              readOnly
              value={props.value ? formatDisplay(parseDate(props.value as string)!) : ""}
              placeholder="DD-MMM-YYYY"
              disabled={props.disabled}
              className={inputClass + " cursor-pointer pr-7 w-full min-w-[140px] h-[28px] text-[11px]"}
              onClick={() => {
                if (!props.disabled) {
                  (document.getElementById(
                    `date-hidden-${props.name}-${props.id ?? props.name}`,
                  ) as HTMLInputElement)?.showPicker?.();
                }
              }}
            />
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
            <input
              id={`date-hidden-${props.name}-${props.id ?? props.name}`}
              type="date"
              name={props.name}
              value={(props.value as string) ?? ""}
              disabled={props.disabled}
              onChange={(e) => { if (e.target.value) props.onChange?.(e); }}
              className="absolute right-0 top-0 opacity-0 w-7 h-full cursor-pointer"
              tabIndex={-1}
            />
          </div>
        ) : trailingIcon ? (
          /* INPUT WITH TRAILING ICON — wrapper hugs only the input row
             (sibling of the label span above), so absolute positioning
             centers against the input's own height, never the label. */
          <div className="relative w-full min-w-0">
            <input
              ref={ref}
              {...props}
              value={props.value ?? ""}
              className={inputClass + " w-full"}
              onWheel={isNumber ? numberInputProps.onWheel : props.onWheel}
              onKeyDown={
                isNumber
                  ? (e) => {
                      numberInputProps.onKeyDown(e);
                      props.onKeyDown?.(e);
                    }
                  : props.onKeyDown
              }
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
            <div className="absolute right-1 top-0 bottom-0 flex items-center">
              {trailingIcon}
            </div>
          </div>
        ) : (
          /* REGULAR INPUT */
          <input
            ref={ref}
            {...props}
            value={props.value ?? ""}
            className={inputClass}
            onWheel={isNumber ? numberInputProps.onWheel : props.onWheel}
            onKeyDown={
              isNumber
                ? (e) => {
                    numberInputProps.onKeyDown(e);
                    props.onKeyDown?.(e);
                  }
                : props.onKeyDown
            }
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

// ─── ModalTextarea ────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: React.ReactNode;
}

export const ModalTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, icon, className = "", ...props }, ref) => (
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
        value={props.value ?? ""}
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
  ),
);
ModalTextarea.displayName = "ModalTextarea";

// ─── FilterSelect ─────────────────────────────────────────────────────────────

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
}

export const FilterSelect = React.forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ options = [], className = "", ...props }, ref) => (
    <select
      ref={ref}
      {...props}
      value={props.value ?? ""}
      className={[
        "h-8 min-w-[60px] px-2.5 py-1",
        "bg-card border border-[var(--border)]",
        "rounded-lg text-xs font-medium text-main",
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
  ),
);
FilterSelect.displayName = "FilterSelect";

// ─── YesNoCheckbox ────────────────────────────────────────────────────────────

interface YesNoCheckboxProps {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (name: string, value: string) => void;
}

export const YesNoCheckbox: React.FC<YesNoCheckboxProps> = ({
  name, label, value, required, disabled, onChange,
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
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-[11px] text-main">{checked ? "Yes" : "No"}</span>
      </div>
      <input type="hidden" name={name} value={normalizedValue} />
    </label>
  );
};

// ─── CreditDaysInput ──────────────────────────────────────────────────────────

interface CreditDaysInputProps {
  value: string | number;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export const CreditDaysInput: React.FC<CreditDaysInputProps> = ({
  value, name, onChange, required, error, className,
}) => (
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
        placeholder="0"
        onChange={onChange}
        onWheel={numberInputProps.onWheel}
        onKeyDown={numberInputProps.onKeyDown}
        className={[
          "no-spinner py-1 pl-2 pr-10 border rounded text-[11px] text-main bg-card transition-all w-full min-w-0",
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
        onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted pointer-events-none">
        Days
      </span>
    </div>
    {error && <span className="text-[10px] text-danger mt-1">{error}</span>}
  </label>
);

interface NumericInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  decimalScale?: number;
  allowNegative?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  max?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  decimalScale = 6,
  allowNegative = false,
  disabled = false,
  className = "",
  name,
  max,
}) => {
  React.useEffect(() => {
    if (max != null && value != null && value > max) {
      onChange(max);
    }
  }, [max, value, onChange]);

  return (
    <NumericFormat
      name={name}
      value={value ?? ""}
      placeholder={placeholder}
      decimalScale={decimalScale}
      allowNegative={allowNegative}
      disabled={disabled}
      isAllowed={(vals) => {
        if (max != null && (vals.floatValue ?? 0) > max) {
          showValidationError(`Only ${max} items available`);
          onChange(max);
          return false;
        }
        return true;
      }}
      onValueChange={(values) => {
        onChange(values.floatValue ?? null);
      }}
      onWheel={(e) => (e.target as HTMLInputElement).blur()}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
      }}
      className={[
        "no-spinner py-1 px-2 border border-theme rounded text-[11px] bg-card text-main",
        "focus:outline-none focus:ring-1 focus:ring-primary transition-all",
        disabled ? "bg-app cursor-not-allowed opacity-60" : "",
        className,
      ].join(" ")}
    />
  );
};

// ─── NumberInput (kept for backward compat — use NumericInput for new code) ───

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const NumberInput: React.FC<NumberInputProps> = ({ value, className = "", ...props }) => (
  <input
    type="number"
    value={value ?? ""}
    placeholder="0"
    onWheel={numberInputProps.onWheel}
    onKeyDown={(e) => {
      numberInputProps.onKeyDown(e);
      props.onKeyDown?.(e);
    }}
    className={[
      "no-spinner py-1 px-2 border border-theme rounded text-[11px] bg-card text-main",
      "focus:outline-none focus:ring-1 focus:ring-primary",
      className,
    ].join(" ")}
    {...props}
  />
);

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  name: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  required?: boolean;
  onLabel?: string;
  offLabel?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  name, label, checked, disabled, required,
  onLabel = "Yes", offLabel = "No", onChange,
}) => (
  <div className="flex flex-col min-w-0">
    <span className="block text-[10px] font-medium text-main mb-1">
      {label}
      {required && <span className="text-danger">*</span>}
    </span>
    <div className={`flex items-center p-0.5 border border-theme rounded-md bg-card/50 h-[27px] w-max ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <label className={`flex items-center justify-center px-3 h-full rounded-sm cursor-pointer transition-all text-[10px] font-medium ${!checked ? "bg-primary text-white shadow-sm" : "text-muted hover:text-main bg-transparent"}`}>
        <input
          type="radio"
          name={name}
          checked={!checked}
          disabled={disabled}
          onChange={() => onChange({ target: { name, type: "checkbox", checked: false } } as any)}
          className="hidden"
        />
        {offLabel}
      </label>
      <label className={`flex items-center justify-center px-3 h-full rounded-sm cursor-pointer transition-all text-[10px] font-medium ${checked ? "bg-primary text-white shadow-sm" : "text-muted hover:text-main bg-transparent"}`}>
        <input
          type="radio"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange({ target: { name, type: "checkbox", checked: true } } as any)}
          className="hidden"
        />
        {onLabel}
      </label>
    </div>
  </div>
);