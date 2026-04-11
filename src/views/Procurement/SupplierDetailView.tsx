import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  X,
  Search,
  FileText,
  Plus,
  Mail,
  Building2,
  FileBarChart,
  Globe,
  CreditCard,
  ShoppingCart,
  Receipt,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { Supplier } from "../../types/Supply/supplier";
import SupplierStatement from "./SupplierStatement";
import PurchaseOrderModal from "../../components/procurement/PurchaseOrderModal";
import SupplierPurchaseOrders from "./SupplierPurchaseOrders";
import SupplierPurchaseInvoices from "./SupplierPurchaseInvoices";
import SupplierBankDetails from "./SupplierBankDetails";
import { getSupplierStatement } from "../../api/statementApi";
import AddBankAccountModal from "../../components/CompanySetup/AddBankAccountModal";
import type { BankAccount } from "../../types/BankAccount/bank";
import PaymentEntryModal from "../PaymentEntry/PaymentEntryModal";
import SupplierDetailViewPayments from "./SupplierDetailViewPayment";

interface Props {
  supplier: Supplier;
  suppliers: Supplier[];
  onBack: () => void;
  onSupplierSelect: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
}

const TABS = [
  { id: "overview",        label: "Overview",        icon: <Globe /> },
  { id: "bank-accounts",   label: "Bank Accounts",   icon: <Building2 /> },
  { id: "purchase-orders", label: "Purchase Orders", icon: <ShoppingCart /> },
  { id: "bills",           label: "Bills",            icon: <Receipt /> },
  { id: "payments",        label: "Payments",         icon: <CreditCard /> },
  { id: "statement",       label: "Statement",        icon: <FileBarChart /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const SupplierDetailView: React.FC<Props> = ({
  supplier,
  suppliers,
  onBack,
  onSupplierSelect,
  onEdit,
}) => {
  const { openPICreate } = useOutletContext<{ openPICreate: () => void }>();

  const [searchTerm, setSearchTerm]             = useState("");
  const [activeTab, setActiveTab]               = useState<TabId>("overview");
  const [showPOModal, setShowPOModal]           = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankModal, setShowBankModal]       = useState(false);
  const [statement, setStatement]               = useState<any>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [editingRow, setEditingRow]             = useState<BankAccount | null>(null);
  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [mobileDrawer, setMobileDrawer]         = useState(false);

  const bankAccountsRefresh = useRef<(() => void) | null>(null);

  /* ─────────────────────────────────────────────────────────
     PAYLOAD FIELD MAPPING  (message.data shape)
     ─────────────────────────────────────────────────────────
     supplier.id                    → unique ID  "SUP-2026-00008"
     supplier.name                  → display name
     supplier.tpin
     supplier.currency
     supplier.supplierTaxCategory   → tax category  (NOT taxCategory)
     supplier.type                  → "Company" / "Individual"
     supplier.status
     supplier.createdAt             → creation timestamp
     supplier.contacts[]            → array of contacts
       .fullName / .email / .mobile / .phone / .isPrimary
     supplier.addresses[]           → array of addresses
       .type ("Billing"|"Shipping") / .line1 / .line2
       .city / .state / .postalCode / .country
     supplier.terms.Buying          → capital-B key  ← KEY DIFFERENCE
       .general
       .delivery / .cancellation / .warranty / .liability
       .payment.phases[]            → { id, name, percentage, condition, credit_days }
       .payment.dueDates / .lateCharges / .taxes / .notes
  ──────────────────────────────────────────────────────── */

  // Primary contact — prefer isPrimary flag, else first entry
  const primaryContact =
    supplier?.contacts?.find((c: any) => c.isPrimary) ??
    supplier?.contacts?.[0];

  // Billing address from addresses array
  const billingAddress = supplier?.addresses?.find((a: any) => a.type === "Billing");

  // terms.Buying (capital B); fall back to lowercase for safety
  const terms = (supplier?.terms as any)?.Buying ?? (supplier?.terms as any)?.buying;

  // Normalised identity fields — handle both old & new payload shapes
  const supplierId   = supplier?.id   ?? (supplier as any)?.supplierId;
  const supplierName = supplier?.supplierName  ?? (supplier as any)?.supplierName;

  // Format billing address from the addresses[] array
  const formatBillingAddress = (): string => {
    if (!billingAddress) return "";
    const line1 = [billingAddress.line1, billingAddress.line2].filter(Boolean).join(", ");
    const line2 = [billingAddress.city, billingAddress.state].filter(Boolean).join(", ");
    const line3 = [billingAddress.country, billingAddress.postalCode].filter(Boolean).join(", ");
    return [line1, line2, line3].filter(Boolean).join("\n");
  };

  // Formatted creation date from createdAt
  const formattedDate = supplier?.dateOfAddition
    ? new Date(supplier.dateOfAddition).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;

  /* ── sidebar search filter ── */
  const q = searchTerm.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter((s) => {
    const name  = (s.supplierName ?? (s as any).supplierName ?? "").toLowerCase();
    const code  = ((s as any).supplierCode ?? s.id ?? "").toLowerCase();
    const tpin  = (s.tpin ?? "").toLowerCase();
    return name.includes(q) || code.includes(q) || tpin.includes(q);
  });

  /* ── isActive — handles both id shapes, no undefined === undefined trap ── */
  const isActive = (s: Supplier): boolean => {
    const sId = s.id ?? (s as any).supplierId;
    if (supplierId && sId) return sId === supplierId;
    const sCode = (s as any).supplierCode;
    const myCode = (supplier as any)?.supplierCode ?? supplier?.id;
    return !!(sCode && myCode && sCode === myCode);
  };

  /* ── statement loader ── */
  useEffect(() => {
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
  }, [activeTab, supplierId]);

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
            onClick={() => openPICreate()}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={13} /> New Invoice
          </button>
        );
      case "bank-accounts":
        return (
          <button
            onClick={() => { setEditingRow(null); setShowBankModal(true); }}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
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

  /* ── Sidebar list ── */
  const SidebarList = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-theme shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Quick find..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-app border border-theme rounded-lg focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-y-auto px-2 py-1.5 custom-scrollbar flex-1">
        {filteredSuppliers.length === 0 && (
          <p className="text-[10px] text-muted text-center py-6">No suppliers found</p>
        )}
        {filteredSuppliers.map((s) => {
          const active    = isActive(s);
          const sName     = s.supplierName ?? (s as any).supplierName ?? "?";
          const sSubtitle = (s as any).supplierCode ?? s.id ?? s.tpin ?? "—";
          return (
            <button
              key={s.id ?? (s as any).supplierId ?? (s as any).supplierCode}
              onClick={() => { onSupplierSelect(s); setMobileDrawer(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-3 border mb-0.5 ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-transparent border-transparent hover:bg-row-hover"
              }`}
            >
              <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                active ? "bg-white/20" : "bg-primary/10 text-primary"
              }`}>
                {sName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-[11px] truncate leading-tight ${active ? "text-white" : "text-main"}`}>
                  {sName}
                </p>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${active ? "text-white/60" : "text-muted"}`}>
                  {sSubtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="flex flex-col bg-app text-main overflow-hidden flex-1 min-h-0">

      {/* ── HEADER ── */}
      <header className="bg-card px-4 py-2 flex items-center justify-between border-b border-theme shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setMobileDrawer(true)} className="lg:hidden p-1.5 hover:bg-row-hover rounded-lg transition-all border border-theme">
            <Menu size={15} className="text-muted" />
          </button>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden lg:flex p-1.5 hover:bg-row-hover rounded-lg transition-all border border-theme"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={15} className="text-muted" /> : <PanelLeftOpen size={15} className="text-muted" />}
          </button>
          <button onClick={onBack} className="p-1.5 hover:bg-row-hover rounded-lg transition-all border border-theme">
            <X size={15} className="text-muted" />
          </button>

          <div className="flex items-center gap-2 min-w-0 ml-1">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center font-black text-[12px] text-primary shrink-0">
              {(supplierName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-[13px] font-black tracking-tight leading-none truncate">{supplierName}</h2>
                {supplierId && (
                  <span className="text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-theme uppercase shrink-0">
                    {supplierId}
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

        <div className="flex items-center gap-3 shrink-0">
          {formattedDate && (
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider hidden md:block">
              Added {formattedDate}
            </span>
          )}
          {renderActionButton()}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* Mobile overlay drawer */}
        {mobileDrawer && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileDrawer(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-theme z-50 flex flex-col lg:hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Suppliers</span>
                <button onClick={() => setMobileDrawer(false)} className="p-1 rounded-lg hover:bg-row-hover transition-all">
                  <X size={14} className="text-muted" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden"><SidebarList /></div>
            </div>
          </>
        )}

        {/* Desktop sidebar */}
        <aside className={`hidden lg:flex flex-col bg-card border-r border-theme transition-all duration-300 shrink-0 overflow-hidden ${sidebarOpen ? "w-64" : "w-0 border-0"}`}>
          {sidebarOpen && (
            <div className="px-4 py-3 border-b border-theme shrink-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted">
                All Suppliers <span className="ml-1.5 text-primary font-black">{suppliers.length}</span>
              </p>
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {sidebarOpen && <SidebarList />}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-app/20">

          {/* Tabs */}
          <div className="bg-card border-b border-theme px-4 shrink-0 z-10">
            <div className="flex overflow-x-auto scrollbar-hide">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-3.5 font-bold text-[10px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-main"
                  }`}
                >
                  {React.cloneElement(t.icon as React.ReactElement, { size: 14 })}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-w-0 overflow-auto">

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-4 animate-in fade-in duration-300 p-4">

                {/* Info strip — new payload fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <InfoStrip
                    icon={<FileText />}
                    label="Tax Category"
                    value={supplier?.taxCategory ?? (supplier as any)?.taxCategory}
                  />
                  <InfoStrip
                    icon={<Globe />}
                    label="TPIN"
                    value={supplier?.tpin}
                  />
                  <InfoStrip
                    icon={<Building2 />}
                    label="Supplier Type"
                    value={supplier?.type ?? (supplier as any)?.supplierType}
                  />
                  <InfoStrip
                    icon={<CreditCard />}
                    label="Currency"
                    value={supplier?.currency}
                  />
                </div>

                {/* Contact + Terms */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

                  {/* Contact — from contacts[] & addresses[] */}
                  <div className="bg-card rounded-2xl border border-theme p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Mail size={12} className="text-primary" /> Contact Channels
                    </h4>
                    <div className="space-y-0">
                      {/* contacts[isPrimary].fullName */}
                      <DataRow label="Contact Person" value={primaryContact?.fullName} />
                      {/* contacts[isPrimary].mobile */}
                      <DataRow label="Phone"          value={primaryContact?.mobile ?? primaryContact?.phone} />
                      {/* contacts[isPrimary].email */}
                      <DataRow label="Email"          value={primaryContact?.email} />
                      {/* addresses[type=Billing] formatted */}
                      <DataRow label="Billing Address" value={formatBillingAddress()} />
                    </div>
                  </div>

                  {/* Terms — from terms.Buying (capital B) */}
                  <div className="bg-card rounded-2xl border border-theme shadow-sm flex flex-col h-[400px]">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest p-5 border-b border-theme">
                      Terms & Conditions
                    </h4>
                    <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                      <div className="text-xs text-muted space-y-4">

                        {terms?.general && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">General</h5>
                            <p>{terms.general}</p>
                          </div>
                        )}

                        <div>
                          <h5 className="text-main font-semibold mb-2">Payment Terms</h5>

                          {/* Payment phases */}
                          {terms?.payment?.phases?.length > 0 && (
                            <ul className="space-y-2 mb-3">
                              {terms.payment.phases.map((phase: any, i: number) => (
                                <li key={phase.id ?? i} className="border-b border-theme pb-2 last:border-none">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-main capitalize">{phase.name}</span>
                                    <span className="font-semibold text-primary">
                                      {String(phase.percentage).includes("%") ? phase.percentage : `${phase.percentage}%`}
                                    </span>
                                  </div>
                                  {phase.condition && (
                                    <p className="text-[10px] text-muted mt-0.5">{phase.condition}</p>
                                  )}
                                  {phase.credit_days && (
                                    <p className="text-[10px] text-muted">Credit days: {phase.credit_days}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="space-y-1">
                            {terms?.payment?.dueDates && (
                              <p><span className="text-main font-medium">Due Dates: </span>{terms.payment.dueDates}</p>
                            )}
                            {terms?.payment?.lateCharges && (
                              <p><span className="text-main font-medium">Late Charges: </span>{terms.payment.lateCharges}</p>
                            )}
                            {terms?.payment?.taxes && (
                              <p><span className="text-main font-medium">Taxes: </span>{terms.payment.taxes}</p>
                            )}
                            {terms?.payment?.notes && (
                              <p><span className="text-main font-medium">Notes: </span>{terms.payment.notes}</p>
                            )}
                          </div>
                        </div>

                        {terms?.delivery && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">Delivery</h5>
                            <p>{terms.delivery}</p>
                          </div>
                        )}
                        {terms?.cancellation && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">Cancellation</h5>
                            <p>{terms.cancellation}</p>
                          </div>
                        )}
                        {terms?.warranty && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">Warranty</h5>
                            <p>{terms.warranty}</p>
                          </div>
                        )}
                        {terms?.liability && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">Liability</h5>
                            <p>{terms.liability}</p>
                          </div>
                        )}

                        {!terms && (
                          <p className="italic">No terms defined for this supplier.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BANK ACCOUNTS ── */}
            {activeTab === "bank-accounts" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <SupplierBankDetails
                  supplierName={supplierName}
                  onAdd={(refresh) => { bankAccountsRefresh.current = refresh; }}
                  onEdit={(row) => { setEditingRow(row); setShowBankModal(true); }}
                />
              </div>
            )}

            {/* ── PURCHASE ORDERS ── */}
            {activeTab === "purchase-orders" && supplierName && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <SupplierPurchaseOrders supplierName={supplierName} />
              </div>
            )}

            {/* ── BILLS ── */}
            {activeTab === "bills" && supplierName && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <SupplierPurchaseInvoices supplierName={supplierName} />
              </div>
            )}

            {/* ── PAYMENTS ── */}
            {activeTab === "payments" && supplierName && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <SupplierDetailViewPayments supplierName={supplierName} />
              </div>
            )}

            {/* ── STATEMENT loading ── */}
            {activeTab === "statement" && statementLoading && (
              <div className="flex items-center justify-center py-20 gap-3 text-muted text-[12px] font-semibold">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading statement…
              </div>
            )}

            {/* ── STATEMENT loaded ── */}
            {activeTab === "statement" && !statementLoading && supplierId && statement && (
              <SupplierStatement
                supplier={supplier}
                statement={statement}
                onMakePayment={(entry) => console.log("pay", entry)}
                onViewEntry={(entry) => console.log("view", entry)}
              />
            )}

            {/* ── STATEMENT no data ── */}
            {activeTab === "statement" && !statementLoading && !statement && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-5 rounded-2xl bg-row-hover text-muted mb-4">
                  <FileText size={28} />
                </div>
                <h3 className="text-sm font-bold text-main">No statement available</h3>
                <p className="text-[10px] text-muted font-bold uppercase mt-1">
                  Statement data could not be loaded
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── MODALS ── */}
      <PurchaseOrderModal isOpen={showPOModal} onClose={() => setShowPOModal(false)} />

      <PaymentEntryModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />

      <AddBankAccountModal
        isOpen={showBankModal}
        onClose={() => { setShowBankModal(false); setEditingRow(null); }}
        onSubmit={() => { setShowBankModal(false); bankAccountsRefresh.current?.(); }}
        partyName={supplierName}
        defaultAccountFor="Supplier"
        initialData={editingRow}
      />
    </div>
  );
};

/* ─── SUB-COMPONENTS ─── */

const InfoStrip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => (
  <div className="bg-card rounded-xl border border-theme p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group">
    <div className="p-2 rounded-lg bg-row-hover text-primary border border-theme group-hover:bg-primary group-hover:text-white transition-all">
      {React.cloneElement(icon as React.ReactElement, { size: 16 })}
    </div>
    <div className="leading-tight">
      <p className="text-[8px] font-black text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-bold text-main">{value || "—"}</p>
    </div>
  </div>
);

const DataRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 py-1 px-3 bg-app/30 rounded-xl border border-transparent hover:border-theme hover:bg-app/50 transition-all">
    <span className="text-[9px] font-bold text-muted uppercase tracking-widest shrink-0">{label}</span>
    <span className="text-xs font-semibold text-main whitespace-pre-line text-right max-w-[250px] break-words">
      {value || "Not provided"}
    </span>
  </div>
);

export default SupplierDetailView;