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
  const paidPct =
    totalAmount > 0 ? Math.min((amountPaid / totalAmount) * 100, 100) : 0;
  const initials = customerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [form, setForm] = useState({
    amount: amountDue,
    paymentMode: "Cash",
    referenceNumber: "",
    depositInto: "",
    cashAccount: "Cash In Hand",
    paymentDate: new Date().toISOString().split("T")[0],
  });

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

  const handleSubmit = () =>
    onSubmit?.({ ...form, invoiceNumber, customerName, customerId });

  // ── FOOTER ──────────────────────────────────────────────
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

  // ── RENDER ───────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Payment"
      subtitle={`${invoiceNumber}${customerName ? "  ·  " + customerName : ""}`}
      icon={CreditCard}
      maxWidth="4xl"
      height="auto"
      footer={footer}
    >
      {/* ═══ TWO-COLUMN BODY ═══ */}
      <div style={{ display: "flex", gap: 0, minHeight: 340 }}>
        {/* ── LEFT: FORM ── */}
        <div
          style={{
            flex: 1,
            padding: "4px 20px 4px 0",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Customer pill */}
          <div
            className="border border-theme bg-card"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              borderRadius: 10,
              alignSelf: "flex-start",
            }}
          >
            <div
              className="bg-primary"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {initials || "?"}
            </div>
            <div>
              <p
                className="text-main"
                style={{ fontWeight: 700, fontSize: 13, margin: 0 }}
              >
                {customerName || "—"}
              </p>
              {customerId && (
                <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>
                  {customerId}
                </p>
              )}
            </div>
          </div>

          {/* Row 1: Amount + Mode */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
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

          {/* Row 2: Date + Cash A/C or Ref */}
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

          {/* Row 3: Deposit Into — non-cash only */}
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

        {/* ── DIVIDER ── */}
        <div
          className="border-l border-theme"
          style={{ width: 1, flexShrink: 0, margin: "0 0 0 8px" }}
        />

        {/* ── RIGHT: SUMMARY ── */}
        <div
          style={{
            width: 210,
            flexShrink: 0,
            padding: "4px 0 4px 24px",
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
              marginBottom: 14,
            }}
          >
            Summary
          </p>

          {/* Invoice ref */}
          <p
            className="text-muted"
            style={{ fontSize: 10.5, margin: "0 0 2px" }}
          >
            Invoice
          </p>
          <p
            className="text-main"
            style={{ fontSize: 14, fontWeight: 800, margin: "0 0 18px" }}
          >
            {invoiceNumber || "—"}
          </p>

          <div className="border-t border-theme" style={{ marginBottom: 16 }} />

          {/* Total */}
          <p
            className="text-muted"
            style={{ fontSize: 10.5, margin: "0 0 2px" }}
          >
            Total Amount
          </p>
          <p
            className="text-main"
            style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}
          >
            ₹{totalAmount.toLocaleString("en-IN")}
          </p>

          {/* Paid */}
          <p
            className="text-muted"
            style={{ fontSize: 10.5, margin: "0 0 2px" }}
          >
            Amount Paid
          </p>
          <p
            className="text-main"
            style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}
          >
            ₹{amountPaid.toLocaleString("en-IN")}
          </p>

          {/* Balance Due — accent box using only --primary + --border */}
          <div
            className="border border-theme"
            style={{
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 18,
              background: "var(--primary)",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,.65)",
                fontSize: 10.5,
                margin: "0 0 4px",
              }}
            >
              Balance Due
            </p>
            <p
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: 900,
                margin: 0,
              }}
            >
              ₹{amountDue.toLocaleString("en-IN")}
            </p>
          </div>

         
        </div>
      </div>
    </Modal>
  );
};

export default CustomerPaymentModal;
