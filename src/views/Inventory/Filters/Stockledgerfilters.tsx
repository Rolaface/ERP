import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  RefreshCw,
  Boxes,
  SlidersHorizontal,
  X,
} from "lucide-react";
import DateRangeFilter from "../../../components/ui/modal/DateRangeFilter";
import {
  FilterDropdownButton,
  LookupDropdown,
  popoverInputClass,
} from "../../../components/filters/Lookupdropdown";
import { useDebouncedLookup } from "../../../api/utils/Usedebouncedlookup";
import type { StockLedgerFiltersState } from "../../../hooks/stock/useStockLedger";
import {
  searchWarehouses,
  searchItems,
} from "../../../api/utils/frappeUtilsApi";
import {
  searchBatches,
  searchItemGroups,
  searchBrands,
} from "../../../api/utils/Resourceapi";

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

const StockLedgerFilters: React.FC<StockLedgerFiltersProps> = ({
  filters,
  updateFilter,
  onApply,
  onBack,
  loading,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ── Labels shown on the trigger buttons (kept local since the API only
  // returns codes, not display names) ──
  const [selectedWarehouseLabel, setSelectedWarehouseLabel] = useState("");
  const [selectedItemLabel, setSelectedItemLabel] = useState("");
  const [selectedBatchLabel, setSelectedBatchLabel] = useState("");
  const [selectedItemGroupLabel, setSelectedItemGroupLabel] = useState("");
  const [selectedBrandLabel, setSelectedBrandLabel] = useState("");

  const warehouseLookup = useDebouncedLookup(
    (q) => searchWarehouses(q, 1, 20),
    "warehouse",
    activeDropdown,
  );
  const itemLookup = useDebouncedLookup(
    (q) => searchItems(q, 1, 20, false),
    "item",
    activeDropdown,
  );
  // Batch is scoped to the selected Item; disabled until one is picked
  const batchLookup = useDebouncedLookup(
    (q) => searchBatches(q, 1, 20, filters.item),
    "batch",
    activeDropdown,
    !!filters.item,
  );
  const itemGroupLookup = useDebouncedLookup(
    (q) => searchItemGroups(q, 1, 20),
    "itemGroup",
    activeDropdown,
  );
  const brandLookup = useDebouncedLookup(
    (q) => searchBrands(q, 1, 20),
    "brand",
    activeDropdown,
  );

  // Sync labels from filter state (e.g. when filters arrive pre-populated)
  useEffect(() => {
    if (filters.warehouse && !selectedWarehouseLabel)
      setSelectedWarehouseLabel(filters.warehouse);
    if (!filters.warehouse && selectedWarehouseLabel)
      setSelectedWarehouseLabel("");
  }, [filters.warehouse]);

  useEffect(() => {
    if (filters.item && !selectedItemLabel)
      setSelectedItemLabel(filters.itemName || filters.item);
    if (!filters.item && selectedItemLabel) setSelectedItemLabel("");
  }, [filters.item, filters.itemName]);

  useEffect(() => {
    if (filters.batch && !selectedBatchLabel)
      setSelectedBatchLabel(filters.batch);
    if (!filters.batch && selectedBatchLabel) setSelectedBatchLabel("");
  }, [filters.batch]);

  useEffect(() => {
    if (filters.itemGroup && !selectedItemGroupLabel)
      setSelectedItemGroupLabel(filters.itemGroup);
    if (!filters.itemGroup && selectedItemGroupLabel)
      setSelectedItemGroupLabel("");
  }, [filters.itemGroup]);

  // Item changed -> old batch is no longer valid, reset it
  useEffect(() => {
    setSelectedBatchLabel("");
    updateFilter("batch", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.item]);
  useEffect(() => {
    if (filters.brand && !selectedBrandLabel)
      setSelectedBrandLabel(filters.brand);
    if (!filters.brand && selectedBrandLabel) setSelectedBrandLabel("");
  }, [filters.brand]);

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
    setSelectedItemGroupLabel("");
    updateFilter("brand", "");
    setSelectedBrandLabel("");
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
      <div className="flex items-center gap-1.5 mr-1">
        <SlidersHorizontal size={11} className="text-muted" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">
          Stock Ledger
        </span>
      </div>

      <div className="w-px self-stretch bg-[var(--border)]" />

      <button
        onClick={onBack}
        className="h-7 px-2.5 flex items-center gap-1 text-[11px] font-semibold border border-[var(--border)]
                   rounded-md hover:bg-row-hover text-muted transition-all whitespace-nowrap"
      >
        <ChevronLeft size={12} />
        Back
      </button>

      <div className="w-[220px]">
        <DateRangeFilter
          from={filters.dateRange.from_date}
          to={filters.dateRange.to_date}
          onChange={(range) => updateFilter("dateRange", range)}
        />
      </div>

      <LookupDropdown
        label="Warehouse"
        selectedLabel={selectedWarehouseLabel}
        selectedValue={filters.warehouse}
        options={warehouseLookup.options}
        isLoading={warehouseLookup.isLoading}
        search={warehouseLookup.search}
        onSearchChange={warehouseLookup.setSearch}
        isOpen={activeDropdown === "warehouse"}
        onToggle={() => openLookup("warehouse", warehouseLookup)}
        placeholder="Search warehouse…"
        allLabel="All Warehouses"
        emptyLabel="No warehouses found"
        onSelect={(opt) => {
          updateFilter("warehouse", opt?.value ?? "");
          setSelectedWarehouseLabel(opt?.label ?? "");
          setActiveDropdown(null);
        }}
      />

      <LookupDropdown
        label="Item"
        selectedLabel={selectedItemLabel}
        selectedValue={filters.item}
        options={itemLookup.options}
        isLoading={itemLookup.isLoading}
        search={itemLookup.search}
        onSearchChange={itemLookup.setSearch}
        isOpen={activeDropdown === "item"}
        onToggle={() => openLookup("item", itemLookup)}
        placeholder="Search item…"
        allLabel="All Items"
        emptyLabel="No items found"
        onSelect={(opt) => {
          updateFilter("item", opt?.value ?? "");
          setSelectedItemLabel(opt?.label ?? "");
          setActiveDropdown(null);
        }}
      />

      <LookupDropdown
        label="Batch"
        selectedLabel={selectedBatchLabel}
        selectedValue={filters.batch}
        options={batchLookup.options}
        isLoading={batchLookup.isLoading}
        search={batchLookup.search}
        onSearchChange={batchLookup.setSearch}
        isOpen={activeDropdown === "batch"}
        onToggle={() => openLookup("batch", batchLookup)}
        placeholder="Search batch…"
        allLabel="All Batches"
        emptyLabel="No batches found"
        disabled={!filters.item}
        disabledHint="Select an item first"
        onSelect={(opt) => {
          updateFilter("batch", opt?.value ?? "");
          setSelectedBatchLabel(opt?.label ?? "");
          setActiveDropdown(null);
        }}
      />

      <LookupDropdown
        label="Item Group"
        selectedLabel={selectedItemGroupLabel}
        selectedValue={filters.itemGroup}
        options={itemGroupLookup.options}
        isLoading={itemGroupLookup.isLoading}
        search={itemGroupLookup.search}
        onSearchChange={itemGroupLookup.setSearch}
        isOpen={activeDropdown === "itemGroup"}
        onToggle={() => openLookup("itemGroup", itemGroupLookup)}
        placeholder="Search item group…"
        allLabel="All Groups"
        emptyLabel="No item groups found"
        onSelect={(opt) => {
          updateFilter("itemGroup", opt?.value ?? "");
          setSelectedItemGroupLabel(opt?.label ?? "");
          setActiveDropdown(null);
        }}
      />
      <LookupDropdown
        label="Brand"
        selectedLabel={selectedBrandLabel}
        selectedValue={filters.brand}
        options={brandLookup.options}
        isLoading={brandLookup.isLoading}
        search={brandLookup.search}
        onSearchChange={brandLookup.setSearch}
        isOpen={activeDropdown === "brand"}
        onToggle={() => openLookup("brand", brandLookup)}
        placeholder="Search brand…"
        allLabel="All Brands"
        emptyLabel="No brands found"
        onSelect={(opt) => {
          updateFilter("brand", opt?.value ?? "");
          setSelectedBrandLabel(opt?.label ?? "");
          setActiveDropdown(null);
        }}
      />

      {/* More — Brand, Voucher #, Project, Include UOM, Currency, Serial/Batch Bundle */}
      <FilterDropdownButton
        label="More"
        active={
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

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="h-7 px-2 flex items-center gap-1 text-[11px] text-red-500 hover:bg-red-500/10 rounded-md transition-colors font-semibold"
        >
          <X size={10} /> Clear
        </button>
      )}

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
