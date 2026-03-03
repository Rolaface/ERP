import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ERP_BASE } from "../../config/api";

// ── Logo loader ───────────────────────────────────────────────────────────────
const loadImageFromUrl = async (url: string): Promise<{ data: string; format: string } | null> => {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "include" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type || "image/png";
    let format = "PNG";
    if (mime.includes("jpeg") || mime.includes("jpg")) format = "JPEG";
    else if (mime.includes("webp")) format = "WEBP";
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror  = () => resolve("");
      reader.readAsDataURL(blob);
    });
    return data ? { data, format } : null;
  } catch {
    return null;
  }
};

const getFullImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ERP_BASE}${path}`;
};

// ── Colors ────────────────────────────────────────────────────────────────────
const BLUE  : [number, number, number] = [44, 62, 80];
const WHITE : [number, number, number] = [255, 255, 255];
const LIGHT : [number, number, number] = [220, 228, 235];

// ── Address lines builder ─────────────────────────────────────────────────────
const addrBlock = (a: any): string[] => {
  if (!a) return [];
  return [
    [a.addressLine1, a.addressLine2].filter(Boolean).join(", "),
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country || "",
    a.phone ? `Ph: ${a.phone}`     : "",
    a.email ? `Email: ${a.email}`  : "",
  ].filter(Boolean);
};

// ─────────────────────────────────────────────────────────────────────────────
export const generatePurchaseInvoicePDF = async (
  po: any,
  company: any,
  resultType: "save" | "bloburl" = "save"
) => {
  const doc      = new jsPDF("p", "mm", "a4");
  const W        = doc.internal.pageSize.width;
  const H        = doc.internal.pageSize.height;
  const currency = po?.currency || "INR";

  doc.setTextColor(0, 0, 0);

  /* ═══════════════════════════════════════════════
     1. LOGO
  ═══════════════════════════════════════════════ */
 let logoH = 0;
const logoW = 30;

if (company?.documents?.companyLogoUrl) {
  const logo = await loadImageFromUrl(
    getFullImageUrl(company.documents.companyLogoUrl)
  );

  if (logo) {
    try {
      logoH = 14;

      // 👉 TOP LEFT POSITION
      doc.addImage(
        logo.data,
        logo.format as any,
        15,   // X position (left margin)
        8,    // Y position
        logoW,
        logoH
      );
    } catch {
      logoH = 0;
    }
  }
}

  /* ═══════════════════════════════════════════════
     2. TITLE
  ═══════════════════════════════════════════════ */
const titleY = 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
doc.text("PURCHASE ORDER", W / 2, titleY, { align: "center" });

  /* ═══════════════════════════════════════════════
     3. COMPANY INFO (left)  +  PO META (right)
  ═══════════════════════════════════════════════ */
const infoY = 32;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(company?.companyName || "Company Name", 15, infoY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  [`TPIN/TAXID: ${company?.tpin || "-"}`,
   `Phone: ${company?.contactInfo?.companyPhone || "-"}`,
   `Email: ${company?.contactInfo?.companyEmail || "-"}`
  ].forEach((l, i) => doc.text(l, 15, infoY + 5 + i * 5));

  const poMetaRows: [string, string][] = [
    ["PI #",         po?.pId       || "-"],
    ["Date:",        po?.poDate     || "-"],
    ["Required By:", po?.requiredBy || "-"],
    ["Status:",      po?.status     || "-"],
  ];
  poMetaRows.forEach(([label, value], i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(label, 130, infoY + i * 5);
    doc.setFont("helvetica", "normal");
    doc.text(value, W - 15, infoY + i * 5, { align: "right" });
  });
/* ═══════════════════════════════════════════════
   4. ADDRESS BOXES — 3 PERFECT PARALLEL COLUMNS
═══════════════════════════════════════════════ */

const HDR   = 8;
const PAD_T = 5;
const PAD_B = 4;
const LH    = 4.5;

const supLines  = addrBlock(po?.addresses?.supplierAddress);
const dispLines = addrBlock(po?.addresses?.dispatchAddress);
const shipLines = addrBlock(po?.addresses?.shippingAddress);

const gap = 5;
const totalWidth = W - 30 - (gap * 2);
const colW = totalWidth / 3;
const boxY = infoY + 24;

// Helper to calculate dynamic height properly
const calculateHeight = (lines: string[], includeName = false) => {
  let height = HDR + PAD_T + PAD_B;

  if (includeName) height += 5;

  lines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, colW - 8);
    height += wrapped.length * LH;
  });

  return height;
};

const supBoxH  = calculateHeight(supLines, true);
const dispBoxH = calculateHeight(dispLines);
const shipBoxH = calculateHeight(shipLines);

const boxH = Math.max(supBoxH, dispBoxH, shipBoxH);

// Render function
const renderAddressBox = (
  x: number,
  title: string,
  lines: string[],
  supplierName?: string
) => {
  // Header
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(x, boxY, colW, HDR, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + colW / 2, boxY + 5.5, { align: "center" });

  // Border
  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(0.3);
  doc.rect(x, boxY, colW, boxH, "D");

  // Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(0, 0, 0);

  let currentY = boxY + HDR + PAD_T;

  // Supplier name only in first column
  if (supplierName) {
    doc.setFont("helvetica", "bold");
    doc.text(supplierName, x + colW / 2, currentY, { align: "center" });
    doc.setFont("helvetica", "normal");
    currentY += 5;
  }

  lines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, colW - 8);
    doc.text(wrapped, x + colW / 2, currentY, { align: "center" });
    currentY += wrapped.length * LH;
  });
};

// Draw 3 columns
renderAddressBox(
  15,
  "Supplier Address:",
  supLines,
  po?.supplierName || "-"
);

renderAddressBox(
  15 + colW + gap,
  "Dispatch Address:",
  dispLines
);

renderAddressBox(
  15 + (colW + gap) * 2,
  "Shipping Address:",
  shipLines
);
  /* ═══════════════════════════════════════════════
     5. INCOTERM + TAX CATEGORY strip
  ═══════════════════════════════════════════════ */
  const stripY = boxY + boxH + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Incoterm: ${po?.incoterm      || "-"}`, 15,       stripY);
  doc.text(`Tax Category: ${po?.taxCategory || "-"}`, W / 2,  stripY);

  /* ═══════════════════════════════════════════════
     6. ITEMS TABLE
  ═══════════════════════════════════════════════ */
  autoTable(doc, {
    startY: stripY + 6,
head: [["Item #", "Description", "Packaging", "UOM", "Unit Price", "Tax %", "Tax Code", "Quantity", "Total"]],
body: (po?.items || []).map((item: any) => {
  const taxRate = po?.tax?.taxRate
    ? po.tax.taxRate
    : "0%";

  return [
  item?.item_code || "-",
  item?.item_name || "-",
`(${item?.packingUnit || 0}) x (${item?.packingSize || 0})`,
  item?.uom || "-",
  Number(item?.rate || 0).toFixed(2),
  taxRate,
item?.VatCd || "-",
  Number(item?.qty || 0).toFixed(2),
  Number(item?.amount || 0).toFixed(2),
];
}),
    styles: { fontSize: 8, halign: "center", textColor: [0, 0, 0] },
    headStyles: { fillColor: [BLUE[0], BLUE[1], BLUE[2]], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [LIGHT[0], LIGHT[1], LIGHT[2]] },
columnStyles: {
  0: { halign: "center", cellWidth: 22 },  // Item #
  1: { halign: "left",   cellWidth: 32, overflow: "linebreak" }, // Description
  2: { halign: "center", cellWidth: 18 },  // Packaging
  3: { halign: "center", cellWidth: 18 },  // UOM
  4: { halign: "right",  cellWidth: 18 },  // Unit Price
  5: { halign: "center", cellWidth: 16 },  // Tax %
  6: { halign: "center", cellWidth: 18 },  // Tax Code
  7: { halign: "right",  cellWidth: 16 },  // Qty
  8: { halign: "right",  cellWidth: 22 },  // Total
},
    margin: { left: 15, right: 15 },
  });
  

  const tableBottom = (doc as any).lastAutoTable.finalY;

  /* ═══════════════════════════════════════════════
     7. SIGNATURE (left)  +  SUMMARY (right)
  ═══════════════════════════════════════════════ */
  const secY = tableBottom + 4;
  const sigW = 85;
  const sumX = 15 + sigW + 5;
  const sumW = W - 15 - sumX;

  // Signature box
  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(0.3);
  doc.rect(15, secY, sigW, 32, "D");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Signature of Authorized Person", 15 + sigW / 2, secY + 22, { align: "center" });
  doc.text("[Title]", 15 + sigW / 2, secY + 27, { align: "center" });

  // Summary table
  const summaryRows = [
    ["Subtotal",            `${Number(po?.summary?.subTotal            || 0).toFixed(2)} ${currency}`],
    ["Tax",                 `${Number(po?.summary?.taxTotal            || 0).toFixed(2)} ${currency}`],
    ["Rounding Adjustment", `${Number(po?.summary?.roundingAdjustment || 0).toFixed(2)} ${currency}`],
    ["Total",               `${Number(po?.summary?.grandTotal          || 0).toFixed(2)} ${currency}`],
  ];

  autoTable(doc, {
    startY: secY,
    head: [],
    body: summaryRows,
    styles: { fontSize: 8.5, textColor: [0, 0, 0], cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 } },
    bodyStyles: { lineColor: [BLUE[0], BLUE[1], BLUE[2]], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [LIGHT[0], LIGHT[1], LIGHT[2]], cellWidth: sumW / 2 },
      1: { halign: "right",                                               cellWidth: sumW / 2 },
    },
    didParseCell: (data) => {
      if (data.row.index === summaryRows.length - 1) {
        data.cell.styles.fillColor = [BLUE[0], BLUE[1], BLUE[2]];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin:     { left: sumX, right: 15 },
    tableWidth: sumW,
  });

  /* ═══════════════════════════════════════════════
     8. TERMS & CONDITIONS
     Only actual term fields — no remarks fallback
  ═══════════════════════════════════════════════ */

