import React, { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";

type Props = {
  label?: string;
  value?: string; // ISO: YYYY-MM-DD
  defaultValue?: string; // ISO: YYYY-MM-DD
  onChange?: (isoValue: string) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (n: number) => String(n).padStart(2, "0");

const isoToDisplay = (iso: string): string => {
  const v = String(iso ?? "").trim();
  if (!ISO_RE.test(v)) return "";
  const [yyyy, mm, dd] = v.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

const formatDisplayDate = (raw: string): string => {
  const digits = String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  let out = dd;
  if (mm) out += `/${mm}`;
  if (yyyy) out += `/${yyyy}`;
  return out;
};

const displayToIso = (display: string): string | null => {
  const v = String(display ?? "").trim();
  if (!v) return "";

  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 1900 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  const d = new Date(yyyy, mm - 1, dd);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }

  return `${yyyy}-${pad2(mm)}-${pad2(dd)}`;
};

const HrDateInput: React.FC<Props> = ({
  label,
  value,
  defaultValue,
  onChange,
  className = "",
  inputClassName = "",
  required = false,
  disabled = false,
  name,
  id,
  placeholder = "DD/MM/YYYY",
}) => {
  const isControlled = value !== undefined;

  const datePickerRef = useRef<HTMLInputElement | null>(null);

  const [internalIso, setInternalIso] = useState(defaultValue ?? "");
  const isoValue = isControlled ? value : internalIso;

  const [displayValue, setDisplayValue] = useState(() =>
    isoToDisplay(isoValue),
  );

  useEffect(() => {
    setDisplayValue(isoToDisplay(isoValue));
  }, [isoValue]);

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalIso(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const commitIso = (nextIso: string) => {
    if (!isControlled) setInternalIso(nextIso);
    onChange?.(nextIso);
  };

  return (
    <label className={label ? `flex flex-col gap-2 ${className}` : className}>
      {label && (
        <span className="font-semibold text-muted">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}

      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={displayValue}
          disabled={disabled}
          required={required}
          className={[
            "w-full px-4 py-2.5 pr-11 text-sm rounded-lg border border-theme bg-card text-main",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            disabled ? "bg-app cursor-not-allowed opacity-60" : "",
            inputClassName,
          ].join(" ")}
          onChange={(e) => {
            const nextDisplay = formatDisplayDate(e.target.value);
            setDisplayValue(nextDisplay);

            if (!nextDisplay) {
              commitIso("");
              return;
            }

            const nextIso = displayToIso(nextDisplay);
            if (nextIso !== null) {
              commitIso(nextIso);
            }
          }}
          onBlur={() => {
            const iso = displayToIso(displayValue);
            if (iso === null) {
              setDisplayValue(isoToDisplay(isoValue));
            }
          }}
        />

        <input
          ref={datePickerRef}
          type="date"
          tabIndex={-1}
          value={
            ISO_RE.test(String(isoValue ?? "").trim())
              ? String(isoValue).trim()
              : ""
          }
          disabled={disabled}
          className="absolute inset-0 opacity-0 pointer-events-none"
          onChange={(e) => {
            commitIso(String(e.target.value ?? "").trim());
          }}
        />

        <button
          type="button"
          disabled={disabled}
          aria-label="Open calendar"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-muted hover:text-primary hover:bg-primary/10 disabled:opacity-40"
          onClick={() => {
            if (disabled) return;

            const el = datePickerRef.current;
            if (!el) return;

            const anyEl = el as any;
            if (typeof anyEl.showPicker === "function") {
              anyEl.showPicker();
              return;
            }

            el.focus();
            el.click();
          }}
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>
    </label>
  );
};

export default HrDateInput;
