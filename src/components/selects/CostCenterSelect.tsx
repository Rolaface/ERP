import React from "react";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { fetchCostCenters } from "../../api/getAllApi";
import type { SearchOption } from "../../api/getAllApi";

interface CostCenterSelectProps {
  value?: string;
  onChange: (value: string, option: SearchOption) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const CostCenterSelect: React.FC<CostCenterSelectProps> = ({
  value,
  onChange,
  error,
  required,
  disabled,
}) => {
  return (
    <SearchSelect2
      label="Cost Center"
      value={value}
      onChange={onChange}
      fetchOptions={fetchCostCenters}
      placeholder="Search cost center..."
      error={error}
      required={required}
      disabled={disabled}
    />
  );
};

export default CostCenterSelect;