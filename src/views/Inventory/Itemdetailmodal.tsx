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
  BarChart3,
  RefreshCw,
  Layers,
  Ruler,
  Boxes,
  BookOpen,
  Hash,
  Globe,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import type { Item, ItemSummary } from "../../types/item";

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
  /** All items for the sidebar list */
  allItems: ItemSummary[];
  /** Currently selected full item */
  item: Item | null;
  loadingDetail?: boolean;
  onSelectItem: (summary: ItemSummary) => void;
  onEditItem: () => void;
  onDeleteItem: () => void;
  onAddItem: () => void;
  /* Invoice / stock data — wire up once APIs are ready */
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
    ? `₹${Number(n).toLocaleString("en-IN")}`
    : "—";

const fmtDate = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
    paid:     "bg-emerald-500/10 text-emerald-700 border-emerald-400/30",
    received: "bg-emerald-500/10 text-emerald-700 border-emerald-400/30",
    pending:  "bg-amber-500/10  text-amber-700  border-amber-400/30",
    overdue:  "bg-red-500/10    text-red-700    border-red-400/30",
    partial:  "bg-blue-500/10   text-blue-700   border-blue-400/30",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${map[status] ?? "bg-muted/10 text-muted border-muted/20"}`}>
      {status}
    </span>
  );
};

const EmptyRows = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <tr>
    <td colSpan={colSpan}>
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-theme flex items-center justify-center">
          <Package size={18} className="text-muted opacity-25" />
        </div>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </td>
  </tr>
);

const SkeletonRows = ({ colSpan, rows = 5 }: { colSpan: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        <td colSpan={colSpan} className="px-4 py-1.5">
          <div className="h-8 rounded-lg bg-row-hover animate-pulse" style={{ animationDelay: `${i * 70}ms` }} />
        </td>
      </tr>
    ))}
  </>
);

/** Key-value field row inside detail cards */
const DetailField = ({ label, value }: { label: string; value?: string | number | null }) => {
  const display = value !== undefined && value !== null && String(value).trim() !== "" ? String(value) : null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-theme last:border-0 gap-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm font-medium text-right ${display ? "text-main" : "text-muted/40"}`}>
        {display ?? "—"}
      </span>
    </div>
  );
};

/** Section heading inside cards */
const CardLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-theme">
    <span className="text-primary">{icon}</span>
    <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</p>
  </div>
);

/** Calendar date picker — DD-MMM-YYYY display, ISO value */
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
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          readOnly
          value={isoToDisplay(value)}
          onClick={() => ref.current?.showPicker?.()}
          placeholder="DD-MMM-YYYY"
          className="pl-3 pr-9 py-2 text-xs border border-theme rounded-xl bg-card text-main focus:outline-none cursor-pointer w-36 font-mono"
        />
        <button type="button" onClick={() => ref.current?.showPicker?.()}
          className="absolute right-2.5 text-muted hover:text-primary transition-colors" tabIndex={-1}>
          <CalendarDays size={13} />
        </button>
        <input ref={ref} type="date" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute right-0 bottom-0 w-8 h-8 opacity-0 pointer-events-none" tabIndex={-1} />
      </div>
    </div>
  );
};

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────

type Tab = "overview" | "sales" | "purchase" | "stock";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview"          },
  { key: "sales",    label: "Sales Invoices"    },
  { key: "purchase", label: "Purchase Invoices" },
  { key: "stock",    label: "Stock Summary"     },
];

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
  salesInvoices    = [],
  purchaseInvoices = [],
  stockRows        = [],
  loadingSales     = false,
  loadingPurchase  = false,
  loadingStock     = false,
  onStockSearch,
}) => {
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activeTab,     setActiveTab]     = useState<Tab>("overview");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [stockFrom,     setStockFrom]     = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0];
  });
  const [stockTo, setStockTo] = useState(() => new Date().toISOString().split("T")[0]);
