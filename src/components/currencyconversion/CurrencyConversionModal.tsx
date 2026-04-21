
import React, { useState, useEffect, useCallback } from "react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import DatePickerInput from "../calendar/DatePickerInput";
import { getBankAccounts } from "../../api/BankAccountApi";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import {
  showValidationError,
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert"; 
import { fetchCurrencyOptions } from "../../utils/currencyOptions";
import SearchSelect2 from "../ui/modal/SearchSelect2";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface EditData {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  isBuying: boolean;
  isSelling: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: EditData | null;
  actionLoading: boolean;
}

interface FormState {
  date: string;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: string;
  isBuying: boolean;
  isSelling: boolean;
}

interface FormErrors {
  date?: string;
  fromCurrency?: string;
  toCurrency?: string;
  exchangeRate?: string;
  purpose?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0]; 
};

const EMPTY_FORM: FormState = {
  date: getTodayDate(),
  fromCurrency: "",
  toCurrency: "",
  exchangeRate: "",
  isBuying: false,
  isSelling: false,
};
// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const CurrencyConversionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editData = null,
  actionLoading,
}) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Reset / pre-fill on open ──────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      setForm({
        date:         editData.date,
        fromCurrency: editData.fromCurrency,
        toCurrency:   editData.toCurrency,
        exchangeRate: String(editData.exchangeRate),
        isBuying:     editData.isBuying,
        isSelling:    editData.isSelling,
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setErrors({});
  }, [isOpen, editData]);

  const fetchCurrencies = useCallback(async (search: string): Promise<{ label: string; value: string }[]> => {
  try {
    const options = await getBankAccounts("Currency");
   
    if (!search) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase())
    );
  } catch {
    return [];
  }
}, []);
  // ── Field helpers ─────────────────────────────
  const clearError = (key: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [key]: undefined }));

  const handleCurrencyChange =
    (field: "fromCurrency" | "toCurrency") => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
      // re-validate same-currency rule live
      if (field === "toCurrency" && value && value === form.fromCurrency) {
        setErrors((prev) => ({
          ...prev,
          toCurrency: "From and To currencies cannot be same",
        }));
      }
    };
  const handleSubmit = async () => {
  if (!validate()) return;

  try {
    const res: any = await onSave({
      ...(editData?.id ? { id: editData.id } : {}),
      date: form.date,
      fromCurrency: form.fromCurrency,
      toCurrency: form.toCurrency,
      exchangeRate: Number(form.exchangeRate),
      isBuying: form.isBuying,
      isSelling: form.isSelling,
    });

    const backend = res?.message;

    if (!backend || backend.status === "error" || backend.status_code >= 400) {
      showApiError(res);
      return;
    }

    showSuccess(backend.message);
    onClose();

  } catch (error) {
    showApiError(error);
  }
};

  const handleExchangeRateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, exchangeRate: e.target.value }));
    clearError("exchangeRate");
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
    clearError("purpose");
  };

  // ── Validation ────────────────────────────────
  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.date)
      next.date = "Date is required";

    if (!form.fromCurrency)
      next.fromCurrency = "From currency is required";

    if (!form.toCurrency)
      next.toCurrency = "To currency is required";
    else if (form.fromCurrency && form.fromCurrency === form.toCurrency)
      next.toCurrency = "From and To currencies cannot be same";

    if (!form.exchangeRate)
      next.exchangeRate = "Exchange rate is required";
    else if (Number(form.exchangeRate) <= 0)
      next.exchangeRate = "Exchange rate must be greater than 0";

    if (!form.isBuying && !form.isSelling)
      next.purpose = "Select at least Buying or Selling";

    setErrors(next);
    return Object.keys(next).length === 0;
  };



  // ── Footer ────────────────────────────────────
 const footer = (
  <>
    <Button variant="secondary" onClick={onClose}>
      Cancel
    </Button>

    <Button
      variant="primary"
      onClick={handleSubmit}
      disabled={actionLoading}
      className={actionLoading ? "opacity-60 cursor-not-allowed" : ""}
    >
      {actionLoading
        ? "Saving..."
        : editData
        ? "Update"
        : "Save"}
    </Button>
  </>
);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Currency Exchange"
      subtitle={editData ? "Edit exchange rate" : "Add exchange rate"}
      footer={footer}
      customWidth="58vw"
      height="auto"
    >
      <div className="p-4">
        <div className="flex flex-wrap gap-4 items-start">

          {/* DATE */}
          <div className="flex-1 min-w-[140px] flex flex-col gap-1">
            <DatePickerInput
              label="Date"
              name="date"
              value={form.date}
              onChange={(name, value) => {
                setForm((prev) => ({ ...prev, [name]: value }));
                clearError("date");
              }}
            />
            {errors.date && (
              <span className="text-danger text-[10px]">{errors.date}</span>
            )}
          </div>

          {/* FROM CURRENCY */}
          <div className="flex-1 min-w-[140px] flex flex-col gap-1">
          <SearchSelect2
  label="From Currency"
  value={form.fromCurrency}
  onChange={handleCurrencyChange("fromCurrency")}
  fetchOptions={fetchCurrencyOptions}  // ← was fetchCurrencies
  placeholder="Search currency...."
  error={errors.fromCurrency}
  required
/>
          </div>

          {/* TO CURRENCY */}
          <div className="flex-1 min-w-[140px] flex flex-col gap-1">
          <SearchSelect2
  label="To Currency"
  value={form.toCurrency}
  onChange={handleCurrencyChange("toCurrency")}
  fetchOptions={fetchCurrencyOptions}  // ← was fetchCurrencies
  placeholder="Search currency...."
  error={errors.toCurrency}
  required
/>
          </div>

          {/* EXCHANGE RATE */}
          <div className="flex-1 min-w-[140px] flex flex-col gap-1">
            <ModalInput
              label="Exchange Rate"
              name="exchangeRate"
              type="number"
              value={form.exchangeRate}
              onChange={handleExchangeRateChange}
              placeholder="e.g. 83.25"
            />
            {errors.exchangeRate && (
              <span className="text-danger text-[10px]">{errors.exchangeRate}</span>
            )}
          </div>

          {/* BUYING / SELLING */}
          <div className="flex flex-col gap-1 mt-5">
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  name="isBuying"
                  checked={form.isBuying}
                  onChange={handleCheckboxChange}
                />
                Buying
              </label>
              <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  name="isSelling"
                  checked={form.isSelling}
                  onChange={handleCheckboxChange}
                />
                Selling
              </label>
            </div>
          
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default CurrencyConversionModal;