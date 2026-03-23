import React, { useState } from "react";
import {FaCalendarAlt} from "react-icons/fa";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import DatePickerInput from "../calendar/DatePickerInput";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}

const CurrencyConversionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    date: null as Date | null,
    fromCurrency: "",
    toCurrency: "",
    buyRate: "",
    sellRate: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.fromCurrency || !form.toCurrency) {
      alert("Please fill required fields");
      return;
    }
    onSave?.(form);
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
      title="Currency Conversion"
      subtitle="Add exchange rate"
      footer={footer}
      customWidth="fit-content"
      height="70vh"
    >
      <div className="p-4">

        {/* FORM */}
        <div className="flex flex-wrap gap-3 items-end">

          {/* DATE */}
          <div className="flex-1 min-w-[100px] max-w-[140px] relative">
  <label className="text-xs text-gray-600">Date</label>

  <DatePickerInput
    selected={form.date}
    onChange={(date: Date | null) =>
      setForm((prev) => ({ ...prev, date }))
    }
    dateFormat="dd/MM/yyyy"
    placeholderText="Select date"
    className="w-full border border-[var(--border)] rounded-md px-2 pr-8 py-1 mt-1 text-xs"
    
  />

  {/* ICON */}
  <FaCalendarAlt className="absolute right-2 top-[28px] text-gray-400 text-sm pointer-events-none" />
</div>

          {/* FROM */}
          <div className="flex-1 min-w-[100px] max-w-[140px]">
            <ModalInput
              label="From Currency"
              name="fromCurrency"
              value={form.fromCurrency}
              onChange={handleChange}
            />
          </div>

          {/* TO */}
          <div className="flex-1 min-w-[100px] max-w-[140px]">
            <ModalInput
              label="To Currency"
              name="toCurrency"
              value={form.toCurrency}
              onChange={handleChange}
            />
          </div>

          {/* BUY */}
          <div className="flex-1 min-w-[100px] max-w-[140px]">
            <ModalInput
              label="Buy Rate"
              name="buyRate"
              type="number"
              value={form.buyRate}
              onChange={handleChange}
            />
          </div>

          {/* SELL */}
          <div className="flex-1 min-w-[100px] max-w-[140px]">
            <ModalInput
              label="Sell Rate"
              name="sellRate"
              type="number"
              value={form.sellRate}
              onChange={handleChange}
            />
          </div>

        </div>
      </div>
    </Modal>
  );
};

export default CurrencyConversionModal;