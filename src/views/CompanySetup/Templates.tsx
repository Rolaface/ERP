import React, { useState } from "react";

// ── Template components ──────────────────────────────────────────────────────
import InvoiceDefaultTemplate  from "../../components/template/invoice/InvoiceDefaultTemplate";
import InvoiceTemplate2        from "../../components/template/invoice/InvoiceTemplate2";
import InvoiceTemplate3        from "../../components/template/invoice/InvoiceTemplate3";
import InvoiceUploadModal      from "../../components/template/invoice/InvoiceUploadModal";

import QuotationDefaultTemplate from "../../components/template/quotation/QuotationDefaultTemplate";
import QuotationTemplate2       from "../../components/template/quotation/QuotationTemplate2";
import QuotationTemplate3       from "../../components/template/quotation/QuotationTemplate3";
import QuotationUploadModal     from "../../components/template/quotation/QuotationUploadModal";

import RFQDefaultTemplate from "../../components/template/rfq/RFQDefaultTemplate";
import RFQTemplate1       from "../../components/template/rfq/rfqTemplate1";
import RFQTemplate2       from "../../components/template/rfq/rfqTemplate2";
import RFQTemplate3       from "../../components/template/rfq/rfqTemplate3";
import RFQUploadModal     from "../../components/template/rfq/RFQUploadModal";

// ✅ Import CompanyTemplates type so the prop is correctly typed
import type { CompanyTemplates } from "../../types/company";

