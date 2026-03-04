import React, { useState } from "react";
import {
  X,
  Search,
  Edit,
  FileText,
  Receipt,
  Plus,
  MapPin,
  Mail,
  Building2,
  FileBarChart,
  Globe,
} from "lucide-react";
import type { CustomerDetail } from "../../types/customer";
import CustomerModal from "../../components/crm/CustomerModal";
import QuotationModal from "../../components/sales/QuotationModal";
import InvoiceModal from "../../components/sales/InvoiceModal";
import CustomerStatement from "../Crm/CustomerStatement";

interface Props {
  customer: CustomerDetail;
  customers: CustomerDetail[];
  onBack: () => void;
  onCustomerSelect: (customer: CustomerDetail) => void;
  onAdd: () => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
}

const CustomerDetailView: React.FC<Props> = ({
  customer,
  customers,
  onBack,
  onCustomerSelect,
  onAdd,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "quotations" | "invoices" | "statement"
  >("overview");

  const q = searchTerm.trim().toLowerCase();
  const filteredCustomers = (customers || []).filter(
    (c) => c.name?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q),
  );

  const renderActionButton = () => {
    switch (activeTab) {
      case "overview":
        return (
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
          >
            <Plus size={14} /> New Customer
          </button>
        );

      case "quotations":
        return (
          <button
            onClick={() => setShowQuotationModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
          >
            <Plus size={14} /> New Quotation
          </button>
        );

      case "invoices":
        return (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
          >
            <Plus size={14} /> New Invoice
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col  bg-app text-main overflow-hidden">
      <header className="bg-card px-5 py-3 flex items-center justify-between border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-row-hover rounded-xl transition-all border border-[var(--border)]"
          >
            <X size={18} className="text-muted" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight leading-none">
                {customer.name}
              </h2>
              <span className="text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-[var(--border)] uppercase">
                {customer.id}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">
              Customer Insight Center
            </p>
          </div>
        </div>
        {renderActionButton()}
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 2. TIGHT SIDEBAR */}
        <aside className="w-64 bg-card border-r border-[var(--border)] h-129 rounded-2xl">
          <div className="p-3 border-b border-[var(--border)] bg-row-hover/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="search"
                placeholder="Quick find..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-app border border-[var(--border)] rounded-lg focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className=" overflow-y-auto custom-scrollbar h-100 mt-5 ">
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => onCustomerSelect(c)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-3 border ${
                  c.id === customer.id
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-transparent border-transparent hover:bg-row-hover"
                }`}
              >
                <div
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-[10px] ${c.id === customer.id ? "bg-white/20" : "bg-muted text-white"}`}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[11px] truncate leading-tight">
                    {c.name}
                  </p>
                  <p
                    className={`text-[8px] font-mono uppercase ${c.id === customer.id ? "text-white/60" : "text-muted"}`}
                  >
                    {c.id}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* 3. CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-app/20">
          {/* COMPACT TABS */}
          <div className="bg-card border-b border-[var(--border)] px-4 shrink-0 z-10 flex items-center justify-between">
            <div className="flex">
              {[
                { id: "overview", label: "Overview", icon: <Globe /> },
                { id: "quotations", label: "Quotations", icon: <FileText /> },
                { id: "invoices", label: "Invoices", icon: <Receipt /> },
                { id: "statement", label: "Statement", icon: <FileBarChart /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-3.5 font-bold text-[10px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-main"}`}
                >
                  {React.cloneElement(t.icon as any, { size: 14 })} {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={(e) => onEdit(customer.id, e)}
              className="flex items-center gap-2 px-3 py-1.5 bg-card border border-[var(--border)] text-muted hover:text-main rounded-lg transition-all font-bold text-[10px] uppercase tracking-widest"
            >
              <Edit size={12} /> Edit Profile
            </button>
          </div>

          <div>
            {activeTab === "overview" && (
              <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500 p-5">
                {/* REFINED QUICK INFO ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoStrip
                    icon={<Building2 />}
                    label="Customer Type"
                    value={customer.type}
                  />
                  <InfoStrip
                    icon={<FileText />}
                    label="Tax ID / TPIN"
                    value={customer.tpin}
                  />
                  <InfoStrip
                    icon={<Receipt />}
                    label="Base Currency"
                    value={customer.currency}
                  />
                </div>

                {/* CONSOLIDATED DATA SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Contact Details */}
                  <div className="bg-card rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Mail size={12} className="text-primary" /> Contact
                      Channels
                    </h4>
                    <div className="space-y-3">
                      <DataRow label="Email Address" value={customer.email} />
                      <DataRow label="Mobile Number" value={customer.mobile} />
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="bg-card rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin size={12} className="text-primary" /> Physical
                      Locations
                    </h4>
                    <div className="space-y-3">
                      <DataRow
                        label="Billing Address"
                        value={customer.billingAddressLine1}
                      />
                      <DataRow
                        label="Shipping Address"
                        value={customer.shippingAddressLine1}
                      />
                    </div>
                  </div>
                </div>

                {/* BOTTOM SECTION FOR MISC INFO (Optional) */}
                <div className="p-4 border-2 border-dashed border-[var(--border)] rounded-2xl flex items-center justify-center opacity-40">
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted text-center">
                    Additional Ledger data will load here
                  </p>
                </div>
              </div>
            )}

            {activeTab === "statement" && (
              <CustomerStatement customerId={customer.id} />
            )}

            {/* Empty States for other tabs */}
            {(activeTab === "quotations" || activeTab === "invoices") && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-5 rounded-2xl bg-row-hover text-muted mb-4">
                  {activeTab === "quotations" ? (
                    <FileText size={32} />
                  ) : (
                    <Receipt size={32} />
                  )}
                </div>
                <h3 className="text-sm font-bold text-main">
                  No {activeTab} available
                </h3>
                <p className="text-[10px] text-muted font-bold uppercase mt-1">
                  Transaction history is empty
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <QuotationModal
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
      />
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSubmit={(created: any) => onCustomerSelect(created)}
      />
    </div>
  );
};

// --- Enterprise UI Sub-components ---

const InfoStrip = ({ icon, label, value }: any) => (
  <div className="bg-card rounded-xl border border-[var(--border)] p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group">
    <div className="p-2 rounded-lg bg-row-hover text-primary border border-[var(--border)] group-hover:bg-primary group-hover:text-white transition-all">
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <div className="leading-tight">
      <p className="text-[8px] font-black text-muted uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-xs font-bold text-main">{value || "—"}</p>
    </div>
  </div>
);

const DataRow = ({ label, value }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 py-1 px-3 bg-app/30 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-app/50 transition-all">
    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
      {label}
    </span>
    <span className="text-xs font-semibold text-main truncate max-w-[200px]">
      {value || "Not provided"}
    </span>
  </div>
);

export default CustomerDetailView;
