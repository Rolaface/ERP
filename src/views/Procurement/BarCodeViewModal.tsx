// components/BarcodeViewModal.tsx
import React from "react";

// Fallback SVG barcode generator (used only when barcode_image_url is absent)
export const buildBars = (val: string): string => {
  const W = 180, H = 48;
  const seed = String(val).split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 7), 0);
  const unitW = (W - 8) / 42;
  let x = 4, rects = "";

  for (let b = 0; b < 42; b++) {
    const barW = Math.max(1, Math.min(3, 1 + ((seed * (b * 13 + 7)) % 17) % 3)) * unitW / 2;
    if ((seed * (b + 3) * 11) % 5 !== 0) {
      rects += `<rect x="${x.toFixed(1)}" y="0" width="${barW.toFixed(1)}" height="${H}" fill="currentColor"/>`;
    }
    x += barW + ((((seed * (b + 1) * 3) % 3) + 1) * unitW) / 3;
    if (x > W - 4) break;
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    style="width:100%;max-width:180px;height:${H}px">${rects}</svg>`;
};

export interface BatchRow {
  batchNumber: string;
  barcodeId: string;
  quantity: number;
  manufactureDate: string;
  expiryDate: string;
  postDate: string;
  supplierName: string;
  barcodeImageUrl?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  batch: BatchRow | null;
  itemName: string;
  itemCode: string;
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";


const buildSinglePrintHTML = (batch: BatchRow, itemName: string, itemCode: string): string => {
  const barcodeBlock = batch.barcodeImageUrl
    ? `<img src="${batch.barcodeImageUrl}" alt="barcode" style="max-width:180px;height:48px;object-fit:contain;display:block;margin:0 auto"/>`
    : buildBars(batch.barcodeId);

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Barcode — ${batch.batchNumber}</title>
<style>
  @page{size:A4;margin:18mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;color:#111;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{border:1px solid #ddd;border-radius:8px;padding:28px 32px;display:flex;flex-direction:column;align-items:center;gap:10px;max-width:320px;width:100%}
  .label{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
  .value{font-size:13px;font-weight:600;color:#111;font-family:monospace}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;margin-top:8px}
  .meta-cell{background:#f8f9fa;border-radius:4px;padding:7px 9px}
  .badge{font-size:10px;padding:2px 8px;border-radius:4px;background:#f3f4f6;border:1px solid #e5e7eb;color:#555;font-family:monospace}
</style></head><body>
<div class="card">
  <p style="font-size:15px;font-weight:700;color:#111;text-align:center">${itemName}</p>
  <p style="font-size:11px;color:#666;font-family:monospace">${itemCode}</p>
  <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0;color:#111">
    ${barcodeBlock}
    <p style="font-size:12px;font-family:monospace;letter-spacing:.14em;color:#111">${batch.barcodeId}</p>
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
    <span class="badge">Batch: ${batch.batchNumber}</span>
    <span class="badge">Qty: ${batch.quantity}</span>
  </div>
  <div class="meta">
    <div class="meta-cell"><div class="label">Mfg Date</div><div class="value" style="font-size:12px">${fmtDate(batch.manufactureDate)}</div></div>
    <div class="meta-cell"><div class="label">Exp Date</div><div class="value" style="font-size:12px">${fmtDate(batch.expiryDate)}</div></div>
    ${batch.postDate ? `<div class="meta-cell"><div class="label">Post Date</div><div class="value" style="font-size:12px">${fmtDate(batch.postDate)}</div></div>` : ""}
    ${batch.supplierName ? `<div class="meta-cell"><div class="label">Supplier</div><div class="value" style="font-size:12px">${batch.supplierName}</div></div>` : ""}
  </div>
</div>
</body></html>`;
};

// ── Component ─────────────────────────────────────────────────────────────────

