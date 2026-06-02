// pages/PurchaseInvoiceBarCode.tsx
import React, { useState, useEffect, useRef } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, { ActionGroup } from "../../components/ui/Table/ActionButton";
import BarcodeViewModal from "./BarCodeViewModal";
import BarcodeViewAllModal from "./BarCodeViewAllModal";
import { getAllBarCodeByItemCode, getItemCodeBySearch } from "../../api/procurement/PurchaseInvoiceApi";

export interface BatchRow {
  batchNumber: string;   // batch_no
  barcodeId: string;     // barcode_value
  quantity: number;
  manufactureDate: string;
  expiryDate: string;
  postDate: string;      
  supplierName: string;   
  barcodeImageUrl?: string;
}

export interface ItemSearchResult {
  itemCode: string;
  itemName: string;
  batches: BatchRow[];
}

// ── API response shapes ───────────────────────────────────────────────────────

interface SearchBatch {
  batch_no: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
}

interface SearchResultItem {
  item_code: string;
  item_name: string;
  uom: string;
  item_group: string;
  description: string;
  total_batches: number;
  batches: SearchBatch[];
}

interface BarcodeBatch {
  item_code: string;
  item_name: string;
  batch_no: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  barcode_value: string;
  barcode_image_url: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (d: string) => {
  if (!d) return "—";
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const [year, month, day] = d.split("T")[0].split("-").map(Number);
  return `${String(day).padStart(2,"0")}-${months[month - 1]}-${year}`;
};

const mapBarcodeBatchToRow = (b: BarcodeBatch): BatchRow => ({
  batchNumber:     b.batch_no,
  barcodeId:       b.barcode_value,
  quantity:        b.quantity,
  manufactureDate: b.manufacturing_date,
  expiryDate:      b.expiry_date,
  postDate:        "",
  supplierName:    "",
  barcodeImageUrl: b.barcode_image_url,
});

// ── Component ─────────────────────────────────────────────────────────────────

const PurchaseInvoiceBarCode: React.FC = () => {
  const [searchTerm, setSearchTerm]         = useState("");
  const [suggestions, setSuggestions]       = useState<SearchResultItem[]>([]);
  const [selectedItem, setSelectedItem]     = useState<ItemSearchResult | null>(null);
  const [loadingSearch, setLoadingSearch]   = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Single barcode modal
  const [singleModal, setSingleModal] = useState<{ open: boolean; batch: BatchRow | null }>
    ({ open: false, batch: null });

  // View all modal
  const [allModal, setAllModal] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const term = searchTerm.trim();

    // if (!term || selectedItem) {
    if (selectedItem) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const data = await getItemCodeBySearch({ search_term: term });
        setSuggestions(data?.message?.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, selectedItem]);

