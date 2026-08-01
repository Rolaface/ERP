import React, { useState, useMemo } from "react";
import { 
  Package, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  X as XIcon, 
  ChevronDown 
} from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../common/ModalFooter"; // Assuming you might use this or a custom footer

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
}

// Dummy data for the UI
const SIDEBAR_DECLARATIONS = [
  { id: "C3460-2019-TZDL", date: "20 Nov 2023", items: 3, supplier: "ODERICH CONSERVA QUALIDADE BRASIL" },
  { id: "C3461-2019-TZDL", date: "20 Nov 2023", items: 7, supplier: "ABC TRADERS LTD" },
  { id: "C3462-2019-TZDL", date: "19 Nov 2023", items: 5, supplier: "ZAM IMPORTS CO." },
  { id: "C3463-2019-TZDL", date: "18 Nov 2023", items: 4, supplier: "GLOBAL SUPPLIES ZM" },
  { id: "C3464-2019-TZDL", date: "17 Nov 2023", items: 6, supplier: "AFRICA MERCHANTS LTD" },
];

// ─── Component ────────────────────────────────────────────────────────────────

const ProcessImportModal: React.FC<ProcessImportModalProps> = ({
  isOpen,
  onClose,
  modalId,
}) => {
  const resolvedModalId = useMemo(
    () => modalId || `process-import-${Date.now()}`,
    [modalId]
  );

  const [activeDeclaration, setActiveDeclaration] = useState(SIDEBAR_DECLARATIONS[0].id);
  const [decisions, setDecisions] = useState<Record<number, "approve" | "reject" | null>>({});

  const handleDecision = (itemId: number, type: "approve" | "reject") => {
    setDecisions((prev) => ({ ...prev, [itemId]: type }));
  };

  const approvedCount = Object.values(decisions).filter((d) => d === "approve").length;
  const rejectedCount = Object.values(decisions).filter((d) => d === "reject").length;
  const pendingCount = 3 - approvedCount - rejectedCount; // Hardcoded 3 for demo purposes

  // ─── Custom Header Subtitle ──────────────────────────────────────────────────

  const customSubtitle = (
    <div className="flex items-center justify-between w-full pr-8">
      <span className="text-muted text-sm">
        Select a declaration to review its items and submit your decisions.
      </span>
      <div className="flex items-center gap-2 text-muted text-sm">
        <RefreshCw size={14} />
        <span>Last refreshed: 30 Jul 2026, 14:32</span>
      </div>
    </div>
  );

  // ─── Footer ──────────────────────────────────────────────────────────────────

  const footerContent = (
    <div className="flex items-center justify-between w-full px-6 py-4 bg-card border-t border-theme">
      <button 
        onClick={onClose} 
        className="px-5 py-2 border border-theme text-main bg-app rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
      >
        Cancel
      </button>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-emerald-600">{approvedCount} approved</span>
          <span className="text-danger">{rejectedCount} rejected</span>
          <span className="text-amber-500">{pendingCount} pending</span>
        </div>
        <button className="px-6 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-md text-sm font-medium transition-opacity shadow-sm">
          Submit Decisions to ZRA
        </button>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Process Import Declarations"
      subtitle={customSubtitle}
      icon={Package}
      footer={footerContent}
      maxWidth="full"
      height="700px"
    >
      <div className="h-full flex bg-app p-4 gap-4 overflow-hidden">
        
        {/* ──────────── LEFT SIDEBAR ──────────── */}
        <div className="w-[320px] bg-card border border-theme rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-theme bg-app/50">
            <h3 className="text-[13px] font-semibold text-main">Pending Declarations</h3>
            <button className="text-muted hover:text-main transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-theme">
            {SIDEBAR_DECLARATIONS.map((decl) => {
              const isActive = activeDeclaration === decl.id;
              return (
                <div 
                  key={decl.id}
                  onClick={() => setActiveDeclaration(decl.id)}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${
                    isActive 
                      ? "bg-primary/5 border-l-2 border-primary" 
                      : "hover:bg-app border-l-2 border-transparent"
                  }`}
                >
                  <input 
                    type="radio" 
                    checked={isActive}
                    readOnly
                    className="mt-1 w-4 h-4 text-primary border-theme focus:ring-primary bg-card"
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className={`text-[13px] font-semibold truncate ${isActive ? "text-primary" : "text-main"}`}>
                      {decl.id}
                    </span>
                    <div className="text-[11px] text-muted flex items-center gap-1.5">
                      <span>{decl.date}</span>
                      <span>•</span>
                      <span>{decl.items} Items</span>
                    </div>
                    <span className="text-[11px] text-muted truncate w-full" title={decl.supplier}>
                      {decl.supplier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-theme bg-app flex items-center gap-2 text-xs text-muted">
            <RefreshCw size={14} className="opacity-70" />
            <span>5 declarations pending</span>
          </div>
        </div>

        {/* ──────────── RIGHT MAIN CONTENT ──────────── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
          
          {/* ── Declaration Information Card ── */}
          <div className="bg-card border border-theme rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5 border-b border-theme pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold text-main">Declaration Information</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded uppercase tracking-wide">
                  Pending Review
                </span>
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline transition-colors">
                View Full Details <ExternalLink size={14} />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-y-5 gap-x-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">Declaration Ref</span>
                <span className="text-[13px] font-semibold text-main">C3460-2019-TZDL</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">Declaration Date</span>
                <span className="text-[13px] font-semibold text-main">20 Nov 2023</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">Task Code</span>
                <span className="text-[13px] font-semibold text-main">2239078</span>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[11px] text-muted uppercase tracking-wider">Supplier</span>
                <span className="text-[13px] font-semibold text-main truncate">ODERICH CONSERVA QUALIDADE BRASIL</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">DCL Date (DCLDE)</span>
                <span className="text-[13px] font-semibold text-main">-1</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">Agent</span>
                <span className="text-[13px] font-semibold text-main">BN METRO Ltd</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">Total Items</span>
                <span className="text-[13px] font-semibold text-main">3</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">Total Weight (KGM)</span>
                <span className="text-[13px] font-semibold text-main">34,893.57</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted uppercase tracking-wider">Package Count</span>
                <span className="text-[13px] font-semibold text-main">5,222</span>
              </div>
            </div>
          </div>

          {/* ── Imported Items Table Card ── */}
          <div className="bg-card border border-theme rounded-xl flex flex-col shadow-sm flex-1 min-h-0">
            <div className="px-5 py-4 border-b border-theme bg-app/50 flex justify-between items-center">
              <h3 className="text-[13px] font-semibold text-main">Imported Items (3)</h3>
              <button className="text-[12px] font-medium text-primary hover:underline">
                Approve all remaining
              </button>
            </div>
            
            <div className="overflow-auto scrollbar-thin">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-theme text-[10px] text-muted font-semibold uppercase tracking-wider bg-app">
                    <th className="px-5 py-3 w-12 text-center">#</th>
                    <th className="px-3 py-3 min-w-[140px]">Item Name</th>
                    <th className="px-3 py-3">HS Code</th>
                    <th className="px-3 py-3 text-right">Qty</th>
                    <th className="px-3 py-3 text-center">Unit</th>
                    <th className="px-3 py-3 text-right">Weight (KGM)</th>
                    <th className="px-3 py-3 text-right">Pkg</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3 min-w-[200px]">Map to Existing Item</th>
                    <th className="px-5 py-3 text-center w-40">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme text-[12px]">
                  
                  {/* Item 1 */}
                  <tr className="hover:bg-app transition-colors">
                    <td className="px-5 py-3 text-center text-muted text-[11px]">1</td>
                    <td className="px-3 py-3 font-medium text-main">BAKED BEANS</td>
                    <td className="px-3 py-3 text-primary cursor-pointer hover:underline text-[11px]">20055900000</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">19,946</td>
                    <td className="px-3 py-3 text-muted text-center text-[11px]">KGM</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">19,945.57</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">2,922</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">$296,865.60</td>
                    <td className="px-3 py-3">
                      <div className="relative">
                        <select className="w-full py-1.5 pl-3 pr-8 border border-theme rounded text-[11px] text-main bg-app appearance-none focus:outline-none focus:border-primary">
                          <option>BEAN-001 - Baked Beans 400g</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleDecision(1, "approve")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                            decisions[1] === "approve" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-theme text-muted hover:bg-app"
                          }`}
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button 
                          onClick={() => handleDecision(1, "reject")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                            decisions[1] === "reject" ? "bg-danger/10 border-danger/30 text-danger" : "border-theme text-muted hover:bg-app"
                          }`}
                        >
                          <XIcon size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Item 2 */}
                  <tr className="hover:bg-app transition-colors">
                    <td className="px-5 py-3 text-center text-muted text-[11px]">2</td>
                    <td className="px-3 py-3 font-medium text-main">TOMATO SAUCE</td>
                    <td className="px-3 py-3 text-primary cursor-pointer hover:underline text-[11px]">21032000000</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">10,000</td>
                    <td className="px-3 py-3 text-muted text-center text-[11px]">KGM</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">9,950.00</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">1,500</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">$150,000.00</td>
                    <td className="px-3 py-3">
                      <div className="relative">
                        <select className="w-full py-1.5 pl-3 pr-8 border border-theme rounded text-[11px] text-main bg-app appearance-none focus:outline-none focus:border-primary">
                          <option>TMS-002 - Tomato Sauce 500ml</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleDecision(2, "approve")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                            decisions[2] === "approve" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-theme text-muted hover:bg-app"
                          }`}
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button 
                          onClick={() => handleDecision(2, "reject")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                            decisions[2] === "reject" ? "bg-danger/10 border-danger/30 text-danger" : "border-theme text-muted hover:bg-app"
                          }`}
                        >
                          <XIcon size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Item 3 */}
                  <tr className="hover:bg-app transition-colors">
                    <td className="px-5 py-3 text-center text-muted text-[11px]">3</td>
                    <td className="px-3 py-3 font-medium text-main">SUGAR</td>
                    <td className="px-3 py-3 text-primary cursor-pointer hover:underline text-[11px]">17019900000</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">5,000</td>
                    <td className="px-3 py-3 text-muted text-center text-[11px]">KGM</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">4,998.00</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">800</td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">$75,000.00</td>
                    <td className="px-3 py-3">
                      <div className="relative">
                        <select className="w-full py-1.5 pl-3 pr-8 border border-theme rounded text-[11px] text-main bg-app appearance-none focus:outline-none focus:border-primary">
                          <option>SUG-001 - Sugar 50kg</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleDecision(3, "approve")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                            decisions[3] === "approve" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-theme text-muted hover:bg-app"
                          }`}
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button 
                          onClick={() => handleDecision(3, "reject")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                            decisions[3] === "reject" ? "bg-danger/10 border-danger/30 text-danger" : "border-theme text-muted hover:bg-app"
                          }`}
                        >
                          <XIcon size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </MinimizableModal>
  );
};

export default ProcessImportModal;