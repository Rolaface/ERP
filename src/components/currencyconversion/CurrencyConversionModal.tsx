import React, { useState } from "react";
import { FaExchangeAlt } from "react-icons/fa";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
      customWidth="50vw"
      height="auto"
    >
      <div className="p-6">

        {/* FORM */}
        <div className="flex gap-4 items-end overflow-x-auto">

  {/* DATE */}
  <div className="min-w-[180px]">
    <label className="text-sm text-gray-600">Date</label>
    <DatePicker
      selected={form.date}
      onChange={(date: Date | null) =>
        setForm((prev) => ({ ...prev, date }))
      }
      dateFormat="dd/MM/yyyy"
      placeholderText="Select date"
      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 mt-1"
    />
  </div>

  {/* FROM */}
  <div className="min-w-[160px]">
    <ModalInput
      label="From Currency"
      name="fromCurrency"
      value={form.fromCurrency}
      onChange={handleChange}
    />
  </div>

  {/* TO */}
  <div className="min-w-[160px]">
    <ModalInput
      label="To Currency"
      name="toCurrency"
      value={form.toCurrency}
      onChange={handleChange}
    />
  </div>

  {/* BUY */}
  <div className="min-w-[140px]">
    <ModalInput
      label="Buy Rate"
      name="buyRate"
      type="number"
      value={form.buyRate}
      onChange={handleChange}
    />
  </div>

  {/* SELL */}
  <div className="min-w-[140px]">
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