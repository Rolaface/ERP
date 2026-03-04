import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, className = "", ...props }, ref) => (
    <label className="flex flex-col gap-2 text-sm w-full group">
      <span className="font-semibold text-muted flex items-center gap-2 group-focus-within:text-primary transition-colors">
        {icon && (
          <span className="text-muted group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        {label}
        {props.required && <span className="text-danger">*</span>}
      </span>
      <input
        ref={ref}
        {...props}
        value={props.value ?? ""}
        className={[
          "w-full rounded-lg border-2 px-4 py-2.5 text-sm",
          "focus:outline-none focus:border-primary transition-all",
          "bg-card text-main placeholder:text-muted",
          props.disabled
            ? "bg-app cursor-not-allowed opacity-60"
            : "border-[var(--border)] hover:border-primary/40",
          className,
        ].join(" ")}
        onFocus={(e) => {
          if (!props.disabled) {
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(37, 99, 235, 0.16)"; // primary-like glow
          }
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
Input.displayName = "Input";

//
// Select Component
//
interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, options = [], className = "", ...props }, ref) => (
    <label className="flex flex-col gap-2 text-sm w-full group">
      <span className="font-semibold text-main flex items-center gap-2 group-focus-within:text-primary transition-colors">
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
          "w-full rounded-lg border-2 px-4 py-2.5 text-sm",
          "focus:outline-none focus:border-primary transition-all",
          "bg-card text-main",
          props.disabled
            ? "bg-app cursor-not-allowed opacity-60"
            : "border-[var(--border)] hover:border-primary/40",
          className,
        ].join(" ")}
      >
        <option value="" disabled>
          Select
        </option>

        {options.map((opt, idx) => (
          <option key={`${opt.value}-${idx}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  ),
);

Select.displayName = "Select";

Select.displayName = "Select";

//
// Textarea Component
//
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: React.ReactNode;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, icon, className = "", ...props }, ref) => (
    <label className="flex flex-col gap-2 text-sm w-full group">
      <span className="font-semibold text-muted flex items-center gap-2 group-focus-within:text-primary transition-colors">
        {icon && (
          <span className="text-muted group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        {label}
        {props.required && <span className="text-red-500">*</span>}
      </span>
      <textarea
        ref={ref}
        {...props}
        className={[
          "w-full rounded-lg border-2 p-4 text-sm resize-none",
          "focus:outline-none focus:border-primary transition-all",
          "bg-card text-main placeholder:text-muted",
          props.disabled
            ? "bg-app cursor-not-allowed opacity-60"
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
  ),
);
Textarea.displayName = "Textarea";

//
// Checkbox Component

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, onChange, className = "" }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative w-5 h-5 flex-shrink-0">
          {/* Real input — invisible but handles all click/keyboard events */}
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          />

          {/* Styled box — driven by React `checked` prop, not peer CSS */}
          <div
            className={[
              "w-5 h-5 border-2 rounded transition-all",
              checked
                ? "border-primary bg-primary"
                : "border-[var(--border)] bg-card",
            ].join(" ")}
          />

          {/* Tick — visible only when checked */}
          <svg
            className={[
              "w-3 h-3 text-white absolute top-1 left-1 pointer-events-none transition-opacity",
              checked ? "opacity-100" : "opacity-0",
            ].join(" ")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <span className={`text-sm font-semibold text-main ${className}`}>
          {label}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
//
// Card Component
//
interface CardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  children,
  className = "",
}) => (
  <div
    className={[
      "bg-card/80 backdrop-blur-sm border rounded-b-md p-5 shadow-sm hover:shadow-md transition-shadow",
      "border-[var(--border)]",
      className,
    ].join(" ")}
  >
    <div className="flex items-center gap-3 mb-5">
      {icon && (
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: "rgba(37, 99, 235, 0.08)" }} // primary-like tint
        >
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-base font-bold text-main">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

//
// Button Component
//
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      icon,
      loading,
      children,
      className = "",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses: Record<
      NonNullable<ButtonProps["variant"]>,
      string
    > = {
      primary: "bg-primary text-white hover:opacity-90 hover:shadow-lg",
      secondary:
        "border-2 border-[var(--border)] text-main bg-card hover:bg-row-hover",
      danger: "bg-danger text-white hover:opacity-90 hover:shadow-lg",
      ghost: "text-main bg-transparent hover:bg-row-hover",
    };

    return (
      <button
        ref={ref}
        type={type}
        {...props}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        disabled={loading || props.disabled}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
