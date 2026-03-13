// src/components/selects/WarehouseSelect.tsx

import React from "react";
import { ModalSelect } from "../ui/modal/modalComponent";

interface WarehouseSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;

  compact?: boolean;
}

const WAREHOUSE_OPTIONS = [
  { value: "", label: "Select Warehouse" },
  { value: "1", label: "Warehouse 1" },
  { value: "2", label: "Warehouse 2" },
];

const WarehouseSelect: React.FC<WarehouseSelectProps> = ({
  value,
  onChange,
  label = "Warehouse",
  name = "warehouse",
  required = false,
  disabled = false,
  className = "",
  compact = false,
}) => {

  if (compact) {
    return (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-[90px] py-1 px-1 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      >
        {WAREHOUSE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }


  return (
    <ModalSelect
      label={required ? `${label} *` : label}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={WAREHOUSE_OPTIONS}
      className={className}
    />
  );
};

export default WarehouseSelect;