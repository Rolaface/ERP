import React, { useState } from "react";
import { X } from "lucide-react";

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName?: string;
  supplierCode?: string;
  billNumber?: string;
  billAmount?: number;
  amountPaid?: number;
  onSubmit?: (data: any) => void;
}

const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  supplierName = "",
  supplierCode = "",
  billNumber = "",
  billAmount = 0,
  amountPaid = 0,
  onSubmit,
}) => {
  const amountDue = billAmount - amountPaid;

  const [form, setForm] = useState({
    amount: amountDue,
    paymentMode: "Cash",
    referenceNumber: "",
    depositInto: "",
    cashAccount: "Cash In Hand",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setForm({
      amount: amountDue,
      paymentMode: "Cash",
      referenceNumber: "",
      depositInto: "",
      cashAccount: "Cash In Hand",
      paymentDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleSubmit = () => {
    onSubmit?.({
      ...form,
      supplierName,
      supplierCode,
      billNumber,
    });
  };

  if (!isOpen) return null;

  const isCash = form.paymentMode === "Cash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card w-[700px] rounded-xl border border-theme shadow-lg overflow-hidden">

        {/* HEADER */}
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            Make Payment – {billNumber}
          </h3>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-5">

          {/* Supplier */}
          <div className="text-sm">
            <span className="font-semibold">Supplier:</span>{" "}
            {supplierName} {supplierCode && `(${supplierCode})`}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted text-xs">Bill Amount</p>
              <p className="font-semibold">₹ {billAmount}</p>
            </div>

            <div>
              <p className="text-muted text-xs">Amount Paid</p>
              <p className="font-semibold">₹ {amountPaid}</p>
            </div>

            <div>
              <p className="text-muted text-xs">Amount Due</p>
              <p className="font-semibold text-danger">₹ {amountDue}</p>
            </div>
          </div>

          {/* FORM */}
          <div className="grid grid-cols-2 gap-4">

            {/* Amount */}
            <div>
              <label className="form-label">Amount *</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="form-label">Payment Mode *</label>
              <select
                name="paymentMode"
                value={form.paymentMode}
                onChange={handleChange}
                className="form-input w-full"
              >
                <option>Cash</option>
                <option>Card / E-wallet</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
              </select>
            </div>

            {/* Cash Account */}
            {isCash && (
              <div>
                <label className="form-label">Cash A/C *</label>
                <select
                  name="cashAccount"
                  value={form.cashAccount}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option>Cash In Hand</option>
                </select>
              </div>
            )}

            {/* Reference Number */}
            {!isCash && (
              <div>
                <label className="form-label">Reference Number *</label>
                <input
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleChange}
                  placeholder="Enter reference number"
                  className="form-input w-full"
                />
              </div>
            )}

            {/* Payment Date */}
            <div>
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>

            {/* Deposit Into */}
            {!isCash && (
              <div>
                <label className="form-label">Deposit Into *</label>
                <select
                  name="depositInto"
                  value={form.depositInto}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option value="">Select Deposit Into</option>
                  <option>Bank</option>
                </select>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-theme px-5 py-4">

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-danger text-white rounded-md text-sm"
          >
            Reset
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm"
          >
            Save
          </button>

        </div>
      </div>
    </div>
  );
};

export default SupplierPaymentModal;