import React, { useEffect, useState } from "react";
import { ModalSelect } from "../ui/modal/modalComponent";
import { getAllWarehouses } from "../../api/WarehouseApi";

interface WarehouseSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Called once when warehouses load — gives you the first warehouse value */
  onDefaultLoad?: (firstWarehouse: string) => void;
}

const WarehouseSelect: React.FC<WarehouseSelectProps> = ({
  value,
  onChange,
  label = "Warehouse",
  name = "warehouse",
  required = false,
  disabled = false,
  className = "",
  compact = false,
  onDefaultLoad,
}) => {
  const [warehouses, setWarehouses] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (warehouses.length) return;

    const loadWarehouses = async () => {
      try {
        const data = await getAllWarehouses();

        const options = data.map((wh: string) => ({
          value: wh,
          label: wh,
        }));

        setWarehouses(options);

        // ✅ Auto-select first warehouse only if:
        // 1. onDefaultLoad callback is provided
        // 2. current value is empty
        // 3. at least one warehouse exists
        if (onDefaultLoad && !value && options.length > 0) {
          onDefaultLoad(options[0].value);
        }
      } catch (err) {
        console.error("Failed to load warehouses", err);
      }
    };

    loadWarehouses();
  }, []);

  if (compact) {
    return (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-[100px] py-1 pl-1 pr-4 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      >
        <option value="">Select</option>
        {warehouses.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <ModalSelect
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={warehouses}
      className={className}
    />
  );
};

export default WarehouseSelect;