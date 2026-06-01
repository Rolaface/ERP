// pages/BarcodeSearchPage.tsx
import React, { useState } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, { ActionGroup } from "../../components/ui/Table/ActionButton";
import BarcodeViewModal from "./BarCodeViewModal";
import BarcodeViewAllModal from "./BarCodeViewAllModal";

export interface BatchRow {
  batchNumber: string;
  barcodeId: string;
  quantity: number;
  manufactureDate: string;
  expiryDate: string;
  postDate: string;
  supplierName: string;
}

export interface ItemSearchResult {
  itemCode: string;
  itemName: string;
  batches: BatchRow[];
}

export const DUMMY_ITEMS: ItemSearchResult[] = [
  {
    itemCode: "STO-ITEM-2026-00003",
    itemName: "Langda Aam",
    batches: [
      { batchNumber: "BATCH-2026-00001", barcodeId: "123456789", quantity: 50,  manufactureDate: "2026-04-01", expiryDate: "2026-08-01", postDate: "2026-05-01", supplierName: "Bicchu Pandey" },
      { batchNumber: "BATCH-2026-00002", barcodeId: "987654321", quantity: 30,  manufactureDate: "2026-04-10", expiryDate: "2026-08-10", postDate: "2026-05-05", supplierName: "Bicchu Pandey" },
      { batchNumber: "BATCH-2026-00003", barcodeId: "112233445", quantity: 20,  manufactureDate: "2026-04-20", expiryDate: "2026-08-20", postDate: "2026-05-10", supplierName: "Ravi Traders"  },
    ],
  },
  {
    itemCode: "STO-ITEM-2026-00010",
    itemName: "Basmati Rice 5kg",
    batches: [
      { batchNumber: "BATCH-2026-00010", barcodeId: "556677889", quantity: 100, manufactureDate: "2026-03-01", expiryDate: "2027-03-01", postDate: "2026-04-01", supplierName: "Negi & Sons"   },
      { batchNumber: "BATCH-2026-00011", barcodeId: "443322110", quantity: 80,  manufactureDate: "2026-03-15", expiryDate: "2027-03-15", postDate: "2026-04-15", supplierName: "Negi & Sons"   },
    ],
  },
  {
    itemCode: "STO-ITEM-2026-00020",
    itemName: "Turmeric Powder",
    batches: [
      { batchNumber: "BATCH-2026-00020", barcodeId: "100200300", quantity: 200, manufactureDate: "2026-02-01", expiryDate: "2027-02-01", postDate: "2026-03-01", supplierName: "Delhi Supplies" },
      { batchNumber: "BATCH-2026-00021", barcodeId: "400500600", quantity: 150, manufactureDate: "2026-02-15", expiryDate: "2027-02-15", postDate: "2026-03-10", supplierName: "Delhi Supplies" },
      { batchNumber: "BATCH-2026-00022", barcodeId: "700800900", quantity: 120, manufactureDate: "2026-03-01", expiryDate: "2027-03-01", postDate: "2026-03-20", supplierName: "Sharma Ent."    },
      { batchNumber: "BATCH-2026-00023", barcodeId: "111222333", quantity: 90,  manufactureDate: "2026-03-10", expiryDate: "2027-03-10", postDate: "2026-03-25", supplierName: "Sharma Ent."    },
    ],
  },
  {
    itemCode: "STO-ITEM-2026-00030",
    itemName: "Mustard Oil 1L",
    batches: [
      { batchNumber: "BATCH-2026-00030", barcodeId: "999888777", quantity: 60,  manufactureDate: "2026-01-10", expiryDate: "2027-01-10", postDate: "2026-02-01", supplierName: "Sharma Ent."    },
    ],
  },
];

const formatDate = (d: string) => {
  if (!d) return "—";
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const [year, month, day] = d.split("T")[0].split("-").map(Number);
  return `${String(day).padStart(2,"0")}-${months[month-1]}-${year}`;
};

const BarcodeSearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedItem, setSelectedItem]       = useState<ItemSearchResult | null>(null);

  // Single barcode modal
  const [singleModal, setSingleModal] = useState<{ open: boolean; batch: BatchRow | null }>
    ({ open: false, batch: null });

  // View all modal
  const [allModal, setAllModal] = useState(false);

  // ── Item search results ──────────────────────────────────────────────────
  const itemResults = searchTerm.trim().length > 0
    ? DUMMY_ITEMS.filter(i =>
        i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // ── Batch table columns ──────────────────────────────────────────────────
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
          <code className="block font-mono text-sm">{r.barcodeId}</code>
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
      key: "postDate",
      header: "Post Date",
      render: (r) => (
        <div className="py-1.5">
          <span className="block">{formatDate(r.postDate)}</span>
        </div>
      ),
    },
    {
      key: "supplierName",
      header: "Supplier Name",
      render: (r) => (
        <div className="py-1.5">
          <span className="block">{r.supplierName}</span>
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
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-4">

      {/* ── Search bar + View All ─────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ position:"relative", flex:1, maxWidth:420 }}>
          <svg style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--muted,#888)" }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search item name or code…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedItem(null);
            }}
            style={{ width:"100%",padding:"8px 12px 8px 32px",borderRadius:7,border:"0.5px solid var(--border,#e5e7eb)",background:"var(--card,#fff)",color:"var(--text,#111)",fontSize:13,outline:"none" }}
          />
          {/* Dropdown suggestions */}
          {itemResults.length > 0 && !selectedItem && (
            <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--card,#fff)",border:"0.5px solid var(--border,#e5e7eb)",borderRadius:7,zIndex:50,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
              {itemResults.map((item) => (
                <div key={item.itemCode}
                  onClick={() => { setSelectedItem(item); setSearchTerm(item.itemName); }}
                  style={{ padding:"9px 12px",cursor:"pointer",borderBottom:"0.5px solid var(--border,#e5e7eb)",fontSize:13 }}
                  onMouseEnter={e => (e.currentTarget.style.background="var(--bg,#f8f9fa)")}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                >
                  <p style={{ margin:0,fontWeight:500 }}>{item.itemName}</p>
                  <p style={{ margin:0,fontSize:11,color:"var(--muted,#888)",fontFamily:"monospace" }}>{item.itemCode} · {item.batches.length} batch{item.batches.length !== 1 ? "es" : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All button — only when an item is selected with 2+ batches */}
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

      {/* ── Selected item header ──────────────────────────────────────────── */}
      {selectedItem && (
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--bg,#f8f9fa)",borderRadius:7,border:"0.5px solid var(--border,#e5e7eb)" }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:"#178ee0",flexShrink:0 }} />
          <div>
            <p style={{ margin:0,fontSize:13,fontWeight:600 }}>{selectedItem.itemName}</p>
            <p style={{ margin:0,fontSize:11,color:"var(--muted,#888)",fontFamily:"monospace" }}>{selectedItem.itemCode}</p>
          </div>
          <button
            onClick={() => { setSelectedItem(null); setSearchTerm(""); }}
            style={{ marginLeft:"auto",width:24,height:24,borderRadius:5,border:"0.5px solid var(--border,#e5e7eb)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted,#888)",fontSize:13 }}
          >✕</button>
        </div>
      )}

      {/* ── Batch table ───────────────────────────────────────────────────── */}
      {selectedItem ? (
        <Table
          columns={batchColumns}
          data={selectedItem.batches}
          tableId="barcode-batch-table"
          rowKey={(r) => r.batchNumber}
          loading={false}
          showToolbar={false}
          emptyMessage="No batches found"
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
          <p style={{ fontSize:13,margin:0 }}>Search for an item to view its batches</p>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
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
    </div>
  );
};

export default BarcodeSearchPage;