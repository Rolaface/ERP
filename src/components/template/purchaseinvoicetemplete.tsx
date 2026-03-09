import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ERP_BASE } from "../../config/api";

// ── Palette (matches purchase order exactly) ──────────────────────────────────
const ERP_BLUE: [number, number, number] = [46, 109, 197];
const HDR_DARK: [number, number, number] = ERP_BLUE;
const HDR_MED: [number, number, number] = ERP_BLUE;
const BADGE_BG: [number, number, number] = [120, 180, 235];
const STRIP_BG: [number, number, number] = [150, 200, 245];
const BOX_TITLE: [number, number, number] = ERP_BLUE;
const TINT: [number, number, number] = [240, 248, 255];
const RULE: [number, number, number] = [200, 220, 240];
const WHITE: [number, number, number] = [255, 255, 255];
const INK: [number, number, number] = [25, 45, 75];
const INK_SOFT: [number, number, number] = [70, 95, 130];
const INK_PALE: [number, number, number] = [130, 150, 180];
const GRAND_BG: [number, number, number] = [190, 220, 250];
const AMT_BLUE: [number, number, number] = [40, 100, 190];
const TAX_BG: [number, number, number] = [225, 238, 255];
const TAX_TEXT: [number, number, number] = [40, 90, 170];

// ── Helpers ───────────────────────────────────────────────────────────────────
const px = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ERP_BASE}${path}`;
};

const fmt2 = (n: any) => Number(n ?? 0).toFixed(2);

// PO-style address block (addressLine1/addressLine2)
const addrBlock = (a: any): string[] => {
  if (!a) return [];
  return [
    [a.addressLine1, a.addressLine2].filter(Boolean).join(", "),
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country ? a.country.toUpperCase() : "",
  ].filter(Boolean);
};

const fmtDate = (dateStr: any) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const months = [
    "JAN","FEB","MAR","APR","MAY","JUN",
    "JUL","AUG","SEP","OCT","NOV","DEC",
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// ─────────────────────────────────────────────────────────────────────────────
export const generatePurchaseInvoicePDF = async (
  pi: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.width;   // 210
  const H = doc.internal.pageSize.height;  // 297
  const cur = pi.currency ?? "INR";
  const M = 14;
  const MR = W - M;

  /* ══════════════════════════════════════════════════════════
     WATERMARK — auto-shrink font so full name always fits
  ══════════════════════════════════════════════════════════ */
  const drawWatermark = () => {
    if (company?.documents?.companyLogoUrl) {
      try {
        doc.setGState(doc.GState({ opacity: 0.06 }));
        doc.addImage(
          px(company.documents.companyLogoUrl),
          "PNG",
          (W - 80) / 2,
          H / 2 - 40,
          80,
          80,
        );
        doc.setGState(doc.GState({ opacity: 1 }));
      } catch { /* ignore */ }
    }
    const name = (company?.companyName ?? "").toUpperCase();
    doc.setFont("helvetica", "bold");
    let fontSize = 20;
    doc.setFontSize(fontSize);
    while (doc.getTextWidth(name) > W - 20 && fontSize > 8) {
      fontSize -= 1;
      doc.setFontSize(fontSize);
    }
    doc.setTextColor(...HDR_DARK);
    doc.setGState(doc.GState({ opacity: 0.07 }));
    doc.text(name, W / 2, H - 48, { align: "center" });
    doc.setGState(doc.GState({ opacity: 1 }));
  };
  drawWatermark();

  /* ══════════════════════════════════════════════════════════
     ①  HEADER — clean white bg | company left | doc info right
        (matches PO layout exactly — no dark band, no logo strip)
  ══════════════════════════════════════════════════════════ */
  const TX = M;

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text((company?.companyName ?? "").toUpperCase(), TX, 14);

  // Tagline
  if (company?.tagline) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 210, 255);
    doc.text(company.tagline.toUpperCase(), TX, 20);
  }

  // Contact info lines
  const infoY = company?.tagline ? 26 : 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(28, 60, 110);
  const infoLines: string[] = [];
  if (company?.tpin) infoLines.push(`TPIN / TAX ID: ${company.tpin}`);
  if (company?.contactInfo?.companyPhone)
    infoLines.push(`Phone: ${company.contactInfo.companyPhone}`);
  if (company?.contactInfo?.companyEmail)
    infoLines.push(`Email: ${company.contactInfo.companyEmail}`);
  infoLines.forEach((l, i) => doc.text(l, TX, infoY + i * 5));

  // Document title — right aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("PURCHASE INVOICE", MR, 14, { align: "right" });

  // Invoice ID
  doc.setFontSize(10);
  doc.text(pi.pId ?? "-", MR, 20, { align: "right" });

  // Meta info — right aligned (matches PO meta block)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  const metaLines = [
    `Invoice Date: ${fmtDate(pi.pDate)}`,
    `Payment Method: ${pi.paymentMethod ?? "-"}`,
    `Status: ${pi.status ?? "-"}`,
  ];
  metaLines.forEach((line, i) => {
    doc.text(line, MR, 26 + i * 4, { align: "right" });
  });
  /* ══════════════════════════════════════════════════════════
     ③  ADDRESS BOXES — Supplier | Dispatch | Ship To
        Left-aligned title text & content (matches PO drawBox)
  ══════════════════════════════════════════════════════════ */
  const AY = 40;
  const BOX_HDR = 7;
  const LH = 4.5;
  const PAD = 3;
  const gap = 3;
  const colW = (W - M * 2 - gap * 2) / 3;

  const supplierL = addrBlock(pi?.addresses?.supplierAddress);
  const dispatchL = addrBlock(pi?.addresses?.dispatchAddress);
  const shippingL = addrBlock(pi?.addresses?.shippingAddress);

  if (pi?.addresses?.supplierAddress?.email)
    supplierL.push(`Email: ${pi.addresses.supplierAddress.email}`);
  if (pi?.addresses?.supplierAddress?.phone)
    supplierL.push(`Phone: ${pi.addresses.supplierAddress.phone}`);

  const calcBoxH = (lines: string[], hasBoldTop = false) => {
    let h = BOX_HDR + PAD * 2;
    if (hasBoldTop) h += LH + 1;
    lines.forEach((l) => {
      h += doc.splitTextToSize(l, colW - 6).length * LH;
    });
    return h + 2;
  };
  const boxH = Math.max(
    calcBoxH(supplierL, true),
    calcBoxH(dispatchL),
    calcBoxH(shippingL),
  );

  // PO-style drawBox: left-aligned title, left-aligned content, black text
  const drawBox = (
    bx: number,
    title: string,
    lines: string[],
    boldTop?: string,
  ) => {
    doc.setFillColor(...BOX_TITLE);
    doc.rect(bx, AY, colW, BOX_HDR, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(title, bx + 3, AY + 5.2);

    doc.setFillColor(...WHITE);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.rect(bx, AY + BOX_HDR, colW, boxH - BOX_HDR, "FD");

    let cy = AY + BOX_HDR + PAD + LH;
    if (boldTop) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      doc.text(boldTop, bx + 3, cy);
      cy += LH + 1;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    lines.forEach((l) => {
      const wr = doc.splitTextToSize(l, colW - 6);
      doc.text(wr, bx + 3, cy);
      cy += wr.length * LH;
    });
  };

  drawBox(M, "Supplier", supplierL, pi?.supplierName ?? "-");
  drawBox(M + colW + gap, "Dispatch Address", dispatchL);
  drawBox(M + (colW + gap) * 2, "Ship To", shippingL);

  /* ══════════════════════════════════════════════════════════
     ④  META ROW — LPO / Project / Cost Center / Incoterm / Tax
  ══════════════════════════════════════════════════════════ */
  const afterBoxY = AY + boxH + 4;
  autoTable(doc, {
  startY: afterBoxY,

  head: [
    ["LPO No", "Supplier Invoice", "Tax Category", "Incoterm", "Shipping Rule"],
  ],

  body: [
    [
      pi?.lpoNumber ?? "-",
      pi?.spplrInvcNo ?? "-",
      pi?.taxCategory ?? "-",
      pi?.incoterm ?? "-",
      pi?.shippingRule ?? "-" // not in API yet
    ],
  ],

  styles: {
    fontSize: 7.5,
    textColor: [0,0,0],
    halign: "left",
    cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
    lineColor: RULE,
    lineWidth: 0.2,
  },

  headStyles: {
    fillColor: ERP_BLUE,
    textColor: [255,255,255],
    fontStyle: "bold",
    halign: "left",
  },

  columnStyles: {
    0: { cellWidth: (W - M*2)/5 },
    1: { cellWidth: (W - M*2)/5 },
    2: { cellWidth: (W - M*2)/5 },
    3: { cellWidth: (W - M*2)/5 },
    4: { cellWidth: (W - M*2)/5 },
  },

  margin: { left: M, right: M },
  tableWidth: W - M * 2,
});
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);

  

  /* ══════════════════════════════════════════════════════════
     ⑤  ITEMS TABLE — ERP_BLUE header, white rows, black text
        (matches PO table style)
  ══════════════════════════════════════════════════════════ */
  doc.setFont("helvetica");
  doc.setFontSize(7);
  doc.setTextColor(...INK_PALE);
 const metaEndY = (doc as any).lastAutoTable.finalY;

doc.text("ITEMS", M, metaEndY + 6);

  const TOTAL_W = 28;

  autoTable(doc, {
   startY: metaEndY + 8,
    head: [
      [
        "#",
        "Item",
        "Packing",
        "Qty",
        "UOM",
        "Rate",
        "Tax",
        `Amount(${cur})`,
      ],
    ],
    body: pi.items.map((item: any, idx: number) => {
      const packing = item.packing ?? "-";
      return [
        idx + 1,
        item.item_name ?? "-",
        packing,
        Number(item.qty ?? 0),
        item.uom ?? "-",
        fmt2(item.rate),
        `${item.VatCd ?? "-"} (${item.vatRate ?? "0"}%)`,
        fmt2(item.amount),
      ];
    }),
    styles: {
      fontSize: 7.5,
      textColor: [0, 0, 0],
      cellPadding: { top: 1, bottom: 1, left: 2, right: 2 },
      lineColor: RULE,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: ERP_BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
    },
    alternateRowStyles: { fillColor: WHITE },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: 48, halign: "left" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: TOTAL_W, halign: "right", textColor: [0, 0, 0], fontSize: 7.5 },
    },
    margin: { left: M, right: M },
    tableWidth: W - M * 2,
  });

  const tblY = (doc as any).lastAutoTable.finalY;

  /* ══════════════════════════════════════════════════════════
     ⑥  TOTALS (right) — labels before amount column, single-
        column amount table — matches PO totals block exactly
  ══════════════════════════════════════════════════════════ */
  const SEC_Y = tblY;
  const ROW_H = 6;

  // Column widths must sum to W - M*2 (same as items table)
const AMOUNT_COL_X = M + 8 + 48 + 20 + 18 + 22 + 18 + 20;

  // Label position just before the amount column
  const LABEL_X = AMOUNT_COL_X - 4;

  const subTotal  = Number(pi?.summary?.subTotal          ?? 0);
  const taxTotal  = Number(pi?.summary?.taxTotal           ?? 0);
  const grandTotal = Number(pi?.summary?.grandTotal        ?? 0);
  const rounding  = Number(pi?.summary?.roundingAdjustment ?? 0);
  const taxRate   = pi?.tax?.taxRate ?? "-";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.text("Sub Total", LABEL_X, SEC_Y + ROW_H * 0.7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Tax", LABEL_X, SEC_Y + ROW_H * 1.7, { align: "right" });
  doc.text("Rounding", LABEL_X, SEC_Y + ROW_H * 2.7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total", LABEL_X, SEC_Y + ROW_H * 3.7, { align: "right" });

  autoTable(doc, {
    startY: SEC_Y,
    head: [],
    body: [
      [`${fmt2(subTotal)} ${cur}`],
      [`${fmt2(taxTotal)} ${cur}`],
      [`${fmt2(rounding)} ${cur}`],
      [`${fmt2(grandTotal)} ${cur}`],
    ],
    styles: {
      fontSize: 8,
      halign: "right",
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      lineColor: RULE,
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: TOTAL_W },
    },
    didParseCell: (data) => {
      if (data.row.index === 0 || data.row.index === 3) {
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: AMOUNT_COL_X, right: M },
    tableWidth: TOTAL_W,
  });

  const sumEndY = (doc as any).lastAutoTable.finalY;
  const SIG_Y = sumEndY;

  /* ══════════════════════════════════════════════════════════
     SIGNATURE — right-aligned under totals (matches PO style)
  ══════════════════════════════════════════════════════════ */
  const LABEL_W = 28;
  const SIGN_X = AMOUNT_COL_X - LABEL_W;
  const SIGN_W = LABEL_W + TOTAL_W;

  // Header bar
  doc.setFillColor(...ERP_BLUE);
  doc.rect(SIGN_X, SIG_Y, SIGN_W, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("Authorised Signatory", SIGN_X + SIGN_W / 2, SIG_Y + 4, {
    align: "center",
  });

  // Signature content box
  doc.setFillColor(...WHITE);
  doc.rect(SIGN_X, SIG_Y + 6, SIGN_W, 22, "F");
  doc.setDrawColor(...RULE);
  doc.line(SIGN_X, SIG_Y + 6,  SIGN_X + SIGN_W, SIG_Y + 6);
  doc.line(SIGN_X, SIG_Y + 28, SIGN_X + SIGN_W, SIG_Y + 28);

  if (company?.documents?.authorizedSignatureUrl) {
    try {
      doc.addImage(
        px(company.documents.authorizedSignatureUrl),
        "PNG",
        SIGN_X + (SIGN_W - 40) / 2,
        SIG_Y + 9,
        40,
        14,
      );
    } catch { /* ignore */ }
  }

  doc.line(SIGN_X + 5, SIG_Y + 22, SIGN_X + SIGN_W - 5, SIG_Y + 22);
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Signature", SIGN_X + SIGN_W / 2, SIG_Y + 26, { align: "center" });

  /* ══════════════════════════════════════════════════════════
     ⑦  TERMS & CONDITIONS — left of signature area (PO style)
  ══════════════════════════════════════════════════════════ */
  let termsY = SIG_Y;
  const buying = pi?.terms?.terms?.buying;
  const termW  = SIGN_X - M;
  const termTW = termW - 14;
  const tLines: string[] = [];

  if (buying) {
    if (buying.general)      tLines.push(`General: ${buying.general}`);
    if (buying.delivery)     tLines.push(`Delivery: ${buying.delivery}`);
    if (buying.cancellation) tLines.push(`Cancellation: ${buying.cancellation}`);
    if (buying.warranty)     tLines.push(`Warranty: ${buying.warranty}`);
    if (buying.liability)    tLines.push(`Liability: ${buying.liability}`);
    if (buying.payment) {
      const p = buying.payment;
      if (p.dueDates)    tLines.push(`Payment Due: ${p.dueDates}`);
      if (p.lateCharges) tLines.push(`Late Charges: ${p.lateCharges}`);
      if (p.notes)       tLines.push(`Notes: ${p.notes}`);
      p.phases?.forEach((ph: any, i: number) =>
        tLines.push(`  ${i + 1}. ${ph.percentage}% — ${ph.condition}`),
      );
    }
  }
  if (!tLines.length) tLines.push("No terms and conditions specified.");

  let tH = 12;
  tLines.forEach((l) => {
    tH += doc.splitTextToSize(l, termTW).length * 3.5;
  });
  const tBH = Math.max(24, tH + 4);

  if (termsY + tBH > H - 16) {
    doc.addPage();
    drawWatermark();
    termsY = 16;
  }

  doc.setFillColor(...WHITE);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.rect(M, termsY, termW, tBH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text("TERMS & CONDITIONS", M + 7, termsY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  let tcy = termsY + 10.5;
  tLines.forEach((l) => {
    const wr = doc.splitTextToSize(l, termTW);
    doc.text(wr, M + 7, tcy);
    tcy += wr.length * 3.5;
  });

  /* ══════════════════════════════════════════════════════════
     ⑧  FOOTER — simple text footer (matches PO)
  ══════════════════════════════════════════════════════════ */
  const totalPg = (doc as any).internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPg; pg++) {
    doc.setPage(pg);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...INK_PALE);
    doc.text("Powered by ERP SYSTEM", W / 2, H - 6, { align: "center" });
    doc.text(`Page ${pg} / ${totalPg}`, MR, H - 6, { align: "right" });
    doc.text("This is a computer-generated document.", M, H - 6);
  }

  /* ══════════════════════════════════════════════════════════
     ⑨  OUTPUT
  ══════════════════════════════════════════════════════════ */
  return resultType === "save"
    ? doc.save(`Purchase_Invoice_${pi.pId}.pdf`)
    : doc.output("bloburl");
};
