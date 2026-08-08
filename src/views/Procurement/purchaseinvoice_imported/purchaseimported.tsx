import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefreshCw, Check, X as XIcon } from "lucide-react";
import Table from "../../../components/ui/Table/Table";
import type { Column } from "../../../components/ui/Table/type";
import { useProcessImportPurchaseInvoiceModal } from "../../../hooks/procument/useProcessImportPurchaseInvoiceModal";
import { getSuppliers } from "../../../api/procurement/supplierApi";
import { submitPurchaseInvoiceImportDecisions } from "../../../api/procurement/Importedpurchaseinvoice.api";
import type {
  DecisionsMap,
  RemarksMap,
} from "../../../types/procument/imported_purchase/processImportPurchaseInvoiceModal.types";
import { fireManagedSwal } from "../../../utils/swalManager";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import type { InvoiceGroup } from "../../../types/procument/imported_purchase/Importedpurchaseinvoice.types ";
import {
  formatAmount,
  formatCompactDate,
} from "../../../utils/day-time formatter/Format";
import InvoiceExpandedRow from "./Invoiceexpandedrow";
import { useCompanyDefaultsStore } from "../../../store/Companydefaultsstore";
import { useCurrencySymbols } from "../../../hooks/Usecurrencysymbols";

function extractSupplierList(res: any): any[] {
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

interface SupplierOption {
  id: string;
  name: string;
}

const ImportedPurchaseInvoice: React.FC = () => {
  const {
    items,
    totals,
    remarks,
    handleRemarkChange,
    isLoading,
    error,
    refresh,
    mappedItems,
    warehouses,
    handleMappedItemChange,
    handleWarehouseChange,
  } = useProcessImportPurchaseInvoiceModal(true);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [processingGroups, setProcessingGroups] = useState<Set<string>>(
    new Set(),
  );
  const [remarkErrors, setRemarkErrors] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");

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
    let result = items;
    if (supplierFilter) {
      result = result.filter((item) => item.supplierTpin === supplierFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.supplierName?.toLowerCase().includes(q) ||
          String(item.invoiceNo).toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, supplierFilter, searchTerm]);

  const invoiceGroups = useMemo<InvoiceGroup[]>(() => {
    const groups = new Map<string, InvoiceGroup>();
    filteredItems.forEach((item) => {
      const key = `${item.supplierTpin}-${item.invoiceNo}`;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
        existing.totalTaxable += item.taxableAmount ?? 0;
        existing.totalTax += item.vatAmount ?? 0;
        existing.totalAmount += item.itemTotalAmount ?? 0;
      } else {
        groups.set(key, {
          key,
          supplierTpin: item.supplierTpin,
          supplierName: item.supplierName ?? item.supplierTpin,
          invoiceNo: item.invoiceNo,
          salesDate: item.salesDate,
          items: [item],
          totalTaxable: item.taxableAmount ?? 0,
          totalTax: item.vatAmount ?? 0,
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

  // Single entry point for approve/reject — used for a single row, a bulk
  // selection, or "approve all remaining". Validates remarks (reject only),
  // confirms with the user, then submits straight to the existing API and
  // refreshes. No local "pending decision" state — the action IS the submit.
  const processGroups = useCallback(
    async (groups: InvoiceGroup[], decision: "approve" | "reject") => {
      if (groups.length === 0) return;

    

      const isBulk = groups.length > 1;
      const result = await fireManagedSwal({
        icon: "warning",
        title: decision === "approve" ? "Approve Invoice?" : "Reject Invoice?",
        text: isBulk
          ? `Are you sure you want to ${decision} ${groups.length} invoices?`
          : `Are you sure you want to ${decision} invoice ${groups[0].invoiceNo} from ${groups[0].supplierName}?`,
        showCancelButton: true,
        confirmButtonColor: decision === "approve" ? "#22c55e" : "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText:
          decision === "approve" ? "Yes, Approve" : "Yes, Reject",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;

      const allItems = groups.flatMap((g) => g.items);
      const decisionsMap: DecisionsMap = {};
      const remarksMap: RemarksMap = {};
      allItems.forEach((item) => {
        decisionsMap[item.id] = decision;
        remarksMap[item.id] = remarks[item.id] ?? "";
      });

      setProcessingGroups((prev) => {
        const next = new Set(prev);
        groups.forEach((g) => next.add(g.key));
        return next;
      });
      try {
        showLoading(
          decision === "approve"
            ? "Approving invoice..."
            : "Rejecting invoice...",
        );
        await submitPurchaseInvoiceImportDecisions(
          allItems,
          decisionsMap,
          remarksMap,
          mappedItems,
          warehouses,
        );
        closeSwal();
        showSuccess(
          decision === "approve" ? "Invoice approved" : "Invoice rejected",
        );
        setSelectedGroups((prev) => {
          const next = new Set(prev);
          groups.forEach((g) => next.delete(g.key));
          return next;
        });
        await refresh();
      } catch (err) {
        closeSwal();
        showApiError(err);
      } finally {
        setProcessingGroups((prev) => {
          const next = new Set(prev);
          groups.forEach((g) => next.delete(g.key));
          return next;
        });
      }
    },
    [remarks, refresh],
  );
  const currency = useCompanyDefaultsStore(
    (state) => state.defaults?.default_currency ?? "",
  );

  const { getNumberFormat } = useCurrencySymbols(currency ? [currency] : []);
  const pattern = getNumberFormat(currency);

  const columns: Column<InvoiceGroup>[] = useMemo(
    () => [
      // {
      //   key: "select",
      //   header: "",
      //   align: "center",
      //   width: "36px",
      //   render: (g) => (
      //     <div onClick={(e) => e.stopPropagation()}>
      //       <input
      //         type="checkbox"
      //         checked={selectedGroups.has(g.key)}
      //         onChange={() => toggleSelectGroup(g.key)}
      //       />
      //     </div>
      //   ),
      // },
      {
        key: "supplierTpin",
        header: "SUPPLIER TPIN",
        align: "left",
        minWidth: "110px",
        render: (g) => (
          <span className="text-[12px] text-main">{g.supplierTpin}</span>
        ),
      },
      {
        key: "supplierName",
        header: "SUPPLIER NAME",
        align: "left",
        minWidth: "170px",
        render: (g) => (
          <span className="font-medium text-main">{g.supplierName}</span>
        ),
      },
      {
        key: "invoiceNo",
        header: "INVOICE NUMBER",
        align: "left",
        minWidth: "110px",
        render: (g) => (
          <div>
            <span className="text-primary text-[12px]">{g.invoiceNo}</span>
            <div className="text-[10px] text-muted">
              {g.items.length} {g.items.length === 1 ? "item" : "items"}
            </div>
          </div>
        ),
      },
      {
        key: "salesDate",
        header: "INVOICE DATE",
        align: "left",
        minWidth: "90px",
        render: (g) => (
          <span className="text-muted text-[12px]">
            {formatCompactDate(g.salesDate)}
          </span>
        ),
      },
      {
        key: "amounts",
        header: "TOTAL",
        align: "right",
        minWidth: "130px",
        render: (g) => (
          <div className="text-right leading-tight">
            <div className="tabular-nums font-medium">
              {currency} {formatAmount(g.totalAmount, pattern)}
            </div>
            <div className="tabular-nums text-[10px] text-muted">
              Tax {formatAmount(g.totalTax, pattern)} · Taxable{" "}
              {formatAmount(g.totalTaxable, pattern)}
            </div>
          </div>
        ),
      },
      {
        key: "remarks",
        header: "REMARKS",
        align: "left",
        minWidth: "140px",

        render: (g) => (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={remarks[g.items[0].id] ?? ""}
              placeholder="Remarks"
              disabled
              className="w-full rounded-md border border-theme bg-muted/50 px-2 py-1.5 text-xs text-muted cursor-not-allowed"
            />
            {remarkErrors[g.key] && (
              <p className="text-[10px] text-danger mt-1">
                {remarkErrors[g.key]}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "ACCEPT / REJECT",
        align: "center",
        width: "140px",
        render: (g) => {
          const isProcessing = processingGroups.has(g.key);
          return (
            <div
              className="flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => processGroups([g], "approve")}
                disabled={isProcessing}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold border border-theme text-muted hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check size={12} />
                Accept
              </button>
              <button
                onClick={() => processGroups([g], "reject")}
                disabled={isProcessing}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold border border-theme text-muted hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XIcon size={12} />
                Reject
              </button>
            </div>
          );
        },
      },
    ],
    [
      selectedGroups,
      processingGroups,
      remarks,
      remarkErrors,
      handleRemarkChange,
      processGroups,
      toggleSelectGroup,
      currency,
      pattern,
    ],
  );

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full">
      <div className="flex flex-1 flex-col min-h-0 bg-card rounded-lg">
        <Table
          tableId="imported-purchase-invoices"
          columns={columns}
          data={invoiceGroups}
          rowKey={(g) => g.key}
          loading={isLoading}
          emptyMessage={
            isLoading
              ? "Loading items..."
              : "No pending imported purchase invoices."
          }
          onRowClick={(g) => toggleGroupExpand(g.key)}
          expandedRowRender={(g) =>
            expandedGroups.has(g.key) ? (
              <InvoiceExpandedRow
                group={g}
                mappedItems={mappedItems}
                warehouses={warehouses}
                onMappedItemChange={handleMappedItemChange}
                onWarehouseChange={handleWarehouseChange}
              />
            ) : null
          }
          showToolbar
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          toolbarPlaceholder="Search supplier or invoice no..."
          enableAdd={false}
          extraFilters={
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
          }
          primaryAction={
            <div className="flex items-center gap-4 flex-wrap">
              {selectedGroups.size > 0 && (
                <>
                  <span className="text-[12px] text-muted">
                    {selectedGroups.size} selected
                  </span>
                  <button
                    onClick={() =>
                      processGroups(
                        invoiceGroups.filter((g) => selectedGroups.has(g.key)),
                        "approve",
                      )
                    }
                    className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 hover:underline"
                  >
                    <Check size={12} /> Approve selected
                  </button>
                  <button
                    onClick={() =>
                      processGroups(
                        invoiceGroups.filter((g) => selectedGroups.has(g.key)),
                        "reject",
                      )
                    }
                    className="flex items-center gap-1 text-[12px] font-medium text-danger hover:underline"
                  >
                    <XIcon size={12} /> Reject selected
                  </button>
                </>
              )}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-main transition-colors"
              >
                <RefreshCw
                  size={13}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          }
          currentPage={1}
          totalPages={1}
          pageSize={Math.max(invoiceGroups.length, 1)}
          totalItems={invoiceGroups.length}
        />
        {error && (
          <div className="px-5 py-2 text-[12px] text-danger border-t border-theme">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportedPurchaseInvoice;
