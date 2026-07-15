import React, { useEffect, useState } from "react";
import { ModalSelect } from "../ui/modal/modalComponent";
import { getAllWarehouses } from "../../api/WarehouseApi";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
interface WarehouseSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  onDefaultLoad?: (firstWarehouse: string) => void;
  excludeValue?: string; 
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
  excludeValue,
}) => {
  const [warehouses, setWarehouses] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (warehouses.length) return;
    const loadWarehouses = async () => {
      try {
        const data = await getAllWarehouses({ is_disabled: 0 });
        const options = data.map((wh: string) => ({ value: wh, label: getGLNameWithoutAbbreviation(wh) }));
        setWarehouses(options);
        if (onDefaultLoad && !value && options.length > 0) {
          onDefaultLoad(options[0].value);
        }
      } catch (err) {
        console.error("Failed to load warehouses", err);
      }
    };
    loadWarehouses();
  }, []);


  const visibleWarehouses = excludeValue
    ? warehouses.filter((w) => w.value !== excludeValue)
    : warehouses;

  if (compact) {
    return (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full py-1 pl-1 pr-4 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      >
        <option value="">Select</option>
        {visibleWarehouses.map((opt) => (
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
      options={visibleWarehouses}
      className={className}
    />
  );
};

export default WarehouseSelect;