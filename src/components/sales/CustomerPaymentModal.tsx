import React, { useState } from "react";
import { CreditCard } from "lucide-react";
import Modal from "../ui/modal/modal";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  invoiceNumber?: string;
  customerName?: string;
  totalAmount?: number;
  amountPaid?: number;
  onSubmit?: (data: any) => void;
}

const CustomerPaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  customerId,
  invoiceNumber = "",
  customerName = "",
  totalAmount = 0,
  amountPaid = 0,
  onSubmit,
}) => {

  const amountDue = totalAmount - amountPaid;

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  const handleSubmit = () =>
    onSubmit?.({ ...form, invoiceNumber, customerName, customerId });

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
        }}
      >
        Reset
      </button>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onClose}
          className="border border-theme text-main bg-card"
          style={{
            padding: "8px 20px",
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
            padding: "8px 24px",
            borderRadius: 8,
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Save Payment
        </button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Payment"
      subtitle={invoiceNumber}
      icon={CreditCard}
      maxWidth="4xl"
      height="auto"
      footer={footer}
    >

      <div style={{ display: "flex", gap: 0, minHeight: 340 }}>

        {/* LEFT FORM */}
        <div
          style={{
            flex: 1,
            padding: "12px 20px 4px 0",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >

          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div>
              <label className="form-label" style={{ marginBottom: 5 }}>
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
              <label className="form-label" style={{ marginBottom: 5 }}>
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

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div>
              <label className="form-label" style={{ marginBottom: 5 }}>
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
                <label className="form-label" style={{ marginBottom: 5 }}>
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
                <label className="form-label" style={{ marginBottom: 5 }}>
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
{!isCash && (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
    <div>
      <label className="form-label" style={{ marginBottom: 5 }}>
        Deposit Into *
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

        {/* DIVIDER */}
        <div className="border-l border-theme" style={{ width: 1 }} />

        {/* SUMMARY */}
        <div
          style={{
            width: 220,
            padding: "4px 0 4px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >

          <p
            className="text-muted"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Summary
          </p>

          {/* Customer */}
          <p className="text-muted" style={{ fontSize: 11 }}>Customer</p>
          <p className="text-main" style={{ fontWeight: 800, marginBottom: 14 }}>
            {customerName || "—"}
          </p>

          {/* Invoice */}
          <p className="text-muted" style={{ fontSize: 11 }}>Invoice</p>
          <p className="text-main" style={{ fontWeight: 700, marginBottom: 14 }}>
            {invoiceNumber || "—"}
          </p>

          <div className="border-t border-theme" style={{ marginBottom: 14 }} />

          {/* Due */}
          <p className="text-muted" style={{ fontSize: 11 }}>Due Amount</p>
          <p className="text-main" style={{ fontWeight: 700, marginBottom: 14 }}>
            ₹{amountDue.toLocaleString("en-IN")}
          </p>

          {/* Pay */}
          <p className="text-muted" style={{ fontSize: 11 }}>Pay Amount</p>
          <p className="text-main" style={{ fontWeight: 700, marginBottom: 14 }}>
            ₹{Number(form.amount || 0).toLocaleString("en-IN")}
          </p>

          <div className="border-t border-theme" style={{ marginBottom: 14 }} />

          {/* Balance */}
          <div
            className="bg-primary"
            style={{
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >

            <p
              style={{
                color: "rgba(255,255,255,.7)",
                fontSize: 10,
                marginBottom: 4,
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

export default CustomerPaymentModal;