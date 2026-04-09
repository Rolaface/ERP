import React from "react";

interface FieldLabelProps {
  label: string;
  required?: boolean;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ label, required }) => (
  <span className="block min-w-0 truncate text-[11px] font-medium uppercase tracking-wide text-muted">
    {label}
    {required && <span className="ml-0.5 text-danger">*</span>}
  </span>
);

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, className = "", required, ...props }, ref) => (
    <label className="flex min-w-0 w-full flex-col gap-0.5">
      <FieldLabel label={label} required={required} />
      <input
        ref={ref}
        required={required}
        className={[
          "h-8 w-full min-w-0 truncate rounded-md border border-theme bg-card px-2.5 text-sm text-main",
          "placeholder:text-muted/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
          props.disabled
            ? "cursor-not-allowed bg-app text-muted opacity-60"
            : "",
          className,
        ].join(" ")}
        {...props}
      />
    </label>
  ),
);

TextInput.displayName = "TextInput";

type TextAreaInputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export const TextAreaInput = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaInputProps
>(({ label, className = "", required, rows = 2, ...props }, ref) => (
  <label className="flex min-w-0 w-full flex-col gap-0.5">
    <FieldLabel label={label} required={required} />
    <textarea
      ref={ref}
      rows={rows}
      required={required}
      className={[
        "min-h-8 w-full min-w-0 resize-y rounded-md border border-theme bg-card px-2.5 py-1.5 text-sm text-main",
        "placeholder:text-muted/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        props.disabled ? "cursor-not-allowed bg-app text-muted opacity-60" : "",
        className,
      ].join(" ")}
      {...props}
    />
  </label>
));

TextAreaInput.displayName = "TextAreaInput";

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
};

export const SelectInput = React.forwardRef<
  HTMLSelectElement,
  SelectInputProps
>(({ label, className = "", required, children, ...props }, ref) => (
  <label className="flex min-w-0 w-full flex-col gap-0.5">
    <FieldLabel label={label} required={required} />
    <select
      ref={ref}
      required={required}
      className={[
        "h-8 w-full min-w-0 rounded-md border border-theme bg-card px-2.5 pr-7 text-sm text-main",
        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        props.disabled ? "cursor-not-allowed opacity-60" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  </label>
));

SelectInput.displayName = "SelectInput";

interface ToggleFieldProps {
  label: string;
  name: string;
  value: string | boolean;
  onValue?: string;
  offValue?: string;
  onLabel?: string;
  offLabel?: string;
  onChange: (name: string, value: string) => void;
}

export const ToggleField: React.FC<ToggleFieldProps> = React.memo(
  ({
    label,
    name,
    value,
    onValue = "Y",
    offValue = "N",
    onLabel,
    offLabel,
    onChange,
  }) => {
    const isOn =
      value === onValue ||
      value === true ||
      value === "true" ||
      value === "Taxable";

    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        <FieldLabel label={label} />
        <div className="flex h-8 w-fit overflow-hidden rounded-md border border-theme">
          <button
            type="button"
            onClick={() => !isOn && onChange(name, onValue)}
            className={[
              "px-3 text-sm font-semibold transition-colors",
              isOn
                ? "bg-primary text-white"
                : "bg-card text-muted hover:bg-primary/10 hover:text-primary",
            ].join(" ")}
          >
            {onLabel ?? onValue}
          </button>
          <div className="w-px shrink-0 bg-theme" />
          <button
            type="button"
            onClick={() => isOn && onChange(name, offValue)}
            className={[
              "px-3 text-sm font-semibold transition-colors",
              !isOn
                ? "bg-primary text-white"
                : "bg-card text-muted hover:bg-primary/10 hover:text-primary",
            ].join(" ")}
          >
            {offLabel ?? offValue}
          </button>
        </div>
        <input type="hidden" name={name} value={isOn ? onValue : offValue} />
      </div>
    );
  },
);

ToggleField.displayName = "ToggleField";

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = React.memo(
  ({ id, label, checked, onChange }) => (
    <label
      htmlFor={id}
      className="group flex min-w-0 cursor-pointer select-none items-center gap-2"
    >
      <span className="relative flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className={[
            "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
            checked
              ? "border-primary bg-primary"
              : "border-theme bg-card group-hover:border-primary/60",
          ].join(" ")}
        >
          {checked && (
            <svg
              className="h-2.5 w-2.5 text-white"
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
        </span>
      </span>
      <span
        className="min-w-0 truncate text-[11px] font-medium text-main"
        title={label}
      >
        {label}
      </span>
    </label>
  ),
);

CheckboxField.displayName = "CheckboxField";

export const SectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-3 mt-5 flex items-center gap-3 first:mt-0">
    <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-widest text-muted">
      {title}
    </span>
    <div className="h-px flex-1 bg-theme" />
  </div>
);

interface TabButtonProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = React.memo(
  ({ label, active, disabled = false, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "border-none bg-transparent px-1 py-2.5 text-sm font-semibold tracking-wide transition-all",
        active
          ? "border-b-2 border-primary text-primary"
          : "border-b-2 border-transparent text-muted hover:text-main",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      {label}
    </button>
  ),
);

TabButton.displayName = "TabButton";