let termsY = tableBottom + 50;
const buying = po?.terms?.terms?.buying;

const boxWidth = W - 30;
const textWidth = boxWidth - 8;

let contentLines: string[] = [];

if (buying) {

  if (buying.general)
    contentLines.push(`General: ${buying.general}`);

  if (buying.delivery)
    contentLines.push(`Delivery: ${buying.delivery}`);

  if (buying.payment) {

    contentLines.push("Payment Terms:");

    if (buying.payment.phases?.length) {
      buying.payment.phases.forEach((phase: any, index: number) => {
        contentLines.push(
          `${index + 1}. ${phase.percentage}% - ${phase.condition}`
        );
      });
    }

    if (buying.payment.dueDates)
      contentLines.push(`Due Dates: ${buying.payment.dueDates}`);

    if (buying.payment.lateCharges)
      contentLines.push(`Late Charges: ${buying.payment.lateCharges}`);

    if (buying.payment.notes)
      contentLines.push(`Notes: ${buying.payment.notes}`);
  }

  if (buying.cancellation)
    contentLines.push(`Cancellation: ${buying.cancellation}`);

  if (buying.warranty)
    contentLines.push(`Warranty: ${buying.warranty}`);

  if (buying.liability)
    contentLines.push(`Liability: ${buying.liability}`);

} else {
  contentLines.push("No terms specified.");
}

