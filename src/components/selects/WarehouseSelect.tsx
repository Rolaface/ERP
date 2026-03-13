import React, {useEffect, useState} from "react";
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
}) => {

  const [warehouses, setWarehouses] = useState<
  { value: string; label: string }[]
>([]);

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
  className={`w-[90px] py-1 px-1 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
>
  <option value="">Select Warehouse</option>

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