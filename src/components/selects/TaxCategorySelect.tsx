import React, { useCallback } from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getAllTaxCategories } from "../../api/taxCategoryApi";

interface TaxCategorySelectProps {
  value?: string;
  onChange: (value: string, option: { label: string; value: string }) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const TaxCategorySelect: React.FC<TaxCategorySelectProps> = ({
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

return (
    <SearchSelect2
      label=""
      value={value}
      onChange={onChange}
      fetchOptions={fetchOptions}
      placeholder="Search tax category..."
      error={error}
      required={required}
      disabled={disabled}
    />
  );
};

export default TaxCategorySelect;