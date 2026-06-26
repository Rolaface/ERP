import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays,
  Wallet,
  ShoppingCart,
  Receipt,
  Building2,
  Plus,
  Percent,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Hash,
  Layers,
  Boxes,
  Ruler,
  BookOpen,
} from "lucide-react";

import {
  AppPage,
  AppPageBody,
  AppSubTabs,
} from "../../components/ui/app-shell";
import { formatDate } from "../../components/UI_Utils/Datedisplay";
import type { Item, ItemSummary, TaxInfo } from "../../types/item";

// ─── PUBLIC TYPES ─────────────────────────────────────────────────────────────

export interface SalesInvoice {
  invoiceNo: string;
  date: string;
  customerName: string;
  qty: number;
  rate: number;
  total: number;
  status: string;
}

export interface PurchaseInvoice {
  invoiceNo: string;
  date: string;
  supplierName: string;
  qty: number;
  rate: number;
  total: number;
  status: string;
}

export interface StockRow {
  date: string;
  voucherType: string;
  voucherNo: string;
  inQty: number;
  inValuePerUnit: number;
  inTotal: number;
  outQty: number;
  outValuePerUnit: number;
  outTotal: number;
  closingQty: number;
  closingValuePerUnit: number;
  closingValue: number;
}

export interface ItemDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  allItems: ItemSummary[];
  item: Item | null;
  loadingDetail?: boolean;
  onSelectItem: (summary: ItemSummary) => void;
  onEditItem: () => void;
  onDeleteItem: () => void;
  onAddItem: () => void;
  // ── CHANGE 1: three new optional per-tab handlers ──────────────────────────
  onAddTaxConfig?: () => void;
  onAddSalesInvoice?: () => void;
  onAddPurchaseInvoice?: () => void;
  // ──────────────────────────────────────────────────────────────────────────
  salesInvoices?: SalesInvoice[];
  purchaseInvoices?: PurchaseInvoice[];
  stockRows?: StockRow[];
  loadingSales?: boolean;
  loadingPurchase?: boolean;
  loadingStock?: boolean;
  onStockSearch?: (from: string, to: string) => void;
}

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────

const fmtRupee = (n?: number | string): string =>
  n !== undefined && n !== null && n !== "" && !isNaN(Number(n))
    ? `${Number(n).toLocaleString("en-IN")}`
    : "—";

const fmtDate = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const isoToDisplay = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleString("en-GB", { month: "short" })}-${d.getFullYear()}`;
};

// ─── ATOMS ────────────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-700 border-emerald-400/30",
    received: "bg-emerald-500/10 text-emerald-700 border-emerald-400/30",
    pending: "bg-amber-500/10  text-amber-700  border-amber-400/30",
    overdue: "bg-red-500/10    text-red-700    border-red-400/30",
    partial: "bg-blue-500/10   text-blue-700   border-blue-400/30",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${map[status] ?? "bg-muted/10 text-muted border-muted/20"}`}
    >
      {status}
    </span>
  );
};

const EmptyRows = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <tr>
    <td colSpan={colSpan}>
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center">
          <Package size={18} className="text-muted opacity-25" />
        </div>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </td>
  </tr>
);

const SkeletonRows = ({
  colSpan,
  rows = 5,
}: {
  colSpan: number;
  rows?: number;
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        <td colSpan={colSpan} className="px-4 py-1.5">
          <div
            className="h-8 rounded-lg bg-row-hover animate-pulse"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        </td>
      </tr>
    ))}
  </>
);

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => {
  const display =
    value !== undefined && value !== null && String(value).trim() !== ""
      ? String(value)
      : null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[var(--border)] last:border-0 gap-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted shrink-0 mt-0.5">
        {label}
      </span>
      <span
        className={`text-sm font-medium text-right ${display ? "text-main" : "text-muted/40"}`}
      >
        {display ?? "—"}
      </span>
    </div>
  );
};

const CardLabel = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border)]">
    <span className="text-primary">{icon}</span>
    <p className="text-[10px] font-black uppercase tracking-widest text-muted">
      {label}
    </p>
  </div>
);

const DatePicker = ({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
}) => {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-muted">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          readOnly
          value={isoToDisplay(value)}
          onClick={() => ref.current?.showPicker?.()}
          placeholder="DD-MMM-YYYY"
          className="pl-3 pr-9 py-2 text-xs border border-[var(--border)] rounded-xl bg-card text-main focus:outline-none cursor-pointer w-36 font-mono"
        />
        <button
          type="button"
          onClick={() => ref.current?.showPicker?.()}
          className="absolute right-2.5 text-muted hover:text-primary transition-colors"
          tabIndex={-1}
        >
          <CalendarDays size={13} />
        </button>
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute right-0 bottom-0 w-8 h-8 opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
    </div>
  );
};

// ─── TAX CARD ─────────────────────────────────────────────────────────────────

const TaxCard = ({ tax, index }: { tax: TaxInfo; index: number }) => {
  const [open, setOpen] = useState(true);
  const rates = tax?.taxRates ?? [];
  const totalRate = rates.reduce((sum, r) => sum + (r?.tax_rate ?? 0), 0);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-row-hover/60 hover:bg-row-hover transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-black">
            {index + 1}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-main truncate">
              {tax.taxName || "—"}
            </p>
            <p className="text-[10px] text-muted truncate">
              {tax.taxCategory || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
            <Percent size={9} />
            {totalRate.toFixed(1)}
          </span>
          {open ? (
            <ChevronUp size={13} className="text-muted" />
          ) : (
            <ChevronDown size={13} className="text-muted" />
          )}
        </div>
      </button>

      {open && rates.length > 0 && (
        <div className="divide-y divide-[var(--border)]">
          {rates.map((rate, ri) => (
            <div
              key={ri}
              className="flex items-center justify-between px-4 py-2.5 gap-4"
            >
              <span className="text-xs text-main leading-snug">
                {rate.tax_type}
              </span>
              <span className="text-xs font-black text-primary shrink-0">
                {rate.tax_rate}%
              </span>
            </div>
          ))}
        </div>
      )}

      {open && rates.length === 0 && (
        <p className="px-4 py-3 text-xs text-muted/60 italic">
          No tax rates configured
        </p>
      )}
    </div>
  );
};

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────

type Tab = "overview" | "tax" | "sales" | "purchase" | "stock";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  isOpen,
  onClose,
  allItems,
  item,
  loadingDetail = false,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onAddItem,
  // ── CHANGE 2: destructure the three new handlers ───────────────────────────
  onAddTaxConfig,
  onAddSalesInvoice,
  onAddPurchaseInvoice,
  // ──────────────────────────────────────────────────────────────────────────
  salesInvoices = [],
  purchaseInvoices = [],
  stockRows = [],
  loadingSales = false,
  loadingPurchase = false,
  loadingStock = false,
  onStockSearch,
}) => {
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [stockFrom, setStockFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [stockTo, setStockTo] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  const inventory = item?.inventoryInfo;

  const taxInfoList: TaxInfo[] = Array.isArray(item?.taxInfo)
    ? item!.taxInfo.map((t) => ({ ...t, taxRates: t.taxRates ?? [] }))
    : [];

  const batchInfo = item?.batchInfo;

  const packingDisplay =
    item?.packingUnit && item?.packingSize
      ? `${item.packingUnit} × ${item.packingSize}`
      : item?.packingUnit
        ? String(item.packingUnit)
        : item?.packingSize
          ? String(item.packingSize)
          : "";

  const dimensionDisplay = (val?: number | string, unit?: string) =>
    val && Number(val) !== 0 ? `${val}${unit ? ` ${unit}` : ""}` : undefined;

  useEffect(() => {
    setActiveTab("overview");
    setInvoiceSearch("");
  }, [item?.id]);

  if (!isOpen) return null;

  const filteredSidebar = allItems.filter((it) =>
    [it.itemName, it.id]
      .join(" ")
      .toLowerCase()
      .includes(sidebarSearch.toLowerCase()),
  );
  const filteredSales = salesInvoices.filter((r) =>
    [r.invoiceNo, r.customerName, r.date]
      .join(" ")
      .toLowerCase()
      .includes(invoiceSearch.toLowerCase()),
  );
  const filteredPurchase = purchaseInvoices.filter((r) =>
    [r.invoiceNo, r.supplierName, r.date]
      .join(" ")
      .toLowerCase()
      .includes(invoiceSearch.toLowerCase()),
  );

  // ── CHANGE 3: dynamic trailing button per active tab ──────────────────────
  const tabActions: Record<Tab, { label: string; handler: () => void }> = {
    overview: { label: "New Item",             handler: onAddItem },
    tax:      { label: "New Tax Config",        handler: onAddTaxConfig      ?? onAddItem },
    sales:    { label: "New Sales Invoice",     handler: onAddSalesInvoice   ?? onAddItem },
    purchase: { label: "New Purchase Invoice",  handler: onAddPurchaseInvoice ?? onAddItem },
    stock:    { label: "New Item",              handler: onAddItem },
  };
  // ──────────────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon?: React.ReactNode }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "tax",
      label: "Tax Config",
      icon:
        taxInfoList.length > 0 ? (
          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black leading-none">
            {taxInfoList.length}
          </span>
        ) : undefined,
    },
    { id: "sales", label: "Sales Invoices" },
    { id: "purchase", label: "Purchase Invoices" },
    { id: "stock", label: "Stock Summary" },
  ];

  return (
    <div
      className="flex bg-app overflow-hidden rounded-2xl border border-[var(--border)]"
      style={{ height: "calc(100vh - 8rem)" }}
    >
      {/* ══════════════════════════════════════════════
          LEFT SIDEBAR — item list
      ══════════════════════════════════════════════ */}
      <aside className="w-64 xl:w-72 shrink-0 flex flex-col border-r border-[var(--border)] bg-card overflow-hidden min-h-0">
        {/* Sidebar header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-muted hover:text-main hover:bg-row-hover transition-all shrink-0"
          >
            <X size={13} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-black text-main truncate">
              {item?.itemName ?? "—"}
            </p>
            <p className="text-[10px] font-mono text-muted">
              ITEM INSIGHT CENTER
            </p>
          </div>
        </div>

        {/* Sidebar search */}
        <div className="px-3 py-3 shrink-0">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Quick find..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-[var(--border)] rounded-xl bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Sidebar item list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredSidebar.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-muted">No items found</p>
            </div>
          ) : (
            filteredSidebar.map((it) => {
              const isActive = item?.id === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onSelectItem(it)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                    isActive ? "bg-primary" : "hover:bg-row-hover"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {(it.itemName?.[0] ?? "I").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-main"}`}
                    >
                      {it.itemName}
                    </p>
                    <p
                      className={`text-[10px] font-mono ${isActive ? "text-white/60" : "text-muted"}`}
                    >
                      {it.id}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — uses AppPage shell
      ══════════════════════════════════════════════ */}
      <AppPage viewportLocked>
        <AppSubTabs
          tabs={TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id as Tab);
            setInvoiceSearch("");
          }}
          leading={
            item ? (
              <div className="flex items-center gap-2 pl-1 shrink-0 max-w-[200px]">
                <span className="truncate text-sm font-semibold text-main leading-none">
                  {item.itemName}
                </span>
                <span className="h-4 w-px bg-[var(--border)] shrink-0" />
              </div>
            ) : null
          }
          trailing={
            // ── CHANGE 3 (continued): button label + handler driven by activeTab
            <button
              type="button"
              onClick={tabActions[activeTab].handler}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Plus size={12} />
              <span className="hidden sm:inline">
                {tabActions[activeTab].label}
              </span>
            </button>
          }
        />

        {/* ── AppPageBody: scrollable tab content ── */}
        <AppPageBody>
          {/* Loading skeleton */}
          {loadingDetail && (
            <div className="space-y-4 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-card border border-[var(--border)] animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingDetail && !item && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center">
                <Package size={24} className="text-muted opacity-20" />
              </div>
              <p className="text-sm text-muted">
                Select an item from the sidebar
              </p>
            </div>
          )}

          {/* Tab content */}
          {!loadingDetail && item && (
            <>
              {/* ════ OVERVIEW ════════════════════════════════════════════ */}
              {activeTab === "overview" && (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Layers size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Item Group
                        </p>
                        <p className="text-sm font-black text-main mt-0.5">
                          {item.itemGroup || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Selling Price
                        </p>
                        <p className="text-sm font-black text-primary mt-0.5">
                          {fmtRupee(item.sellingPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShoppingCart size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                          Buying Price
                        </p>
                        <p className="text-sm font-black text-main mt-0.5">
                          {fmtRupee(item.buyingPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Identification */}
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-5">
                      <CardLabel
                        icon={<Hash size={13} />}
                        label="Identification"
                      />
                      <DetailField label="Item Code" value={item.id} />
                      <DetailField label="SKU" value={item.sku} />
                      <DetailField label="Brand" value={item.brand} />
                      <DetailField
                        label="Item Class Code"
                        value={item.itemClassCode}
                      />
                      <DetailField
                        label="Country of Origin"
                        value={item.countryOfOrigin}
                      />
                      <DetailField label="Packing" value={packingDisplay} />
                      <DetailField label= "Unit of Measure"
 value={item.unitOfMeasureCd} />
                      <DetailField
                        label="Service Charge"
                        value={item.svcCharge}
                      />
                      <DetailField
                        label="Pieces/Box"
                        value={inventory?.piecesPerBox ?? (item as any) .piecesPerBox}
                      />
                    </div>

                    {/* Vendor & Accounts */}
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-5">
                      <CardLabel
                        icon={<Building2 size={13} />}
                        label="Vendor & Accounts"
                      />
                      <DetailField
                        label="Preferred Vendor"
                        value={
                          item.vendorInfo?.preferredVendor ??
                          (item as any).preferredVendor
                        }
                      />
                      <DetailField
                        label="Vendor Name"
                        value={(item.vendorInfo as any)?.preferredVendorName}
                      />
                    </div>

                    {/* Inventory */}
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-5">
                      <CardLabel icon={<Boxes size={13} />} label="Inventory" />
                      <DetailField
                        label="Valuation Method"
                        value={
                          inventory?.valuationMethod ??
                          (item as any).valuationMethod
                        }
                      />
                      <DetailField
                        label="Tracking Method"
                        value={
                          inventory?.trackingMethod ??
                          (item as any).trackingMethod
                        }
                      />
                      <DetailField
                        label="Min Stock Level"
                        value={
                          inventory?.minStockLevel ??
                          (item as any).minStockLevel
                        }
                      />
                      <DetailField
                        label="Max Stock Level"
                        value={
                          inventory?.maxStockLevel ??
                          (item as any).maxStockLevel
                        }
                      />
                      <DetailField
                        label="Reorder Level"
                        value={
                          inventory?.reorderLevel ?? (item as any).reorderLevel
                        }
                      />
                    </div>

                    {/* Physical Attributes */}
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-5">
                      <CardLabel
                        icon={<Ruler size={13} />}
                        label="Physical Attributes"
                      />
                      <DetailField
                        label="Weight"
                        value={
                          item.weight && Number(item.weight) !== 0
                            ? `${item.weight} ${item.weightUnit ?? ""}`.trim()
                            : undefined
                        }
                      />
                      <DetailField
                        label="Length"
                        value={dimensionDisplay(
                          item.dimensionLength,
                          (item as any).dimensionUOM,
                        )}
                      />
                      <DetailField
                        label="Width"
                        value={dimensionDisplay(
                          item.dimensionWidth,
                          (item as any).dimensionUOM,
                        )}
                      />
                      <DetailField
                        label="Height"
                        value={dimensionDisplay(
                          item.dimensionHeight,
                          (item as any).dimensionUOM,
                        )}
                      />
                      <DetailField label="INS" value={item.ins} />
                    </div>

                    {/* Batch Info */}
                    {batchInfo && (
                      <div className="bg-card border border-[var(--border)] rounded-2xl p-5">
                        <CardLabel
                          icon={<FlaskConical size={13} />}
                          label="Batch & Expiry"
                        />
                        <DetailField
                          label="Has Batch No"
                          value={batchInfo.has_batch_no ? "Yes" : "No"}
                        />
                        <DetailField
                          label="Has Expiry Date"
                          value={batchInfo.has_expiry_date ? "Yes" : "No"}
                        />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {item.description?.trim() && (
                    <div className="bg-card border border-[var(--border)] rounded-2xl p-5">
                      <CardLabel
                        icon={<BookOpen size={13} />}
                        label="Description"
                      />
                      <p className="text-sm text-main leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ════ TAX CONFIG ══════════════════════════════════════════ */}
              {activeTab === "tax" && (
                <div className="space-y-4">
                  <div className="bg-card border border-[var(--border)] rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Percent size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-main">
                        {taxInfoList.length} Tax Configuration
                        {taxInfoList.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {taxInfoList.length === 0
                          ? "No tax configurations assigned to this item"
                          : `Total ${taxInfoList
                              .reduce(
                                (s, t) =>
                                  s +
                                  (t.taxRates ?? []).reduce(
                                    (rs, r) => rs + (r?.tax_rate ?? 0),
                                    0,
                                  ),
                                0,
                              )
                              .toFixed(1)}% combined rate across all configs`}
                      </p>
                    </div>
                  </div>

                  {taxInfoList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center">
                        <Receipt size={20} className="text-muted opacity-20" />
                      </div>
                      <p className="text-sm text-muted">
                        No tax configurations found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {taxInfoList.map((tax, i) => (
                        <TaxCard key={i} tax={tax} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ════ SALES INVOICES ══════════════════════════════════════ */}
              {activeTab === "sales" && (
                <div className="bg-card border border-[var(--border)] rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] flex-wrap gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-main">
                      Sales Invoices
                    </p>
                    <div className="relative">
                      <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-card text-main focus:outline-none w-40 sm:w-48"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-row-hover">
                        <tr>
                          {[
                            "Invoice No",
                            "Date",
                            "Customer",
                            "Qty",
                            "Rate",
                            "Total",
                            "Status",
                          ].map((h, i) => (
                            <th
                              key={i}
                              className={`px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap ${
                                i >= 3 && i <= 5
                                  ? "text-right"
                                  : i === 6
                                    ? "text-center"
                                    : "text-left"
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingSales ? (
                          <SkeletonRows colSpan={7} />
                        ) : filteredSales.length === 0 ? (
                          <EmptyRows
                            colSpan={7}
                            label="No sales invoices found"
                          />
                        ) : (
                          filteredSales.map((row, i) => (
                            <tr
                              key={i}
                              className="border-t border-[var(--border)] hover:bg-row-hover transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-warning/10 text-warning shrink-0">
                                    <ArrowUpRight size={11} />
                                  </div>
                                  <span className="font-bold text-main">
                                    {row.invoiceNo}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">
                                {fmtDate(row.date)}
                              </td>
                              <td className="px-4 py-3 font-medium text-main">
                                {row.customerName}
                              </td>
                              <td className="px-4 py-3 text-right text-main">
                                {row.qty}
                              </td>
                              <td className="px-4 py-3 text-right text-main">
                                {fmtRupee(row.rate)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-main">
                                {fmtRupee(row.total)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusPill status={row.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ════ PURCHASE INVOICES ═══════════════════════════════════ */}
              {activeTab === "purchase" && (
                <div className="bg-card border border-[var(--border)] rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] flex-wrap gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-main">
                      Purchase Invoices
                    </p>
                    <div className="relative">
                      <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-card text-main focus:outline-none w-40 sm:w-48"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-row-hover">
                        <tr>
                          {[
                            "Invoice No",
                            "Date",
                            "Supplier",
                            "Qty",
                            "Rate",
                            "Total",
                            "Status",
                          ].map((h, i) => (
                            <th
                              key={i}
                              className={`px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap ${
                                i >= 3 && i <= 5
                                  ? "text-right"
                                  : i === 6
                                    ? "text-center"
                                    : "text-left"
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPurchase ? (
                          <SkeletonRows colSpan={7} />
                        ) : filteredPurchase.length === 0 ? (
                          <EmptyRows
                            colSpan={7}
                            label="No purchase invoices found"
                          />
                        ) : (
                          filteredPurchase.map((row, i) => (
                            <tr
                              key={i}
                              className="border-t border-[var(--border)] hover:bg-row-hover transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-success/10 text-success shrink-0">
                                    <ArrowDownLeft size={11} />
                                  </div>
                                  <span className="font-bold text-main">
                                    {row.invoiceNo}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">
                                {fmtDate(row.date)}
                              </td>
                              <td className="px-4 py-3 font-medium text-main">
                                {row.supplierName}
                              </td>
                              <td className="px-4 py-3 text-right text-main">
                                {row.qty}
                              </td>
                              <td className="px-4 py-3 text-right text-main">
                                {fmtRupee(row.rate)}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-main">
                                {fmtRupee(row.total)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusPill status={row.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ════ STOCK SUMMARY ═══════════════════════════════════════ */}
              {activeTab === "stock" && (
                <div className="bg-card border border-[var(--border)] rounded-2xl overflow-hidden">
                  <div className="flex flex-wrap items-end gap-3 px-5 py-4 border-b border-[var(--border)] bg-row-hover/40">
                    <DatePicker
                      label="Start Date"
                      value={stockFrom}
                      onChange={setStockFrom}
                      required
                    />
                    <DatePicker
                      label="End Date"
                      value={stockTo}
                      onChange={setStockTo}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => onStockSearch?.(stockFrom, stockTo)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
                    >
                      <Search size={12} /> Search
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-row-hover">
                          <th
                            rowSpan={2}
                            className="px-4 py-2 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-[var(--border)] whitespace-nowrap"
                          >
                            Date
                          </th>
                          <th
                            rowSpan={2}
                            className="px-4 py-2 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-[var(--border)] whitespace-nowrap"
                          >
                            Voucher Type
                          </th>
                          <th
                            rowSpan={2}
                            className="px-4 py-2 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-[var(--border)] whitespace-nowrap"
                          >
                            Voucher No
                          </th>
                          <th
                            colSpan={3}
                            className="px-4 py-2 text-center text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-[var(--border)] bg-muted"
                          >
                            Inwards
                          </th>
                          <th
                            colSpan={3}
                            className="px-4 py-2 text-center text-[10px] font-black text-white uppercase tracking-widest border-b border-r border-[var(--border)] bg-primary"
                          >
                            Outwards
                          </th>
                          <th
                            colSpan={3}
                            className="px-4 py-2 text-center text-[10px] font-black text-white uppercase tracking-widest border-b border-[var(--border)] bg-primary/50"
                          >
                            Closing
                          </th>
                        </tr>
                        <tr className="bg-row-hover border-b border-[var(--border)]">
                          {[
                            { l: "Qty", br: false },
                            { l: "Value/Unit", br: false },
                            { l: "Total", br: true },
                            { l: "Qty", br: false },
                            { l: "Value/Unit", br: false },
                            { l: "Total", br: true },
                            { l: "Closing Qty", br: false },
                            { l: "Value/Unit", br: false },
                            { l: "Closing Value", br: false },
                          ].map(({ l, br }, i) => (
                            <th
                              key={i}
                              className={`px-3 py-2 text-right text-[10px] font-bold text-muted uppercase tracking-wider whitespace-nowrap ${br ? "border-r border-[var(--border)]" : ""}`}
                            >
                              {l}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingStock ? (
                          <SkeletonRows colSpan={12} />
                        ) : stockRows.length === 0 ? (
                          <EmptyRows
                            colSpan={12}
                            label="Select a date range and click Search"
                          />
                        ) : (
                          stockRows.map((row, i) => (
                            <tr
                              key={i}
                              className="border-t border-[var(--border)] hover:bg-row-hover transition-colors"
                            >
                              <td className="px-4 py-2.5 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap border-r border-[var(--border)]">
                                {fmtDate(row.date)}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-main border-r border-[var(--border)]">
                                {row.voucherType || "—"}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-mono text-primary font-bold border-r border-[var(--border)]">
                                {row.voucherNo || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs text-main">
                                {row.inQty ?? 0}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs text-main">
                                {row.inValuePerUnit
                                  ? fmtRupee(row.inValuePerUnit)
                                  : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs font-bold text-success border-r border-[var(--border)]">
                                {row.inTotal ? fmtRupee(row.inTotal) : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs text-main">
                                {row.outQty ?? 0}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs text-main">
                                {row.outValuePerUnit
                                  ? fmtRupee(row.outValuePerUnit)
                                  : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs font-bold text-warning border-r border-[var(--border)]">
                                {row.outTotal ? fmtRupee(row.outTotal) : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs font-bold text-main">
                                {row.closingQty ?? 0}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs text-main">
                                {row.closingValuePerUnit
                                  ? fmtRupee(row.closingValuePerUnit)
                                  : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs font-black text-primary">
                                {fmtRupee(row.closingValue)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </AppPageBody>
      </AppPage>
    </div>
  );
};

export default ItemDetailView;