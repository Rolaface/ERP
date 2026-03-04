import React from "react";

export type SelectOption = {
  readonly value: string | number;
  readonly label: string;
};

type SelectProps = {
  label: string;
  name: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly SelectOption[];
};

const Select: React.FC<SelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
}) => (
  <label className="flex flex-col gap-1 text-sm w-full">
    <span className="font-medium text-muted">{label}</span>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="rounded border border-theme bg-app px-3 py-2 text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

export default Select;
