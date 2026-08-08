import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Package,
  RefreshCw,
  Check,
  X as XIcon,
} from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ItemSelect from "../../selects/itemGenriSelect";
import WarehouseSelect from "../../selects/WarehouseSelect";
import ExpandableDetailRow from "../../../components/common/ExpandableDetailRow";
import RowExpandToggle from "../../../components/common/RowExpandToggle";
import { useProcessImportModal } from "../../../hooks/inventory/Useprocessimportmodal";
import SupplierSelect from "../../selects/procurement/SupplierSelect";
import { getSuppliers } from "../../../api/procurement/supplierApi";

interface ProcessImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;

  onSuccess?: () => void;
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

const fmtNum = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PENDING_TABLE_COLSPAN = 11;

// getSuppliers() returns resp.data directly (the whole backend body), which
// looks like: { status, message, data: { data: Supplier[], pagination: {...} } }
// This pulls the actual array out regardless of which shape shows up.
function extractSupplierList(res: any): any[] {
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

type SupplierFilterResult = {
  id: string;
  name: string;
};

const ProcessImportModal: React.FC<ProcessImportModalProps> = ({
  isOpen,
  onClose,
  modalId,
  onSuccess,
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
    warehouses,
    suppliers,
    handleWarehouseChange,
    handleDecision,
    handleRemarkChange,
    handleMappedItemChange,
    handleSupplierChange,
    approveAllRemaining,
    counts,
    isLoading,
    isSubmitting,
    refresh,
    submit,
  } = useProcessImportModal(isOpen);

  // ── expand + select state ──
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // ── supplier filter ──
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [supplierFilterName, setSupplierFilterName] = useState<string>("");


const [filterResults, setFilterResults] = useState<SupplierFilterResult[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterRequestIdRef = useRef(0);

  const fetchFilterSuppliers = useCallback(async (searchTerm: string) => {
    const requestId = ++filterRequestIdRef.current;
    try {
      setFilterLoading(true);
      const res = await getSuppliers(1, 20, { search: searchTerm });
      const raw = extractSupplierList(res);
      if (requestId !== filterRequestIdRef.current) return;
      setFilterResults(raw.map((s: any) => ({ id: s.id, name: s.name })));
    } catch (err) {
      console.error("Failed to search suppliers for filter", err);
      if (requestId === filterRequestIdRef.current) setFilterResults([]);
    } finally {
      if (requestId === filterRequestIdRef.current) setFilterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      fetchFilterSuppliers(filterSearch);
    }, 300);
    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, [filterSearch, filterOpen, fetchFilterSuppliers]);

  const handleFilterFocus = () => {
    setFilterOpen(true);
    fetchFilterSuppliers(filterSearch);
  };

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterContainerRef.current?.contains(e.target as Node)) return;
      setFilterOpen(false);
      setFilterSearch(supplierFilterName);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen, supplierFilterName]);

  const handleFilterSelect = (s: { id: string; name: string }) => {
    setSupplierFilter(s.id);
    setSupplierFilterName(s.name);
    setFilterSearch(s.name);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setSupplierFilter("");
    setSupplierFilterName("");
    setFilterSearch("");
    setFilterOpen(false);
  };

  const filteredItems = useMemo(() => {
    if (!supplierFilter) return items;
    return items.filter((item) => suppliers[item.id]?.id === supplierFilter);
  }, [items, suppliers, supplierFilter]);

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
      prev.size === filteredItems.length
        ? new Set()
        : new Set(filteredItems.map((i) => i.id)),
    );
  }, [filteredItems]);

  const bulkDecision = useCallback(
    (decision: "approve" | "reject") => {
      selectedRows.forEach((id) => handleDecision(id, decision));
      setSelectedRows(new Set());
    },
    [selectedRows, handleDecision],
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
          onClick={async () => {
            if (isSubmitting) return;
            const success = await submit();
            if (success) {
              onSuccess?.();
              onClose();
            }
          }}
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
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-muted font-medium whitespace-nowrap">
                  Filter by Supplier:
                </label>
                <div ref={filterContainerRef} className="relative w-48">
                  <input
                    type="text"
                    autoComplete="off"
                    value={filterSearch}
                    placeholder={filterLoading ? "Loading..." : "All Suppliers"}
                    onFocus={handleFilterFocus}
                    onChange={(e) => {
                      setFilterSearch(e.target.value);
                      if (supplierFilter) setSupplierFilter("");
                      if (!filterOpen) setFilterOpen(true);
                    }}
                    className="py-1 pl-2 pr-6 border border-theme rounded text-[11px] text-main bg-card w-full focus:outline-none focus:border-primary"
                  />
                  {supplierFilter && (
                    <button
                      type="button"
                      onClick={clearFilter}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-main"
                      aria-label="Clear supplier filter"
                    >
                      <XIcon size={12} />
                    </button>
                  )}

                  {filterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-card border border-theme rounded-lg shadow-xl overflow-hidden z-50">
                      <ul className="max-h-56 overflow-y-auto text-[11px]">
                        <li
                          onMouseDown={(e) => {
                            e.preventDefault();
                            clearFilter();
                          }}
                          className={[
                            "px-3 py-1.5 cursor-pointer border-b border-theme transition-colors",
                            !supplierFilter
                              ? "bg-primary/10 text-primary font-semibold"
                              : "hover:bg-primary/5 text-main",
                          ].join(" ")}
                        >
                          All Suppliers
                        </li>
                        {filterLoading ? (
                          <li className="px-3 py-2 text-muted text-[11px]">
                            Loading…
                          </li>
                        ) : filterResults.length === 0 ? (
                          <li className="px-3 py-2 text-muted text-[11px]">
                            {filterSearch
                              ? `No match for "${filterSearch}"`
                              : "No suppliers found"}
                          </li>
                        ) : (
                          filterResults.map((s) => (
                            <li
                              key={s.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleFilterSelect(s);
                              }}
                              className={[
                                "px-3 py-1.5 cursor-pointer border-b border-theme last:border-none transition-colors truncate",
                                s.id === supplierFilter
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "hover:bg-primary/5 text-main",
                              ].join(" ")}
                            >
                              {s.name}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
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
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-theme text-[10px] text-muted font-semibold uppercase tracking-wider bg-app">
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredItems.length > 0 &&
                        selectedRows.size === filteredItems.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-2 py-3 w-8"></th>
                  <th className="px-3 py-3 w-10 text-center">#</th>
                  <th className="px-3 py-3 min-w-[180px]">Item Name</th>
                  <th className="px-3 py-3">HS Code</th>
                  <th className="px-3 py-3 text-right">Qty</th>
                  <th className="px-3 py-3 text-right min-w-[120px]">Amount</th>
                  <th className="px-3 py-3 min-w-[220px]">
                    Map to Existing Item
                  </th>
                  <th className="px-3 py-3 min-w-[200px]">Supplier</th>
                  <th className="px-3 py-3 min-w-[160px]">Warehouse</th>
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
                {filteredItems.map((item, index) => {
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
                            value={mappedItems[item.id]?.itemCode ?? ""}
                            selectedId={mappedItems[item.id]?.itemCode ?? ""}
                            onChange={(selected) =>
                              handleMappedItemChange(item.id, selected)
                            }
                            placeholder="Map item.."
                            className="w-full"
                          />
                        </td>
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SupplierSelect
                            selectedId={suppliers[item.id]?.id ?? ""}
                            onChange={(selected) =>
                              handleSupplierChange(item.id, selected)
                            }
                            label=""
                            placeholder="Map supplier..."
                            className="w-full"
                          />
                        </td>
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WarehouseSelect
                            compact
                            value={warehouses[item.id] ?? ""}
                            onChange={(e) => handleWarehouseChange(item.id, e)}
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
                            {
                              label: "Declaration Date",
                              value: formatApiDate(item.dclDe),
                            },
                            { label: "Task Code", value: item.taskCd },
                            { label: "Status", value: item.statusCd },
                            { label: "Origin", value: item.orgnNatCd },
                            { label: "Export Nation", value: item.exptNatCd },
                            { label: "Weight", value: fmtNum(item.totWt) },
                            { label: "Net Weight", value: fmtNum(item.netWt) },
                            {
                              label: "Package",
                              value: `${item.pkg.toLocaleString()} ${item.pkgUnitCd}`,
                            },
                            { label: "Agent", value: item.agntNm },
                            { label: "Supplier", value: item.supplierNm },
                            {
                              label: "Exchange Rate",
                              value: fmtNum(item.exchangeRate),
                            },
                          ]}
                        >
                          <div className="max-w-md">
                            <span className="text-muted block mb-1 text-[11px]">
                              Remark
                            </span>
                            <input
                              type="text"
                              value={remarks[item.id] ?? ""}
                              onChange={(e) =>
                                handleRemarkChange(item.id, e.target.value)
                              }
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