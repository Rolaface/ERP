import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  FileText,
  RefreshCw,
  Check,
  X as XIcon,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useProcessImportPurchaseInvoiceModal } from "../../../hooks/procument/useProcessImportPurchaseInvoiceModal";
import { getSuppliers } from "../../../api/procurement/supplierApi";

interface ProcessImportPurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  onSuccess?: () => void;
}

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

const GROUP_TABLE_COLSPAN = 10;

function extractSupplierList(res: any): any[] {
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

interface SupplierOption {
  id: string;
  name: string;
}

// One row per supplier invoice (PI) — decisions (approve/reject) are made
// at this invoice level only. Item rows underneath are read-only detail
// lines: no per-item decision, no expand/collapse.
interface InvoiceGroup {
  key: string;
  supplierTpin: string;
  supplierName: string;
  invoiceNo: string | number;
  salesDate: string;
  items: any[];
  totalAmount: number;
}

const ProcessImportPurchaseInvoiceModal = ({
  isOpen,
  onClose,
  modalId,
  onSuccess,
}: ProcessImportPurchaseInvoiceModalProps) => {
  const resolvedModalId = useMemo(
    () => modalId || `process-purchase-invoice-import-${Date.now()}`,
    [modalId],
  );

  const {
    items,
    totals,
    decisions,
    remarks,
    handleDecision,
    approveAllRemaining,
    counts,
    isLoading,
    isSubmitting,
    error,
    refresh,
    submit,
  } = useProcessImportPurchaseInvoiceModal(isOpen);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // Selection now lives at the invoice (group) level, since decisions are
  // only ever made per-invoice, not per-item.
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [supplierFilterName, setSupplierFilterName] = useState<string>("");

  const [filterResults, setFilterResults] = useState<SupplierOption[]>([]);
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
    return items.filter((item) => item.supplierTpin === supplierFilter);
  }, [items, supplierFilter]);

  // Group the flattened item rows back by supplier invoice — supplier
  // name + item count up top, items nested below on expand.
  const invoiceGroups = useMemo<InvoiceGroup[]>(() => {
    const groups = new Map<string, InvoiceGroup>();
    filteredItems.forEach((item) => {
      const key = `${item.supplierTpin}-${item.invoiceNo}`;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
        existing.totalAmount += item.itemTotalAmount ?? 0;
      } else {
        groups.set(key, {
          key,
          supplierTpin: item.supplierTpin,
          // ASSUMPTION: item.supplierName carries the flattened spplrNm.
          // Falls back to TPIN if the hook doesn't expose it under that name.
          supplierName: item.supplierName ?? item.supplierTpin,
          invoiceNo: item.invoiceNo,
          salesDate: item.salesDate,
          items: [item],
          totalAmount: item.itemTotalAmount ?? 0,
        });
      }
    });
    return Array.from(groups.values());
  }, [filteredItems]);

  const toggleGroupExpand = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleSelectGroup = useCallback((key: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleSelectAllGroups = useCallback(() => {
    setSelectedGroups((prev) =>
      prev.size === invoiceGroups.length
        ? new Set()
        : new Set(invoiceGroups.map((g) => g.key)),
    );
  }, [invoiceGroups]);

  // Bulk decision now applies at the invoice level: every item inside
  // each selected invoice gets the same decision.
  const bulkDecision = useCallback(
    (decision: "approve" | "reject") => {
      const groupsByKey = new Map(invoiceGroups.map((g) => [g.key, g]));
      selectedGroups.forEach((key) => {
        const group = groupsByKey.get(key);
        group?.items.forEach((i) => handleDecision(i.id, decision));
      });
      setSelectedGroups(new Set());
    },
    [selectedGroups, invoiceGroups, handleDecision],
  );

  const groupDecision = useCallback(
    (group: InvoiceGroup, decision: "approve" | "reject") => {
      group.items.forEach((i) => handleDecision(i.id, decision));
    },
    [handleDecision],
  );

  const groupStatus = (group: InvoiceGroup) => {
    let approved = 0;
    let rejected = 0;
    group.items.forEach((i) => {
      if (decisions[i.id] === "approve") approved += 1;
      else if (decisions[i.id] === "reject") rejected += 1;
    });
    return {
      approved,
      rejected,
      pending: group.items.length - approved - rejected,
    };
  };

  const getGroupStatus = (group: InvoiceGroup) => {
    const status = groupStatus(group);

    if (status.pending === group.items.length) {
      return {
        label: "Pending",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
      };
    }

    if (status.approved === group.items.length) {
      return {
        label: "Approved",
        className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      };
    }

    if (status.rejected === group.items.length) {
      return {
        label: "Rejected",
        className: "bg-red-100 text-red-700 border border-red-200",
      };
    }

    return {
      label: "Partially Processed",
      className: "bg-blue-100 text-blue-700 border border-blue-200",
    };
  };

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
            await submit();
            onSuccess?.();
            onClose();
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
      title="Process Import Purchase Invoices"
      icon={FileText}
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
              Imported Purchase Invoices ({totals.totalItems} items ·{" "}
              {invoiceGroups.length} invoices)
            </h3>
            <div className="flex items-center gap-4">
              {selectedGroups.size > 0 && (
                <>
                  <span className="text-[12px] text-muted">
                    {selectedGroups.size} invoice
                    {selectedGroups.size > 1 ? "s" : ""} selected
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
                        invoiceGroups.length > 0 &&
                        selectedGroups.size === invoiceGroups.length
                      }
                      onChange={toggleSelectAllGroups}
                    />
                  </th>
                  <th className="px-2 py-3 w-8"></th>
                  <th className="px-3 py-3 min-w-[200px]">Supplier</th>
                  <th className="px-3 py-3">Invoice No</th>
                  <th className="px-3 py-3">Sales Date</th>
                  <th className="px-3 py-3 text-center">Items</th>
                  <th className="px-3 py-3 text-right min-w-[120px]">
                    Total Amount
                  </th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 min-w-[220px]">Remarks</th>
                  <th className="px-5 py-3 text-center w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-[12px]">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={GROUP_TABLE_COLSPAN}
                      className="px-5 py-8 text-center text-muted text-[12px]"
                    >
                      {isLoading
                        ? "Loading items..."
                        : "No items to display yet — this fills in once the API is connected."}
                    </td>
                  </tr>
                )}
                {invoiceGroups.map((group) => {
                  const isGroupExpanded = expandedGroups.has(group.key);
                  const isGroupSelected = selectedGroups.has(group.key);
                  const status = groupStatus(group);
                  return (
                    <React.Fragment key={group.key}>
                      <tr
                        onClick={() => toggleGroupExpand(group.key)}
                        className="hover:bg-app transition-colors cursor-pointer"
                      >
                        <td
                          className="px-3 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isGroupSelected}
                            onChange={() => toggleSelectGroup(group.key)}
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          {isGroupExpanded ? (
                            <ChevronDown size={14} className="text-muted" />
                          ) : (
                            <ChevronRight size={14} className="text-muted" />
                          )}
                        </td>
                        <td className="px-3 py-3 font-medium text-main">
                          {group.supplierName}
                          <div className="text-[10px] text-muted font-normal">
                            TPIN {group.supplierTpin}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-primary text-[11px]">
                          {group.invoiceNo}
                        </td>
                        <td className="px-3 py-3 text-muted text-[11px]">
                          {formatApiDate(group.salesDate)}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-main">
                          {group.items.length}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-main text-right">
                          ZMW {fmtNum(group.totalAmount)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {(() => {
                            const badge = getGroupStatus(group);

                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={remarks[group.items[0].id] ?? ""}
                            onChange={(e) =>
                              handleRemarkChange(
                                group.items[0].id,
                                e.target.value,
                              )
                            }
                            placeholder="Enter remarks..."
                            className="w-full rounded-md border border-theme bg-card px-3 py-2 text-xs focus:border-primary focus:outline-none"
                          />
                        </td>
                        <td
                          className="px-5 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(() => {
                            const status = getGroupStatus(group);

                            const approveActive = status.label === "Approved";
                            const rejectActive = status.label === "Rejected";

                            return (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    groupDecision(group, "approve")
                                  }
                                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                                    approveActive
                                      ? "bg-emerald-600 text-white border border-emerald-600"
                                      : "border border-theme text-muted hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                                  }`}
                                >
                                  <Check size={12} />
                                  Approve
                                </button>

                                <button
                                  onClick={() => groupDecision(group, "reject")}
                                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                                    rejectActive
                                      ? "bg-red-600 text-white border border-red-600"
                                      : "border border-theme text-muted hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                  }`}
                                >
                                  <XIcon size={12} />
                                  Reject
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>

                      {isGroupExpanded && (
                        <tr>
                          <td
                            colSpan={GROUP_TABLE_COLSPAN}
                            className="bg-app/40 px-3 py-3"
                          >
                            <table className="w-full text-left border border-theme rounded-lg overflow-hidden">
                              <thead>
                                <tr className="border-b border-theme text-[10px] text-muted font-semibold uppercase tracking-wider bg-app">
                                  <th className="px-3 py-2 w-10 text-center">
                                    #
                                  </th>
                                  <th className="px-3 py-2 min-w-[160px]">
                                    Item Name
                                  </th>
                                  <th className="px-3 py-2">Item Class Code</th>
                                  <th className="px-3 py-2 text-right">Qty</th>
                                  <th className="px-3 py-2 text-right min-w-[110px]">
                                    Amount
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-theme text-[12px] bg-card">
                                {group.items.map((item, index) => (
                                  <tr
                                    key={item.id}
                                    className="hover:bg-app transition-colors"
                                  >
                                    <td className="px-3 py-2 text-center text-muted text-[11px]">
                                      {index + 1}
                                    </td>
                                    <td className="px-3 py-2 font-medium text-main">
                                      {item.itemName}
                                    </td>
                                    <td className="px-3 py-2 text-primary text-[11px]">
                                      {item.itemClassCd}
                                    </td>
                                    <td className="px-3 py-2 tabular-nums text-main text-right">
                                      {item.qty.toLocaleString()}{" "}
                                      {item.qtyUnitCd}
                                    </td>
                                    <td className="px-3 py-2 tabular-nums text-main text-right">
                                      ZMW {fmtNum(item.itemTotalAmount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
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

export default ProcessImportPurchaseInvoiceModal;
