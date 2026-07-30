import React, { useMemo, useState } from "react";
import { File, User, Mail, Phone } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportedItemModalProps {
  isOpen?: boolean;
  onClose: () => void;
  declarationId?: string;
  modalId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ImportedItemModal: React.FC<ImportedItemModalProps> = ({
  isOpen = true,
  onClose,
  declarationId = "C3460-2019-TZDL",
  modalId,
}) => {
  const resolvedModalId = useMemo(
    () => modalId || `imported-item-${declarationId}-${Date.now()}`,
    [modalId, declarationId]
  );

  const [selectedItems, setSelectedItems] = useState<number[]>([1]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems([1, 2, 3]);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ─── Footer ──────────────────────────────────────────────────────────────────

  const customFooter = (
    <div className="flex items-center justify-between w-full px-4 py-2.5 bg-app border-t border-theme">
      <button 
        onClick={onClose}
        className="px-4 py-1.5 border border-theme text-main bg-card rounded text-[11px] font-medium hover:bg-app transition-colors"
      >
        Cancel
      </button>
      
      <div className="flex items-center gap-4">
        <span className="text-[11px] font-semibold text-main">
          {selectedItems.length} items selected
        </span>
        <button className="px-5 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded text-[11px] font-medium transition-colors">
          Submit Decisions
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
      title="Declaration Details"
      subtitle={
        <div className="flex items-center gap-2">
          <span className="text-xs">Declaration No: {declarationId}</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-200 text-amber-900 rounded uppercase tracking-wider">
            Pending
          </span>
        </div>
      }
      icon={File}
      footer={customFooter}
      maxWidth="full"
      height="85vh"
    >
      <div className="h-full flex flex-col bg-[#f8fafc] overflow-y-auto p-3 sm:p-4">
        
        {/* ── Main Layout: Table on Left, Sidebar on Right ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4 items-start">
          
          {/* ──────────── LEFT COLUMN: ITEMS TABLE ──────────── */}
          <div className="bg-card border border-theme rounded-md flex flex-col shadow-sm min-w-0">
            <div className="px-4 py-2.5 border-b border-theme flex justify-between items-center">
              <h3 className="text-[12px] font-semibold text-main">Imported Items (3)</h3>
            </div>
            
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-[10px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-theme uppercase tracking-wider text-[9px] text-muted bg-app/50">
                    <th className="px-2 py-2 w-8 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6] w-3 h-3"
                        checked={selectedItems.length === 3}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-2 py-2 text-center">#</th>
                    <th className="px-2 py-2">Item Name</th>
                    <th className="px-2 py-2">HS Code</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-center">Unit</th>
                    <th className="px-2 py-2 text-right">Weight (KGM)</th>
                    <th className="px-2 py-2 text-right">Pkg</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-center">Org/Exp</th>
                    <th className="px-2 py-2 min-w-[160px]">Map To Existing Item</th>
                    <th className="px-2 py-2 min-w-[100px] text-center">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  
                  {/* Item 1 */}
                  <tr className="hover:bg-app/50 transition-colors group">
                    <td className="px-2 py-1.5 text-center">
                       <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6] w-3 h-3"
                        checked={selectedItems.includes(1)}
                        onChange={() => handleSelectItem(1)}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-muted text-center">1</td>
                    <td className="px-2 py-1.5 font-medium text-main truncate max-w-[120px]" title="BAKED BEANS">BAKED BEANS</td>
                    <td className="px-2 py-1.5 text-[#3b82f6] font-medium cursor-pointer hover:underline">20055900000</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">19,946</td>
                    <td className="px-2 py-1.5 text-muted text-center">KGM</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">19,945.57</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">2,922</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">
                      $296,865.60
                    </td>
                    <td className="px-2 py-1.5 text-muted text-center">BR / BR</td>
                    <td className="px-2 py-1.5">
                      <select className="w-full py-1 px-1.5 border border-theme rounded text-[10px] text-main bg-card focus:outline-none focus:border-[#3b82f6]">
                        <option>BEAN-001 - Baked Beans 400g</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select className="w-full py-1 px-1.5 border border-theme rounded text-[10px] text-main bg-card focus:outline-none focus:border-[#3b82f6]">
                        <option value="pending">Pending</option>
                        <option value="approve">Approve</option>
                        <option value="reject">Reject</option>
                      </select>
                    </td>
                  </tr>

                  {/* Item 2 */}
                  <tr className="hover:bg-app/50 transition-colors group">
                    <td className="px-2 py-1.5 text-center">
                       <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6] w-3 h-3"
                        checked={selectedItems.includes(2)}
                        onChange={() => handleSelectItem(2)}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-muted text-center">2</td>
                    <td className="px-2 py-1.5 font-medium text-main truncate max-w-[120px]" title="TOMATO SAUCE">TOMATO SAUCE</td>
                    <td className="px-2 py-1.5 text-[#3b82f6] font-medium cursor-pointer hover:underline">21032000000</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">10,000</td>
                    <td className="px-2 py-1.5 text-muted text-center">KGM</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">9,950.00</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">1,500</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">
                      $150,000.00
                    </td>
                    <td className="px-2 py-1.5 text-muted text-center">BR / BR</td>
                    <td className="px-2 py-1.5">
                      <select className="w-full py-1 px-1.5 border border-theme rounded text-[10px] text-main bg-card focus:outline-none focus:border-[#3b82f6]">
                        <option>TMS-002 - Tomato Sauce 500ml</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                       <select className="w-full py-1 px-1.5 border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium rounded text-[10px] focus:outline-none">
                        <option value="approve">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="reject">Reject</option>
                      </select>
                    </td>
                  </tr>

                  {/* Item 3 */}
                  <tr className="hover:bg-app/50 transition-colors group">
                    <td className="px-2 py-1.5 text-center">
                       <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6] w-3 h-3"
                        checked={selectedItems.includes(3)}
                        onChange={() => handleSelectItem(3)}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-muted text-center">3</td>
                    <td className="px-2 py-1.5 font-medium text-main truncate max-w-[120px]" title="SUGAR">SUGAR</td>
                    <td className="px-2 py-1.5 text-[#3b82f6] font-medium cursor-pointer hover:underline">17019900000</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">5,000</td>
                    <td className="px-2 py-1.5 text-muted text-center">KGM</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">4,998.00</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">800</td>
                    <td className="px-2 py-1.5 tabular-nums text-main text-right">
                      $75,000.00
                    </td>
                    <td className="px-2 py-1.5 text-muted text-center">BR / BR</td>
                    <td className="px-2 py-1.5">
                      <select className="w-full py-1 px-1.5 border border-theme rounded text-[10px] text-main bg-card focus:outline-none focus:border-[#3b82f6]">
                        <option>SUG-001 - Sugar 50kg</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select className="w-full py-1 px-1.5 border border-danger/30 bg-danger/10 text-danger font-medium rounded text-[10px] focus:outline-none">
                        <option value="reject">Rejected</option>
                        <option value="approve">Approve</option>
                        <option value="pending">Pending</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ──────────── RIGHT COLUMN: SIDEBAR PANELS ──────────── */}
          <div className="flex flex-col gap-4 xl:sticky xl:top-0">
            
            {/* Declaration Info Card */}
            <div className="bg-card border border-theme rounded-md p-4 shadow-sm">
              <h3 className="text-[11px] font-semibold text-main mb-3 border-b border-theme pb-1.5">
                Declaration Information
              </h3>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-muted uppercase tracking-wider font-medium">Task Code</span>
                  <span className="text-[10px] font-semibold text-main">2239078</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-muted uppercase tracking-wider font-medium">Dcl Date (DclDe)</span>
                  <span className="text-[10px] font-semibold text-main">-1</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-[9px] text-muted uppercase tracking-wider font-medium">Supplier</span>
                  <span className="text-[10px] font-semibold text-main truncate w-full" title="ODERICH CONSERVA QUALIDADE BRASIL">
                    ODERICH CONSERVA QUALIDADE ...
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] text-muted uppercase tracking-wider font-medium">Exchange Rate</span>
                  <span className="text-[10px] font-semibold text-main tabular-nums">929.79</span>
                </div>
              </div>
            </div>

            {/* Agent Details Card */}
            <div className="bg-card border border-theme rounded-md p-4 shadow-sm">
              <h3 className="text-[11px] font-semibold text-main mb-3 border-b border-theme pb-1.5">
                Agent Details
              </h3>
              <div className="flex flex-col gap-2 text-[10px]">
                <div className="flex items-center gap-2.5">
                  <User size={12} className="text-muted shrink-0" />
                  <span className="font-medium text-main">BN METRO Ltd</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted">
                  <Mail size={12} className="shrink-0" />
                  <span>—</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted">
                  <Phone size={12} className="shrink-0" />
                  <span>—</span>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-card border border-theme rounded-md p-4 shadow-sm">
              <h3 className="text-[11px] font-semibold text-main mb-3 border-b border-theme pb-1.5">
                Summary
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted">Total Items</span>
                  <span className="font-bold text-main tabular-nums">3</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted">Total Weight</span>
                  <span className="font-bold text-main tabular-nums">34,893.57 KGM</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted">Package Count</span>
                  <span className="font-bold text-main tabular-nums">5,222</span>
                </div>
                <div className="flex justify-between items-center text-[10px] border-t border-theme pt-2 mt-1">
                  <span className="text-muted font-medium">Total Amount</span>
                  <span className="font-bold text-main tabular-nums">$521,865.60</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default ImportedItemModal;