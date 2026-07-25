import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  RefreshCw,
  Boxes,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FaCheck } from "react-icons/fa";
import DateRangeFilter from "../../../components/ui/modal/DateRangeFilter";
import type { StockLedgerFiltersState } from "../../../hooks/stock/useStockLedger";
import {
  searchWarehouses,
  searchItems,
  searchbatches,
} from "../../../api/utils/frappeUtilsApi";

interface StockLedgerFiltersProps {
  filters: StockLedgerFiltersState;
  updateFilter: <K extends keyof StockLedgerFiltersState>(
    key: K,
    value: StockLedgerFiltersState[K],
  ) => void;
  onApply: () => void;
  onBack: () => void;
  loading: boolean;
}

type LookupOption = { value: string; label: string };

const popoverInputClass =
  "h-7 px-2.5 text-[11px] border border-[var(--border)] rounded-md bg-app text-main " +
  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary " +
  "placeholder:text-muted disabled:opacity-70 disabled:cursor-not-allowed w-full";

// ── Dropdown trigger button, same visual language as Receivables/Payables filter bars ──
const FilterDropdownButton: React.FC<{
  label: string;
  active: boolean;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  width?: string;
}> = ({
  label,
  active,
  isOpen,
  onToggle,
  disabled,
  children,
  width = "w-56",
}) => (
  <div className="relative">
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`h-7 px-2.5 text-[11px] font-semibold border rounded-md flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40"
      }`}
    >
      {label}
    </button>
    {isOpen && (
      <div
        className={`absolute top-full left-0 mt-1.5 bg-card border border-[var(--border)] rounded-lg z-30 ${width} shadow-xl p-2.5`}
      >
        {children}
      </div>
    )}
  </div>
);

