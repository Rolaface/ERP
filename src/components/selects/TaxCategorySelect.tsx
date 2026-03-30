import React from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { fetchTaxCategories } from "../../api/getAllApi";
import type { SearchOption } from "../../api/getAllApi";

interface TaxCategorySelectProps {
  value?: string;
  onChange: (value: string, option: SearchOption) => void;
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
  return (
    <SearchSelect2
      label="Tax Category"
      value={value}
      onChange={onChange}
      fetchOptions={fetchTaxCategories}
      placeholder="Search tax category..."
      error={error}
      required={required}
      disabled={disabled}
    />
  );
};

export default TaxCategorySelect;