// ─────────────────────────────────────────────────────────────────────────────
// ✅ THE FIX: declare props — this is the one thing that was missing
//    Without this, React.FC rejects any prop you try to pass (ts 2322)
// ─────────────────────────────────────────────────────────────────────────────
interface TemplatesProps {
  templates: CompanyTemplates | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED TYPES  (shared across all template variants)
// ─────────────────────────────────────────────────────────────────────────────
export interface InvoiceItem {
  productName: string;
  description: string;
  quantity: number;
  listPrice: number;
  discount: number;
  tax: number;
}

export interface InvoiceData {
  // DefaultTemplate field names
  invoiceId?: string;
  dateOfInvoice: string;
  dueDate: string;
  // Template2 / Template3 aliases
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceDueDate?: string;
  customerName: string;
  currency: string;
  poNumber?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  notes?: string;
  termsAndConditions?: string;
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPostalCode?: string;
  billingAddressLine1?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billToContact?: string;
  billToCompany?: string;
  billToAddress?: string;
  billToEmail?: string;
  shippingAddressLine1?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  phone?: string;
  website?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  items: InvoiceItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  adjustment: number;
  grandTotal: number;
  total?: number; // alias used by Template2
}

export interface QuotationItem {
  productName: string;
  description: string;
  quantity: number;
  listPrice: number;
  discount: number;
  tax: number;
}

export interface QuotationData {
  quotationId?: string;
  customerName: string;
  subject?: string;
  quotationDate: string;
  validUntil: string;
  poNumber?: string;
  currency: string;
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPostalCode?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddressLine1?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  items: QuotationItem[];
  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  adjustment: number;
  grandTotal: number;
  paymentTerms?: string;
  termsAndConditions?: string;
  notes?: string;
}

export interface RFQItem {
  service?: string;
  description?: string;
  quantity?: number;
  pricePerUnit?: string;
  totalPrice: string;
  pricePerHour?: string;
  estimatedTime?: string;
  hours?: number;
  material?: string;
  size?: string;
  color?: string;
  paperType?: string;
}

export interface RFQData {
  vendorName: string;
  date: string;
  rfqId?: string;
  vendorAddress?: string;
  requestingCompany?: string;
  requestingAddress?: string;
  subject?: string;
  items: RFQItem[];
  totalCost: string;
  deadline?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  additionalRequirements?: string[];
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE ID TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TemplateCategory      = "invoice" | "quotation" | "rfq";
type InvoiceTemplateType   = "default" | "template2" | "template3";
type QuotationTemplateType = "default" | "quotation1" | "quotation2" | "quotation3";
type RFQTemplateType       = "default" | "rfq1" | "rfq2" | "rfq3";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT MAPS
// ─────────────────────────────────────────────────────────────────────────────
const invoiceComponents: Record<InvoiceTemplateType, React.FC<any>> = {
  default:   InvoiceDefaultTemplate,
  template2: InvoiceTemplate2,
  template3: InvoiceTemplate3,
};

const quotationComponents: Record<QuotationTemplateType, React.FC<any>> = {
  default:    QuotationDefaultTemplate,
  quotation1: QuotationDefaultTemplate, // PDF-only, reuse Default as visual
  quotation2: QuotationTemplate2,
  quotation3: QuotationTemplate3,
};

const rfqComponents: Record<RFQTemplateType, React.FC<any>> = {
  default: RFQDefaultTemplate,
  rfq1:    RFQTemplate1,
  rfq2:    RFQTemplate2,
  rfq3:    RFQTemplate3,
};

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY PREVIEW DATA
// ─────────────────────────────────────────────────────────────────────────────
const previewInvoice: InvoiceData = {
  invoiceId: "INV-2025-001", invoiceNumber: "INV-2025-001",
  dateOfInvoice: "2025-11-01", invoiceDate: "2025-11-01",
  dueDate: "2025-11-10", invoiceDueDate: "2025-11-10",
  customerName: "Client Co.", currency: "INR",
  poNumber: "PO-2025-001", paymentTerms: "Net 10", paymentMethod: "Bank Transfer",
  companyName: "My Company Pvt Ltd",
  billingAddressLine1: "123 Main St", billingCity: "Mumbai",
  billingState: "Maharashtra", billingPostalCode: "400001",
  billToContact: "John Doe", phone: "+91 9999999999",
  billToEmail: "john@client.com", website: "www.myclient.com",
  items: [
    { productName: "Custom Setup",    description: "ERP custom implementation", quantity: 10, listPrice: 2000, discount: 0, tax: 240 },
    { productName: "Module Training", description: "ERP module training",        quantity: 5,  listPrice: 1500, discount: 0, tax: 180 },
  ],
  subTotal: 27500, totalDiscount: 0, totalTax: 420, adjustment: 0,
  grandTotal: 27920, total: 27920,
  termsAndConditions: "Payment due in 10 days.",
  notes: "Thank you for your business!",
};

const previewQuotation: QuotationData = {
  quotationId: "QUO-001", customerName: "Customer Name",
  subject: "Quotation for Services",
  quotationDate: "2025-11-11", validUntil: "2025-11-20",
  poNumber: "PO-001", currency: "INR",
  companyName: "My Company Pvt Ltd", companyAddress: "77 MG Road",
  companyCity: "Delhi", companyState: "Delhi", companyPostalCode: "110001",
  billingAddressLine1: "456 Park Ave", billingCity: "Bengaluru",
  billingState: "Karnataka", billingPostalCode: "560001",
  shippingAddressLine1: "456 Park Ave", shippingCity: "Bengaluru",
  shippingState: "Karnataka", shippingPostalCode: "560001",
  items: [
    { productName: "Demo Product", description: "Professional software solution", quantity: 1, listPrice: 50000, discount: 0, tax: 2500 },
  ],
  subTotal: 50000, totalDiscount: 0, totalTax: 2500, adjustment: 0, grandTotal: 52500,
  paymentTerms: "Net 14",
  termsAndConditions: "Payment due within 14 days.",
  notes: "Thank you for your business!",
};

const previewRFQ: RFQData = {
  vendorName: "Vendor Company", date: "2025-11-19",
  subject: "Request for Catering Services",
  items: [
    { service: "Buffet Service",   description: "Full buffet for 100 guests", quantity: 100, pricePerUnit: "$25", totalPrice: "$2,500" },
    { service: "Beverage Package", description: "Drinks and coffee",          quantity: 100, pricePerUnit: "$5",  totalPrice: "$500"   },
  ],
  totalCost: "$3,000",
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ FIXED COMPONENT — React.FC<TemplatesProps> accepts the `templates` prop
// ─────────────────────────────────────────────────────────────────────────────
const Templates: React.FC<TemplatesProps> = ({ templates }) => {
  const [modalOpen,   setModalOpen]   = useState(false);
  const [modalType,   setModalType]   = useState<TemplateCategory | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialise from saved company templates if present, else "default"
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceTemplateType>(
    (templates?.invoiceTemplate as InvoiceTemplateType) ?? "default",
  );
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationTemplateType>(
    (templates?.quotationTemplate as QuotationTemplateType) ?? "default",
  );
  const [selectedRFQ, setSelectedRFQ] = useState<RFQTemplateType>(
    (templates?.rfqTemplate as RFQTemplateType) ?? "default",
  );

  const openGallery = (cat: TemplateCategory) => { setModalType(cat); setModalOpen(true); setPreviewMode(false); };
  const openPreview = (cat: TemplateCategory) => { setModalType(cat); setModalOpen(true); setPreviewMode(true);  };
  const closeModal  = ()                       => { setModalOpen(false); setModalType(null); setPreviewMode(false); };

  const renderCard = (components: Record<string, React.FC<any>>, id: string, data: any) => {
    const Comp = components[id];
    return Comp ? <Comp data={data} /> : null;
  };

  const invoiceLabel   = selectedInvoice   === "default" ? "Current Invoice"   : `Invoice Template ${selectedInvoice.replace("template", "")}`;
  const quotationLabel = selectedQuotation === "default" ? "Current Quotation" : `Quotation Template ${selectedQuotation.replace("quotation", "")}`;
  const rfqLabel       = selectedRFQ       === "default" ? "Current RFQ"       : `RFQ Template ${selectedRFQ.replace("rfq", "")}`;

  return (
    <div>
      <div className="flex mt-12 gap-9 justify-center flex-wrap">

        <TemplateCard title="Invoice" label={invoiceLabel} labelColor="bg-[#748B75]"
          onPreview={() => openPreview("invoice")} onUpdate={() => openGallery("invoice")}>
          {renderCard(invoiceComponents, selectedInvoice, previewInvoice)}
        </TemplateCard>

        <TemplateCard title="Quotation" label={quotationLabel} labelColor="bg-[#D4B5A0]"
          onPreview={() => openPreview("quotation")} onUpdate={() => openGallery("quotation")}>
          {renderCard(quotationComponents, selectedQuotation, previewQuotation)}
        </TemplateCard>

        <TemplateCard title="RFQ" label={rfqLabel} labelColor="bg-[#B2B1CF]"
          onPreview={() => openPreview("rfq")} onUpdate={() => openGallery("rfq")}>
          {renderCard(rfqComponents, selectedRFQ, previewRFQ)}
        </TemplateCard>

      </div>

      {modalOpen && modalType === "invoice" && (
        <InvoiceUploadModal
          isOpen={modalOpen} onClose={closeModal}
          data={previewInvoice as any}
          selectedTemplateId={selectedInvoice}
          setSelectedTemplateId={(id) => setSelectedInvoice(id as InvoiceTemplateType)}
          previewMode={previewMode}
        />
      )}

      {modalOpen && modalType === "quotation" && (
        <QuotationUploadModal
          isOpen={modalOpen} onClose={closeModal}
          data={previewQuotation}
          selectedTemplateId={selectedQuotation}
          setSelectedTemplateId={(id) => setSelectedQuotation(id as QuotationTemplateType)}
          previewMode={previewMode}
        />
      )}

      {modalOpen && modalType === "rfq" && (
        <RFQUploadModal
          isOpen={modalOpen} onClose={closeModal}
          data={previewRFQ}
          selectedTemplateId={selectedRFQ}
          setSelectedTemplateId={(id) => setSelectedRFQ(id as RFQTemplateType)}
          previewMode={previewMode}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable card wrapper
// ─────────────────────────────────────────────────────────────────────────────
interface TemplateCardProps {
  title: string;
  label: string;
  labelColor: string;
  onPreview: () => void;
  onUpdate: () => void;
  children: React.ReactNode;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  title, label, labelColor, onPreview, onUpdate, children,
}) => (
  <div className="flex flex-col items-center w-[280px] h-[480px] mx-4">
    <div className="text-base font-semibold mb-2 tracking-wide">{title}</div>
    <div
      onClick={onPreview}
      className="cursor-pointer bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-400 flex flex-col items-center flex-1 w-full"
    >
      <div className="w-full flex justify-center items-start p-3 overflow-hidden flex-1">
        <div className="w-full h-full flex justify-center items-start scale-[0.32] origin-top">
          {children}
        </div>
      </div>
      <div className={`text-white text-center w-full py-3 font-semibold text-sm ${labelColor}`}>
        {label}
      </div>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onUpdate(); }}
      className="mt-2 mb-3 px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
    >
      Update
    </button>
  </div>
);

export default Templates;