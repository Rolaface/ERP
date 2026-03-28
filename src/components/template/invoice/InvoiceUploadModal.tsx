import React, { useRef } from "react";
import InvoiceDefaultTemplate from "../invoice/InvoiceDefaultTemplate";
// ❌ InvoiceTemplate1 is NOT a React component — it's a PDF generator (generateInvoicePDF).
//    It cannot be rendered as <Comp data={data} />. Keeping it out of templateComponents.
import InvoiceTemplate2 from "../invoice/InvoiceTemplate2";
import InvoiceTemplate3 from "../invoice/InvoiceTemplate3";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ✅ FIX: InvoiceData lives in InvoiceDefaultTemplate, NOT in "../../../types/invoice"
import type { InvoiceData } from "../invoice/InvoiceDefaultTemplate";

// ── Template list ────────────────────────────────────────────────────────────
// template1 is intentionally excluded — it generates a PDF, not a preview card
const templates = [
  { id: "default",   name: "Current Invoice",    color: "bg-gray-600"  },
  { id: "template2", name: "Invoice Template 2", color: "bg-[#D4B5A0]" },
  { id: "template3", name: "Invoice Template 3", color: "bg-[#B2B1CF]" },
];

const templateComponents: { [key: string]: React.FC<{ data: InvoiceData }> } = {
  default:   InvoiceDefaultTemplate,
  // template1 omitted — it's a jsPDF generator, not a renderable React component
  template2: InvoiceTemplate2,
  template3: InvoiceTemplate3,
};

// ── Props ────────────────────────────────────────────────────────────────────
interface InvoiceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  previewMode?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({
  isOpen,
  onClose,
  data,
  selectedTemplateId,
  setSelectedTemplateId,
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

  // ── Preview Mode ────────────────────────────────────────────────────────────
  if (previewMode) {
    const SelectedComponent = templateComponents[selectedTemplateId];
    return (
      <div
        className="fixed inset-0 z-50 flex justify-center items-center p-4"
        style={{ background: "rgba(0,0,0,0.7)" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between px-8 py-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-2xl font-bold">Invoice Preview</h2>
            <button
              onClick={onClose}
              className="ml-2 text-2xl p-1 rounded hover:bg-gray-200 transition text-gray-500"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8 bg-gray-100">
            <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
              {SelectedComponent && <SelectedComponent data={data} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Selection Mode ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center p-4"
      style={{ background: "rgba(255,255,255,0.85)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between px-8 py-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-2xl font-bold">Update Invoice Template</h2>
          <button
            onClick={onClose}
            className="ml-2 text-2xl p-1 rounded hover:bg-gray-200 transition text-gray-500"
          >
            ×
          </button>
        </div>

        <div className="relative flex items-center flex-1 min-h-0 py-8">
          {/* Left Arrow */}
          <button
            className="absolute left-2 z-10 top-1/2 -translate-y-1/2 bg-white rounded-full shadow border p-2 hover:bg-gray-100"
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft size={34} />
          </button>

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="overflow-x-auto flex-1 hide-scrollbar"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="flex min-w-max">
              {templates.map((template, idx) => {
                const Comp = templateComponents[template.id];
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    onDoubleClick={() => {
                      setSelectedTemplateId(template.id);
                      onClose();
                    }}
                    className={`bg-white rounded-lg shadow-xl overflow-hidden flex flex-col items-center w-[370px] max-w-[370px] min-w-[340px] border-2 cursor-pointer transition hover:shadow-2xl hover:scale-[1.02] ${
                      selectedTemplateId === template.id
                        ? "border-blue-700 ring-2 ring-blue-400"
                        : "border-gray-300"
                    } ${idx < templates.length - 1 ? "mr-8" : ""}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedTemplateId === template.id}
                  >
                    <div className="w-full h-[370px] flex justify-center items-start p-2 overflow-hidden bg-gray-50">
                      <div className="w-[580px] h-[1050px] flex justify-center items-start scale-[0.36] origin-top">
                        {Comp && <Comp data={data} />}
                      </div>
                    </div>
                    <div className={`text-white text-center w-full py-2 font-semibold text-base ${template.color}`}>
                      {template.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            className="absolute right-2 z-10 top-1/2 -translate-y-1/2 bg-white rounded-full shadow border p-2 hover:bg-gray-100"
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight size={34} />
          </button>
        </div>

        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none }
          .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none }
        `}</style>
      </div>
    </div>
  );
};

export default InvoiceUploadModal;