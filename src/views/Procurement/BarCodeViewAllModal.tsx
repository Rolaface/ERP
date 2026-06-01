import React from "react";

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
 }
 
 export interface ItemSearchResult {
   itemCode: string;
   itemName: string;
   batches: BatchRow[];
 }
 

interface Props {
  open: boolean;
  onClose: () => void;
  itemName: string;
  itemCode: string;
  batches: BatchRow[];
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const buildAllPrintHTML = (batches: BatchRow[], itemName: string, itemCode: string): string => {
  const cards = batches.map(b => `
    <div style="border:1px solid #ddd;border-radius:6px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px;break-inside:avoid">
      <p style="margin:0;font-size:11px;font-weight:700;color:#111;text-align:center">${b.batchNumber}</p>
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0;color:#111">
        ${buildBars(b.barcodeId)}
        <p style="margin:0;font-size:11px;font-family:monospace;letter-spacing:.12em;color:#111">${b.barcodeId}</p>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center">
        <span style="font-size:9px;padding:2px 6px;border-radius:3px;background:#f3f4f6;border:1px solid #e5e7eb;color:#555;font-family:monospace">Qty: ${b.quantity}</span>
        <span style="font-size:9px;padding:2px 6px;border-radius:3px;background:#f3f4f6;border:1px solid #e5e7eb;color:#555;font-family:monospace">Exp: ${fmtDate(b.expiryDate)}</span>
        <span style="font-size:9px;padding:2px 6px;border-radius:3px;background:#f3f4f6;border:1px solid #e5e7eb;color:#555;font-family:monospace">Sup: ${b.supplierName}</span>
      </div>
    </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>All Barcodes — ${itemName}</title>
<style>
  @page{size:A4;margin:16mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;color:#111;background:#fff}
  .header{border-bottom:2px solid #178ee0;padding-bottom:10px;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media print{.grid{page-break-inside:auto}}
</style></head><body>
<div class="header">
  <h1 style="font-size:15px;font-weight:700;color:#178ee0">${itemName}</h1>
  <p style="font-size:11px;color:#666;font-family:monospace;margin-top:3px">${itemCode} · ${batches.length} batch${batches.length !== 1 ? "es" : ""}</p>
  <p style="font-size:10px;color:#999;margin-top:2px">Printed: ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</p>
</div>
<div class="grid">${cards}</div>
</body></html>`;
};

const BarcodeViewAllModal: React.FC<Props> = ({ open, onClose, itemName, itemCode, batches }) => {
  if (!open) return null;

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=794,height=1123");
    if (!w) return;
    w.document.write(buildAllPrintHTML(batches, itemName, itemCode));
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  const handleDownload = () => {
    const blob = new Blob([buildAllPrintHTML(batches, itemName, itemCode)], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `barcodes-${itemCode}-all.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:1050,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(2px)" }} />
      <div style={{
        position:"fixed",top:"50%",left:"50%",zIndex:1051,
        transform:"translate(-50%,-50%)",
        width:"min(660px,95vw)",maxHeight:"90vh",
        background:"var(--card,#fff)",color:"var(--text,#111)",
        borderRadius:10,border:"0.5px solid var(--border,#e5e7eb)",
        display:"flex",flexDirection:"column",
        boxShadow:"0 8px 40px rgba(0,0,0,0.15)",overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"0.5px solid var(--border,#e5e7eb)",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:30,height:30,borderRadius:7,background:"#178ee0",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 9v1M3 14v1M8 9v6M11 9v1M11 14v1M14 9v6M17 9v1M17 14v1M20 9v6"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize:14,fontWeight:600,margin:0 }}>{itemName}</p>
              <p style={{ fontSize:10,color:"var(--muted,#888)",margin:0,fontFamily:"monospace" }}>
                {itemCode} · {batches.length} batch{batches.length !== 1 ? "es" : ""}
              </p>
            </div>
          </div>
          <div style={{ display:"flex",gap:6,alignItems:"center" }}>
            <button onClick={handlePrint} style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,fontSize:12,fontWeight:500,cursor:"pointer",border:"0.5px solid var(--border,#e5e7eb)",background:"transparent",color:"var(--text,#111)" }}>
              🖨 Print All
            </button>
            <button onClick={handleDownload} style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,fontSize:12,fontWeight:500,cursor:"pointer",border:"none",background:"#178ee0",color:"#fff" }}>
              ↓ Download All
            </button>
            <button onClick={onClose} style={{ width:26,height:26,borderRadius:6,cursor:"pointer",border:"0.5px solid var(--border,#e5e7eb)",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted,#888)" }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"14px 16px",overflowY:"auto",flex:1 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {batches.map((b, i) => (
              <div key={i} style={{ border:"0.5px solid var(--border,#e5e7eb)",borderRadius:8,padding:"12px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                <p style={{ fontSize:11,fontWeight:600,margin:0,fontFamily:"monospace",textAlign:"center" }}>{b.batchNumber}</p>
                <div style={{ width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0",color:"var(--text,#111)" }}
                  dangerouslySetInnerHTML={{ __html: buildBars(b.barcodeId) }} />
                <p style={{ fontSize:11,fontFamily:"monospace",letterSpacing:".12em",margin:0 }}>{b.barcodeId}</p>
                <div style={{ display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center" }}>
                  {[`Qty: ${b.quantity}`,`Exp: ${fmtDate(b.expiryDate)}`,`${b.supplierName}`].map(l => (
                    <span key={l} style={{ fontSize:9,padding:"2px 6px",borderRadius:3,background:"var(--bg,#f3f4f6)",border:"0.5px solid var(--border,#e5e7eb)",color:"var(--muted,#666)",fontFamily:"monospace" }}>{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BarcodeViewAllModal;