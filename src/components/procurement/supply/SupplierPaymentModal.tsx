import React, { useState } from "react";
import { Wallet } from "lucide-react";
import Modal from "../../ui/modal/modal"; // adjust path as needed
import { createSupplierPayment } from "../../../api/procurement/supplierApi";
import {
  showSuccess,
  showApiError,
  showLoading,
  closeSwal,
  showValidationError,
} from "../../../utils/alert";
interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName?: string;
  supplierId?: string;
  billAmount?: number;
  amountPaid?: number;
  onSubmit?: (data: any) => void;
  
}

const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  supplierName = "",
  supplierId = "",
  billAmount = 0,
  amountPaid = 0,
  onSubmit,
}) => {
  const amountDue = billAmount - amountPaid;
  const paidPct =
    billAmount > 0 ? Math.min((amountPaid / billAmount) * 100, 100) : 0;

  const [form, setForm] = useState({
    amount: amountDue,
    paymentMode: "Cash",
    referenceNumber: "",
    depositInto: "",
    cashAccount: "Cash In Hand",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const balanceAfterPayment = amountDue - Number(form.amount || 0);
  const isCash = form.paymentMode === "Cash";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleReset = () =>
    setForm({
      amount: amountDue,
      paymentMode: "Cash",
      referenceNumber: "",
      depositInto: "",
      cashAccount: "Cash In Hand",
      paymentDate: new Date().toISOString().split("T")[0],
    });

const handleSubmit = async () => {
  try {
    if (!form.amount || Number(form.amount) <= 0) {
      showValidationError("Please enter a valid payment amount.");
      return;
    }

    if (!form.paymentDate) {
      showValidationError("Please select payment date.");
      return;
    }

    if (!isCash && !form.referenceNumber) {
      showValidationError("Reference number is required.");
      return;
    }

    showLoading("Processing payment...");

    const payload = {
      supplier_id: supplierId,
      payment_date: form.paymentDate,
      payment_mode: form.paymentMode,
      amount: Number(form.amount),
      reference_number: isCash ? "" : form.referenceNumber,
      deposit_into_account: isCash ? form.cashAccount : form.depositInto,
    };

    const response = await createSupplierPayment(payload);

    closeSwal();

    if (!response || response?.message?.status !== "success") {
      showApiError(response?.message?.message || "Payment failed");
      return;
    }

    showSuccess(response?.message?.message || "Payment recorded successfully");

    onSubmit?.(response);
    onClose();

  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};

  /* ── FOOTER ─────────────────────────────── */
  const footer = (
    <>
      <button
        onClick={handleReset}
        className="text-muted"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          padding: 0,
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Reset
      </button>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onClose}
          className="border border-theme text-main bg-card"
          style={{
            padding: "8px 22px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="bg-primary"
          style={{
            padding: "8px 26px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}
        >
          Make Payment
        </button>
      </div>
    </>
  );

  /* ── RENDER  */
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Make Payment"
      subtitle={supplierName}
      icon={Wallet}
      maxWidth="4xl"
      height="auto"
      footer={footer}
    >
      <div style={{ display: "flex", gap: 24, minHeight: 320 }}>
        {/*  LEFT: FORM  */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* ── Row 1: Amount + Mode ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginTop: 15,
            }}
          >
            <div>
              <label
                className="form-label"
                style={{ display: "block", marginBottom: 5 }}
              >
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>
            <div>
              <label
                className="form-label"
                style={{ display: "block", marginBottom: 5 }}
              >
                Payment Mode *
              </label>
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
          </div>

          {/* ── Row 2: Date + Cash A/C or Ref ── */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <label
                className="form-label"
                style={{ display: "block", marginBottom: 5 }}
              >
                Payment Date *
              </label>
              <input
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={handleChange}
                className="form-input w-full"
              />
            </div>

            {isCash ? (
              <div>
                <label
                  className="form-label"
                  style={{ display: "block", marginBottom: 5 }}
                >
                  Cash A/C *
                </label>
                <select
                  name="cashAccount"
                  value={form.cashAccount}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option>Cash In Hand</option>
                </select>
              </div>
            ) : (
              <div>
                <label
                  className="form-label"
                  style={{ display: "block", marginBottom: 5 }}
                >
                  Reference Number *
                </label>
                <input
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleChange}
                  placeholder="TXN / UTR / Cheque no."
                  className="form-input w-full"
                />
              </div>
            )}
          </div>

          {/* ── Row 3: Deposit Into (non-cash only) ── */}
          {!isCash && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div>
                <label
                  className="form-label"
                  style={{ display: "block", marginBottom: 5 }}
                >
                  Deposit Into 
                </label>
                <select
                  name="depositInto"
                  value={form.depositInto}
                  onChange={handleChange}
                  className="form-input w-full"
                >
                  <option value="">Select account</option>
                  <option>Bank</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/*  DIVIDER  */}
        <div className="border-l border-theme" style={{ flexShrink: 0 }} />

        {/*  RIGHT: SUMMARY  */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <p
            className="text-muted"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}
          >
            Summary
          </p>

          {/* Supplier Name */}
          <p className="text-muted" style={{ fontSize: 11, margin: "0 0 2px" }}>
            Supplier
          </p>
          <p
            className="text-main"
            style={{ fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}
          >
            {supplierName || "—"}
          </p>

          <div className="border-t border-theme" style={{ marginBottom: 14 }} />

          {/* Due Amount */}
          <p className="text-muted" style={{ fontSize: 11, margin: "0 0 2px" }}>
            Due Amount
          </p>
          <p
            className="text-main"
            style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}
          >
            ₹{amountDue.toLocaleString("en-IN")}
          </p>

          {/* Payment Amount */}
          <p className="text-muted" style={{ fontSize: 11, margin: "0 0 2px" }}>
            Payment Amount
          </p>
          <p
            className="text-main"
            style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}
          >
            ₹{Number(form.amount || 0).toLocaleString("en-IN")}
          </p>

          <div className="border-t border-theme" style={{ marginBottom: 14 }} />

          {/* Balance After Payment */}
          <div
            className="bg-primary"
            style={{ borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}
          >
            <p
              style={{
                color: "rgba(255,255,255,.7)",
                fontSize: 10.5,
                margin: "0 0 4px",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                fontWeight: 600,
              }}
            >
              Balance After Payment
            </p>
            <p
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-.01em",
              }}
            >
              ₹{balanceAfterPayment.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SupplierPaymentModal;
