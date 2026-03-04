import React, { useState } from "react";
import {
  X,
  Search,
  FileText,
  Receipt,
  Plus,
  Building2,
  MapPin,
  Mail,
} from "lucide-react";
import type { Supplier } from "../../types/Supply/supplier";
import SupplierStatement from "./SupplierStatement";
import PurchaseInvoiceModal from "../../components/procurement/PurchaseInvoiceModal";
import PurchaseOrderModal from "../../components/procurement/PurchaseOrderModal";
import SupplierPurchaseOrders from "./SupplierPurchaseOrders";

/*  PROPS  */

interface Props {
  supplier: Supplier;
  suppliers: Supplier[];
  onBack: () => void;
  onSupplierSelect: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
}

/*  COMPONENT  */

const SupplierDetailView: React.FC<Props> = ({
  supplier,
  suppliers,
  onBack,
  onSupplierSelect,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "purchase-orders" | "bills" | "statement"
  >("overview");
  const [showPOModal, setShowPOModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const supplierDetail = suppliers.find((s) =>
    supplier.supplierId
      ? s.supplierId === supplier.supplierId
      : s.supplierCode === supplier.supplierCode,
  );
  const supplierName = supplierDetail?.supplierName;

  const supplierCode = supplierDetail?.supplierCode;

  const filteredSuppliers = suppliers.filter(
    (s) =>
      (s.supplierName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.supplierCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.tpin || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderActionButton = () => {
    switch (activeTab) {
      case "purchase-orders":
        return (
          <button
            onClick={() => setShowPOModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
          >
            <Plus size={14} /> New Purchase Order
          </button>
        );
      case "bills":
        return (
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md"
          >
            <Plus size={14} /> New Purchase Invoice
          </button>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success";
      case "inactive":
        return "bg-danger text-danger";
      case "pending":
        return "bg-warning text-warning";
      default:
        return "bg-muted text-main";
    }
  };

  const formatAddress = () => {
    const parts = [
      supplierDetail?.billingAddressLine1,
      supplierDetail?.billingAddressLine2,
      supplierDetail?.billingCity,
      supplierDetail?.district,
      supplierDetail?.province,
      supplierDetail?.billingPostalCode,
      supplierDetail?.billingCountry,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  };

  return (
    <div className="flex flex-col bg-app text-main overflow-hidden ">
      {/*  HEADER  */}
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
                {supplierDetail?.supplierName}
              </h2>
              {supplierDetail?.supplierCode && (
                <span className="text-[9px] font-bold text-muted bg-row-hover px-1.5 py-0.5 rounded border border-[var(--border)] uppercase">
                  {supplierDetail?.supplierCode}
                </span>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">
              Supplier Insight Center
            </p>
          </div>
        </div>

        {renderActionButton()}
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/*  SIDEBAR  */}
        <aside className="w-60 bg-card border-r border-[var(--border)] h-130 rounded-2xl">
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

          <div className=" overflow-y-auto custom-scrollbar mt-3 px-2 h-110">
            {filteredSuppliers.map((s) => (
              <button
                key={s.supplierId || s.supplierCode}
                onClick={() => onSupplierSelect(s)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-3 border ${
                  s.supplierCode === supplierDetail?.supplierCode
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-transparent border-transparent hover:bg-row-hover"
                }`}
              >
                <div
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    s.supplierCode === supplierDetail?.supplierCode
                      ? "bg-white/20"
                      : "bg-muted text-white"
                  }`}
                >
                  {(s.supplierName || "?").charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[11px] truncate leading-tight">
                    {s.supplierName}
                  </p>
                  <p className="text-[8px] font-mono uppercase text-muted">
                    {s.supplierCode || s.tpin || "—"}
                  </p>
                </div>

                {s.status && (
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${getStatusColor(
                      s.status,
                    )}`}
                  >
                    {s.status.toUpperCase()}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/*  MAIN  */}
        <main className="flex-1 flex flex-col min-w-0 bg-app/20">
          {/* Tabs */}
          <div className="bg-card border-b border-[var(--border)] px-4 shrink-0 z-10">
            <div className="flex">
              {[
                { id: "overview", label: "Overview" },
                { id: "purchase-orders", label: "Purchase Orders" },
                { id: "bills", label: "Bills" },
                { id: "statement", label: "Statement" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-3.5 font-bold text-[10px] uppercase tracking-widest border-b-2 transition-all ${
                    activeTab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-main"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pt-4 px-2 box-border">
            {activeTab === "overview" && (
              <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500 p-5">
                {/* Info Strips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoStrip
                    label="Currency"
                    value={supplierDetail?.currency}
                    icon={<Building2 />}
                  />
                  <InfoStrip
                    label="TPIN"
                    value={supplierDetail?.tpin}
                    icon={<FileText />}
                  />
                  <InfoStrip
                    label="Opening Balance"
                    value={supplierDetail?.openingBalance}
                    icon={<Receipt />}
                  />
                </div>

                {/* Contact + Address */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Mail size={12} className="text-primary" /> Contact
                      Channels
                    </h4>
                    <div className="space-y-3">
                      <DataRow
                        label="Email Address"
                        value={supplierDetail?.emailId}
                      />
                      <DataRow
                        label="Phone Number"
                        value={supplierDetail?.phoneNo}
                      />
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-[var(--border)] p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin size={12} className="text-primary" /> Physical
                      Location
                    </h4>
                    <DataRow label="Billing Address" value={formatAddress()} />
                  </div>
                </div>

                <div className="p-4 border-2 border-dashed border-[var(--border)] rounded-2xl flex items-center justify-center opacity-40">
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted">
                    Additional ledger data will load here
                  </p>
                </div>
              </div>
            )}

            {activeTab === "purchase-orders" && supplierName && (
              <SupplierPurchaseOrders supplierName={supplierName} />
            )}

            {activeTab === "statement" && supplierDetail && (
              <SupplierStatement supplier={supplierDetail} />
            )}
          </div>
        </main>
      </div>

      <PurchaseOrderModal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
      />

      <PurchaseInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};

/*  SUB COMPONENTS  */

const InfoStrip = ({ icon, label, value }: any) => (
  <div className="bg-card rounded-xl border border-[var(--border)] p-3 flex items-center gap-3 shadow-sm">
    <div className="p-2 rounded-lg bg-row-hover text-primary border border-[var(--border)]">
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <div>
      <p className="text-[8px] font-black text-muted uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xs font-bold text-main">{value || "—"}</p>
    </div>
  </div>
);

const DataRow = ({ label, value }: any) => (
  <div className="flex justify-between items-center gap-2 py-1 px-3 bg-app/30 rounded-xl">
    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
      {label}
    </span>
    <span className="text-xs font-semibold text-main truncate max-w-[220px]">
      {value || "Not provided"}
    </span>
  </div>
);

export default SupplierDetailView;