// ───── Calculate dynamic height ─────
let calculatedHeight = 12;

contentLines.forEach(line => {
  const wrapped = doc.splitTextToSize(line, textWidth);
  calculatedHeight += wrapped.length * 5;
});

// Minimum height safety
const boxHeight = Math.max(30, calculatedHeight + 6);
// 🔴 PAGE BREAK CHECK (ADD THIS)
let finalTermsY = termsY;

if (finalTermsY + boxHeight > H - 20) {
  doc.addPage();
  finalTermsY = 20; // top margin on new page
}

// ───── Draw Box ─────
doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
doc.setLineWidth(0.3);
doc.rect(15, finalTermsY, boxWidth, boxHeight, "D");

// ───── Title ─────
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
doc.text("Terms & Conditions", 19, finalTermsY + 6);

// ───── Content ─────
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(0, 0, 0);
let currentY = finalTermsY + 12;
contentLines.forEach(line => {
  const wrapped = doc.splitTextToSize(line, textWidth);
  doc.text(wrapped, 19, currentY);
  currentY += wrapped.length * 5;
});

  /* ═══════════════════════════════════════════════
     9. FOOTER
  ═══════════════════════════════════════════════ */
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Powered by ERP System", 105, H - 10, { align: "center" });
  doc.text(`Created By: ${po?.metadata?.createdBy || "-"}`, 105, H - 5, { align: "center" });

  doc.setTextColor(0, 0, 0);

if (resultType === "save") {
  doc.save(`Purchase_Order_${po?.poId}.pdf`);
  return;
}

const blob = doc.output("blob");
const url = URL.createObjectURL(blob);
return url;
};