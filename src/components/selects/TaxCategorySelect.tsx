import React, { useCallback } from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getAllTaxCategories } from "../../api/taxCategoryApi";

interface TaxCategorySelectProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const TaxCategorySelect: React.FC<TaxCategorySelectProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  const fetchOptions = useCallback(async (search: string) => {
    try {
      const res = await getAllTaxCategories(1, 20, search || undefined);
      const list: { name: string; title: string }[] = res?.data ?? res?.data?.categories ?? [];
      return list.map((t) => ({
        label: t.title,
        value: t.name,
      }));
    } catch {
      return [];
    }
  }, []);

  const handleChange = useCallback((selectedValue: string, _option?: { label: string; value: string }) => {
    onChange(selectedValue);
  }, [onChange]);

  return (
    <SearchSelect2

      label={label || ""}
      value={value}
      onChange={handleChange}
      fetchOptions={fetchOptions}
      placeholder="Search tax category..."
      error={error}
      required={required}
      disabled={disabled}
    />
  );
};

export default TaxCategorySelect;