import React, { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/* ───────────────────────── styles ───────────────────────── */

// Same look as the inputs in SalesOrderModal (border-theme, bg-card, text-xs)
export const inputCls =
  "w-full h-8 rounded-md border border-theme bg-card px-2 text-xs text-main placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-60";

/* ───────────────────────── field wrapper ───────────────────────── */

interface FieldProps {
  label: string;
  required?: boolean;
  right?: React.ReactNode; // small text on the right of the label row
  hint?: React.ReactNode; // helper text under the input
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  required,
  right,
  hint,
  className,
  children,
}) => (
  <div className={className}>
    <div className="mb-1 flex items-center justify-between gap-2">
      <label className="text-[11px] text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {right && <span className="text-[10px] text-muted">{right}</span>}
    </div>
    {children}
    {hint && <p className="mt-1 text-[10px] text-muted">{hint}</p>}
  </div>
);

/* ───────────────────────── inputs ───────────────────────── */

export const TextInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
> = ({ className = "", icon, ...rest }) =>
  icon ? (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted">
        {icon}
      </span>
      <input
        type="text"
        className={`${inputCls} pl-7 ${className}`}
        {...rest}
      />
    </div>
  ) : (
    <input type="text" className={`${inputCls} ${className}`} {...rest} />
  );

export interface Option {
  value: string;
  label: string;
}

export const SelectInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  icon?: React.ReactNode;
}> = ({ value, onChange, options, placeholder, icon }) => (
  <div className="relative">
    {icon && (
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted">
        {icon}
      </span>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} ${icon ? "pl-7" : ""}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  note?: string;
}> = ({ label, checked, onChange, note }) => (
  <label className="flex cursor-pointer items-center gap-2 text-xs text-main">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-3.5 w-3.5 accent-[var(--primary,#1e3a8a)]"
    />
    <span>{label}</span>
    {note && <span className="text-[10px] text-muted">{note}</span>}
  </label>
);

// "$ [ 0.00 ] USD" style input used for rates
export const RateInput: React.FC<{
  prefix: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ prefix, suffix, value, onChange }) => (
  <div className="flex h-8 items-center rounded-md border border-theme bg-card px-2 focus-within:border-primary">
    <span className="text-xs text-muted">{prefix}</span>
    <input
      type="number"
      min={0}
      step="0.01"
      inputMode="decimal"
      value={value}
      placeholder="0.00"
      onChange={(e) => onChange(e.target.value)}
      className="min-w-0 flex-1 bg-transparent px-2 text-right text-xs tabular-nums text-main focus:outline-none"
    />
    {suffix && <span className="text-[10px] text-muted">{suffix}</span>}
  </div>
);

/* ───────────────────────── tabs (same markup as SalesOrderModal) ───────────────────────── */

export const ModalTabs = <T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<{ id: T; label: string }>;
  active: T;
  onChange: (id: T) => void;
}) => (
  <div className="bg-app border-b border-theme px-3 sm:px-8 shrink-0">
    <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all whitespace-nowrap shrink-0 ${
            active === tab.id
              ? "text-primary border-b-[3px] border-primary"
              : "text-muted border-b-[3px] border-transparent hover:text-main"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

/* ───────────────────────── small UI pieces ───────────────────────── */

export const NotSavedBadge: React.FC<{
  text?: string;
  variant?: "plain" | "warning";
}> = ({ text = "Not Saved", variant = "plain" }) =>
  variant === "warning" ? (
    <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-500/25 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
      <span className="h-1 w-1 rounded-full bg-amber-300" />
      {text}
    </span>
  ) : (
    <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-medium text-white">
      {text}
    </span>
  );

export const HintWithIcon: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex items-center gap-1.5 text-[10px] text-muted">
    <Info size={12} className="shrink-0" />
    <span>{children}</span>
  </div>
);

export const SideCard: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-card rounded-lg border border-theme p-3">
    <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-main">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

export const SummaryRow: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted">{label}</span>
    <span className="font-medium text-main tabular-nums">{value}</span>
  </div>
);

// Dark highlighted total (same style as "Grand Total" in SalesOrderModal)
export const DarkTotal: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="mt-2 flex items-center justify-between rounded-lg bg-primary px-2 py-2">
    <span className="text-xs font-semibold text-white">{label}</span>
    <span className="text-xs font-bold text-white tabular-nums">{value}</span>
  </div>
);

export const fmtMoney = (n: number, symbol: string) =>
  `${symbol}${n.toFixed(2)}`;

export const toNum = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/* ───────────────────────── hooks ───────────────────────── */

// Unique id so MinimizableModal can track each open modal (same idea as SalesOrderModal)
export const useModalId = (prefix: string) =>
  useState(() => `${prefix}-${Date.now()}`)[0];

// Form state + dirty check + reset + "discard changes?" confirm
export function useModalForm<T extends object>(initial: T) {
  const initialRef = useRef(initial);
  const [values, setValues] = useState<T>(initial);

  const set = <K extends keyof T>(key: K, value: T[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const dirty = JSON.stringify(values) !== JSON.stringify(initialRef.current);
  const reset = () => setValues(initialRef.current);

  // TODO: swap window.confirm for your app's confirm dialog (the one inside handleCloseWithConfirm)
  const confirmClose = (onClose: () => void) => () => {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?"))
      return;
    onClose();
  };

  return { values, set, setValues, dirty, reset, confirmClose };
}

// Loads dropdown options for a Link field (Project Type, Activity Type, Employee).
// TODO: replace this fetch with your own API helper if /api/resource needs a token.
export function usePmLinkOptions(doctype: string, labelField?: string) {
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    let alive = true;
    const fields = labelField ? ["name", labelField] : ["name"];
    const url = `/api/resource/${encodeURIComponent(
      doctype,
    )}?fields=${encodeURIComponent(JSON.stringify(fields))}&limit_page_length=0`;

    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        setOptions(
          (json?.data ?? []).map((d: any) => ({
            value: d.name,
            label: labelField ? d[labelField] || d.name : d.name,
          })),
        );
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [doctype, labelField]);

  return options;
}