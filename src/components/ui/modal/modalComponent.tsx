import React from "react";
interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder? : string;
  error?: string;
}

export const ModalSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, options = [], children, className = "", error, ...props }, ref) => (
    <label className="flex flex-col text-sm group min-w-0">

      {/* LABEL */}
      <span className="block text-[10px] font-medium text-main mb-1">
        {icon && (
          <span className="text-muted group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </span>

      {/* SELECT */}
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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

export const ModalInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, className = "", error, ...props }, ref) => (
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

      {/* INPUT */}
      <input
        ref={ref}
        {...props}
        value={props.value ?? ""}
        className={[
          "py-1 px-2 border rounded text-[11px] text-main bg-card transition-all w-auto min-w-0",

          error
            ? "border-danger focus:border-danger"
            : props.disabled
              ? "bg-app cursor-not-allowed opacity-60 border-theme"
              : "border-[var(--border)] hover:border-primary/40",

          className,
        ].join(" ")}
        onFocus={(e) => {
          if (!props.disabled) {
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(239, 68, 68, 0.18)"
              : "0 0 0 3px rgba(37, 99, 235, 0.16)";
          }
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "";
          props.onBlur?.(e);
        }}
      />

      {error && <span className="text-[10px] text-danger mt-1">{error}</span>}
    </label>
  ),
);

ModalInput.displayName = "ModalInput";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.16)";
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

/*  FILTER SELECT  */

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
}

export const FilterSelect = React.forwardRef<
  HTMLSelectElement,
  FilterSelectProps
>(({ options = [], className = "", ...props }, ref) => {
  return (
    <select
      ref={ref}
      {...props}
      value={props.value ?? ""}
      className={[
        "h-9 min-w-[60px]",
        "px-3 py-1",
        "bg-card border border-[var(--border)]",
        "rounded-xl",
        "text-xs font-medium text-main",
        "focus:ring-2 focus:ring-primary/10",
        "focus:border-primary outline-none transition-all",
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
  );
});

FilterSelect.displayName = "FilterSelect";

/** Y/N Checkbox that still sends Y/N to backend */

interface YesNoCheckboxProps {
  name: string;
  label: string;
  value?: string; // expects "Y" | "N"
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
  // Production safety: always normalize value
  const normalizedValue = value === "Y" ? "Y" : "N";
  const checked = normalizedValue === "Y";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked ? "Y" : "N";
    onChange(name, newValue);
  };

  return (
   <label className="flex flex-col text-sm min-w-0 w-fit">

      {/* LABEL */}
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted mb-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>

      {/* CHECKBOX */}
    <div className="flex items-center gap-2 cursor-pointer select-none">
  
  <div
    onClick={() => !disabled && onChange(name, checked ? "N" : "Y")}
    className={[
      "w-7 h-7 rounded-md border flex items-center justify-center transition-all",
      checked
        ? "bg-primary border-primary"
        : "bg-card border-theme hover:border-primary/60",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>

 <span className="text-[11px] text-main">
    {checked ? "Yes" : "No"}
  </span>

</div>

      {/* Hidden field ensures form always submits Y/N */}
      <input
        type="hidden"
        name={name}
        value={normalizedValue}
      />

    </label>
  );
};