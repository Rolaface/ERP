import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Search,
  CheckCircle2,
  FileText,
  Banknote,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import Modal from "../ui/modal/modal";
import { receiveCustomerPayment } from "../../api/CustomerPayment";
import { getAllCustomers } from "../../api/customerApi";
import { getAllSalesInvoices } from "../../api/salesApi";
import { getSalesInvoiceById } from "../../api/salesApi";
// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  mobile: string;
  currency: string;
  onboardingBalance: number;
}

interface InvoiceRow {
  invoiceNumber: string;
  invoiceType: string;
  dateOfInvoice: string;
  dueDate: string;
  total: number;
  OutStandingAmount: number;
  invoiceStatus: string;
  currency: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "customer" | "invoice";
  invoiceNumber?: string;
  customerName?: string;
  customerId?: string;
  totalAmount?: number;
  amountPaid?: number;
  OutStandingAmount?: number;
  currency?: string;
  onSubmit?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Label = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label
    style={{
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".07em",
      textTransform: "uppercase",
      color: "var(--color-text-muted,#6b7280)",
      marginBottom: 6,
      display: "block",
    }}
  >
    {children}
    {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
  </label>
);

const PAGE_SIZE = 5;

const statusColor = (s: string) => {
  if (s === "Paid") return { bg: "#dcfce7", color: "#166534" };
  if (s === "Approved") return { bg: "#dbeafe", color: "#1e40af" };
  if (s === "Draft") return { bg: "#f3f4f6", color: "#374151" };
  if (s === "Cancelled") return { bg: "#fee2e2", color: "#991b1b" };
  return { bg: "#fef9c3", color: "#854d0e" };
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CustomerPaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber: propInvoiceNo = "",
  customerName: propCustomerName = "",
  customerId: propCustomerId = "",
  totalAmount = 0,
  amountPaid = 0,
  OutStandingAmount,
  currency: propCurrency = "",
  onSubmit,
  mode = "customer",
}) => {
  // ── Customer dropdown ──
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [filtered, setFiltered] = useState<CustomerOption[]>([]);
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [loadingC, setLoadingC] = useState(false);
  const [selected, setSelected] = useState<CustomerOption | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Invoices ──
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [invPage, setInvPage] = useState(1);
  const [invTotal, setInvTotal] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(
    null,
  );

  // ── Form ──
  const propAmountDue =
    OutStandingAmount !== undefined
      ? OutStandingAmount
      : Math.max(totalAmount - amountPaid, 0);

  const amountDue = selectedInvoice
    ? selectedInvoice.OutStandingAmount
    : propAmountDue;

  const blankForm = (due = 0) => ({
    amount: due,
    paymentMode: "Cash",
    referenceNumber: "",
    depositInto: "",
    cashAccount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [form, setForm] = useState(blankForm(propAmountDue));
  const [saving, setSaving] = useState(false);

  const isCash = form.paymentMode === "Cash";
  const payAmt = Number(form.amount || 0);
  const balance = Math.max(amountDue - payAmt, 0);
  const overpaid = payAmt > amountDue && amountDue > 0;
  const currency =
    selectedInvoice?.currency || selected?.currency || propCurrency || "₹";
  const isInvoiceMode = mode === "invoice" && !!propInvoiceNo;
  // ── Reset on open ──
  useEffect(() => {
    if (!isOpen) return;
    setForm(blankForm(propAmountDue));
    setSelected(null);
    setSearch(propCustomerName || "");
    setDropOpen(false);
    setInvoices([]);
    setSelectedInvoice(null);
    setInvPage(1);
    if (!isInvoiceMode) {
      loadCustomers();
    }
  }, [isOpen,isInvoiceMode,propCustomerName]);
 useEffect(() => {
  if (!isInvoiceMode) return;

  if (propCustomerName) {
    setSelected({
      id: propCustomerId || "",
      name: propCustomerName,
      email: "",
      mobile: "",
      currency: propCurrency || "₹",
      onboardingBalance: 0,
    });

    setSearch(propCustomerName);
  }
}, [isInvoiceMode, propCustomerName, propCustomerId, propCurrency]);
  useEffect(() => {
    if (!propInvoiceNo) return;

    const loadInvoice = async () => {
      try {
        const res = await getSalesInvoiceById(propInvoiceNo);

        if (res?.status_code === 200) {
          const inv = res.data;

          const mapped = {
            invoiceNumber: inv.invoiceNumber,
            invoiceType: inv.invoiceType ?? "",
            dateOfInvoice: inv.dateOfInvoice
              ? new Date(inv.dateOfInvoice).toLocaleDateString()
              : "",
            dueDate: inv.dueDate
              ? new Date(inv.dueDate).toLocaleDateString()
              : "—",
            total: Number(inv.totalAmount ?? 0),
            OutStandingAmount: Number(inv.OutStandingAmount ?? 0),
            invoiceStatus: inv.invoiceStatus ?? "",
            currency: inv.currency ?? propCurrency,
          };

          setSelectedInvoice(mapped);

          setForm((f) => ({
            ...f,
            amount: mapped.OutStandingAmount,
          }));
        }
      } catch (err) {
        console.error("Invoice load failed", err);
      }
    };

    loadInvoice();
  }, [propInvoiceNo, propCurrency]);

  // ── Pre-select from invoice row ──
  useEffect(() => {
    if (!customers.length || !propCustomerId) return;

    const found = customers.find((c) => c.id === propCustomerId);

    if (found) {
      setSelected(found);
      setSearch(found.name);

      loadInvoices(found.name, 1);
    }
  }, [customers, propCustomerId]);

  // ── Filter dropdown ──
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? customers.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.id.toLowerCase().includes(q),
          )
        : customers,
    );
  }, [search, customers]);

  // ── Outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── API calls ──
  const loadCustomers = async () => {
    setLoadingC(true);
    try {
      const res = await getAllCustomers(1, 100);
      if (res?.status_code === 200) {
        setCustomers(
          res.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            mobile: c.mobile,
            currency: c.currency,
            onboardingBalance: c.onboardingBalance ?? 0,
          })),
        );
      }
    } finally {
      setLoadingC(false);
    }
  };

  const loadInvoices = async (customerName: string, page: number) => {
    setLoadingInv(true);
    try {
      // Filter invoices by customer — adjust params as your API supports
      const res = await getAllSalesInvoices(
        page,
        PAGE_SIZE,
        "invoiceNumber",
        "desc",
        "",
        customerName,
        1,
      );
      if (res?.status_code === 200) {
        setInvoices(
          res.data.map((inv: any) => ({
            invoiceNumber: inv.invoiceNumber,
            invoiceType: inv.invoiceType ?? "",
            dateOfInvoice: inv.dateOfInvoice
              ? new Date(inv.dateOfInvoice).toLocaleDateString()
              : "",
            dueDate: inv.dueDate
              ? new Date(inv.dueDate).toLocaleDateString()
              : "—",
            total: Number(inv.totalAmount ?? 0),
            OutStandingAmount: Number(inv.OutStandingAmount ?? 0),
            invoiceStatus: inv.invoiceStatus ?? "",
            currency: inv.currency ?? propCurrency,
          })),
        );
        setInvTotal(res.pagination?.total || res.data.length);
      }
    } finally {
      setLoadingInv(false);
    }
  };

  // ── Handlers ──
  const pickCustomer = (c: CustomerOption) => {
    setSelected(c);
    setSearch(c.name);
    setDropOpen(false);
    setSelectedInvoice(null);
    setInvPage(1);
    setForm(blankForm(0));
    loadInvoices(c.name, 1);
  };

  const clearCustomer = () => {
    setSelected(null);
    setSearch("");
    setInvoices([]);
    setSelectedInvoice(null);
    setForm(blankForm(propAmountDue));
  };

  const pickInvoice = (inv: InvoiceRow) => {
    if (selectedInvoice?.invoiceNumber === inv.invoiceNumber) {
      setSelectedInvoice(null);
      setForm((f) => ({ ...f, amount: 0 }));
    } else {
      setSelectedInvoice(inv);
      setForm((f) => ({ ...f, amount: inv.OutStandingAmount }));
    }
  };

  const changePage = (p: number) => {
    setInvPage(p);
    if (selected) loadInvoices(selected.name, p);
  };

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!payAmt || overpaid) return;
    setSaving(true);
    try {
      await receiveCustomerPayment({
        customer_name: selected?.name || propCustomerName,
        invoice_number:
          selectedInvoice?.invoiceNumber || propInvoiceNo || "ALL",
        payment_date: form.paymentDate,
        payment_mode: form.paymentMode,
        amount: payAmt,
        reference_number: !isCash ? form.referenceNumber : "",
        deposit_into_account: isCash ? form.cashAccount : form.depositInto,
        notes: form.notes,
      });
      onSubmit?.();
      onClose();
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const totalInvoiceAmount = totalAmount || selectedInvoice?.total || 0;

  const outstandingAmount =
    selectedInvoice?.OutStandingAmount ?? OutStandingAmount ?? 0;

  const paidAmount = totalInvoiceAmount - outstandingAmount;
  // useEffect(() => {
  //   if (!invoices.length || !propInvoiceNo) return;

  //   const inv = invoices.find((i) => i.invoiceNumber === propInvoiceNo);

  //   if (inv) {
  //     setSelectedInvoice(inv);
  //     setForm((f) => ({
  //       ...f,
  //       amount: inv.OutStandingAmount,
  //     }));
  //   }
  // }, [invoices, propInvoiceNo]);
  const totalInvPages = Math.ceil(invTotal / PAGE_SIZE);

  // ── Footer ──
  const footer = (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        width: "100%",
      }}
    >
      <button
        onClick={onClose}
        className="border border-theme text-main bg-card"
        style={{
          padding: "9px 22px",
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
        disabled={!payAmt || overpaid || saving || !selected}
        className="bg-primary"
        style={{
          padding: "9px 28px",
          borderRadius: 8,
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 7,
          opacity: !payAmt || overpaid || saving || !selected ? 0.5 : 1,
        }}
      >
        {saving ? (
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <CheckCircle2 size={14} />
        )}
        {saving ? "Saving…" : "Save Payment"}
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Payment"
      subtitle={selected ? selected.name : "Customer Payment"}
      icon={CreditCard}
      maxWidth="6xl"
      height="auto"
      footer={footer}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cIn { from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)} }

        .cpm-drop-item {
          padding: 9px 12px; cursor:pointer; display:flex; align-items:center; gap:9px;
          transition:background .1s; border-bottom:1px solid var(--color-border-theme,#f3f4f6);
        }
        .cpm-drop-item:last-child { border-bottom:none; }
        .cpm-drop-item:hover { background:var(--color-bg-hover,rgba(0,0,0,.04)); }

        .cpm-inv-row {
          display:grid; grid-template-columns: 1.4fr 0.8fr 0.9fr 0.9fr 1fr 1fr 0.7fr;
          align-items:center; gap:8px; padding:9px 12px; border-radius:8px;
          cursor:pointer; transition:all .14s;
          border:1.5px solid transparent;
        }
        .cpm-inv-row:hover { background:var(--color-bg-hover,rgba(0,0,0,.035)); }
        .cpm-inv-row.selected {
          border-color:var(--color-primary,#6366f1);
          background:var(--color-primary-soft,#eef2ff);
        }

        .cpm-mode {
          border:1.5px solid var(--color-border-theme,#e5e7eb); background:var(--color-card,#fff);
          border-radius:8px; padding:8px 12px; font-size:12px; font-weight:600; cursor:pointer;
          transition:all .14s; flex:1; display:flex; align-items:center; gap:5px;
          color:var(--color-text-main,#111); white-space:nowrap;
        }
        .cpm-mode.on {
          border-color:var(--color-primary,#6366f1);
          background:var(--color-primary-soft,#eef2ff);
          color:var(--color-primary,#6366f1);
        }

        .cpm-pg-btn {
          width:28px; height:28px; border-radius:6px; border:1.5px solid var(--color-border-theme,#e5e7eb);
          background:var(--color-card,#fff); display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all .12s; color:var(--color-text-main,#111);
        }
        .cpm-pg-btn:hover:not(:disabled) { border-color:var(--color-primary,#6366f1); color:var(--color-primary,#6366f1); }
        .cpm-pg-btn:disabled { opacity:.35; cursor:not-allowed; }
      `}</style>

      <div style={{ display: "flex", gap: 0, minHeight: 400 }}>
        {/* ════════════ LEFT FORM ════════════ */}
        <div
          style={{
            flex: 1,
            paddingRight: 28,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* ── Customer Search ── */}
          <div>
            <Label required>Customer</Label>
            <div ref={dropRef} style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
                <input
                  value={search}
                  disabled={isInvoiceMode}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setDropOpen(true);
                    if (selected) clearCustomer();
                  }}
                  onFocus={() => {
                    if (!isInvoiceMode) setDropOpen(true);
                  }}
                  placeholder="Search customer by name or ID…"
                  className="form-input w-full"
                  style={{ paddingLeft: 34, paddingRight: 34, fontSize: 13 }}
                  autoComplete="off"
                />
                {selected && !isInvoiceMode && (
                  <button
                    onClick={clearCustomer}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {dropOpen && !selected && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    zIndex: 999,
                    background: "var(--color-card,#fff)",
                    border: "1.5px solid var(--color-border-theme,#e5e7eb)",
                    borderRadius: 10,
                    boxShadow: "0 8px 28px rgba(0,0,0,.11)",
                    maxHeight: 230,
                    overflowY: "auto",
                  }}
                >
                  {loadingC ? (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Loader2
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Loading customers…
                    </div>
                  ) : filtered.length === 0 ? (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: 12,
                      }}
                    >
                      No customers found
                    </div>
                  ) : (
                    filtered.map((c) => (
                      <div
                        key={c.id}
                        className="cpm-drop-item"
                        onClick={() => pickCustomer(c)}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: "var(--color-primary-soft,#eef2ff)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 800,
                            color: "var(--color-primary,#6366f1)",
                            flexShrink: 0,
                          }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 700,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 10,
                              color: "#9ca3af",
                            }}
                          >
                            {c.id}
                            {c.email ? ` · ${c.email}` : ""}
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#6b7280",
                            flexShrink: 0,
                          }}
                        >
                          {c.currency}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected customer chip */}
            {selected && (
              <div
                style={{
                  marginTop: 8,
                  padding: "9px 14px",
                  background: "var(--color-bg-subtle,#f9fafb)",
                  border: "1.5px solid var(--color-primary-soft,#c7d2fe)",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  animation: "cIn .18s ease",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--color-primary-soft,#eef2ff)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--color-primary,#6366f1)",
                    flexShrink: 0,
                  }}
                >
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {selected.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: "#9ca3af",
                    }}
                  >
                    {selected.id}
                    {selected.email ? ` · ${selected.email}` : ""}
                  </p>
                </div>
                {selected.onboardingBalance > 0 && (
                  <div style={{ textAlign: "right", marginRight: 6 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        color: "#9ca3af",
                      }}
                    >
                      Adv. Balance
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#22c55e",
                      }}
                    >
                      {selected.currency}{" "}
                      {selected.onboardingBalance.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Invoice Table ── */}
          {selected && !isInvoiceMode && (
            <div style={{ animation: "cIn .2s ease" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Label>Select Invoice *</Label>
                {selectedInvoice && (
                  <button
                    onClick={() => {
                      setSelectedInvoice(null);
                      setForm((f) => ({ ...f, amount: 0 }));
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 11,
                      color: "var(--color-primary,#6366f1)",
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Table header */}
              <div
                style={{
                  border: "1.5px solid var(--color-border-theme,#e5e7eb)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.4fr 0.8fr 0.9fr 0.9fr 1fr 1fr 0.7fr",
                    gap: 8,
                    padding: "8px 12px",
                    background: "var(--color-bg-subtle,#f9fafb)",
                    borderBottom: "1px solid var(--color-border-theme,#e5e7eb)",
                  }}
                >
                  {[
                    "Invoice No.",
                    "Type",
                    "Date",
                    "Due Date",
                    "Amount",
                    "Outstanding",
                    "Status",
                  ].map((h) => (
                    <span
                      key={h}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".07em",
                        textTransform: "uppercase",
                        color: "#9ca3af",
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                <div style={{ minHeight: 180 }}>
                  {loadingInv ? (
                    <div
                      style={{
                        padding: 32,
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Loader2
                        size={15}
                        style={{
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Loading invoices…
                    </div>
                  ) : invoices.length === 0 ? (
                    <div
                      style={{
                        padding: 32,
                        textAlign: "center",
                        color: "#9ca3af",
                        fontSize: 12,
                      }}
                    >
                      No invoices found for this customer
                    </div>
                  ) : (
                    invoices.map((inv) => {
                      const sc = statusColor(inv.invoiceStatus);
                      const isSelected =
                        selectedInvoice?.invoiceNumber === inv.invoiceNumber;
                      return (
                        <div
                          key={inv.invoiceNumber}
                          className={`cpm-inv-row${
                            isSelected ? " selected" : ""
                          }`}
                          onClick={() => pickInvoice(inv)}
                          style={{
                            borderBottom:
                              "1px solid var(--color-border-theme,#f3f4f6)",
                          }}
                        >
                          {/* Invoice No */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {isSelected ? (
                              <CheckCircle
                                size={13}
                                style={{
                                  color: "var(--color-primary,#6366f1)",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <FileText
                                size={13}
                                style={{
                                  color: "#d1d5db",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {inv.invoiceNumber}
                            </span>
                          </div>

                          {/* Type */}
                          <span
                            style={{
                              fontSize: 10,
                              background: "var(--color-bg-hover,#f3f4f6)",
                              padding: "2px 7px",
                              borderRadius: 5,
                              fontWeight: 600,
                              color: "#374151",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {inv.invoiceType || "—"}
                          </span>

                          {/* Date */}
                          <span
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                            }}
                          >
                            {inv.dateOfInvoice}
                          </span>

                          {/* Due Date */}
                          <span
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                            }}
                          >
                            {inv.dueDate}
                          </span>

                          {/* Total */}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {inv.currency} {inv.total.toLocaleString("en-IN")}
                          </span>

                          {/* Outstanding */}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color:
                                inv.OutStandingAmount > 0
                                  ? "#ef4444"
                                  : "#22c55e",
                            }}
                          >
                            {inv.currency}{" "}
                            {inv.OutStandingAmount.toLocaleString("en-IN")}
                          </span>

                          {/* Status */}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 20,
                              background: sc.bg,
                              color: sc.color,
                              whiteSpace: "nowrap",
                              textAlign: "center",
                            }}
                          >
                            {inv.invoiceStatus}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                {invTotal > PAGE_SIZE && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderTop: "1px solid var(--color-border-theme,#e5e7eb)",
                      background: "var(--color-bg-subtle,#f9fafb)",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      Showing{" "}
                      {Math.min((invPage - 1) * PAGE_SIZE + 1, invTotal)}–
                      {Math.min(invPage * PAGE_SIZE, invTotal)} of {invTotal}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <button
                        className="cpm-pg-btn"
                        disabled={invPage === 1}
                        onClick={() => changePage(invPage - 1)}
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          minWidth: 60,
                          textAlign: "center",
                        }}
                      >
                        {invPage} / {totalInvPages}
                      </span>
                      <button
                        className="cpm-pg-btn"
                        disabled={invPage >= totalInvPages}
                        onClick={() => changePage(invPage + 1)}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Payment Mode ── */}
          <div>
            <Label required>Payment Mode</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Cash", "Card / E-wallet", "Cheque", "Bank Draft"].map(
                (mode) => (
                  <button
                    key={mode}
                    className={`cpm-mode${
                      form.paymentMode === mode ? " on" : ""
                    }`}
                    onClick={() =>
                      setForm((f) => ({ ...f, paymentMode: mode }))
                    }
                  >
                    {mode === "Cash" && <Banknote size={13} />}
                    {mode === "Card / E-wallet" && <CreditCard size={13} />}
                    {(mode === "Cheque" || mode === "Bank Draft") && (
                      <FileText size={13} />
                    )}
                    {mode}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* ── Amount + Date ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <Label required>Amount</Label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                >
                  {currency}
                </span>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={onChange}
                  className="form-input w-full"
                  style={{ paddingLeft: 34 }}
                />
              </div>
              {overpaid && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <AlertCircle size={11} /> Exceeds amount due
                </p>
              )}
            </div>
            <div>
              <Label required>Payment Date</Label>
              <input
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={onChange}
                className="form-input w-full"
              />
            </div>
          </div>

          {/* ── Account fields ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isCash ? "1fr" : "1fr 1fr",
              gap: 14,
            }}
          >
            {isCash ? (
              <div>
                <Label required>Cash Account</Label>
                <select
                  name="cashAccount"
                  value={form.cashAccount}
                  onChange={onChange}
                  className="form-input w-full"
                >
                  <option value="">Select cash account</option>
                  <option>Petty Cash</option>
                  <option>Main Cash</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <Label required>Reference / TXN No.</Label>
                  <input
                    name="referenceNumber"
                    value={form.referenceNumber}
                    onChange={onChange}
                    placeholder="UTR / Cheque / TXN ID"
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <Label required>Deposit Into</Label>
                  <select
                    name="depositInto"
                    value={form.depositInto}
                    onChange={onChange}
                    className="form-input w-full"
                  >
                    <option value="">Select bank account</option>
                    <option>HDFC Current A/C</option>
                    <option>ICICI Savings A/C</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* ── Notes ── */}
          <div>
            <Label>Notes (optional)</Label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={2}
              placeholder="Add any payment remarks…"
              className="form-input w-full"
              style={{ resize: "vertical", fontSize: 13 }}
            />
          </div>
        </div>

        {/* ════════════ DIVIDER ════════════ */}
        <div
          className="border-l border-theme"
          style={{ width: 1, flexShrink: 0 }}
        />

        {/* ════════════ RIGHT SUMMARY ════════════ */}
        <div
          style={{
            width: 210,
            paddingLeft: 24,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#9ca3af",
              marginBottom: 18,
            }}
          >
            Summary
          </p>

          <SR
            label="Customer"
            value={selected?.name || propCustomerName || "—"}
            bold
          />
          <SR
            label="Invoice"
            value={selectedInvoice?.invoiceNumber || propInvoiceNo || "—"}
          />
          <SR label="Mode" value={form.paymentMode} />
          <SR
            label="Invoice Total"
            value={`${currency} ${totalInvoiceAmount.toLocaleString("en-IN")}`}
          />

          <SR
            label="Already Paid"
            value={`${currency} ${paidAmount.toLocaleString("en-IN")}`}
          />

          <SR
            label="Outstanding"
            value={`${currency} ${outstandingAmount.toLocaleString("en-IN")}`}
            bold
          />

          <div className="border-t border-theme" style={{ margin: "14px 0" }} />

          <SR
            label="Amount Due"
            value={`${currency} ${amountDue.toLocaleString("en-IN")}`}
          />
          <SR
            label="Paying Now"
            value={`${currency} ${payAmt.toLocaleString("en-IN")}`}
            accent
          />

          <div className="border-t border-theme" style={{ margin: "14px 0" }} />

          {/* Balance card */}
          <div
            className="bg-primary"
            style={{ borderRadius: 12, padding: "16px" }}
          >
            <p
              style={{
                color: "rgba(255,255,255,.65)",
                fontSize: 10,
                marginBottom: 4,
                letterSpacing: ".06em",
                textTransform: "uppercase",
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
              {currency} {balance.toLocaleString("en-IN")}
            </p>
            {overpaid && (
              <p
                style={{
                  color: "#fca5a5",
                  fontSize: 10,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <AlertCircle size={10} /> Exceeds due
              </p>
            )}
            {!overpaid && balance === 0 && payAmt > 0 && (
              <p
                style={{
                  color: "#bbf7d0",
                  fontSize: 10,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle2 size={10} /> Fully settled
              </p>
            )}
          </div>

          {/* Selected invoice detail (mini) */}
          {selectedInvoice && (
            <div
              style={{
                marginTop: 16,
                padding: "12px",
                background: "var(--color-bg-subtle,#f9fafb)",
                border: "1.5px solid var(--color-border-theme,#e5e7eb)",
                borderRadius: 10,
                animation: "cIn .18s ease",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".07em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: 8,
                }}
              >
                Selected Invoice
              </p>
              <MiniRow label="No." value={selectedInvoice.invoiceNumber} />
              <MiniRow
                label="Total"
                value={`${selectedInvoice.currency} ${selectedInvoice.total.toLocaleString("en-IN")}`}
              />
              <MiniRow
                label="Outstanding"
                value={`${selectedInvoice.currency} ${selectedInvoice.OutStandingAmount.toLocaleString("en-IN")}`}
                red
              />
              <MiniRow label="Due Date" value={selectedInvoice.dueDate} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── SR: Summary Row ──────────────────────────────────────────────────────────
const SR = ({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) => (
  <div style={{ marginBottom: 12 }}>
    <p
      style={{
        fontSize: 10,
        color: "#9ca3af",
        margin: 0,
        marginBottom: 2,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: 12,
        fontWeight: bold || accent ? 800 : 600,
        margin: 0,
        color: accent
          ? "var(--color-primary,#6366f1)"
          : "var(--color-text-main,#111827)",
      }}
    >
      {value}
    </p>
  </div>
);

// ─── MiniRow ─────────────────────────────────────────────────────────────────
const MiniRow = ({
  label,
  value,
  red,
}: {
  label: string;
  value: string;
  red?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 5,
      gap: 4,
    }}
  >
    <span style={{ fontSize: 10, color: "#9ca3af" }}>{label}</span>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: red ? "#ef4444" : "var(--color-text-main,#111)",
        textAlign: "right",
      }}
    >
      {value}
    </span>
  </div>
);

export default CustomerPaymentModal;
