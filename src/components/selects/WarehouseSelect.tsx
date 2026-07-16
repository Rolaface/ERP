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
    readOnlyField?: boolean; 
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
  onDefaultLoad, readOnlyField = false,
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

  if (compact) {
    return (
     <select
  name={name}
  value={value}
  onChange={onChange}
  disabled={disabled}
  required={required}
  className={[
    "w-full py-1 pl-1 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary",
    readOnlyField ? "appearance-none pr-2" : "pr-4",
    className,
  ].join(" ")}
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