import React, { useEffect } from "react";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getAllModeOfPayment } from "../../../api/BankAccountApi";
import { useDefault } from "../../../hooks/usedefaultdata";

interface ModeOfPaymentSelectProps {
  value: string;
  onChange: (value: string, hasDefaultAccount: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

const ModeOfPaymentSelect: React.FC<ModeOfPaymentSelectProps> = ({
  value,
  onChange,
  label = "Mode of Payment",
  placeholder = "Search mode of payment",
  required = false,
  disabled = false,
  name = "mode",
}) => {
  const defaultPaymentMode = useDefault("default_payment_mode");

  // Pre-fill from store only on mount if value is empty
  useEffect(() => {
    if (!value && defaultPaymentMode) {
      onChange(defaultPaymentMode, true);
    }
  }, [defaultPaymentMode]);

  const fetchOptions = async (q: string) => {
    const res = await getAllModeOfPayment(1, 20, q || "", 1);
    return res.data.map((item: any) => ({
      label: item.name,
      value: item.name,
      meta: item,
    }));
  };

  const handleChange = async (_: string, option: any) => {
    const selectedDefaultAccount =
      option?.meta?.defaultAccount ??
      option?.meta?.default_account ??
      option?.meta?.defaultBankAccount ??
      option?.meta?.default_bank_account;

    const hasDefault = !!selectedDefaultAccount;

    // No error, no block — just pass the info along.
    onChange(option?.value || "", hasDefault);
  };

  return (
    <SearchSelect2
      label={label}
      value={value}
      onChange={handleChange}
      fetchOptions={fetchOptions}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
};

export default ModeOfPaymentSelect;