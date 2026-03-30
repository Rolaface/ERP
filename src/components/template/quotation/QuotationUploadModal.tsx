import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QuotationDefaultTemplate from "../quotation/QuotationDefaultTemplate";
import QuotationTemplate2 from "../quotation/QuotationTemplate2";
import QuotationTemplate3 from "../quotation/QuotationTemplate3";

// ─── Shared QuotationData type ────────────────────────────────────────────────
// This is the ONE unified type used by Default, Template2, and Template3.
// All three templates use these field names — do NOT change them.
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

  // Company info (used by Template3)
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPostalCode?: string;

  // Billing address
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Shipping address (used by Template3)
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  // Bank info (used by Template3 T&C section)
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

// ─── Template registry ────────────────────────────────────────────────────────
// "quotation1" intentionally reuses DefaultTemplate because QuotationTemplate1
// is a PDF-only generator (jsPDF), not a React component.
const templates = [
  { id: "default",    name: "Current Quotation",     color: "bg-gray-600"   },
  { id: "quotation1", name: "Quotation Template 1",  color: "bg-[#748B75]"  },
  { id: "quotation2", name: "Quotation Template 2",  color: "bg-[#D4B5A0]"  },
  { id: "quotation3", name: "Quotation Template 3",  color: "bg-[#B2B1CF]"  },
];

const templateComponents: Record<string, React.FC<{ data: QuotationData; companyLogoUrl?: string }>> = {
  default:    QuotationDefaultTemplate,
  quotation1: QuotationDefaultTemplate, // Template1 is PDF-only — fallback to Default
  quotation2: QuotationTemplate2,
  quotation3: QuotationTemplate3,
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface QuotationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: QuotationData;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  companyLogoUrl?: string;
  previewMode?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
const QuotationUploadModal: React.FC<QuotationUploadModalProps> = ({
  isOpen,
  onClose,
  data,
  selectedTemplateId,
  setSelectedTemplateId,
  companyLogoUrl,
  previewMode = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleScroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: dir === "left" ? 0 : scrollRef.current.scrollWidth,
      behavior: "smooth",
    });
  };

  // ── Preview mode: show selected template full-size ──────────────────────────
  if (previewMode) {
    const SelectedComponent = templateComponents[selectedTemplateId];
    return (
      <div
        className="fixed inset-0 z-50 flex justify-center items-center p-4"
        style={{ background: "rgba(0,0,0,0.7)" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-8 py-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-2xl font-bold">Quotation Preview</h2>
            <button
              onClick={onClose}
              className="text-2xl p-1 rounded hover:bg-gray-200 transition text-gray-500"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8 bg-gray-100">
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
              {SelectedComponent && (
                <SelectedComponent data={data} companyLogoUrl={companyLogoUrl} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Selection mode: scrollable template gallery ─────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center p-4"
      style={{ background: "rgba(255,255,255,0.85)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-2xl font-bold">Update Quotation Template</h2>
          <button
            onClick={onClose}
            className="text-2xl p-1 rounded hover:bg-gray-200 transition text-gray-500"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="relative flex items-center flex-1 min-h-0 py-8">
          {/* Left arrow */}
          <button
            className="absolute left-2 z-10 top-1/2 -translate-y-1/2 bg-white rounded-full shadow border p-2 hover:bg-gray-100"
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft size={34} />
          </button>

          {/* Scrollable template row */}
          <div
            ref={scrollRef}
            className="overflow-x-auto flex-1 hide-scrollbar"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="flex min-w-max">
              {templates.map((template, idx) => {
                const Comp = templateComponents[template.id];
                const isSelected = selectedTemplateId === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    onDoubleClick={() => {
                      setSelectedTemplateId(template.id);
                      onClose();
                    }}
                    className={[
                      "bg-white rounded-lg shadow-xl overflow-hidden flex flex-col items-center",
                      "w-[370px] max-w-[370px] min-w-[340px] border-2 cursor-pointer transition",
                      "hover:shadow-2xl hover:scale-[1.02]",
                      isSelected
                        ? "border-blue-700 ring-2 ring-blue-400"
                        : "border-gray-300",
                      idx < templates.length - 1 ? "mr-8" : "",
                    ].join(" ")}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedTemplateId(template.id);
                    }}
                  >
                    {/* Scaled preview */}
                    <div className="w-full h-[370px] flex justify-center items-start p-2 overflow-hidden bg-gray-50">
                      <div className="w-[580px] h-[1050px] flex justify-center items-start scale-[0.36] origin-top">
                        {Comp && <Comp data={data} companyLogoUrl={companyLogoUrl} />}
                      </div>
                    </div>

                    {/* Label bar */}
                    <div className={`text-white text-center w-full py-2 font-semibold text-base ${template.color}`}>
                      {template.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right arrow */}
          <button
            className="absolute right-2 z-10 top-1/2 -translate-y-1/2 bg-white rounded-full shadow border p-2 hover:bg-gray-100"
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight size={34} />
          </button>
        </div>

        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        `}</style>
      </div>
    </div>
  );
};

export default QuotationUploadModal;