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
export const generatePurchaseOrderPDF = async (
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
  let logoH   = 0;
  const logoW = 40;

  if (company?.documents?.companyLogoUrl) {
    const logo = await loadImageFromUrl(getFullImageUrl(company.documents.companyLogoUrl));
    if (logo) {
      try {
        logoH = 14;
        doc.addImage(logo.data, logo.format as any, (W - logoW) / 2, 8, logoW, logoH);
      } catch { logoH = 0; }
    }
  }

  /* ═══════════════════════════════════════════════
     2. TITLE
  ═══════════════════════════════════════════════ */
  const titleY = logoH > 0 ? 8 + logoH + 6 : 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text("PURCHASE ORDER", 105, titleY, { align: "center" });

  /* ═══════════════════════════════════════════════
     3. COMPANY INFO (left)  +  PO META (right)
  ═══════════════════════════════════════════════ */
  const infoY = titleY + 7;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(company?.companyName || "Company Name", 15, infoY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  [`TPIN: ${company?.tpin || "-"}`,
   `Phone: ${company?.contactInfo?.companyPhone || "-"}`,
   `Email: ${company?.contactInfo?.companyEmail || "-"}`
  ].forEach((l, i) => doc.text(l, 15, infoY + 5 + i * 5));

  const poMetaRows: [string, string][] = [
    ["PO #",         po?.poId       || "-"],
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
    head: [["Item #", "Description", "UOM", "Unit Price", "Quantity", "Total"]],
    body: (po?.items || []).map((item: any) => [
      item?.item_code || "-",
      item?.item_name || "-",
      item?.uom       || "-",
      Number(item?.rate   || 0).toFixed(2),
      Number(item?.qty    || 0).toFixed(2),
      Number(item?.amount || 0).toFixed(2),
    ]),
    styles: { fontSize: 8, halign: "center", textColor: [0, 0, 0] },
    headStyles: { fillColor: [BLUE[0], BLUE[1], BLUE[2]], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [LIGHT[0], LIGHT[1], LIGHT[2]] },
    columnStyles: {
      0: { halign: "center", cellWidth: 30 },
      1: { halign: "left"                  },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "right",  cellWidth: 24 },
      4: { halign: "right",  cellWidth: 22 },
      5: { halign: "right",  cellWidth: 24 },
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
  const termsY = Math.max(secY + 36, (doc as any).lastAutoTable.finalY + 5);

  const buying = po?.terms?.terms?.buying;
  const termsContent: string[] = [];
  if (buying?.general)        termsContent.push(`General: ${buying.general}`);
  if (buying?.delivery)       termsContent.push(`Delivery: ${buying.delivery}`);
  if (buying?.payment?.notes) termsContent.push(`Payment: ${buying.payment.notes}`);
  if (buying?.warranty)       termsContent.push(`Warranty: ${buying.warranty}`);
  if (buying?.cancellation)   termsContent.push(`Cancellation: ${buying.cancellation}`);
  if (buying?.liability)      termsContent.push(`Liability: ${buying.liability}`);

  // Box height: enough for content, min 28mm
  const termsBoxH = Math.max(28, 10 + termsContent.length * 5 + 6);

  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(0.3);
  doc.rect(15, termsY, W - 30, termsBoxH, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text("Terms & Conditions:", 19, termsY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  if (termsContent.length > 0) {
    termsContent.forEach((line, i) => {
      const wrapped = doc.splitTextToSize(line, W - 38);
      doc.text(wrapped, 19, termsY + 13 + i * 5);
    });
  } else {
    doc.setTextColor(140, 140, 140);
    doc.text("No terms specified.", 19, termsY + 13);
  }

  /* ═══════════════════════════════════════════════
     9. FOOTER
  ═══════════════════════════════════════════════ */
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Powered by ERP System", 105, H - 10, { align: "center" });
  doc.text(`Created By: ${po?.metadata?.createdBy || "-"}`, 105, H - 5, { align: "center" });

  doc.setTextColor(0, 0, 0);

  return resultType === "save"
    ? doc.save(`Purchase_Order_${po?.poId}.pdf`)
    : doc.output("bloburl");
};