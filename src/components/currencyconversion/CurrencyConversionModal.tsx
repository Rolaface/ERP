// CurrencyConversionModal.tsx
import React, { useState } from "react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import DatePickerInput from "../calendar/DatePickerInput";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const CurrencyConversionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    date: "",
    fromCurrency: "",
    toCurrency: "",
    exchangeRate: "",
    isBuying: false,
    isSelling: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "exchangeRate"
            ? value
            : value.toUpperCase(),
    }));
  };


  const validate = () => {
    if (
      !form.date ||
      !form.fromCurrency ||
      !form.toCurrency ||
      !form.exchangeRate
    ) {
      alert("All fields are required");
      return false;
    }

    if (form.fromCurrency === form.toCurrency) {
      alert("Currencies cannot be same");
      return false;
    }

    if (Number(form.exchangeRate) <= 0) {
      return false;
    }

    if (!form.isBuying && !form.isSelling) {
      return false;
    }

    if (
      form.fromCurrency.length !== 3 ||
      form.toCurrency.length !== 3
    ) {
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...form,
      exchangeRate: Number(form.exchangeRate),
    });

    onClose();
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Currency Exchange"
      subtitle="Add exchange rate"
      footer={footer}
      customWidth="58vw"
      height="auto"
    >
      <div className="p-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* DATE */}
          <div className="flex-1 min-w-[120px]">
            <DatePickerInput
              label="Date"
              name="date"
              value={form.date}
              onChange={(name, value) =>
                setForm((prev) => ({ ...prev, [name]: value }))
              }
            />
          </div>

          {/* FROM CURRENCY */}
          <div className="flex-1 min-w-[120px]">
            <ModalInput
              label="From Currency"
              name="fromCurrency"
              value={form.fromCurrency}
              onChange={handleChange}
              placeholder="e.g. INR"
            />
          </div>

          {/* TO CURRENCY */}
          <div className="flex-1 min-w-[120px]">
            <ModalInput
              label="To Currency"
              name="toCurrency"
              value={form.toCurrency}
              onChange={handleChange}
              placeholder="e.g. USD"
            />
          </div>


          {/* EXCHANGE RATE */}
          <div className="flex-1 min-w-[120px]">
            <ModalInput
              label="Exchange Rate"
              name="exchangeRate"
              type="number"
              value={form.exchangeRate}
              onChange={handleChange}
            />
          </div>

          {/* CHECKBOXES */}
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isBuying"
                checked={form.isBuying}
                onChange={handleChange}
              />
              Buying
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isSelling"
                checked={form.isSelling}
                onChange={handleChange}
              />
              Selling
            </label>
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default CurrencyConversionModal;