  // ── Select item → fetch barcodes ─────────────────────────────────────────
  const handleSelectItem = async (item: SearchResultItem) => {
    setSearchTerm(item.item_name);
    setSuggestions([]);
    setLoadingBatches(true);
    setSelectedItem(null);

    try {
      const data = await getAllBarCodeByItemCode(item.item_code);
      const batches: BatchRow[] = (data?.message?.batches ?? []).map(mapBarcodeBatchToRow);
      setSelectedItem({ itemCode: item.item_code, itemName: item.item_name, batches });
    } catch {
      setSelectedItem({ itemCode: item.item_code, itemName: item.item_name, batches: [] });
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleClear = () => {
    setSelectedItem(null);
    setSearchTerm("");
    setSuggestions([]);
  };

  // ── Batch table columns ───────────────────────────────────────────────────
  const batchColumns: Column<BatchRow>[] = [
    {
      key: "batchNumber",
      header: "Batch Number",
      render: (r) => (
        <div className="py-1.5">
          <code className="block font-mono text-sm">{r.batchNumber}</code>
        </div>
      ),
    },
    {
      key: "barcodeId",
      header: "Barcode ID",
      render: (r) => (
        <div className="py-1.5">
          <code className="block font-mono text-sm">{r.barcodeId || "—"}</code>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      render: (r) => (
        <div className="py-1.5">
          <span className="block text-right">{r.quantity.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "manufactureDate",
      header: "Mfg Date",
      render: (r) => (
        <div className="py-1.5">
          <span className="block">{formatDate(r.manufactureDate)}</span>
        </div>
      ),
    },
    {
      key: "expiryDate",
      header: "Exp Date",
      render: (r) => (
        <div className="py-1.5">
          <span className="block">{formatDate(r.expiryDate)}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (r) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            title="View Barcode"
            onClick={() => setSingleModal({ open: true, batch: r })}
            disabled={!r.barcodeId}
          />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-4">

      {/* Search bar + View All */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ position:"relative", flex:1, maxWidth:420 }}>
          {/* Search icon */}
          {loadingSearch ? (
            <svg style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#178ee0",animation:"spin 1s linear infinite" }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--muted,#888)" }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          )}

          {/* <input
            type="text"
            placeholder="Search item name or code…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedItem(null); }}
            style={{ width:"100%",padding:"8px 12px 8px 32px",borderRadius:7,border:"0.5px solid var(--border,#e5e7eb)",background:"var(--card,#fff)",color:"var(--text,#111)",fontSize:13,outline:"none" }}
          /> */}
          <input
    type="text"
    placeholder="Search item name or code…"
    value={searchTerm}
    onChange={(e) => { setSearchTerm(e.target.value); setSelectedItem(null); }}
    // Add these two lines:
    onFocus={() => setIsFocused(true)}
    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
    style={{ width:"100%",padding:"8px 12px 8px 32px",borderRadius:7,border:"0.5px solid var(--border,#e5e7eb)",background:"var(--card,#fff)",color:"var(--text,#111)",fontSize:13,outline:"none" }}
  />

          {/* Dropdown suggestions */}
          {/* {suggestions.length > 0 && !selectedItem && ( */}
          {isFocused && suggestions.length > 0 && !selectedItem && (
            <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--card,#fff)",border:"0.5px solid var(--border,#e5e7eb)",borderRadius:7,zIndex:50,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
              {suggestions.map((item) => (
                <div
                  key={item.item_code}
                  onClick={() => handleSelectItem(item)}
                  style={{ padding:"9px 12px",cursor:"pointer",borderBottom:"0.5px solid var(--border,#e5e7eb)",fontSize:13 }}
                  onMouseEnter={e => (e.currentTarget.style.background="var(--bg,#f8f9fa)")}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                >
                  <p style={{ margin:0,fontWeight:500 }}>{item.item_name}</p>
                  <p style={{ margin:0,fontSize:11,color:"var(--muted,#888)",fontFamily:"monospace" }}>
                    {item.item_code} · {item.total_batches} batch{item.total_batches !== 1 ? "es" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All — only when item selected with 2+ batches */}
        {selectedItem && selectedItem.batches.length > 1 && (
          <button
            onClick={() => setAllModal(true)}
            style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:13,fontWeight:500,cursor:"pointer",border:"0.5px solid #178ee0",background:"transparent",color:"#178ee0" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9v1M3 14v1M8 9v6M11 9v1M11 14v1M14 9v6M17 9v1M17 14v1M20 9v6"/>
            </svg>
            View All Barcodes ({selectedItem.batches.length})
          </button>
        )}
      </div>

      {/* Selected item header */}
      {selectedItem && (
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--bg,#f8f9fa)",borderRadius:7,border:"0.5px solid var(--border,#e5e7eb)" }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:"#178ee0",flexShrink:0 }} />
          <div>
            <p style={{ margin:0,fontSize:13,fontWeight:600 }}>{selectedItem.itemName}</p>
            <p style={{ margin:0,fontSize:11,color:"var(--muted,#888)",fontFamily:"monospace" }}>{selectedItem.itemCode}</p>
          </div>
          <button
            onClick={handleClear}
            style={{ marginLeft:"auto",width:24,height:24,borderRadius:5,border:"0.5px solid var(--border,#e5e7eb)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted,#888)",fontSize:13 }}
          >✕</button>
        </div>
      )}

      {/* Batch table / loading / empty state */}
      {loadingBatches ? (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:8,color:"var(--muted,#888)",paddingTop:40 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#178ee0" strokeWidth="2"
            style={{ animation:"spin 1s linear infinite" }}>
            <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize:13,margin:0 }}>Loading barcodes…</p>
        </div>
      ) : selectedItem ? (
        <Table
          columns={batchColumns}
          data={selectedItem.batches}
          tableId="barcode-batch-table"
          rowKey={(r) => r.batchNumber}
          loading={false}
          showToolbar={false}
          emptyMessage="No barcodes found for this item"
          currentPage={1}
          totalPages={1}
          pageSize={selectedItem.batches.length}
          totalItems={selectedItem.batches.length}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
        />
      ) : (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:8,color:"var(--muted,#888)",paddingTop:40 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p style={{ fontSize:13,margin:0 }}>Search for an item to view its barcodes</p>
        </div>
      )}

      {/* Modals */}
      <BarcodeViewModal
        open={singleModal.open}
        onClose={() => setSingleModal({ open: false, batch: null })}
        batch={singleModal.batch}
        itemName={selectedItem?.itemName ?? ""}
        itemCode={selectedItem?.itemCode ?? ""}
      />

      <BarcodeViewAllModal
        open={allModal}
        onClose={() => setAllModal(false)}
        itemName={selectedItem?.itemName ?? ""}
        itemCode={selectedItem?.itemCode ?? ""}
        batches={selectedItem?.batches ?? []}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PurchaseInvoiceBarCode;