const packingDisplay =
  item?.packingUnit && item?.packingSize
    ? `${item.packingUnit} × ${item.packingSize}`
    : item?.packingUnit || item?.packingSize || "";
  /* Reset tab + search whenever selected item changes */
  useEffect(() => {
    setActiveTab("overview");
    setInvoiceSearch("");
  }, [item?.id]);

  if (!isOpen) return null;

  const filteredSidebar  = allItems.filter((it) =>
    [it.itemName, it.id].join(" ").toLowerCase().includes(sidebarSearch.toLowerCase())
  );
  const filteredSales    = salesInvoices.filter((r) =>
    [r.invoiceNo, r.customerName, r.date].join(" ").toLowerCase().includes(invoiceSearch.toLowerCase())
  );
  const filteredPurchase = purchaseInvoices.filter((r) =>
    [r.invoiceNo, r.supplierName, r.date].join(" ").toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  

  return (
    /* ── Inline container — fills its parent, no overlay ── */
    <div className="flex bg-app overflow-hidden rounded-2xl border border-theme" style={{ height: "calc(100vh - 8rem)" }}>

      {/* ══════════════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════════════ */}
      <aside className="w-64 xl:w-72 shrink-0 flex flex-col border-r border-theme bg-card overflow-hidden min-h-0">

        {/* Sidebar top bar — X button + title */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-theme shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-theme flex items-center justify-center text-muted hover:text-main hover:bg-row-hover transition-all shrink-0"
          >
            <X size={13} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-black text-main truncate">{item?.itemName ?? "—"}</p>
            <p className="text-[10px] font-mono text-muted">ITEM INSIGHT CENTER</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Quick find..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-theme rounded-xl bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Item list */}
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
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {(it.itemName?.[0] ?? "I").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-main"}`}>
                      {it.itemName}
                    </p>
                    <p className={`text-[10px] font-mono ${isActive ? "text-white/60" : "text-muted"}`}>
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
          RIGHT PANEL
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-theme bg-card shrink-0 gap-4">
          {/* Name + ID */}
          <div className="min-w-0">
            {item ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-main leading-tight truncate">{item.itemName}</h2>
                  <span className="text-[10px] font-mono text-muted bg-row-hover px-2 py-0.5 rounded-md">{item.id}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-0.5">
                  ITEM INSIGHT CENTER
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Select an item</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {item && (
              <>
                <button
                  type="button"
                  onClick={onEditItem}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-theme rounded-xl text-main hover:bg-row-hover transition-all"
                >
                  <Edit size={12} /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={onDeleteItem}
                  className="w-8 h-8 flex items-center justify-center border border-red-400/30 rounded-xl text-red-500 hover:bg-red-500/5 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onAddItem}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm whitespace-nowrap"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">New Item</span>
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center border-b border-theme bg-card shrink-0 overflow-x-auto px-4 sm:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setInvoiceSearch(""); }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-main"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto bg-app">

          {/* Loading skeleton */}
          {loadingDetail && (
            <div className="p-4 sm:p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-card border border-theme animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          )}

          {/* No item selected */}
          {!loadingDetail && !item && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-theme flex items-center justify-center">
                <Package size={24} className="text-muted opacity-20" />
              </div>
              <p className="text-sm text-muted">Select an item from the sidebar</p>
            </div>
          )}

          {/* Content */}
          {!loadingDetail && item && (
            <div className="p-4 sm:p-6 space-y-4">

              {/* ════ OVERVIEW ════════════════════════════════════════════ */}
              {activeTab === "overview" && (
                <>
                  {/* Top 3 KPI cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-theme rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Layers size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Item Group</p>
                        <p className="text-sm font-black text-main mt-0.5">{item.itemGroup || "—"}</p>
                      </div>
                    </div>
                    <div className="bg-card border border-theme rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Selling Price</p>
                        <p className="text-sm font-black text-primary mt-0.5">{fmtRupee(item.sellingPrice)}</p>
                      </div>
                    </div>
                    <div className="bg-card border border-theme rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShoppingCart size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Buying Price</p>
                        <p className="text-sm font-black text-main mt-0.5">{fmtRupee(item.buyingPrice)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Two-column detail cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Identification */}
                    <div className="bg-card border border-theme rounded-2xl p-5">
                      <CardLabel icon={<Hash size={13} />} label="Identification" />
                      <DetailField label="Item Code"      value={item.id} />
                      <DetailField label="SKU"            value={item.sku} />
                      <DetailField label="Brand"          value={item.brand} />
                      <DetailField label="Class Code"     value={item.itemClassCode} />
                      <DetailField label="Type Code"      value={item.itemTypeCode} />
                      <DetailField label="Origin Nation"  value={item.originNationCode} />

                      <DetailField label="Packing" value={packingDisplay} />
                      <DetailField label="UOM"            value={item.unitOfMeasureCd} />
                      <DetailField label="Service Charge" value={item.svcCharge} />
                    </div>

                    {/* Tax & Accounts */}
                    <div className="bg-card border border-theme rounded-2xl p-5">
                      <CardLabel icon={<Receipt size={13} />} label="Tax & Accounts" />
                      <DetailField label="Tax Category"     value={item.taxCategory} />
                      <DetailField label="Tax Preference"   value={item.taxPreference} />
                      <DetailField label="Tax Type"         value={item.taxType} />
                      <DetailField label="Tax Code"         value={item.taxCode} />
                      <DetailField label="Tax %"            value={item.taxPerct ? `${item.taxPerct}%` : undefined} />
                      <DetailField label="Preferred Vendor" value={item.preferredVendor} />
                      <DetailField label="Sales Account"    value={item.salesAccount} />
                      <DetailField label="Purchase Account" value={item.purchaseAccount} />
                    </div>

                    {/* Inventory */}
                    <div className="bg-card border border-theme rounded-2xl p-5">
                      <CardLabel icon={<Boxes size={13} />} label="Inventory" />
                      <DetailField label="Valuation Method" value={item.valuationMethod} />
                      <DetailField label="Tracking Method"  value={item.trackingMethod} />
                      <DetailField label="Min Stock Level"  value={item.minStockLevel} />
                      <DetailField label="Max Stock Level"  value={item.maxStockLevel} />
                      <DetailField label="Reorder Level"    value={item.reorderLevel} />
                    </div>

                    {/* Physical Attributes */}
                    <div className="bg-card border border-theme rounded-2xl p-5">
                      <CardLabel icon={<Ruler size={13} />} label="Physical Attributes" />
                      <DetailField label="Weight"  value={item.weight ? `${item.weight} ${item.weightUnit ?? ""}`.trim() : undefined} />
                      <DetailField label="Length"  value={item.dimensionLength ? `${item.dimensionLength} ${item.dimensionUnit ?? ""}`.trim() : undefined} />
                      <DetailField label="Width"   value={item.dimensionWidth  ? `${item.dimensionWidth}  ${item.dimensionUnit ?? ""}`.trim() : undefined} />
                      <DetailField label="Height"  value={item.dimensionHeight ? `${item.dimensionHeight} ${item.dimensionUnit ?? ""}`.trim() : undefined} />
                      <DetailField label="INS"     value={item.ins} />
                    </div>

                  </div>

                  {/* Description — only shown when present */}
                  {item.description?.trim() && (
                    <div className="bg-card border border-theme rounded-2xl p-5">
                      <CardLabel icon={<BookOpen size={13} />} label="Description" />
                      <p className="text-sm text-main leading-relaxed">{item.description}</p>
                    </div>
                  )}
                </>
              )}

              {/* ════ SALES INVOICES ══════════════════════════════════════ */}
              {activeTab === "sales" && (
                <div className="bg-card border border-theme rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme flex-wrap gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-main">Sales Invoices</p>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input type="text" placeholder="Search..."
                        value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-theme rounded-lg bg-card text-main focus:outline-none w-40 sm:w-48" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-row-hover">
                        <tr>
                          {["Invoice No", "Date", "Customer", "Qty", "Rate", "Total", "Status"].map((h, i) => (
                            <th key={i} className={`px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap ${i >= 3 && i <= 5 ? "text-right" : i === 6 ? "text-center" : "text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingSales ? <SkeletonRows colSpan={7} /> :
                         filteredSales.length === 0 ? <EmptyRows colSpan={7} label="No sales invoices found" /> :
                         filteredSales.map((row, i) => (
                          <tr key={i} className="border-t border-theme hover:bg-row-hover transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-warning/10 text-warning shrink-0"><ArrowUpRight size={11} /></div>
                                <span className="font-bold text-main">{row.invoiceNo}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">{fmtDate(row.date)}</td>
                            <td className="px-4 py-3 font-medium text-main">{row.customerName}</td>
                            <td className="px-4 py-3 text-right text-main">{row.qty}</td>
                            <td className="px-4 py-3 text-right text-main">{fmtRupee(row.rate)}</td>
                            <td className="px-4 py-3 text-right font-bold text-main">{fmtRupee(row.total)}</td>
                            <td className="px-4 py-3 text-center"><StatusPill status={row.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ════ PURCHASE INVOICES ═══════════════════════════════════ */}
              {activeTab === "purchase" && (
                <div className="bg-card border border-theme rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme flex-wrap gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-main">Purchase Invoices</p>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input type="text" placeholder="Search..."
                        value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-theme rounded-lg bg-card text-main focus:outline-none w-40 sm:w-48" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-row-hover">
                        <tr>
                          {["Invoice No", "Date", "Supplier", "Qty", "Rate", "Total", "Status"].map((h, i) => (
                            <th key={i} className={`px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap ${i >= 3 && i <= 5 ? "text-right" : i === 6 ? "text-center" : "text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPurchase ? <SkeletonRows colSpan={7} /> :
                         filteredPurchase.length === 0 ? <EmptyRows colSpan={7} label="No purchase invoices found" /> :
                         filteredPurchase.map((row, i) => (
                          <tr key={i} className="border-t border-theme hover:bg-row-hover transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-success/10 text-success shrink-0"><ArrowDownLeft size={11} /></div>
                                <span className="font-bold text-main">{row.invoiceNo}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap">{fmtDate(row.date)}</td>
                            <td className="px-4 py-3 font-medium text-main">{row.supplierName}</td>
                            <td className="px-4 py-3 text-right text-main">{row.qty}</td>
                            <td className="px-4 py-3 text-right text-main">{fmtRupee(row.rate)}</td>
                            <td className="px-4 py-3 text-right font-bold text-main">{fmtRupee(row.total)}</td>
                            <td className="px-4 py-3 text-center"><StatusPill status={row.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ════ STOCK SUMMARY ═══════════════════════════════════════ */}
              {activeTab === "stock" && (
                <div className="bg-card border border-theme rounded-2xl overflow-hidden">
                  {/* Date range bar */}
                  <div className="flex flex-wrap items-end gap-3 px-5 py-4 border-b border-theme bg-row-hover/40">
                    <DatePicker label="Start Date" value={stockFrom} onChange={setStockFrom} required />
                    <DatePicker label="End Date"   value={stockTo}   onChange={setStockTo}   required />
                    <button type="button" onClick={() => onStockSearch?.(stockFrom, stockTo)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm">
                      <Search size={12} /> Search
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-row-hover">
                          <th rowSpan={2} className="px-4 py-2 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-theme whitespace-nowrap">Date</th>
                          <th rowSpan={2} className="px-4 py-2 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-theme whitespace-nowrap">Voucher Type</th>
                          <th rowSpan={2} className="px-4 py-2 text-left text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-theme whitespace-nowrap">Voucher No</th>
                          <th colSpan={3} className="px-4 py-2 text-center text-[10px] font-black text-muted uppercase tracking-widest border-b border-r border-theme bg-muted">Inwards</th>
                          <th colSpan={3} className="px-4 py-2 text-center text-[10px] font-black text-white uppercase tracking-widest border-b border-r border-theme bg-primary">Outwards</th>
                          <th colSpan={3} className="px-4 py-2 text-center text-[10px] font-black text-white uppercase tracking-widest border-b border-theme bg-primary/50">Closing</th>
                        </tr>
                        <tr className="bg-row-hover border-b border-theme">
                          {[
                            { l: "Qty",            br: false },
                            { l: "Value/Unit",     br: false },
                            { l: "Total",          br: true  },
                            { l: "Qty",            br: false },
                            { l: "Value/Unit",     br: false },
                            { l: "Total",          br: true  },
                            { l: "Closing Qty",    br: false },
                            { l: "Value/Unit",     br: false },
                            { l: "Closing Value",  br: false },
                          ].map(({ l, br }, i) => (
                            <th key={i} className={`px-3 py-2 text-right text-[10px] font-bold text-muted uppercase tracking-wider whitespace-nowrap ${br ? "border-r border-theme" : ""}`}>{l}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingStock ? <SkeletonRows colSpan={12} /> :
                         stockRows.length === 0 ? <EmptyRows colSpan={12} label="Select a date range and click Search" /> :
                         stockRows.map((row, i) => (
                          <tr key={i} className="border-t border-theme hover:bg-row-hover transition-colors">
                            <td className="px-4 py-2.5 text-[10px] font-black text-muted uppercase tracking-widest whitespace-nowrap border-r border-theme">{fmtDate(row.date)}</td>
                            <td className="px-4 py-2.5 text-xs text-main border-r border-theme">{row.voucherType || "—"}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-primary font-bold border-r border-theme">{row.voucherNo || "—"}</td>
                            <td className="px-3 py-2.5 text-right text-xs text-main">{row.inQty ?? 0}</td>
                            <td className="px-3 py-2.5 text-right text-xs text-main">{row.inValuePerUnit ? fmtRupee(row.inValuePerUnit) : "—"}</td>
                            <td className="px-3 py-2.5 text-right text-xs font-bold text-success border-r border-theme">{row.inTotal ? fmtRupee(row.inTotal) : "—"}</td>
                            <td className="px-3 py-2.5 text-right text-xs text-main">{row.outQty ?? 0}</td>
                            <td className="px-3 py-2.5 text-right text-xs text-main">{row.outValuePerUnit ? fmtRupee(row.outValuePerUnit) : "—"}</td>
                            <td className="px-3 py-2.5 text-right text-xs font-bold text-warning border-r border-theme">{row.outTotal ? fmtRupee(row.outTotal) : "—"}</td>
                            <td className="px-3 py-2.5 text-right text-xs font-bold text-main">{row.closingQty ?? 0}</td>
                            <td className="px-3 py-2.5 text-right text-xs text-main">{row.closingValuePerUnit ? fmtRupee(row.closingValuePerUnit) : "—"}</td>
                            <td className="px-3 py-2.5 text-right text-xs font-black text-primary">{fmtRupee(row.closingValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailView;