import React, { useMemo, useState, useCallback } from "react";
import {
  Package,
  RefreshCw,
  Check,
  X as XIcon,
  AlertTriangle,
} from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ItemSelect from "../../selects/itemGenriSelect";
import ExpandableDetailRow from "../../../components/common/ExpandableDetailRow";
import RowExpandToggle from "../../../components/common/RowExpandToggle";
import { useProcessImportModal } from "../../../hooks/inventory/Useprocessimportmodal";

interface ProcessImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
}

// YYYYMMDD -> "20 Nov 2023"
function formatApiDate(raw: string): string {
  if (!raw || raw.length !== 8) return "—";
  const year = raw.slice(0, 4);
  const month = Number(raw.slice(4, 6)) - 1;
  const day = raw.slice(6, 8);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${Number(day)} ${months[month] ?? ""} ${year}`;
}

const fmtNum = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PENDING_TABLE_COLSPAN = 9;

const ProcessImportModal: React.FC<ProcessImportModalProps> = ({
  isOpen,
  onClose,
  modalId,
}) => {
  const resolvedModalId = useMemo(
    () => modalId || `process-import-${Date.now()}`,
    [modalId],
  );

  const {
    items,
    totals,
    decisions,
    remarks,
    mappedItems,
    handleDecision,
    handleRemarkChange,
    handleMappedItemChange,
    approveAllRemaining,
    counts,
    isLoading,
    isSubmitting,
    error,
    refresh,
    submit,
  } = useProcessImportModal(isOpen);

  // ── expand + select state ──
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedRows((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  }, [items]);

  const bulkDecision = useCallback(
    (decision: "approve" | "reject") => {
      selectedRows.forEach((id) => handleDecision(id, decision));
      setSelectedRows(new Set());
    },
    [selectedRows, handleDecision],
  );

  const customSubtitle = (
    <div className="flex items-center justify-between w-full pr-8">
      <span className="text-muted text-sm">
        Review imported items and submit your decisions.
      </span>
      <div className="flex items-center gap-2 text-muted text-sm">
        <RefreshCw size={14} />
        <span>{totals.totalItems} items pending</span>
      </div>
    </div>
  );

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
          <span className="text-emerald-600">{counts.approved} approved</span>
          <span className="text-danger">{counts.rejected} rejected</span>
          <span className="text-amber-500">{counts.pending} pending</span>
        </div>
        <button
          onClick={submit}
          disabled={items.length === 0 || isSubmitting}
          className="px-6 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-md text-sm font-medium transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Decisions to ZRA"}
        </button>
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Process Import Declarations"
      icon={Package}
      footer={footerContent}
      maxWidth="full"
      height="700px"
    >
      <div className="h-full flex flex-col bg-app p-4 gap-4 overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-[13px]">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-card border border-theme rounded-xl flex flex-col shadow-sm flex-1 min-h-0">
          <div className="px-5 py-4 border-b border-theme bg-app/50 flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-main">
              Imported Items ({totals.totalItems})
            </h3>
            <div className="flex items-center gap-4">
              {selectedRows.size > 0 && (
                <>
                  <span className="text-[12px] text-muted">
                    {selectedRows.size} selected
                  </span>
                  <button
                    onClick={() => bulkDecision("approve")}
                    className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 hover:underline"
                  >
                    <Check size={12} /> Approve selected
                  </button>
                  <button
                    onClick={() => bulkDecision("reject")}
                    className="flex items-center gap-1 text-[12px] font-medium text-danger hover:underline"
                  >
                    <XIcon size={12} /> Reject selected
                  </button>
                </>
              )}
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-main transition-colors"
                disabled={isLoading}
              >
                <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={approveAllRemaining}
                className="text-[12px] font-medium text-primary hover:underline"
              >
                Approve all remaining
              </button>
            </div>
          </div>

          <div className="overflow-auto scrollbar-thin flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-theme text-[10px] text-muted font-semibold uppercase tracking-wider bg-app">
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedRows.size === items.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-2 py-3 w-8"></th>
                  <th className="px-3 py-3 w-10 text-center">#</th>
                  <th className="px-3 py-3 min-w-[180px]">Item Name</th>
                  <th className="px-3 py-3">HS Code</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right min-w-[120px]">Amount</th>
                  <th className="px-3 py-3 min-w-[220px]">Map to Existing Item</th>
                  <th className="px-5 py-3 text-center w-40">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-[12px]">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={PENDING_TABLE_COLSPAN}
                      className="px-5 py-8 text-center text-muted text-[12px]"
                    >
                      {isLoading
                        ? "Loading items..."
                        : "No items to display yet — this fills in once the API is connected."}
                    </td>
                  </tr>
                )}
                {items.map((item, index) => {
                  const isExpanded = expandedRows.has(item.id);
                  const isSelected = selectedRows.has(item.id);
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => toggleExpand(item.id)}
                        className={`hover:bg-app transition-colors cursor-pointer ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td
                          className="px-3 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <RowExpandToggle
                            isExpanded={isExpanded}
                            onToggle={() => toggleExpand(item.id)}
                          />
                        </td>
                        <td className="px-3 py-3 text-center text-muted text-[11px]">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 font-medium text-main">
                          {item.itemNm}
                        </td>
                        <td className="px-3 py-3 text-primary cursor-pointer hover:underline text-[11px]">
                          {item.hsCd}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-main text-right">
                          {item.qty.toLocaleString()} {item.qtyUnitCd}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-main text-right">
                          {item.currencyCd} {fmtNum(item.amount)}
                        </td>
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ItemSelect
                            value={mappedItems[item.id] ?? ""}
                            selectedId={mappedItems[item.id] ?? ""}
                            onChange={(selected) =>
                              handleMappedItemChange(item.id, selected.itemCode)
                            }
                            className="w-full"
                          />
                        </td>
                        <td
                          className="px-5 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDecision(item.id, "approve")}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                                decisions[item.id] === "approve"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "border-theme text-muted hover:bg-app"
                              }`}
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleDecision(item.id, "reject")}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                                decisions[item.id] === "reject"
                                  ? "bg-danger/10 border-danger/30 text-danger"
                                  : "border-theme text-muted hover:bg-app"
                              }`}
                            >
                              <XIcon size={12} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <ExpandableDetailRow
                          colSpan={PENDING_TABLE_COLSPAN}
                          fields={[
                            { label: "Declaration No", value: item.dclNo },
                            { label: "Declaration Ref", value: item.dclRefNum },
                            { label: "Declaration Date", value: formatApiDate(item.dclDe) },
                            { label: "Task Code", value: item.taskCd },
                            { label: "Status", value: item.statusCd },
                            { label: "Origin", value: item.orgnNatCd },
                            { label: "Export Nation", value: item.exptNatCd },
                            { label: "Weight", value: fmtNum(item.totWt) },
                            { label: "Net Weight", value: fmtNum(item.netWt) },
                            { label: "Package", value: `${item.pkg.toLocaleString()} ${item.pkgUnitCd}` },
                            { label: "Agent", value: item.agntNm },
                            { label: "Supplier", value: item.supplierNm },
                            { label: "Exchange Rate", value: fmtNum(item.exchangeRate) },
                          ]}
                        >
                          <div className="max-w-md">
                            <span className="text-muted block mb-1 text-[11px]">Remark</span>
                            <input
                              type="text"
                              value={remarks[item.id] ?? ""}
                              onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                              placeholder="Add a remark..."
                              className="w-full py-1.5 px-3 border border-theme rounded text-[11px] text-main bg-app focus:outline-none focus:border-primary"
                            />
                          </div>
                        </ExpandableDetailRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default ProcessImportModal;