// ── List-style option row for API-backed dropdowns (Warehouse, Item, Batch) ──
const DropdownItem: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex justify-between items-center transition-colors ${
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-main hover:bg-row-hover"
    }`}
  >
    <span className="truncate pr-2">{children}</span>
    {active && <FaCheck className="text-[9px] shrink-0" />}
  </button>
);

const SEARCH_DEBOUNCE_MS = 300;

// ── Generic hook-like helper: server-side debounced lookup, shared shape for
// Warehouse/Item/Batch or any future dropdown backed by the same paginated-autosuggest API ──
function useDebouncedLookup(
  fetcher: (query: string) => Promise<{ data: LookupOption[] }>,
  activeKey: string,
  activeDropdown: string | null,
  enabled: boolean = true,
) {
  const [options, setOptions] = useState<LookupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = (query: string) => {
    if (!enabled) {
      setOptions([]);
      return;
    }
    setIsLoading(true);
    fetcher(query)
      .then((res) => setOptions(res.data))
      .catch((err) => console.error(`Failed to search ${activeKey}`, err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (activeDropdown !== activeKey || !enabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => run(search), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeDropdown, enabled]);

  return { options, isLoading, search, setSearch, run };
}

const StockLedgerFilters: React.FC<StockLedgerFiltersProps> = ({
  filters,
  updateFilter,
  onApply,
  onBack,
  loading,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ── Warehouse — server-side debounced search ──
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState("");
  const warehouseLookup = useDebouncedLookup(
    (q) => searchWarehouses(q, 1, 20),
    "warehouse",
    activeDropdown,
  );

  // ── Item — server-side debounced search ──
  const [selectedItemLabel, setSelectedItemLabel] = useState("");
  const itemLookup = useDebouncedLookup(
    (q) => searchItems(q, 1, 20, false),

    "item",
    activeDropdown,
  );

  // ── Batch — scoped to the selected Item; disabled until an Item is picked ──
  const [selectedBatchLabel, setSelectedBatchLabel] = useState("");
  const batchLookup = useDebouncedLookup(
    (q) => searchbatches(q, 1, 20),
    "batch",
    activeDropdown,
  );
  useEffect(() => {
    if (filters.item && !selectedItemLabel) {
      setSelectedItemLabel(filters.itemName || filters.item);
    }
    if (!filters.item && selectedItemLabel) {
      setSelectedItemLabel("");
    }
  }, [filters.item, filters.itemName]);

  useEffect(() => {
    if (filters.batch && !selectedBatchLabel) {
      setSelectedBatchLabel(filters.batch);
    }
    if (!filters.batch && selectedBatchLabel) {
      setSelectedBatchLabel("");
    }
  }, [filters.batch]);
  // ▲▲▲ END OF NEW CODE ▲▲▲

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (filters.warehouse && !selectedWarehouseLabel) {
      setSelectedWarehouseLabel(filters.warehouse);
    }
    if (!filters.warehouse && selectedWarehouseLabel) {
      setSelectedWarehouseLabel("");
    }
  }, [filters.warehouse]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (key: string) =>
    setActiveDropdown((prev) => (prev === key ? null : key));

  const openLookup = (
    key: string,
    lookup: ReturnType<typeof useDebouncedLookup>,
  ) => {
    const opening = activeDropdown !== key;
    toggle(key);
    lookup.setSearch("");
    if (opening) lookup.run("");
  };

  const hasActiveFilters =
    !!filters.warehouse ||
    !!filters.item ||
    !!filters.batch ||
    !!filters.itemGroup ||
    !!filters.brand ||
    !!filters.voucherNo ||
    !!filters.project ||
    !!filters.includeUom ||
    filters.includeSerialBatchBundle;

  const clearAll = () => {
    updateFilter("warehouse", "");
    setSelectedWarehouseLabel("");
    updateFilter("item", "");
    setSelectedItemLabel("");
    updateFilter("batch", "");
    setSelectedBatchLabel("");
    updateFilter("itemGroup", "");
    updateFilter("brand", "");
    updateFilter("voucherNo", "");
    updateFilter("project", "");
    updateFilter("includeUom", "");
    updateFilter("includeSerialBatchBundle", false);
    setActiveDropdown(null);
  };

  return (
    <div
      ref={wrapRef}
      className="bg-card border border-[var(--border)] rounded-lg px-3 py-2 flex flex-wrap items-center gap-2"
    >
      {/* Icon + label */}
      <div className="flex items-center gap-1.5 mr-1">
        <SlidersHorizontal size={11} className="text-muted" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">
          Stock Ledger
        </span>
      </div>

      <div className="w-px self-stretch bg-[var(--border)]" />

      {/* Back */}
      <button
        onClick={onBack}
        className="h-7 px-2.5 flex items-center gap-1 text-[11px] font-semibold border border-[var(--border)]
                   rounded-md hover:bg-row-hover text-muted transition-all whitespace-nowrap"
      >
        <ChevronLeft size={12} />
        Back
      </button>

      {/* Date Range */}
      <div className="w-[220px]">
        <DateRangeFilter
          from={filters.dateRange.from_date}
          to={filters.dateRange.to_date}
          onChange={(range) => updateFilter("dateRange", range)}
        />
      </div>

      {/* Warehouse */}
      <FilterDropdownButton
        label={selectedWarehouseLabel || "Warehouse"}
        active={!!filters.warehouse}
        isOpen={activeDropdown === "warehouse"}
        onToggle={() => openLookup("warehouse", warehouseLookup)}
        width="w-64"
      >
        <input
          autoFocus
          value={warehouseLookup.search}
          onChange={(e) => warehouseLookup.setSearch(e.target.value)}
          placeholder="Search warehouse…"
          className={`${popoverInputClass} mb-1.5`}
        />
        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
          <DropdownItem
            active={!filters.warehouse}
            onClick={() => {
              updateFilter("warehouse", "");
              setSelectedWarehouseLabel("");
              setActiveDropdown(null);
            }}
          >
            All Warehouses
          </DropdownItem>
          {warehouseLookup.isLoading ? (
            <div className="px-2.5 py-2 text-xs text-muted text-center">
              Searching…
            </div>
          ) : warehouseLookup.options.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-muted text-center">
              No warehouses found
            </div>
          ) : (
            warehouseLookup.options.map((opt) => (
              <DropdownItem
                key={opt.value}
                active={filters.warehouse === opt.value}
                onClick={() => {
                  updateFilter("warehouse", opt.value);
                  setSelectedWarehouseLabel(opt.label);
                  setActiveDropdown(null);
                }}
              >
                {opt.label}
              </DropdownItem>
            ))
          )}
        </div>
      </FilterDropdownButton>

      {/* Item — debounced search via searchItems */}
      <FilterDropdownButton
        label={selectedItemLabel || "Item"}
        active={!!filters.item}
        isOpen={activeDropdown === "item"}
        onToggle={() => openLookup("item", itemLookup)}
        width="w-64"
      >
        <input
          autoFocus
          value={itemLookup.search}
          onChange={(e) => itemLookup.setSearch(e.target.value)}
          placeholder="Search item…"
          className={`${popoverInputClass} mb-1.5`}
        />
        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
          <DropdownItem
            active={!filters.item}
            onClick={() => {
              updateFilter("item", "");
              setSelectedItemLabel("");
              setActiveDropdown(null);
            }}
          >
            All Items
          </DropdownItem>
          {itemLookup.isLoading ? (
            <div className="px-2.5 py-2 text-xs text-muted text-center">
              Searching…
            </div>
          ) : itemLookup.options.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-muted text-center">
              No items found
            </div>
          ) : (
            itemLookup.options.map((opt) => (
              <DropdownItem
                key={opt.value}
                active={filters.item === opt.value}
                onClick={() => {
                  updateFilter("item", opt.value);
                  setSelectedItemLabel(opt.label);
                  setActiveDropdown(null);
                }}
              >
                {opt.label}
              </DropdownItem>
            ))
          )}
        </div>
      </FilterDropdownButton>

      {/* Batch — scoped to selected Item, disabled until one is picked */}
      <FilterDropdownButton
        label={selectedBatchLabel || "Batch"}
        active={!!filters.batch}
        isOpen={activeDropdown === "batch"}
        onToggle={() => openLookup("batch", batchLookup)}
        width="w-64"
      >
        <input
          autoFocus
          value={batchLookup.search}
          onChange={(e) => batchLookup.setSearch(e.target.value)}
          placeholder="Search batch…"
          className={`${popoverInputClass} mb-1.5`}
        />
        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
          <DropdownItem
            active={!filters.batch}
            onClick={() => {
              updateFilter("batch", "");
              setSelectedBatchLabel("");
              setActiveDropdown(null);
            }}
          >
            All Batches
          </DropdownItem>
          {batchLookup.isLoading ? (
            <div className="px-2.5 py-2 text-xs text-muted text-center">
              Searching…
            </div>
          ) : batchLookup.options.length === 0 ? (
            <div className="px-2.5 py-2 text-xs text-muted text-center">
              No batches found
            </div>
          ) : (
            batchLookup.options.map((opt) => (
              <DropdownItem
                key={opt.value}
                active={filters.batch === opt.value}
                onClick={() => {
                  updateFilter("batch", opt.value);
                  setSelectedBatchLabel(opt.label);
                  setActiveDropdown(null);
                }}
              >
                {opt.label}
              </DropdownItem>
            ))
          )}
        </div>
      </FilterDropdownButton>

      {/* More — Item Group, Brand, Voucher #, Project, Include UOM, Currency, Serial/Batch Bundle */}
      <FilterDropdownButton
        label="More"
        active={
          !!filters.itemGroup ||
          !!filters.brand ||
          !!filters.voucherNo ||
          !!filters.project ||
          !!filters.includeUom ||
          filters.includeSerialBatchBundle
        }
        isOpen={activeDropdown === "more"}
        onToggle={() => toggle("more")}
        width="w-72"
      >
        <div className="flex flex-col gap-2">
          <input
            value={filters.itemGroup}
            onChange={(e) => updateFilter("itemGroup", e.target.value)}
            placeholder="All Groups"
            className={popoverInputClass}
          />
          <input
            value={filters.brand}
            onChange={(e) => updateFilter("brand", e.target.value)}
            placeholder="All Brands"
            className={popoverInputClass}
          />
          <input
            value={filters.voucherNo}
            onChange={(e) => updateFilter("voucherNo", e.target.value)}
            placeholder="Voucher #"
            className={popoverInputClass}
          />
          <input
            value={filters.project}
            onChange={(e) => updateFilter("project", e.target.value)}
            placeholder="Project"
            className={popoverInputClass}
          />
          <input
            value={filters.includeUom}
            onChange={(e) => updateFilter("includeUom", e.target.value)}
            placeholder="Include UOM"
            className={popoverInputClass}
          />
          <select
            value={filters.valuationFieldType}
            onChange={(e) =>
              updateFilter("valuationFieldType", e.target.value as any)
            }
            className={popoverInputClass}
          >
            <option value="Currency">Currency</option>
            <option value="Float">Float</option>
          </select>
          <label className="flex items-center gap-2 text-[11px] text-main cursor-pointer select-none h-7">
            <input
              type="checkbox"
              checked={filters.includeSerialBatchBundle}
              onChange={(e) =>
                updateFilter("includeSerialBatchBundle", e.target.checked)
              }
              className="w-3.5 h-3.5 rounded border-[var(--border)] accent-primary"
            />
            Enable Serial / Batch Bundle
          </label>
        </div>
      </FilterDropdownButton>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="h-7 px-2 flex items-center gap-1 text-[11px] text-red-500 hover:bg-red-500/10 rounded-md transition-colors font-semibold"
        >
          <X size={10} /> Clear
        </button>
      )}

      {/* Apply — pushed right */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onApply}
          disabled={loading}
          className="h-7 flex items-center gap-1.5 px-3.5 bg-primary text-white text-[11px] font-bold
                     rounded-md hover:bg-primary/90 transition-all disabled:opacity-50
                     disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? (
            <RefreshCw size={11} className="animate-spin" />
          ) : (
            <Boxes size={11} />
          )}
          Apply
        </button>
      </div>
    </div>
  );
};

export default StockLedgerFilters;
