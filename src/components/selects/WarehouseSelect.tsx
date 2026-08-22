import React, { useCallback, useRef, useState } from "react";
import { Warehouse as WarehouseIcon } from "lucide-react";
import { ModalSelect } from "../ui/modal/modalComponent";
import { getAllWarehouses } from "../../api/WarehouseApi";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
import SelectShell from "../../components/ui/select/SelectShell";

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

type WarehouseOption = { value: string; label: string };


let warehouseCache: WarehouseOption[] | null = null;
let warehouseFetchPromise: Promise<WarehouseOption[]> | null = null;

function loadWarehousesShared(): Promise<WarehouseOption[]> {
  if (warehouseCache) return Promise.resolve(warehouseCache);
  if (warehouseFetchPromise) return warehouseFetchPromise;

  warehouseFetchPromise = getAllWarehouses({ is_disabled: 0 })
    .then((data: string[]) => {
      const options = data.map((wh: string) => ({
        value: wh,
        label: getGLNameWithoutAbbreviation(wh),
      }));
      warehouseCache = options;
      return options;
    })
    .finally(() => {
      warehouseFetchPromise = null;
    });

  return warehouseFetchPromise;
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
  readOnlyField = false,
}) => {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>(
    warehouseCache ?? [],
  );

  const [loading, setLoading] = useState(false);

  const hasTriggeredRef = useRef(false);

  const ensureLoaded = useCallback(() => {
    if (hasTriggeredRef.current) return;
    if (warehouseCache) {
   
      setWarehouses(warehouseCache);
      return;
    }
    hasTriggeredRef.current = true;
    setLoading(true);

    loadWarehousesShared()
      .then((options) => {
        setWarehouses(options);
        if (onDefaultLoad && !value && options.length > 0) {
          onDefaultLoad(options[0].value);
        }
      })
      .catch((err) => {
        console.error("Failed to load warehouses", err);
        hasTriggeredRef.current = false; 
      })
      .finally(() => {
        setLoading(false);
      });
  }, [onDefaultLoad, value]);

  if (compact) {
    const hasValue = Boolean(value);
    return (
      <SelectShell
        icon={!hasValue ? <WarehouseIcon /> : undefined}
        showChevron={!readOnlyField}
        disabled={disabled}
        className={className}
      >
        <select
          name={name}
          value={value}
          onChange={onChange}
          onFocus={ensureLoaded}
          onMouseDown={ensureLoaded}
          disabled={disabled}
          required={required}
          className="appearance-none cursor-pointer"
        >
          <option value="">{loading ? "Loading..." : "Select"}</option>
          {warehouses.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </SelectShell>
    );
  }

  return (
    <div
      onFocus={ensureLoaded}
      onMouseDown={ensureLoaded}
      className={className}
    >
      <ModalSelect
        label={loading ? "Loading..." : label}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        options={warehouses}
      />
    </div>
  );
};

export default WarehouseSelect;