import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ERP_BASE } from "../../config/api";

// ── Colors (same as PO) ───────────────────────────────────────────────────────
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
    a.phone ? `Ph: ${a.phone}`    : "",
    a.email ? `Email: ${a.email}` : "",
  ].filter(Boolean);
};

// ─────────────────────────────────────────────────────────────────────────────
export const generatePurchaseInvoicePDF = async (
  inv: any,
  company: any,
  resultType: "save" | "bloburl" = "save"
) => {
  const doc      = new jsPDF("p", "mm", "a4");
  const W        = doc.internal.pageSize.width;
  const H        = doc.internal.pageSize.height;
  const currency = inv?.currency || "INR";

  doc.setTextColor(0, 0, 0);

  /* ═══════════════════════════════════════════════
     1. LOGO  (same loader as PO)
  ═══════════════════════════════════════════════ */
  if (company?.documents?.companyLogoUrl) {
    const logoPath    = company.documents.companyLogoUrl;
    const fullLogoUrl = logoPath.startsWith("http") ? logoPath : `${ERP_BASE}${logoPath}`;
    try {
      doc.addImage(fullLogoUrl, "PNG", 15, 6, 40, 20);
    } catch (e) {
      console.log("Logo error:", e);
    }
  }

  /* ═══════════════════════════════════════════════
     2. TITLE
  ═══════════════════════════════════════════════ */
  const titleY = 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text("PURCHASE INVOICE", W / 2, titleY, { align: "center" });

  /* ═══════════════════════════════════════════════
     3. COMPANY INFO (left)  +  INVOICE META (right)
     Fields mapped from API response:
       pId, spplrInvcNo, pDate, requiredBy,
       status, lpoNumber, project, costCenter,
       paymentMethod
  ═══════════════════════════════════════════════ */
  const infoY = 32;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(company?.companyName || "Company Name", 15, infoY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  [
    `TPIN: ${company?.tpin                         || "-"}`,
    `Phone: ${company?.contactInfo?.companyPhone   || "-"}`,
    `Email: ${company?.contactInfo?.companyEmail   || "-"}`,
  ].forEach((l, i) => doc.text(l, 15, infoY + 5 + i * 5));

  // Right-side meta — all invoice-specific fields
  const invMetaRows: [string, string][] = [
    ["Invoice #:",        inv?.pId            || "-"],
    ["Supplier Inv #:",   inv?.spplrInvcNo    || "-"],
    ["Date:",             inv?.pDate          || "-"],
    ["Required By:",      inv?.requiredBy     || "-"],
    ["Status:",           inv?.status         || "-"],
    ["LPO Number:",       inv?.lpoNumber      || "-"],
    ["Project:",          inv?.project        || "-"],
    ["Cost Center:",      inv?.costCenter     || "-"],
    ["Payment Method:",   inv?.paymentMethod  || "-"],
  ];

  // Two right-side columns start at different Y; 8 rows × 4.5 gap = 36mm
  // We shrink line-gap to 4 so all 9 rows fit without overlapping section 4
  invMetaRows.forEach(([label, value], i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(label, 118, infoY + i * 4.2);
    doc.setFont("helvetica", "normal");
    doc.text(value, W - 15, infoY + i * 4.2, { align: "right" });
  });

  /* ═══════════════════════════════════════════════
     4. ADDRESS BOXES — compact 3-column (same as PO)
  ═══════════════════════════════════════════════ */
  const HDR   = 7;
  const PAD_T = 3;
  const PAD_B = 3;
  const LH    = 4;

  const supLines  = addrBlock(inv?.addresses?.supplierAddress);
  const dispLines = addrBlock(inv?.addresses?.dispatchAddress);
  const shipLines = addrBlock(inv?.addresses?.shippingAddress);

  const gap        = 5;
  const totalWidth = W - 30 - gap * 2;
  const colW       = totalWidth / 3;

  // Push boxY down enough to clear the taller meta block (9 rows × 4.2 = ~38)
  const boxY = infoY + 42;

  const calculateHeight = (lines: string[], includeName = false) => {
    let h = HDR + PAD_T + PAD_B;
    if (includeName) h += LH + 1;
    lines.forEach(line => {
      const wrapped = doc.splitTextToSize(line, colW - 8);
      h += wrapped.length * LH;
    });
    return h;
  };

  const boxH = Math.max(
    calculateHeight(supLines, true),
    calculateHeight(dispLines),
    calculateHeight(shipLines)
  );

  const renderAddressBox = (
    x: number,
    title: string,
    lines: string[],
    supplierName?: string
  ) => {
    // Header bar
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.rect(x, boxY, colW, HDR, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(title, x + colW / 2, boxY + 5, { align: "center" });

    // Border
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.3);
    doc.rect(x, boxY, colW, boxH, "D");

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);

    let cy = boxY + HDR + PAD_T;

    if (supplierName) {
      doc.setFont("helvetica", "bold");
      doc.text(supplierName, x + colW / 2, cy, { align: "center" });
      doc.setFont("helvetica", "normal");
      cy += LH + 1;
    }

    lines.forEach(line => {
      const wrapped = doc.splitTextToSize(line, colW - 8);
      doc.text(wrapped, x + colW / 2, cy, { align: "center" });
      cy += wrapped.length * LH;
    });
  };

  renderAddressBox(15,                    "Supplier Address:",  supLines, inv?.supplierName || "-");
  renderAddressBox(15 + colW + gap,       "Dispatch Address:",  dispLines);
  renderAddressBox(15 + (colW + gap) * 2, "Shipping Address:",  shipLines);

  /* ═══════════════════════════════════════════════
     5. INCOTERM + TAX CATEGORY strip
  ═══════════════════════════════════════════════ */
  const stripY = boxY + boxH + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Incoterm: ${inv?.incoterm       || "-"}`, 15,      stripY);
  doc.text(`Tax Category: ${inv?.taxCategory || "-"}`, W / 2,  stripY);

  /* ═══════════════════════════════════════════════
     6. ITEMS TABLE
     Note: API uses VatCd (capital V) — mapped here
  ═══════════════════════════════════════════════ */
  autoTable(doc, {
    startY: stripY + 6,
    head: [["Item #", "Description", "Packaging", "UOM", "Unit Price", "Tax %", "Tax Code", "Quantity", "Total"]],
    body: (inv?.items || []).map((item: any) => {
      const taxRate = inv?.tax?.taxRate ? inv.tax.taxRate : "0%";
      return [
        item?.item_code                                      || "-",
        item?.item_name                                      || "-",
        `(${item?.packingUnit || 0}) x (${item?.packingSize || 0})`,
        item?.uom                                            || "-",
        Number(item?.rate   || 0).toFixed(2),
        taxRate,
        item?.VatCd || item?.vatCd                          || "-",   // ← capital V from API
        Number(item?.qty    || 0).toFixed(2),
        Number(item?.amount || 0).toFixed(2),
      ];
    }),
    styles:             { fontSize: 8, halign: "center", textColor: [0, 0, 0] },
    headStyles:         { fillColor: [BLUE[0], BLUE[1], BLUE[2]], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [LIGHT[0], LIGHT[1], LIGHT[2]] },
    columnStyles: {
      0: { halign: "center", cellWidth: 22 },
      1: { halign: "left",   cellWidth: 32, overflow: "linebreak" },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "right",  cellWidth: 18 },
      5: { halign: "center", cellWidth: 16 },
      6: { halign: "center", cellWidth: 18 },
      7: { halign: "right",  cellWidth: 16 },
      8: { halign: "right",  cellWidth: 22 },
    },
    margin: { left: 15, right: 15 },
  });

  const tableBottom = (doc as any).lastAutoTable.finalY;

  /* ═══════════════════════════════════════════════
     7. SIGNATURE (left)  +  SUMMARY (right)
     Same signature loader as PO (logo/sign URL)
  ═══════════════════════════════════════════════ */
  const secY = tableBottom + 4;
  const sigW = 85;
  const sumX = 15 + sigW + 5;
  const sumW = W - 15 - sumX;

  // Signature box
  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(0.3);
  doc.rect(15, secY, sigW, 32, "D");

  if (company?.documents?.authorizedSignatureUrl) {
    const signPath    = company.documents.authorizedSignatureUrl;
    const fullSignUrl = signPath.startsWith("http") ? signPath : `${ERP_BASE}${signPath}`;
    try {
      const imgW = 55;
      const imgH = 18;
      const imgX = 15 + (sigW - imgW) / 2;
      const imgY = secY + 5;
      const fmt  = fullSignUrl.toLowerCase().includes(".jpg") || fullSignUrl.toLowerCase().includes(".jpeg") ? "JPEG" : "PNG";
      doc.addImage(fullSignUrl, fmt, imgX, imgY, imgW, imgH);
    } catch (e) {
      console.log("Signature error:", e);
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Signature of Authorized Person", 15 + sigW / 2, secY + 22, { align: "center" });
    doc.text("[Title]", 15 + sigW / 2, secY + 27, { align: "center" });
  }

  // Summary table
  const summaryRows = [
    ["Subtotal",            `${Number(inv?.summary?.subTotal            || 0).toFixed(2)} ${currency}`],
    ["Tax",                 `${Number(inv?.summary?.taxTotal            || 0).toFixed(2)} ${currency}`],
    ["Rounding Adjustment", `${Number(inv?.summary?.roundingAdjustment || 0).toFixed(2)} ${currency}`],
    ["Total",               `${Number(inv?.summary?.grandTotal          || 0).toFixed(2)} ${currency}`],
  ];

  autoTable(doc, {
    startY: secY,
    head:   [],
    body:   summaryRows,
    styles:      { fontSize: 8.5, textColor: [0, 0, 0], cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 } },
    bodyStyles:  { lineColor: [BLUE[0], BLUE[1], BLUE[2]], lineWidth: 0.2 },
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
     8. TERMS & CONDITIONS  (dynamic — same as PO)
  ═══════════════════════════════════════════════ */
  const summaryBottom = (doc as any).lastAutoTable.finalY;
  const termsY        = Math.max(secY + 36, summaryBottom) + 6;

  const buying    = inv?.terms?.terms?.buying;
  const boxWidth  = W - 30;
  const textWidth = boxWidth - 8;

  let contentLines: string[] = [];

  if (buying) {
    if (buying.general)    contentLines.push(`General: ${buying.general}`);
    if (buying.delivery)   contentLines.push(`Delivery: ${buying.delivery}`);
    if (buying.payment) {
      contentLines.push("Payment Terms:");
      if (buying.payment.phases?.length) {
        buying.payment.phases.forEach((phase: any, i: number) => {
          contentLines.push(`${i + 1}. ${phase.percentage}% - ${phase.condition}`);
        });
      }
      if (buying.payment.dueDates)    contentLines.push(`Due Dates: ${buying.payment.dueDates}`);
      if (buying.payment.lateCharges) contentLines.push(`Late Charges: ${buying.payment.lateCharges}`);
      if (buying.payment.notes)       contentLines.push(`Notes: ${buying.payment.notes}`);
    }
    if (buying.cancellation) contentLines.push(`Cancellation: ${buying.cancellation}`);
    if (buying.warranty)     contentLines.push(`Warranty: ${buying.warranty}`);
    if (buying.liability)    contentLines.push(`Liability: ${buying.liability}`);
  } else {
    contentLines.push("No terms specified.");
  }

  // Dynamic height
  let calcH = 12;
  contentLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, textWidth);
    calcH += wrapped.length * 5;
  });
  const boxHeight = Math.max(30, calcH + 6);

  // Page break check
  let finalTermsY = termsY;
  if (finalTermsY + boxHeight > H - 20) {
    doc.addPage();
    finalTermsY = 20;
  }

  // Draw box
  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(0.3);
  doc.rect(15, finalTermsY, boxWidth, boxHeight, "D");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.text("Terms & Conditions", 19, finalTermsY + 6);

  // Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  let curY = finalTermsY + 12;
  contentLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, textWidth);
    doc.text(wrapped, 19, curY);
    curY += wrapped.length * 5;
  });

  /* ═══════════════════════════════════════════════
     9. FOOTER
  ═══════════════════════════════════════════════ */
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Powered by ERP System",                              105, H - 10, { align: "center" });
  doc.text(`Created By: ${inv?.metadata?.createdBy || "-"}`,    105, H - 5,  { align: "center" });

  doc.setTextColor(0, 0, 0);

  return resultType === "save"
    ? doc.save(`Purchase_Invoice_${inv?.pId}.pdf`)
    : doc.output("bloburl");
};