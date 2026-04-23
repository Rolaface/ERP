import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  X,
  Search,
  FileText,
  Receipt,
  Plus,
  MapPin,
  Mail,
  Building2,
  FileBarChart,
  Globe,
  CreditCard,
  Phone,
  Users,
  Tag,
  Banknote,
  Layers,
  ChevronRight,
  BadgeCheck,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarDays,
} from "lucide-react";
import type { CustomerDetail } from "../../types/customer";
import QuotationModal from "../../components/sales/QuotationModal";
import InvoiceModal from "../../components/sales/InvoiceModal";
import CustomerStatement from "../Crm/CustomerStatement";
import CustomerInvoices from "./CustomerInvoices";
import CustomerQuotations from "./CustomerQuotations";
import CustomerBankDetails from "./CustomerBankDetails";
import AddBankAccountModal from "../../components/CompanySetup/AddBankAccountModal";
import PaymentEntryModal from "../../views/PaymentEntry/PaymentEntryModal";
import CustomerdetailviewPayment from "./CustomerDetailViewPayments";
import { getCustomerByCustomerCode } from "../../api/customerApi";



type OutletContextType = {
  openCustomerCreate: () => void;
  openInvoiceCreate:()=>void;
  openQuotationCreate: () => void;
};

interface Props {
  customerId: string;
  customers: CustomerDetail[];
  onBack: () => void;
  onCustomerSelect: (customerId: string) => void;
  onAdd: () => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmtDate = (raw?: string | null): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatAddress = (addr?: any): string => {
  if (!addr) return "";
  const line1 = [addr.line1, addr.line2].filter(Boolean).join(", ");
  const line2 = [addr.city, addr.state].filter(Boolean).join(", ");
  const line3 = [addr.country, addr.postalCode].filter(Boolean).join(" ");
  return [line1, line2, line3].filter(Boolean).join("\n");
};

const fmtPct = (v: any): string => {
  if (!v) return "";
  return String(v).includes("%") ? String(v) : `${v}%`;
};

const TABS = [
  { id: "overview",   label: "Overview",     icon: <Globe /> },
  { id: "bank",       label: "Bank Details", icon: <Building2 /> },
  { id: "quotations", label: "Quotations",   icon: <FileText /> },
  { id: "invoices",   label: "Invoices",     icon: <Receipt /> },
  { id: "payments",   label: "Payments",     icon: <CreditCard /> },
  { id: "statement",  label: "Statement",    icon: <FileBarChart /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const CustomerDetailView: React.FC<Props> = ({
  customerId,
  customers,
  onBack,
  onCustomerSelect,
}) => {
  const { openCustomerCreate } = useOutletContext<OutletContextType>();
  const { openInvoiceCreate } = useOutletContext<OutletContextType>();
  const { openQuotationCreate } = useOutletContext<OutletContextType> ();

  const [searchTerm,          setSearchTerm]          = useState("");
  const [customer,            setCustomer]            = useState<CustomerDetail | null>(null);
  const [loading,             setLoading]             = useState(true);
  const [activeTab,           setActiveTab]           = useState<TabId>("overview");
  const [showQuotationModal,  setShowQuotationModal]  = useState(false);
  const [showInvoiceModal,    setShowInvoiceModal]    = useState(false);
  const [showPaymentModal,    setShowPaymentModal]    = useState(false);
  const [showBankAccountModal,setShowBankAccountModal]= useState(false);
  const [editingRow,          setEditingRow]          = useState<any>(null);
  const [sidebarOpen,         setSidebarOpen]         = useState(true);
  const [mobileDrawer,        setMobileDrawer]        = useState(false);

  const refreshBankAccounts = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    getCustomerByCustomerCode(customerId)
      .then((res) => {
        const data = res?.message?.data ?? res?.data ?? null;
        setCustomer(data);
      })
      .catch((err) => console.error("Failed to fetch customer:", err))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted">
        Customer not found
      </div>
    );
  }

  // ── DERIVED: correct API field mapping ──────────────────────────────────────

  // contacts[] — prefer isPrimary, else first
  const contacts      = (customer as any).contacts ?? [];
  const primaryContact = contacts.find((c: any) => c.isPrimary) ?? contacts[0];

  // addresses[]
  const addresses     = (customer as any).addresses ?? [];
  const billingAddr   = addresses.find((a: any) => a.type === "Billing");
  const shippingAddr  = addresses.find((a: any) => a.type === "Shipping");

  // Contact fields — prefer contacts[] array, fall back to flat top-level fields
  const contactName   = primaryContact?.fullName
    ?? [primaryContact?.firstName, primaryContact?.lastName].filter(Boolean).join(" ")
    ?? "";
  const contactMobile = primaryContact?.mobile ?? primaryContact?.phone ?? (customer as any).mobile ?? "";
  const contactEmail  = primaryContact?.email ?? (customer as any).email ?? "";
  const contactStatus = primaryContact?.status ?? "";

  // terms — API sends terms.Selling (capital S)
  const sellingTerms = (customer.terms as any)?.Selling ?? (customer.terms as any)?.selling;

  // tax category — API sends customerTaxCategory
  const taxCategory  = (customer as any).customerTaxCategory ?? (customer as any).taxCategory ?? "";

  // group
  const customerGroup = (customer as any).customerGroup ?? "";

  // createdAt
  const createdAt     = (customer as any).createdAt ?? customer.dateOfAddition ?? "";

  // ── Sidebar filter ──────────────────────────────────────────────────────────
  const q = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter(
    (c) =>
      ((c as any).name ?? "").toLowerCase().includes(q) ||
      (c.id ?? "").toLowerCase().includes(q),
  );

  // ── Action button ───────────────────────────────────────────────────────────
  const renderActionButton = () => {
    switch (activeTab) {
      case "overview":
        return (
          <button onClick={() => openCustomerCreate()}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={13} /> New Customer
          </button>
        );
      case "quotations":
        return (
          <button onClick={() => openQuotationCreate()}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={13} /> New Quotation
          </button>
        );
      case "invoices":
        return (
          <button onClick={() => openInvoiceCreate()}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={13} /> New Invoice
          </button>
        );
      case "payments":
        return (
          <button onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={13} /> Receive Payment
          </button>
        );
      case "bank":
        return (
          <button onClick={() => { setEditingRow(null); setShowBankAccountModal(true); }}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={13} /> Add Bank
          </button>
        );
      default:
        return null;
    }
  };

  // ── Sidebar list ────────────────────────────────────────────────────────────
  const SidebarList = () => (
    <div className="flex flex-col h-[490px] ">
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
      <div className="overflow-y-auto px-2 py-1.5 flex-1 rounded-2xl">
        {filteredCustomers.length === 0 && (
          <p className="text-[10px] text-muted text-center py-6">No customers found</p>
        )}
        {filteredCustomers.map((c) => {
          const cName = (c as any).name ?? c.displayName ?? "?";
          const cId   = c.id ?? "—";
          const active = cId === customer.id;
          return (
            <button
              key={cId}
              onClick={() => { onCustomerSelect(cId); setMobileDrawer(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 border mb-0.5 ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-transparent border-transparent hover:bg-row-hover"
              }`}
            >
              <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}>
                {cName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-[11px] truncate leading-tight ${active ? "text-white" : "text-main"}`}>
                  {cName}
                </p>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${active ? "text-white/60" : "text-muted"}`}>
                  {cId}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ═══════════════════════════ RENDER ════════════════════════════════════════

  return (
    <div className="flex flex-col bg-app text-main overflow-hidden flex-1 min-h-0">

      {/* ── HEADER ── */}
      <header className="bg-card px-4 py-2.5 flex items-center justify-between border-b border-theme shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setMobileDrawer(true)}
            className="lg:hidden p-1.5 hover:bg-row-hover rounded-lg border border-theme transition-all">
            <Menu size={15} className="text-muted" />
          </button>
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
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center font-black text-[13px] text-primary shrink-0 border border-primary/20">
              {((customer as any).name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[13px] font-black tracking-tight leading-none truncate">
                  {(customer as any).name}
                </h2>
                {customer.id && (
                  <span className="text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-theme uppercase shrink-0">
                    {customer.id}
                  </span>
                )}
                {(customer as any).status === "Active" && (
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
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Customers</span>
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
                All Customers <span className="ml-1.5 text-primary font-black">{customers.length}</span>
              </p>
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {sidebarOpen && <SidebarList />}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-app/20">

          {/* Tabs */}
          <div className="bg-card border-b border-theme px-4 shrink-0 z-10">
            <div className="flex overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3.5 font-bold text-[10px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-main"
                  }`}
                >
                  {React.cloneElement(tab.icon as React.ReactElement, { size: 13 })}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-w-0 overflow-auto">

            {/* ════ OVERVIEW ════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="p-4 space-y-4">

                {/* KPI strip row 1 — 4 cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <KpiCard icon={<Building2 size={15} />} label="Customer Type"     value={(customer as any).type} />
                   <KpiCard icon={<Banknote size={15} />}  label="Currency"     value={(customer as any).currency} />              
                  <KpiCard icon={<Tag size={15} />}       label="Tax Category"      value={taxCategory} />
                  <KpiCard icon={<BadgeCheck size={15} />} label="TPIN"             value={(customer as any).tpin} mono />
                  <KpiCard icon={<Layers size={15} />}    label="Customer Group"   value={customerGroup} />
                </div>

                

                {/* Contact + Terms */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Contact card */}
                  <div className="bg-card rounded-2xl border border-theme overflow-auto h-[390px]">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-theme">
                      <Mail size={12} className="text-primary" />
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Contact Channels</h4>
                    </div>
                    <div className="divide-y divide-theme">
                      <DataRow icon={<Users size={11} />}   label="Contact Person"  value={contactName} />
                      <DataRow icon={<Phone size={11} />}   label="Mobile"          value={contactMobile} mono />
                      <DataRow icon={<Mail size={11} />}    label="Email"           value={contactEmail} />
                      <DataRow icon={<BadgeCheck size={11} />} label="Status"       value={contactStatus} />
                    </div>

                    {/* Addresses */}
                    <div className="border-t border-theme">
                      <div className="flex items-center gap-2 px-5 py-3 border-b border-theme bg-row-hover/30">
                        <MapPin size={12} className="text-primary" />
                        <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Physical Locations</h4>
                      </div>

                      {billingAddr && (
                        <div className="px-4 py-3 border-b border-theme last:border-0">
                          <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5">Billing Address</p>
                          {formatAddress(billingAddr).split("\n").map((line, i) => (
                            <p key={i} className="text-xs font-medium text-main leading-snug">{line}</p>
                          ))}
                        </div>
                      )}

                      {shippingAddr && (
                        <div className="px-4 py-3">
                          <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5">Shipping Address</p>
                          {formatAddress(shippingAddr).split("\n").map((line, i) => (
                            <p key={i} className="text-xs font-medium text-main leading-snug">{line}</p>
                          ))}
                        </div>
                      )}

                      {!billingAddr && !shippingAddr && (
                        <p className="px-4 py-4 text-xs text-muted italic">No addresses on file</p>
                      )}
                    </div>

                    {/* Additional contacts */}
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
                                  {c.isPrimary && (
                                    <span className="ml-1.5 text-[8px] font-black text-primary uppercase">Primary</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-muted truncate">{c.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms card — reads terms.Selling (capital S) */}
                  <div className="bg-card rounded-2xl border border-theme flex flex-col h-[390px]">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-theme shrink-0">
                      <FileText size={12} className="text-primary" />
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Terms & Conditions</h4>
                    </div>

                    <div className="overflow-y-auto flex-1 p-5 space-y-4 text-xs text-muted">
                      {sellingTerms?.general && (
                        <TermsSection title="General">
                          <p className="leading-relaxed">{sellingTerms.general}</p>
                        </TermsSection>
                      )}

                      {(sellingTerms?.payment?.phases?.length ?? 0) > 0 && (
                        <TermsSection title="Payment Phases">
                          <div className="space-y-2">
                            {sellingTerms.payment.phases.map((phase: any, i: number) => (
                              <div key={phase.id ?? i} className="rounded-xl border border-theme p-3 bg-app/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-main capitalize">{phase.name}</span>
                                  <span className="text-xs font-black text-primary">{fmtPct(phase.percentage)}</span>
                                </div>
                                {phase.condition && <p className="text-[10px] text-muted">{phase.condition}</p>}
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

                      {(sellingTerms?.payment?.dueDates ||
                        sellingTerms?.payment?.lateCharges ||
                        sellingTerms?.payment?.taxes ||
                        sellingTerms?.payment?.notes) && (
                        <TermsSection title="Payment Details">
                          <div className="space-y-1">
                            {sellingTerms.payment.dueDates    && <TermLine label="Due Dates"    value={sellingTerms.payment.dueDates} />}
                            {sellingTerms.payment.lateCharges && <TermLine label="Late Charges" value={sellingTerms.payment.lateCharges} />}
                            {sellingTerms.payment.taxes       && <TermLine label="Taxes"        value={sellingTerms.payment.taxes} />}
                            {sellingTerms.payment.notes       && <TermLine label="Notes"        value={sellingTerms.payment.notes} />}
                          </div>
                        </TermsSection>
                      )}

                      {sellingTerms?.delivery     && <TermsSection title="Delivery"><p>{sellingTerms.delivery}</p></TermsSection>}
                      {sellingTerms?.cancellation && <TermsSection title="Cancellation"><p>{sellingTerms.cancellation}</p></TermsSection>}
                      {sellingTerms?.warranty     && <TermsSection title="Warranty"><p>{sellingTerms.warranty}</p></TermsSection>}
                      {sellingTerms?.liability    && <TermsSection title="Liability"><p>{sellingTerms.liability}</p></TermsSection>}

                      {!sellingTerms && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <div className="w-10 h-10 rounded-xl border-2 border-dashed border-theme flex items-center justify-center">
                            <FileText size={16} className="text-muted opacity-30" />
                          </div>
                          <p className="text-[11px] text-muted italic">No terms defined for this customer</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ BANK ════════════════════════════════════════════════ */}
            {activeTab === "bank" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerBankDetails
                  customerName={(customer as any).id}
                  onAdd={(refresh) => {
                    setEditingRow(null);
                    refreshBankAccounts.current = refresh;
                    setShowBankAccountModal(true);
                  }}
                  onEdit={(row) => { setEditingRow(row); setShowBankAccountModal(true); }}
                />
              </div>
            )}

            {/* ════ STATEMENT ══════════════════════════════════════════ */}
            {activeTab === "statement" && (
              <CustomerStatement customerId={customer.id} />
            )}

            {/* ════ QUOTATIONS ═════════════════════════════════════════ */}
            {activeTab === "quotations" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerQuotations customerId={customer.id} />
              </div>
            )}

            {/* ════ INVOICES ═══════════════════════════════════════════ */}
            {activeTab === "invoices" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerInvoices customerName={(customer as any).id} />
              </div>
            )}

            {/* ════ PAYMENTS ═══════════════════════════════════════════ */}
            {activeTab === "payments" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerdetailviewPayment customerName={(customer as any).name} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── MODALS ── */}
      <QuotationModal  isOpen={showQuotationModal}  onClose={() => setShowQuotationModal(false)} />
      <InvoiceModal    isOpen={showInvoiceModal}    onClose={() => setShowInvoiceModal(false)} />
      <PaymentEntryModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => setShowPaymentModal(false)}
        customerId={customer.id}
      />
      <AddBankAccountModal
        isOpen={showBankAccountModal}
      
        onClose={() => { setShowBankAccountModal(false); setEditingRow(null); }}
        onSubmit={() => { setShowBankAccountModal(false); refreshBankAccounts.current?.(); }}
        partyName={(customer as any).id}
        defaultAccountFor="Customer"
        initialData={editingRow}
         customerId={customer.id}
      />
    </div>
  );
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const KpiCard = ({
  icon, label, value, mono,
}: {
  icon: React.ReactNode; label: string; value?: string | null; mono?: boolean;
}) => (
  <div className="bg-card rounded-xl border border-theme p-3.5 flex items-center gap-3 hover:shadow-sm transition-all group">
    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-black text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs font-bold text-main truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  </div>
);

const DataRow = ({
  icon, label, value, mono,
}: {
  icon?: React.ReactNode; label: string; value?: string | null; mono?: boolean;
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

const TermsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
      <ChevronRight size={9} className="text-primary" />
      {title}
    </p>
    <div className="text-xs text-muted leading-relaxed">{children}</div>
  </div>
);

const TermLine = ({ label, value }: { label: string; value: string }) => (
  <p><span className="font-semibold text-main">{label}: </span>{value}</p>
);

export default CustomerDetailView;