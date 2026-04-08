import React, { useEffect, useState } from "react";
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
};

interface Props {
  customerId: string;
  customers: CustomerDetail[];
  onBack: () => void;
  onCustomerSelect: (customerId: string) => void;
  onAdd: () => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
}

const CustomerDetailView: React.FC<Props> = ({
  customerId,
  customers,
  onBack,
  onCustomerSelect,
}) => {
  const { openCustomerCreate } = useOutletContext<OutletContextType>();
  const [searchTerm, setSearchTerm] = useState("");
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [refreshBankAccounts, setRefreshBankAccounts] = useState<(() => void) | null>(null);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "bank" | "quotations" | "invoices" | "payments" | "statement"
  >("overview");

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        return;
      }

      setLoading(true);

      try {
        const response = await getCustomerByCustomerCode(customerId);
        const data = response?.message?.data ?? response?.data ?? null;
        setCustomer(data);
      } catch (error) {
        console.error("Failed to fetch customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const q = searchTerm.trim().toLowerCase();
  const filteredCustomers = (customers || []).filter(
    (entry) =>
      entry.name?.toLowerCase().includes(q) ||
      entry.id?.toLowerCase().includes(q),
  );

  const line1 = [customer.shippingAddressLine1, customer.shippingAddressLine2]
    .filter(Boolean)
    .join(", ");
  const line2 = [customer.shippingCity, customer.shippingPostalCode]
    .filter(Boolean)
    .join(", ");
  const line3 = [customer.shippingState, customer.shippingCountry]
    .filter(Boolean)
    .join(", ");
  const shippingAddress = [line1, line2, line3].filter(Boolean).join("\n");

  const bLine1 = [customer.billingAddressLine1, customer.billingAddressLine2]
    .filter(Boolean)
    .join(", ");
  const bLine2 = [customer.billingCity, customer.billingPostalCode]
    .filter(Boolean)
    .join(", ");
  const bLine3 = [customer.billingState, customer.billingCountry]
    .filter(Boolean)
    .join(", ");
  const billingAddress = [bLine1, bLine2, bLine3].filter(Boolean).join("\n");

  const sellingTerms = customer.terms?.selling;

  const getPhaseName = (phase: any) => phase.name || "";

  const formatPercentage = (value: any) => {
    if (!value) {
      return "";
    }

    return value.toString().includes("%") ? value : `${value}%`;
  };

  const renderActionButton = () => {
    switch (activeTab) {
      case "overview":
        return (
          <button
            onClick={() => openCustomerCreate()}
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

      case "payments":
        return (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
          >
            <Plus size={14} /> Receive Payment
          </button>
        );

      case "bank":
        return (
          <button
            onClick={() => {
              setEditingRow(null);
              setShowBankAccountModal(true);
            }}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
          >
            <Plus size={14} /> Add Bank
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-app text-main overflow-hidden flex-1 min-h-0">
      <header className="bg-card px-4 py-2 flex items-center justify-between border-b border-theme shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-row-hover rounded-xl transition-all border border-theme"
          >
            <X size={18} className="text-muted" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight leading-none">
                {customer.name}
              </h2>
              <span className="text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-theme uppercase">
                {customer.id}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">
              Customer Insight Center
            </p>
          </div>
        </div>
        {renderActionButton()}
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <aside
          className="flex flex-col bg-card border-r border-theme transition-all shrink-0 overflow-hidden w-64"
        >
          <div className="px-3 h-[42px] flex items-center border-b border-theme bg-row-hover/10 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="search"
                placeholder="Quick find..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-app border border-theme rounded-lg focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 p-2" style={{ maxHeight: '560px' }}>
            {filteredCustomers.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onCustomerSelect(entry.id)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-3 border ${
                  entry.id === customer.id
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-transparent border-transparent hover:bg-row-hover"
                }`}
              >
                <div
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    entry.id === customer.id
                      ? "bg-white/20"
                      : "bg-muted text-white"
                  }`}
                >
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[11px] truncate leading-tight">
                    {entry.name}
                  </p>
                  <p
                    className={`text-[8px] font-mono uppercase ${
                      entry.id === customer.id ? "text-white/60" : "text-muted"
                    }`}
                  >
                    {entry.id}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-app/20">
          <div className="bg-card border-b border-theme px-4 shrink-0 z-10 flex items-center justify-between">
            <div className="flex">
              {[
                { id: "overview", label: "Overview", icon: <Globe /> },
                { id: "bank", label: "Bank Details", icon: <Building2 /> },
                { id: "quotations", label: "Quotations", icon: <FileText /> },
                { id: "invoices", label: "Invoices", icon: <Receipt /> },
                { id: "payments", label: "Payments", icon: <CreditCard /> },
                { id: "statement", label: "Statement", icon: <FileBarChart /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-3.5 font-bold text-[10px] uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-main"
                  }`}
                >
                  {React.cloneElement(tab.icon as React.ReactElement, { size: 14 })}{" "}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 overflow-auto">
            {activeTab === "overview" && (
              <div className="space-y-4 animate-in fade-in duration-500 p-4">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                  <div className="bg-card rounded-2xl border border-theme p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Mail size={12} className="text-primary" /> Contact
                      Channels
                    </h4>
                    <div className="space-y-0">
                      <DataRow
                        label="Contact Person"
                        value={customer.contactPerson}
                      />
                      <DataRow label="Mobile Number" value={customer.mobile} />
                      <DataRow label="Email Address" value={customer.email} />
                    </div>
                    <h4 className="mt-6 text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin size={12} className="text-primary" /> Physical
                      Locations
                    </h4>
                    <div className="space-y-0">
                      <DataRow label="Billing Address" value={billingAddress} />
                      <DataRow
                        label="Shipping Address"
                        value={shippingAddress}
                      />
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-theme shadow-sm flex flex-col h-[400px]">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest p-5 border-b border-theme">
                      Terms & Conditions
                    </h4>

                    <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                      <div className="text-xs text-muted space-y-4">
                        {sellingTerms?.general && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">
                              General
                            </h5>
                            <p>{sellingTerms.general}</p>
                          </div>
                        )}

                        <div>
                          <h5 className="text-main font-semibold mb-2">
                            Payment Terms
                          </h5>

                          <ul className="space-y-2">
                            {sellingTerms?.payment?.phases?.map(
                              (phase: any, index: number) => {
                                const phaseName = getPhaseName(phase);
                                const percentage = formatPercentage(
                                  phase.percentage,
                                );

                                return (
                                  <li
                                    key={phase.id ?? `${phaseName}-${index}`}
                                    className="border-b border-theme pb-2 last:border-none"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium text-main">
                                        {phaseName}
                                      </span>
                                      <span className="font-semibold text-primary">
                                        {percentage}
                                      </span>
                                    </div>

                                    {phase.condition && (
                                      <p className="text-[10px] text-muted mt-0.5">
                                        {phase.condition}
                                      </p>
                                    )}
                                  </li>
                                );
                              },
                            )}
                          </ul>

                          <div className="mt-3 space-y-1">
                            {sellingTerms?.payment?.dueDates && (
                              <p>
                                <span className="text-main font-medium">
                                  Due Dates:
                                </span>{" "}
                                {sellingTerms.payment.dueDates}
                              </p>
                            )}

                            {sellingTerms?.payment?.lateCharges && (
                              <p>
                                <span className="text-main font-medium">
                                  Late Charges:
                                </span>{" "}
                                {sellingTerms.payment.lateCharges}
                              </p>
                            )}

                            {sellingTerms?.payment?.taxes && (
                              <p>
                                <span className="text-main font-medium">
                                  Taxes:
                                </span>{" "}
                                {sellingTerms.payment.taxes}
                              </p>
                            )}

                            {sellingTerms?.payment?.notes && (
                              <p>
                                <span className="text-main font-medium">
                                  Notes:
                                </span>{" "}
                                {sellingTerms.payment.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {sellingTerms?.delivery && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">
                              Delivery
                            </h5>
                            <p>{sellingTerms.delivery}</p>
                          </div>
                        )}

                        {sellingTerms?.cancellation && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">
                              Cancellation
                            </h5>
                            <p>{sellingTerms.cancellation}</p>
                          </div>
                        )}

                        {sellingTerms?.warranty && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">
                              Warranty
                            </h5>
                            <p>{sellingTerms.warranty}</p>
                          </div>
                        )}

                        {sellingTerms?.liability && (
                          <div>
                            <h5 className="text-main font-semibold mb-1">
                              Liability
                            </h5>
                            <p>{sellingTerms.liability}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bank" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerBankDetails
                  customerName={customer.name}
                  onAdd={(refresh) => {
                    setEditingRow(null);
                    setRefreshBankAccounts(() => refresh);
                    setShowBankAccountModal(true);
                  }}
                  onEdit={(row) => {
                    setEditingRow(row);
                    setShowBankAccountModal(true);
                  }}
                />
              </div>
            )}

            {activeTab === "statement" && (
              <CustomerStatement customerId={customer.id} />
            )}

            {activeTab === "quotations" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerQuotations customerId={customer.id} />
              </div>
            )}

            {activeTab === "invoices" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerInvoices customerName={customer.name} />
              </div>
            )}

            {activeTab === "payments" && (
              <div className="p-5 w-full min-w-0 overflow-hidden">
                <CustomerdetailviewPayment customerName={customer.name} />
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
      <PaymentEntryModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
        }}
        onSuccess={() => {
          setShowPaymentModal(false);
        }}
      />
      <AddBankAccountModal
        isOpen={showBankAccountModal}
        onClose={() => {
          setShowBankAccountModal(false);
          setEditingRow(null);
        }}
        onSubmit={() => {
          setShowBankAccountModal(false);
          refreshBankAccounts?.();
        }}
        partyName={customer.name}
        defaultAccountFor="Customer"
        initialData={editingRow}
      />
    </div>
  );
};

const InfoStrip = ({ icon, label, value }: any) => (
  <div className="bg-card rounded-xl border border-theme p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group">
    <div className="p-2 rounded-lg bg-row-hover text-primary border border-theme group-hover:bg-primary group-hover:text-white transition-all">
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <div className="leading-tight">
      <p className="text-[8px] font-black text-muted uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-xs font-bold text-main">{value || "-"}</p>
    </div>
  </div>
);

const DataRow = ({ label, value }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 py-1 px-3 bg-app/30 rounded-xl border border-transparent hover:border-theme hover:bg-app/50 transition-all">
    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
      {label}
    </span>
    <span className="text-xs font-semibold text-main whitespace-pre-line text-right max-w-[250px]">
      {value || "Not provided"}
    </span>
  </div>
);

export default CustomerDetailView;