const BarcodeViewModal: React.FC<Props> = ({ open, onClose, batch, itemName, itemCode }) => {
  if (!open || !batch) return null;

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=794,height=1123");
    if (!w) return;
    w.document.write(buildSinglePrintHTML(batch, itemName, itemCode));
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const handleDownload = () => {
    const blob = new Blob([buildSinglePrintHTML(batch, itemName, itemCode)], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `barcode-${batch.batchNumber}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const BarcodeDisplay = () =>
    batch.barcodeImageUrl ? (
      <img
        src={batch.barcodeImageUrl}
        alt="barcode"
        style={{ maxWidth:180, height:48, objectFit:"contain", display:"block" }}
      />
    // ) : (
    //   <div
    //     style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", color:"var(--text,#111)" }}
    //     dangerouslySetInnerHTML={{ __html: buildBars(batch.barcodeId) }}
    //   />
    // );
    ) : (
  <p style={{ fontSize:11, color:"var(--muted,#888)", margin:0 }}>No barcode image</p>
);

  const metaFields = [
    { label:"Mfg Date",  value: fmtDate(batch.manufactureDate) },
    { label:"Exp Date",  value: fmtDate(batch.expiryDate)      },
    ...(batch.postDate    ? [{ label:"Post Date", value: fmtDate(batch.postDate)  }] : []),
    ...(batch.supplierName ? [{ label:"Supplier",  value: batch.supplierName      }] : []),
  ];

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:1050,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(2px)" }} />
      <div style={{
        position:"fixed",top:"50%",left:"50%",zIndex:1051,
        transform:"translate(-50%,-50%)",
        width:"min(380px,95vw)",
        background:"var(--card,#fff)",color:"var(--text,#111)",
        borderRadius:10,border:"0.5px solid var(--border,#e5e7eb)",
        display:"flex",flexDirection:"column",
        boxShadow:"0 8px 40px rgba(0,0,0,0.15)",overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"0.5px solid var(--border,#e5e7eb)",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:30,height:30,borderRadius:7,background:"#178ee0",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 9v1M3 14v1M8 9v6M11 9v1M11 14v1M14 9v6M17 9v1M17 14v1M20 9v6"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize:14,fontWeight:600,margin:0 }}>{itemName}</p>
              <p style={{ fontSize:10,color:"var(--muted,#888)",margin:0,fontFamily:"monospace" }}>{batch.batchNumber}</p>
            </div>
          </div>
          <div style={{ display:"flex",gap:6 }}>
            <button onClick={handlePrint} style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,fontSize:12,fontWeight:500,cursor:"pointer",border:"0.5px solid var(--border,#e5e7eb)",background:"transparent",color:"var(--text,#111)" }}>
              🖨 Print
            </button>
            <button onClick={handleDownload} style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,fontSize:12,fontWeight:500,cursor:"pointer",border:"none",background:"#178ee0",color:"#fff" }}>
              ↓ Save
            </button>
            <button onClick={onClose} style={{ width:26,height:26,borderRadius:6,cursor:"pointer",border:"0.5px solid var(--border,#e5e7eb)",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted,#888)" }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"18px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10 }}>
          <p style={{ fontSize:11,color:"var(--muted,#888)",fontFamily:"monospace",margin:0 }}>{itemCode}</p>

          {/* Barcode image or SVG */}
          <div style={{ width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0" }}>
            <BarcodeDisplay />
            <p style={{ fontSize:13,fontFamily:"monospace",letterSpacing:".14em",margin:0 }}>{batch.barcodeId}</p>
          </div>

          {/* Badges */}
          <div style={{ display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center" }}>
            {[`Batch: ${batch.batchNumber}`, `Qty: ${batch.quantity}`].map(l => (
              <span key={l} style={{ fontSize:10,padding:"2px 8px",borderRadius:4,background:"var(--bg,#f3f4f6)",border:"0.5px solid var(--border,#e5e7eb)",color:"var(--muted,#666)",fontFamily:"monospace" }}>{l}</span>
            ))}
          </div>

          {/* Meta grid */}
          {metaFields.length > 0 && (
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",marginTop:4 }}>
              {metaFields.map(({ label, value }) => (
                <div key={label} style={{ background:"var(--bg,#f8f9fa)",borderRadius:6,padding:"7px 9px" }}>
                  <p style={{ fontSize:9,color:"var(--muted,#888)",textTransform:"uppercase",letterSpacing:".06em",margin:"0 0 2px" }}>{label}</p>
                  <p style={{ fontSize:12,fontWeight:500,margin:0 }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BarcodeViewModal;