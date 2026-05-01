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
  Phone,
  MapPin,
  Tag,
  BadgeCheck,
  Banknote,
  Users,
  CalendarDays,
  ChevronRight,
  Layers,
  Clock,
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

// ─── API RESPONSE SHAPE (from message.data) ──────────────────────────────────
// supplier.id                       → "SUP-2026-00008"
// supplier.name                     → display name  (NOT supplierName)
// supplier.type                     → "Company" | "Individual"
// supplier.tpin
// supplier.currency
// supplier.supplierTaxCategory      → tax category  (NOT taxCategory)
// supplier.supplierGroup
// supplier.status                   → "Active"
// supplier.createdAt                → "2026-04-11 14:01:56..."  (NOT dateOfAddition)
// supplier.contacts[]
//   .id / .firstName / .lastName / .fullName
//   .email / .mobile / .phone
//   .isPrimary / .isBilling / .status
// supplier.addresses[]
//   .id / .type ("Billing"|"Shipping")
//   .line1 / .line2 / .city / .county / .state / .postalCode / .country
//   .isPrimary / .isShipping
// supplier.terms.Buying             (capital B)
//   .general / .delivery / .cancellation / .warranty / .liability
//   .payment.phases[]  { id, name, percentage, condition, credit_days }
//   .payment.dueDates / .lateCharges / .taxes / .notes
// ─────────────────────────────────────────────────────────────────────────────

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
  { id: "bills",           label: "Bills",           icon: <Receipt /> },
  { id: "payments",        label: "Payments",        icon: <CreditCard /> },
  { id: "statement",       label: "Statement",       icon: <FileBarChart /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmtDate = (raw?: string | null): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const SupplierDetailView: React.FC<Props> = ({
  supplier,
  suppliers,
  onBack,
  onSupplierSelect,
  onEdit,
}) => {
  const { openPICreate } = useOutletContext<{ openPICreate: () => void }>();
   const { openPOCreate } = useOutletContext<{ openPOCreate: () => void }>();
    // const { openPICreate } = useOutletContext<{ openPICreate: () => void }>();
  

  const [searchTerm,       setSearchTerm]       = useState("");
  const [activeTab,        setActiveTab]        = useState<TabId>("overview");
  const [showPOModal,      setShowPOModal]      = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankModal,    setShowBankModal]    = useState(false);
  const [statement,        setStatement]        = useState<any>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [editingRow,       setEditingRow]       = useState<BankAccount | null>(null);
  const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [mobileDrawer,     setMobileDrawer]     = useState(false);

  const bankAccountsRefresh = useRef<(() => void) | null>(null);

  // ── DERIVED: correct field mapping from API response ─────────────────────
  // name comes as `name` in new API (not `supplierName`)
  const supplierId   = (supplier as any)?.id   ?? (supplier as any)?.supplierId;
  const supplierName = (supplier as any)?.name ?? supplier?.supplierName ?? (supplier as any)?.supplierName;

  // supplierTaxCategory is the correct key from API (not taxCategory)
  const taxCategory  = (supplier as any)?.supplierTaxCategory ?? (supplier as any)?.taxCategory ?? supplier?.taxCategory;

  // createdAt from API (not dateOfAddition)
  const createdAt    = (supplier as any)?.createdAt ?? supplier?.dateOfAddition;

  // contacts[] — primary contact
  const contacts = (supplier as any)?.contacts ?? supplier?.contacts ?? [];
  const primaryContact = contacts.find((c: any) => c.isPrimary) ?? contacts[0];

  // addresses[] — billing address
  const addresses    = (supplier as any)?.addresses ?? supplier?.addresses ?? [];
  const billingAddr  = addresses.find((a: any) => a.type === "Billing") ?? addresses[0];

  // terms.Buying (capital B) — fall back to terms.buying for legacy
  const terms = (supplier?.terms as any)?.Buying ?? (supplier?.terms as any)?.buying;

  // Format billing address into readable lines
  const billingLines = billingAddr
    ? [
        [billingAddr.line1, billingAddr.line2].filter(Boolean).join(", "),
        [billingAddr.city, billingAddr.state].filter(Boolean).join(", "),
        [billingAddr.country, billingAddr.postalCode].filter(Boolean).join(" "),
      ].filter(Boolean)
    : [];

  // sidebar filter
  const q = searchTerm.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter((s) => {
    const sName = ((s as any).name ?? s.supplierName ?? "").toLowerCase();
    const sId   = ((s as any).id   ?? (s as any).supplierId ?? "").toLowerCase();
    const sTpin = (s.tpin ?? "").toLowerCase();
    return sName.includes(q) || sId.includes(q) || sTpin.includes(q);
  });

  const isActive = (s: Supplier): boolean => {
    const sId = (s as any).id ?? (s as any).supplierId;
    if (supplierId && sId) return sId === supplierId;
    return false;
  };

  // statement loader
  useEffect(() => {
    if (activeTab !== "statement" || !supplierId) return;
    const load = async () => {
      try {
        setStatementLoading(true);
        const res = await getSupplierStatement(supplierId);
        if (res?.message.status_code === 200) setStatement(res.message.data);
      } catch (err) {
        console.error("Failed to load supplier statement", err);
      } finally {
        setStatementLoading(false);
      }
    };
    load();
  }, [activeTab, supplierId]);

  // action button per tab
  const renderActionButton = () => {
    switch (activeTab) {
      case "purchase-orders":
        // return (
        //   <button onClick={() => openPOCreate()}
        //     className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
        //     <Plus size={13} /> New PO
        //   </button>
        // );
        return null;
      case "bills":
        // return (
        //   <button onClick={() => openPICreate()}
        //     className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
        //     <Plus size={13} /> New Invoice
        //   </button>
        // );
        return null;
      case "bank-accounts":
        // return (
        //   <button onClick={() => { setEditingRow(null); setShowBankModal(true); }}
        //     className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
        //     <Plus size={13} /> Add Bank
        //   </button>
        // );
        return null;
      case "payments":
        // return (
        //   <button onClick={() => setShowPaymentModal(true)}
        //     className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
        //     <Plus size={13} /> Make Payment
        //   </button>
        // );
        return null;
      default:
        return null;
    }
  };

  // ── Sidebar List ────────────────────────────────────────────────────────
  const SidebarList = () => (
      <div className="flex flex-col h-[450px]">
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
      <div className="overflow-y-auto px-2 py-1.5 flex-1 min-h-0 no-scrollbar">
        {filteredSuppliers.length === 0 && (
          <p className="text-[10px] text-muted text-center py-6">No suppliers found</p>
        )}
        {filteredSuppliers.map((s) => {
          const active = isActive(s);
          const sName  = (s as any).name ?? s.supplierName ?? "?";
          const sId    = (s as any).id   ?? (s as any).supplierId ?? "—";
          return (
            <button
              key={sId}
              onClick={() => { onSupplierSelect(s); setMobileDrawer(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 border mb-0.5 ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-transparent border-transparent hover:bg-row-hover"
              }`}
            >
              <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}>
                {sName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-[11px] truncate leading-tight ${active ? "text-white" : "text-main"}`}>
                  {sName}
                </p>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${active ? "text-white/60" : "text-muted"}`}>
                  {sId}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ═══════════════════ RENDER ═══════════════════════════════════════════════
  return (
    <div className="flex flex-col bg-app text-main overflow-hidden flex-1 min-h-0">

      {/* ── HEADER ── */}
      <header className="bg-card px-4 py-2.5 flex items-center justify-between border-b border-theme shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile drawer toggle */}
          <button onClick={() => setMobileDrawer(true)}
            className="lg:hidden p-1.5 hover:bg-row-hover rounded-lg border border-theme transition-all">
            <Menu size={15} className="text-muted" />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden lg:flex p-1.5 hover:bg-row-hover rounded-lg border border-theme transition-all"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen
              ? <PanelLeftClose size={15} className="text-muted" />
              : <PanelLeftOpen  size={15} className="text-muted" />}
          </button>
          <button onClick={onBack}
            className="p-1.5 hover:bg-row-hover rounded-lg border border-theme transition-all">
            <X size={15} className="text-muted" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0 ml-1">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center font-black text-[13px] text-primary shrink-0 border border-primary/20">
              {(supplierName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[13px] font-black tracking-tight leading-none truncate">{supplierName ?? "—"}</h2>
                {supplierId && (
                  <span className="text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-theme uppercase shrink-0">
                    {supplierId}
                  </span>
                )}
                {/* Status dot */}
                {(supplier as any)?.status === "Active" && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {createdAt && (
            <span className="hidden md:flex items-center gap-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
              <CalendarDays size={11} />
              Added {fmtDate(createdAt)}
            </span>
          )}
          {/* <button
            onClick={() => onEdit(supplier)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold border border-theme rounded-lg text-main hover:bg-row-hover transition-all"
          >
            Edit
          </button> */}
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
                  {React.cloneElement(t.icon as React.ReactElement, { size: 13 })}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-w-0 overflow-auto">

            {/* ════ OVERVIEW ════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="p-4 space-y-4">

                {/* KPI strip — 4 cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <KpiCard
                    icon={<Users size={15} />}
                    label="Supplier Type"
                    value={(supplier as any)?.type ?? (supplier as any)?.supplierType}
                  />
                     <KpiCard
                    icon={<Banknote size={15} />}
                    label="Currency"
                    value={(supplier as any)?.currency ?? supplier?.currency}
                  />
                  <KpiCard
                    icon={<Tag size={15} />}
                    label="Tax Category"
                    value={taxCategory}
                  />
                  <KpiCard
                    icon={<BadgeCheck size={15} />}
                    label="TPIN"
                    value={supplier?.tpin}
                    mono
                  />
                   <KpiCard
                    icon={<Layers size={15} />}
                    label="Supplier Group"
                    value={(supplier as any)?.supplierGroup}
                  />
                </div>


                {/* Contact + Terms */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Contact card — from contacts[] & addresses[] */}
                  <div className="bg-card rounded-2xl border border-theme overflow-hidden no-scrollbar">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-theme">
                      <Mail size={12} className="text-primary" />
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Contact Channels</h4>
                    </div>
                    <div className="divide-y divide-theme">
                      <DataRow
                        icon={<Users size={11} />}
                        label="Contact Person"
                        value={primaryContact?.fullName ?? [primaryContact?.firstName, primaryContact?.lastName].filter(Boolean).join(" ")}
                      />
                      <DataRow
                        icon={<Phone size={11} />}
                        label="Mobile"
                        value={primaryContact?.mobile ?? primaryContact?.phone}
                        mono
                      />
                      <DataRow
                        icon={<Mail size={11} />}
                        label="Email"
                        value={primaryContact?.email}
                      />
                      <DataRow
                        icon={<BadgeCheck size={11} />}
                        label="Contact Status"
                        value={primaryContact?.status}
                      />
                    </div>

                    {/* Billing address block */}
                    {billingLines.length > 0 && (
                      <div className="px-4 py-3 border-t border-theme bg-row-hover/40">
                        <div className="flex items-start gap-2">
                          <MapPin size={11} className="text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Billing Address</p>
                            {billingLines.map((line, i) => (
                              <p key={i} className="text-xs font-medium text-main leading-snug">{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* All contacts list — if more than one */}
                    {contacts.length > 1 && (
                      <div className="px-4 py-3 border-t border-theme">
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">
                          All Contacts ({contacts.length})
                        </p>
                        <div className="space-y-2">
                          {contacts.map((c: any, i: number) => (
                            <div key={c.id ?? i} className="flex items-center gap-3 p-2.5 rounded-xl border border-theme bg-app/50">
                              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                                {(c.fullName ?? c.firstName ?? "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-main truncate">
                                  {c.fullName ?? [c.firstName, c.lastName].filter(Boolean).join(" ")}
                                  {c.isPrimary && <span className="ml-1.5 text-[8px] font-black text-primary uppercase">Primary</span>}
                                </p>
                                <p className="text-[10px] text-muted truncate">{c.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms card — from terms.Buying */}
                  <div className="bg-card rounded-2xl border border-theme flex flex-col" style={{ maxHeight: 480 }}>
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-theme shrink-0">
                      <FileText size={12} className="text-primary" />
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Terms & Conditions</h4>
                    </div>

                  <div className="overflow-y-auto flex-1 p-5 space-y-4 text-xs text-muted no-scrollbar">

                      {/* General */}
                      {terms?.general && (
                        <TermsSection title="General">
                          <p className="leading-relaxed">{terms.general}</p>
                        </TermsSection>
                      )}

                      {/* Payment phases */}
                      {(terms?.payment?.phases?.length ?? 0) > 0 && (
                        <TermsSection title="Payment Phases">
                          <div className="space-y-2">
                            {terms.payment.phases.map((phase: any, i: number) => (
                              <div key={phase.id ?? i} className="rounded-xl border border-theme p-3 bg-app/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-main capitalize">{phase.name}</span>
                                  <span className="text-xs font-black text-primary">
                                    {String(phase.percentage).includes("%") ? phase.percentage : `${phase.percentage}%`}
                                  </span>
                                </div>
                                {phase.condition && (
                                  <p className="text-[10px] text-muted">{phase.condition}</p>
                                )}
                                {phase.credit_days && (
                                  <p className="text-[10px] text-muted">
                                    Credit: <span className="font-semibold text-main">{phase.credit_days} days</span>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </TermsSection>
                      )}

                      {/* Payment extras */}
                      {(terms?.payment?.dueDates || terms?.payment?.lateCharges || terms?.payment?.taxes || terms?.payment?.notes) && (
                        <TermsSection title="Payment Details">
                          <div className="space-y-1">
                            {terms.payment.dueDates   && <TermLine label="Due Dates"     value={terms.payment.dueDates} />}
                            {terms.payment.lateCharges && <TermLine label="Late Charges" value={terms.payment.lateCharges} />}
                            {terms.payment.taxes       && <TermLine label="Taxes"        value={terms.payment.taxes} />}
                            {terms.payment.notes       && <TermLine label="Notes"        value={terms.payment.notes} />}
                          </div>
                        </TermsSection>
                      )}

                      {terms?.delivery     && <TermsSection title="Delivery"><p>{terms.delivery}</p></TermsSection>}
                      {terms?.cancellation && <TermsSection title="Cancellation"><p>{terms.cancellation}</p></TermsSection>}
                      {terms?.warranty     && <TermsSection title="Warranty"><p>{terms.warranty}</p></TermsSection>}
                      {terms?.liability    && <TermsSection title="Liability"><p>{terms.liability}</p></TermsSection>}

                      {!terms && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <div className="w-10 h-10 rounded-xl border-2 border-dashed border-theme flex items-center justify-center">
                            <FileText size={16} className="text-muted opacity-30" />
                          </div>
                          <p className="text-[11px] text-muted italic">No terms defined for this supplier</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ BANK ACCOUNTS ═══════════════════════════════════════ */}
            {activeTab === "bank-accounts" && (
              <div className="p-2 w-full min-w-0 overflow-hidden">
                <SupplierBankDetails
                  supplierName={supplierId}
                  onAdd={(refresh) => { bankAccountsRefresh.current = refresh; }}
                  onEdit={(row) => { setEditingRow(row); setShowBankModal(true); }}
                />
              </div>
            )}

            {/* ════ PURCHASE ORDERS ════════════════════════════════════ */}
            {activeTab === "purchase-orders" && supplierName && (
              <div className="p-2 w-full min-w-0 overflow-hidden">
                <SupplierPurchaseOrders supplierName={supplierId} />
              </div>
            )}

            {/* ════ BILLS ══════════════════════════════════════════════ */}
            {activeTab === "bills" && supplierName && (
              <div className="p-2 w-full min-w-0 overflow-hidden">
                <SupplierPurchaseInvoices supplierName={supplierId} />
              </div>
            )}

            {/* ════ PAYMENTS ═══════════════════════════════════════════ */}
            {activeTab === "payments" && supplierName && (
              <div className="p-2 w-full min-w-0 overflow-hidden">
                <SupplierDetailViewPayments supplierName={supplierName} />
              </div>
            )}

            {/* ════ STATEMENT ══════════════════════════════════════════ */}
            {activeTab === "statement" && statementLoading && (
              <div className="flex items-center justify-center py-20 gap-3 text-muted text-[12px] font-semibold">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading statement…
              </div>
            )}
            {activeTab === "statement" && !statementLoading && statement && (
              <SupplierStatement
                supplier={supplier}
                statement={statement}
                onMakePayment={(entry) => console.log("pay", entry)}
                onViewEntry={(entry) => console.log("view", entry)}
              />
            )}
            {activeTab === "statement" && !statementLoading && !statement && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-5 rounded-2xl bg-row-hover text-muted mb-4">
                  <FileText size={28} />
                </div>
                <h3 className="text-sm font-bold text-main">No statement available</h3>
                <p className="text-[10px] text-muted font-bold uppercase mt-1">Statement data could not be loaded</p>
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

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** KPI banner card */
const KpiCard = ({
  icon, label, value, mono,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  mono?: boolean;
}) => (
  <div className="bg-card rounded-xl border border-theme p-3.5 flex items-center gap-3 hover:shadow-sm transition-all group">
    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-black text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs font-bold text-main truncate ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);

/** Data row inside Contact card */
const DataRow = ({
  icon, label, value, mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-row-hover/60 transition-colors">
    <div className="flex items-center gap-1.5 shrink-0">
      {icon && <span className="text-muted">{icon}</span>}
      <span className="text-[9px] font-black text-muted uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-xs font-semibold text-main text-right max-w-[200px] truncate ${mono ? "font-mono" : ""}`}>
      {value || "—"}
    </span>
  </div>
);

/** Terms section wrapper */
const TermsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
      <ChevronRight size={9} className="text-primary" />
      {title}
    </p>
    <div className="text-xs text-muted leading-relaxed">{children}</div>
  </div>
);

/** Single term key-value line */
const TermLine = ({ label, value }: { label: string; value: string }) => (
  <p>
    <span className="font-semibold text-main">{label}: </span>
    {value}
  </p>
);

export default SupplierDetailView;