import React, { useState, useEffect, useRef } from "react";
import {
  X, Search, FileText, Plus, CreditCard, Mail, Menu, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import type { Supplier } from "../../types/Supply/supplier";
import SupplierStatement from "./SupplierStatement";
import PurchaseInvoiceModal from "../../components/procurement/PurchaseInvoiceModal";
import PurchaseOrderModal from "../../components/procurement/PurchaseOrderModal";
import SupplierPurchaseOrders from "./SupplierPurchaseOrders";
import SupplierPaymentModal from "../../components/procurement/supply/SupplierPaymentModal";
import SupplierPurchaseInvoices from "./SupplierPurchaseInvoices";
import SupplierBankDetails from "./SupplierBankDetails";
import { getSupplierStatement } from "../../api/statementApi";
import AddBankAccountModal from "../../components/CompanySetup/AddBankAccountModal";
import type { BankAccount } from "../../types/BankAccount/bank";

interface Props {
  supplier: Supplier;
  suppliers: Supplier[];
  onBack: () => void;
  onSupplierSelect: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
}

/* 
   TABS config
 */
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "bank-accounts", label: "Bank Accounts" },
  { id: "purchase-orders", label: "Purchase Orders" },
  { id: "bills", label: "Bills" },
  { id: "payments", label: "Payments" },
  { id: "statement", label: "Statement" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* 
   MAIN COMPONENT
 */
const SupplierDetailView: React.FC<Props> = ({
  supplier,
  suppliers,
  onBack,
  onSupplierSelect,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showPOModal, setShowPOModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [statement, setStatement] = useState<any>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<BankAccount | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const terms = supplier?.terms?.buying;
  const bankAccountsRefresh = useRef<(() => void) | null>(null);
  /* ── derived ── */
  const supplierDetail = suppliers.find((s) =>
    supplier.supplierId
      ? s.supplierId === supplier.supplierId
      : s.supplierCode === supplier.supplierCode,
  );
  const supplierName = supplierDetail?.supplierName;
  const supplierCode = supplierDetail?.supplierCode;
  const formattedDate = supplier?.dateOfAddition
    ? new Date(supplier.dateOfAddition).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : null;

  const filteredSuppliers = suppliers.filter(
    (s) =>
      (s.supplierName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.supplierCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.tpin || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* ── statement loader ── */
  useEffect(() => {
    const supplierId = supplierDetail?.supplierId;
    if (activeTab !== "statement" || !supplierId) return;

    const load = async () => {
      try {
        setStatementLoading(true);
        const res = await getSupplierStatement(supplierId);
        if (res?.status_code === 200) setStatement(res.data);
      } catch (err) {
        console.error("Failed to load supplier statement", err);
      } finally {
        setStatementLoading(false);
      }
    };
    load();
  }, [activeTab, supplierDetail]);

  /* ── action button per tab ── */
  const renderActionButton = () => {
    switch (activeTab) {
      case "purchase-orders":
        return (
          <button
            onClick={() => setShowPOModal(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={13} /> New PO
          </button>
        );
      case "bills":
        return (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={13} /> New Invoice
          </button>
        );
      case "bank-accounts":
        return (
          <button
            onClick={() => {
              setEditingRow(null);
              setShowBankAccountModal(true);
            }}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg"
          >
            <Plus size={13} /> Add Bank
          </button>
        );
      case "payments":
        return (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={13} /> Make Payment
          </button>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-success/15 text-success";
      case "inactive":
        return "bg-danger/15 text-danger";
      case "pending":
        return "bg-warning/15 text-warning";
      default:
        return "bg-muted/15 text-muted";
    }
  };

  const formatAddress = () => {
    if (!supplier) return "—";

    const {
      billingAddressLine1,
      billingAddressLine2,
      billingCity,
      district,
      province,
      billingPostalCode,
      billingCountry,
    } = supplier;

    const line1 = [billingAddressLine1, billingAddressLine2]
      .filter(Boolean)
      .join(", ");
    const line2 = [billingCity, district, province].filter(Boolean).join(", ");
    const line3 = [billingCountry, billingPostalCode]
      .filter(Boolean)
      .join(", ");

    return (
      <div className="flex flex-col text-right leading-tight text-[10px]">
        {line1 && <span>{line1}</span>}
        {line2 && <span>{line2}</span>}
        {line3 && <span>{line3}</span>}
      </div>
    );
  };

  const SidebarList = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Search */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Quick find..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-app border border-[var(--border)] rounded-lg focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
          />
        </div>
      </div>

      {/* List — flex-1 fills remaining sidebar height, scrolls when overflow */}
      <div className="overflow-y-auto px-2 py-1.5 custom-scrollbar flex-1">
        {filteredSuppliers.length === 0 && (
          <p className="text-[10px] text-muted text-center py-6">
            No suppliers found
          </p>
        )}
        {filteredSuppliers.map((s) => {
          const isActive = s.supplierCode === supplierDetail?.supplierCode;
          return (
            <button
              key={s.supplierId || s.supplierCode}
              onClick={() => {
                onSupplierSelect(s);
                setMobileDrawer(false);
              }}
              style={
                isActive
                  ? {
                    background: "var(--primary)",
                    borderColor: "var(--primary)",
                    color: "var(--primary-foreground, #fff)",
                  }
                  : {}
              }
              className={`w-full text-left px-2.5 py-2 rounded-xl transition-all duration-150 flex items-center gap-2.5 mb-0.5 border ${isActive
                ? "border-[var(--primary)] shadow-sm"
                : "bg-transparent border-transparent hover:bg-[var(--row-hover)]"
                }`}
            >
              {/* Avatar */}
              <div
                style={
                  isActive
                    ? {
                      background: "rgba(255,255,255,0.18)",
                      color: "var(--primary-foreground, #fff)",
                    }
                    : {}
                }
                className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-black text-[11px] ${isActive ? "" : "bg-[var(--primary)]/10 text-[var(--primary)]"
                  }`}
              >
                {(s.supplierName || "?").charAt(0).toUpperCase()}
              </div>

              {/* Name + code */}
              <div className="flex-1 min-w-0">
                <p
                  style={
                    isActive ? { color: "var(--primary-foreground, #fff)" } : {}
                  }
                  className={`font-bold text-[11px] truncate leading-tight ${!isActive ? "text-main" : ""}`}
                >
                  {s.supplierName}
                </p>
                <p
                  style={isActive ? { color: "rgba(255,255,255,0.55)" } : {}}
                  className={`text-[9px] font-mono uppercase tracking-wider ${!isActive ? "text-muted" : ""}`}
                >
                  {s.supplierCode || s.tpin || "—"}
                </p>
              </div>

              {/* Status badge */}
              {s.status && (
                <span
                  style={
                    isActive
                      ? {
                        background: "rgba(255,255,255,0.18)",
                        color: "var(--primary-foreground, #fff)",
                      }
                      : {}
                  }
                  className={`px-1.5 py-0.5 text-[8px] font-black rounded-full shrink-0 ${!isActive ? getStatusColor(s.status) : ""
                    }`}
                >
                  {s.status.toUpperCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="flex flex-col bg-app text-main overflow-hidden h-full">
      {/*  HEADER  */}
      <header className="bg-card px-4 py-2.5 flex items-center justify-between border-b border-[var(--border)] shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileDrawer(true)}
            className="lg:hidden p-1.5 hover:bg-row-hover rounded-lg transition-all border border-[var(--border)]"
          >
            <Menu size={15} className="text-muted" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden lg:flex p-1.5 hover:bg-row-hover rounded-lg transition-all border border-[var(--border)]"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={15} className="text-muted" />
            ) : (
              <PanelLeftOpen size={15} className="text-muted" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-row-hover rounded-lg transition-all border border-[var(--border)]"
          >
            <X size={15} className="text-muted" />
          </button>

          {/* Supplier identity */}
          <div className="flex items-center gap-2 min-w-0 ml-1">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center font-black text-[12px] text-primary shrink-0">
              {(supplierDetail?.supplierName || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-[13px] font-black tracking-tight leading-none truncate">
                  {supplierDetail?.supplierName}
                </h2>
                {supplierDetail?.supplierCode && (
                  <span className="text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-[var(--border)] uppercase shrink-0">
                    {supplierDetail.supplierCode}
                  </span>
                )}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5 hidden sm:block">
                Supplier Insight Center
              </p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {formattedDate && (
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider hidden md:block">
              Added {formattedDate}
            </span>
          )}
          {renderActionButton()}
        </div>
      </header>

      {/*  BODY  */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative bg-app ">
        {/* ── MOBILE OVERLAY DRAWER ── */}
        {mobileDrawer && (
          <>
            {/* backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setMobileDrawer(false)}
            />
            {/* drawer */}
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-[var(--border)] z-50 flex flex-col lg:hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                  Suppliers
                </span>
                <button
                  onClick={() => setMobileDrawer(false)}
                  className="p-1 rounded-lg hover:bg-row-hover transition-all"
                >
                  <X size={14} className="text-muted" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <SidebarList />
              </div>
            </div>
          </>
        )}

        {/* ── DESKTOP SIDEBAR ── */}
        <aside
          className={`hidden lg:flex flex-col bg-card border border-[var(--border)] rounded-b-2xl  mb-3 transition-all duration-300 shrink-0 overflow-hidden self-start sticky top-0 ${sidebarOpen ? "w-56" : "w-0 border-0"
            }`}
          style={{ maxHeight: "calc(100vh - 110px)" }}
        >
          {/* Header row */}
          {sidebarOpen && (
            <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted">
                All Suppliers
                <span className="ml-1.5 text-[var(--primary)] font-black">
                  {suppliers.length}
                </span>
              </p>
            </div>
          )}
          {/* flex-1 min-h-0 so SidebarList's inner flex-1 scroll works */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {sidebarOpen && <SidebarList />}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-0 bg-card">
          {/* ── TABS ── */}
          <div className="bg-card border-b border-[var(--border)] px-2 sm:px-4 shrink-0">
            <div className="flex overflow-x-auto scrollbar-hide">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 sm:px-4 py-3 font-bold text-[10px] uppercase tracking-widest border-b-2 transition-all whitespace-nowrap shrink-0 ${activeTab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-main"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0 bg-app">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
                {/* Quick-info strip */}
                <div className="bg-card rounded-2xl border border-[var(--border)] p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Tax Category", value: supplier?.taxCategory },
                      { label: "TPIN", value: supplier?.tpin },
                      {
                        label: "Opening Balance",
                        value: supplier?.openingBalance,
                      },
                      { label: "Currency", value: supplier?.currency },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-app/40 rounded-xl p-3">
                        <p className="text-[8px] font-black text-muted uppercase tracking-wider mb-1">
                          {label}
                        </p>
                        <p className="text-[12px] font-bold text-main">
                          {value || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact + Bank — stacked on mobile, side-by-side on lg */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ">
                  <div className="bg-card rounded-2xl border border-[var(--border)] p-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Mail size={11} className="text-primary" /> Contact
                      Channels
                    </h4>
                    <div className="space-y-0.5">
                      <DataRow
                        label="Contact Person"
                        value={supplierDetail?.contactPerson}
                      />
                      <DataRow label="Phone" value={supplierDetail?.phoneNo} />
                      <DataRow
                        label="Alternate"
                        value={supplierDetail?.alternateNo}
                      />
                      <DataRow label="Email" value={supplierDetail?.emailId} />
                      <DataRow
                        label="Billing Address"
                        value={formatAddress()}
                      />
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm flex flex-col h-full">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest p-4 border-b border-[var(--border)]">
                      Terms & Conditions
                    </h4>

                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                      <div className="text-xs text-muted space-y-4">
                        <div>
                          <h5 className="text-main font-semibold mb-2">
                            Payment Terms
                          </h5>
                          <p>{terms?.payment?.dueDates || "—"}</p>
                        </div>

                        <div>
                          <h5 className="text-main font-semibold mb-1">
                            Delivery
                          </h5>
                          <p>{terms?.delivery || "—"}</p>
                        </div>

                        <div>
                          <h5 className="text-main font-semibold mb-1">
                            Cancellation
                          </h5>
                          <p>{terms?.cancellation || "—"}</p>
                        </div>

                        <div>
                          <h5 className="text-main font-semibold mb-1">
                            Warranty
                          </h5>
                          <p>{terms?.warranty || "—"}</p>
                        </div>

                        <div>
                          <h5 className="text-main font-semibold mb-1">
                            Liability
                          </h5>
                          <p>{terms?.liability || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PURCHASE ORDERS */}
            {activeTab === "purchase-orders" && supplierName && (
              <SupplierPurchaseOrders supplierName={supplierName} />
            )}

            {/* BILLS */}
            {activeTab === "bills" && supplierName && (
              <SupplierPurchaseInvoices supplierName={supplierName} />
            )}

            {activeTab === "bank-accounts" && (
              <SupplierBankDetails
                supplierName={supplierName}
                onAdd={(refresh) => {
                  bankAccountsRefresh.current = refresh;
                }}
                onEdit={(row) => {
                  setEditingRow(row);
                  setShowBankAccountModal(true);
                }}
              />
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-5 rounded-2xl bg-row-hover text-muted mb-4">
                  <CreditCard size={28} />
                </div>
                <h3 className="text-sm font-bold text-main">
                  No payments recorded
                </h3>
                <p className="text-[10px] text-muted font-bold uppercase mt-1">
                  Supplier payment history will appear here
                </p>
              </div>
            )}

            {/* STATEMENT — loading */}
            {activeTab === "statement" && statementLoading && (
              <div className="flex items-center justify-center py-20 gap-3 text-muted text-[12px] font-semibold">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading statement…
              </div>
            )}

            {/* STATEMENT — loaded */}
            {activeTab === "statement" &&
              !statementLoading &&
              supplierDetail &&
              statement && (
                <SupplierStatement
                  supplier={supplier}
                  statement={statement}
                  onMakePayment={(entry) => console.log("pay", entry)}
                  onViewEntry={(entry) => console.log("view", entry)}
                />
              )}

            {/* STATEMENT — no data */}
            {activeTab === "statement" && !statementLoading && !statement && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-5 rounded-2xl bg-row-hover text-muted mb-4">
                  <FileText size={28} />
                </div>
                <h3 className="text-sm font-bold text-main">
                  No statement available
                </h3>
                <p className="text-[10px] text-muted font-bold uppercase mt-1">
                  Statement data could not be loaded
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/*  MODALS  */}
      <PurchaseOrderModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
      />
      <PurchaseInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
      <SupplierPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        supplierName={supplierName}
      // supplierCode={supplierCode}
      />

      <AddBankAccountModal
        isOpen={showBankAccountModal}
        onClose={() => {
          setShowBankAccountModal(false);
          setEditingRow(null);
        }}
        onSubmit={() => {
          setShowBankAccountModal(false);
          bankAccountsRefresh.current?.();
        }}
        partyName={supplierName}
        defaultAccountFor="Supplier"
        initialData={editingRow}
      />
    </div>
  );
};

/* ─── SUB-COMPONENTS ─── */
const DataRow = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="flex justify-between items-center gap-3 py-1.5 px-3 bg-app/40 rounded-xl">
    <span className="text-[9px] font-bold text-muted uppercase tracking-widest shrink-0">
      {label}
    </span>
    <span className="text-[11px] font-semibold text-main text-right max-w-[220px] break-words">
      {value || "Not provided"}
    </span>
  </div>
);

export default SupplierDetailView;
