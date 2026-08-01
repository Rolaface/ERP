import React, { useMemo ,useState,useCallback} from "react";
import {
  Package,
  RefreshCw,
  Check,
  X as XIcon,
  AlertTriangle,
} from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ItemSelect from "../../selects/ItemSelect";
import { useProcessImportModal } from "../../../hooks/inventory/Useprocessimportmodal";
import { getAllItems } from "../../../api/itemApi";



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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${Number(day)} ${months[month] ?? ""} ${year}`;
}

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

  const [erpItems, setErpItems] = useState<
  { value: string; label: string }[]
>([]);

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
  const loadErpItems = useCallback(async () => {
  try {
    const res = await getAllItems(1, 1000);

    const list = Array.isArray(res?.data?.data)
      ? res.data.data
      : [];

    setErpItems(
      list.map((item: any) => ({
        value: item.id,
        label: `${item.id} - ${item.itemName}`,
      }))
    );
  } catch (err) {
    console.error(err);
  }
}, []);

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

        {/* ── Imported Items Table Card ── */}
        <div className="bg-card border border-theme rounded-xl flex flex-col shadow-sm flex-1 min-h-0">
          <div className="px-5 py-4 border-b border-theme bg-app/50 flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-main">
              Imported Items ({totals.totalItems})
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-main transition-colors"
                disabled={isLoading}
              >
                <RefreshCw
                  size={13}
                  className={isLoading ? "animate-spin" : ""}
                />
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
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-theme text-[10px] text-muted font-semibold uppercase tracking-wider bg-app">
                  <th className="px-5 py-3 w-12 text-center">#</th>
                  <th className="px-3 py-3">Declaration No</th>
                  <th className="px-3 py-3">Declaration Ref</th>
                  <th className="px-3 py-3">Declaration Date</th>
                  <th className="px-3 py-3 min-w-[140px]">Item Name</th>
                  <th className="px-3 py-3">HS Code</th>
                  <th className="px-3 py-3">Task Code</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Origin</th>
                  <th className="px-3 py-3">Export Nation</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-center">Unit</th>
                  <th className="px-3 py-3 text-right">Weight</th>
                  <th className="px-3 py-3 text-right">Net Weight</th>
                  <th className="px-3 py-3 text-right">Pkg</th>
                  <th className="px-3 py-3 text-center">Pkg Unit</th>
                  <th className="px-3 py-3 min-w-[160px]">Agent</th>
                  <th className="px-3 py-3 min-w-[160px]">Supplier</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 text-right">Exch. Rate</th>
                  <th className="px-3 py-3 min-w-[200px]">
                    Map to Existing Item
                  </th>
                  <th className="px-3 py-3 min-w-[160px]">Remark</th>
                  <th className="px-5 py-3 text-center w-40">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-[12px]">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={22}
                      className="px-5 py-8 text-center text-muted text-[12px]"
                    >
                      {isLoading
                        ? "Loading items..."
                        : "No items to display yet — this fills in once the API is connected."}
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-app transition-colors">
                    <td className="px-5 py-3 text-center text-muted text-[11px]">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3 text-main text-[11px]">
                      {item.dclNo}
                    </td>
                    <td className="px-3 py-3 text-muted text-[11px]">
                      {item.dclRefNum ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-muted text-[11px]">
                      {formatApiDate(item.dclDe)}
                    </td>
                    <td className="px-3 py-3 font-medium text-main">
                      {item.itemNm}
                    </td>
                    <td className="px-3 py-3 text-primary cursor-pointer hover:underline text-[11px]">
                      {item.hsCd}
                    </td>
                    <td className="px-3 py-3 text-muted text-[11px]">
                      {item.taskCd}
                    </td>
                    <td className="px-3 py-3 text-muted text-center text-[11px]">
                      {item.statusCd}
                    </td>
                    <td className="px-3 py-3 text-muted text-[11px]">
                      {item.orgnNatCd}
                    </td>
                    <td className="px-3 py-3 text-muted text-[11px]">
                      {item.exptNatCd}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">
                      {item.qty.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-muted text-center text-[11px]">
                      {item.qtyUnitCd}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">
                      {item.totWt.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">
                      {item.netWt.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">
                      {item.pkg.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-muted text-center text-[11px]">
                      {item.pkgUnitCd}
                    </td>
                    <td className="px-3 py-3 text-muted text-[11px] truncate">
                      {item.agntNm}
                    </td>
                    <td className="px-3 py-3 text-muted text-[11px] truncate">
                      {item.supplierNm ?? "—"}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-main text-right">
                      {item.currencyCd}{" "}
                      {item.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-muted text-right text-[11px]">
                      {item.exchangeRate.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <ItemSelect
                        value={mappedItems[item.id] ?? ""}
                        onChange={(selected) => {
                          handleMappedItemChange(item.id, selected.itemCode);
                        }}
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={remarks[item.id] ?? ""}
                        onChange={(e) =>
                          handleRemarkChange(item.id, e.target.value)
                        }
                        placeholder="Add a remark..."
                        className="w-full py-1.5 px-3 border border-theme rounded text-[11px] text-main bg-app focus:outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-5 py-3">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default ProcessImportModal;
