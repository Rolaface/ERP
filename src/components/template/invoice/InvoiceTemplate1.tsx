import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPaymentMethodLabel } from "../../../constants/invoice.constants";
import { ERP_BASE } from "../../../config/api";

// ── Palette (matches Purchase Order exactly) ──────────────────────────────────
const ERP_BLUE: [number, number, number] = [46, 109, 197];
const HDR_DARK: [number, number, number] = ERP_BLUE;
const BOX_TITLE: [number, number, number] = ERP_BLUE;
const RULE: [number, number, number] = [200, 220, 240];
const WHITE: [number, number, number] = [255, 255, 255];
const INK: [number, number, number] = [25, 45, 75];
const INK_SOFT: [number, number, number] = [70, 95, 130];
const INK_PALE: [number, number, number] = [130, 150, 180];
const TINT: [number, number, number] = [240, 248, 255];
const NAVY: [number, number, number] = [13, 38, 64];
const TAX_BG: [number, number, number] = [232, 241, 252];
const TAX_TEXT: [number, number, number] = [30, 70, 130];
const DISCOUNT: [number, number, number] = [160, 60, 60];

// ── Helpers ───────────────────────────────────────────────────────────────────
const px = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ERP_BASE}${path}`;
};

const fmt2 = (n: any) => Number(n ?? 0).toFixed(2);

// Invoice uses line1/line2 (not addressLine1/addressLine2)
const addrBlock = (a: any): string[] => {
  if (!a) return [];
  return [
    [a.line1, a.line2].filter(Boolean).join(", "),
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country ? a.country.toUpperCase() : "",
  ].filter(Boolean);
};

const fmtDate = (dateStr: any) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

// ─────────────────────────────────────────────────────────────────────────────
export const generateInvoicePDF = async (
  invoice: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  const cur = invoice.currencyCode ?? "INR";
  const M = 14;
  const MR = W - M;
  const LOGO_Y = 5;
  const LOGO_SZ = 32;
  const LOGO_X = M;

  /* ══════════════════════════════════════════════════════════
     LOGO
  ══════════════════════════════════════════════════════════ */
  if (company?.documents?.companyLogoUrl) {
    try {
      doc.addImage(
        px(company.documents.companyLogoUrl),
        "PNG",
        LOGO_X,
        LOGO_Y,
        LOGO_SZ,
        LOGO_SZ,
      );
    } catch {}
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...INK);
    doc.text(
      (company?.companyName ?? "Rx").slice(0, 2).toUpperCase(),
      LOGO_X + LOGO_SZ / 2,
      LOGO_Y + LOGO_SZ / 2 + 3,
      { align: "center" },
    );
  }

  /* ══════════════════════════════════════════════════════════
     WATERMARK
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
      } catch {}
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
     ①  HEADER — Company info (left) | Invoice title + meta (right)
  ══════════════════════════════════════════════════════════ */
  const TX = LOGO_X + LOGO_SZ + 6;

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

  // Company contact info
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

  // Invoice type badge label (right side, top)
  const badgeLabel =
    invoice.invoiceType === "Export" ? "EXPORT INVOICE" : "TAX INVOICE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(badgeLabel, MR, 14, { align: "right" });

  // Invoice number
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber ?? "-", MR, 20, { align: "right" });

  // Meta info (right side)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  const metaLines = [
    `Invoice Date: ${fmtDate(invoice.dateOfInvoice)}`,
    `Due Date: ${fmtDate(invoice.dueDate)}`,
    `Status: ${invoice.invoiceStatus ?? "-"}`,
    `Currency: ${cur}`,
  ];
  if (invoice.lpoNumber) metaLines.push(`LPO No: ${invoice.lpoNumber}`);
  metaLines.forEach((line, i) => {
    doc.text(line, MR, 26 + i * 4, { align: "right" });
  });

  /* ══════════════════════════════════════════════════════════
     ②  ADDRESS BOXES — Bill To | Ship To | Payment Info
  ══════════════════════════════════════════════════════════ */
  const AY = 44;
  const BOX_HDR = 7;
  const LH = 4.5;
  const PAD = 3;
  const gap = 3;
  const colW = (W - M * 2 - gap * 2) / 3;

  const billL = addrBlock(invoice?.billingAddress);
  const shipL = addrBlock(invoice?.shippingAddress);
  const payL: string[] = (
    [
      `Method: ${getPaymentMethodLabel(invoice?.paymentInformation?.paymentMethod) ?? "-"}`,
      `Terms: ${invoice?.paymentInformation?.paymentTerms ?? "-"}`,
      `Bank: ${invoice?.paymentInformation?.bankName ?? "-"}`,
      invoice?.paymentInformation?.accountNumber
        ? `A/C: ${invoice.paymentInformation.accountNumber}`
        : null,
      invoice?.paymentInformation?.swiftCode
        ? `SWIFT: ${invoice.paymentInformation.swiftCode}`
        : null,
    ] as (string | null)[]
  ).filter(Boolean) as string[];

  const calcBoxH = (lines: string[], hasBoldTop = false) => {
    let h = BOX_HDR + PAD * 2;
    if (hasBoldTop) h += LH + 1;
    lines.forEach((l) => {
      h += doc.splitTextToSize(l, colW - 6).length * LH;
    });
    return h + 2;
  };

  const boxH = Math.max(
    calcBoxH(billL, true),
    calcBoxH(shipL),
    calcBoxH(payL),
  );

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

  drawBox(M, "Bill To", billL, invoice?.customerName ?? "-");
  drawBox(M + colW + gap, "Ship To", shipL);
  drawBox(M + (colW + gap) * 2, "Payment Info", payL);

  /* ══════════════════════════════════════════════════════════
     ③  Customer TPIN
  ══════════════════════════════════════════════════════════ */
  const afterBoxY = AY + boxH + 4;
  if (invoice?.customerTpin) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_SOFT);
    doc.text(`Customer TPIN: ${invoice.customerTpin}`, M, afterBoxY);
  }

  /* ══════════════════════════════════════════════════════════
     ④  ITEMS TABLE
  ══════════════════════════════════════════════════════════ */
  doc.setFont("helvetica");
  doc.setFontSize(7);
  doc.setTextColor(...INK_PALE);
  doc.text("ITEMS", M, afterBoxY + 9);

  // Column widths must sum to exactly W - M*2 = 182mm
  // 6+20+28+26+12+14+14+12+12+10+10+18 = 182 ✓
  const TOTAL_W = 18;

  autoTable(doc, {
    startY: afterBoxY + 11,
    head: [
      [
        "#",
        "Item Code",
        "Description",
        "Batch",
        "Packing",
        "MFG",
        "EXP",
        "Qty",
        "Rate",
        "Disc%",
        "Tax",
        `Amt(${cur})`,
      ],
    ],
    body: invoice.items.map((item: any, idx: number) => {
      const qty = Number(item.quantity ?? 0);
      const rate = Number(item.price ?? 0);
      const disc = Number(item.discount ?? 0);
      // Discount may be a flat negative amount (as in sample data)
      const discAbs = Math.abs(disc);
      const discPct = (qty * rate) > 0 ? ((discAbs / (qty * rate)) * 100) : 0;
      const net = qty * rate - discAbs;
      const packing =
        item.packingUnit && item.packingSize
          ? `${item.packingUnit}×${item.packingSize}`
          : "-";
      return [
        idx + 1,
        item.itemCode ?? "-",
        item.description ?? "-",
        item.batchNo || "-",
        packing,
        fmtDate(item.mfgDate),
        fmtDate(item.expDate),
        Math.round(qty).toLocaleString(),
        fmt2(rate),
        discAbs > 0 ? `${discPct.toFixed(2)}%` : "0%",
        item.vatCode ?? "-",
        fmt2(net),
      ];
    }),
    styles: {
      fontSize: 6.5,
      textColor: [0, 0, 0],
      cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      lineColor: RULE,
      lineWidth: 0.15,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: ERP_BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 6.5,
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
    },
    alternateRowStyles: { fillColor: TINT },
    columnStyles: {
      0:  { cellWidth: 6,        halign: "center" },
      1:  { cellWidth: 20,       halign: "left",  fontStyle: "bold", textColor: INK },
      2:  { cellWidth: 28,       halign: "left" },
      3:  { cellWidth: 26,       halign: "center" },
      4:  { cellWidth: 12,       halign: "center" },
      5:  { cellWidth: 14,       halign: "center" },
      6:  { cellWidth: 14,       halign: "center" },
      7:  { cellWidth: 12,       halign: "right" },
      8:  { cellWidth: 12,       halign: "right" },
      9:  { cellWidth: 10,       halign: "center" },
      10: { cellWidth: 10,       halign: "center" },
      11: { cellWidth: TOTAL_W,  halign: "right", fontStyle: "bold", textColor: ERP_BLUE },
    },
    margin: { left: M, right: M },
    tableWidth: W - M * 2,
  });

  const tblY = (doc as any).lastAutoTable.finalY;

  /* ══════════════════════════════════════════════════════════
     ⑤  TOTALS (right) — aligned to Amount column
  ══════════════════════════════════════════════════════════ */
  const SEC_Y = tblY;

  // Calculate totals from invoice items
  let gross = 0, totalDiscAmt = 0;
  invoice.items.forEach((i: any) => {
    const q = Number(i.quantity ?? 0);
    const p = Number(i.price ?? 0);
    const d = Math.abs(Number(i.discount ?? 0));
    gross += q * p;
    totalDiscAmt += d;
  });

  const subTotal = gross - totalDiscAmt;

  // Tax: sum vatTaxableAmount if present, else estimate from vatCode
  const taxableRaw = invoice.items.reduce(
    (a: number, i: any) => a + Number(i.vatTaxableAmount ?? 0),
    0,
  );
  const taxTotal = taxableRaw > 0 ? taxableRaw : 0;
  const grandTotal = subTotal + taxTotal;

  // Amount column X = M + sum of all preceding column widths = M + 164
  const AMOUNT_COL_X =
    M +
    6  +  // #
    20 +  // Item Code
    28 +  // Description
    26 +  // Batch
    12 +  // Packing
    14 +  // MFG
    14 +  // EXP
    12 +  // Qty
    12 +  // Rate
    10 +  // Disc%
    10;   // Tax

  const LABEL_X = AMOUNT_COL_X - 4;
  const ROW_H = 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.text("Sub Total", LABEL_X, SEC_Y + ROW_H * 0.7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Discount", LABEL_X, SEC_Y + ROW_H * 1.7, { align: "right" });
  doc.text("Tax Total", LABEL_X, SEC_Y + ROW_H * 2.7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total", LABEL_X, SEC_Y + ROW_H * 3.7, { align: "right" });

  type TR = [string, "normal" | "discount" | "tax" | "grand"];
  const totRows: [string, TR[1]][] = [
    [`${fmt2(gross)} ${cur}`,       "normal"],
    [`-${fmt2(totalDiscAmt)} ${cur}`, "discount"],
    [`${fmt2(taxTotal)} ${cur}`,    "tax"],
    [`${fmt2(grandTotal)} ${cur}`,  "grand"],
  ];

  autoTable(doc, {
    startY: SEC_Y,
    head: [],
    body: totRows.map((r) => [r[0]]),
    styles: {
      fontSize: 8,
      halign: "center",
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      lineColor: RULE,
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: TOTAL_W },
    },
    didParseCell: (data) => {
      const t = totRows[data.row.index]?.[1];
      if (!t) return;
      if (t === "normal" || t === "grand") {
        data.cell.styles.fontStyle = "bold";
      }
      if (t === "discount") {
        data.cell.styles.textColor = DISCOUNT;
        data.cell.styles.fillColor = [252, 245, 245] as any;
      }
      if (t === "tax") {
        data.cell.styles.fillColor = TAX_BG;
        data.cell.styles.textColor = TAX_TEXT;
      }
      if (t === "grand") {
        data.cell.styles.fillColor = NAVY;
        data.cell.styles.textColor = WHITE;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 9;
      }
    },
    margin: { left: AMOUNT_COL_X, right: M },
    tableWidth: TOTAL_W,
  });

  const sumEndY = (doc as any).lastAutoTable.finalY;

  /* ══════════════════════════════════════════════════════════
     ⑥  AUTHORISED SIGNATORY (same position as PO)
  ══════════════════════════════════════════════════════════ */
  const SIG_Y = sumEndY;
  const LABEL_W = 28;
  const SIGN_X = AMOUNT_COL_X - LABEL_W;
  const SIGN_W = LABEL_W + TOTAL_W;

  doc.setFillColor(...ERP_BLUE);
  doc.rect(SIGN_X, SIG_Y, SIGN_W, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("Authorised Signatory", SIGN_X + SIGN_W / 2, SIG_Y + 4, {
    align: "center",
  });

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
    } catch {}
  }

  doc.line(SIGN_X + 5, SIG_Y + 22, SIGN_X + SIGN_W - 5, SIG_Y + 22);
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Signature", SIGN_X + SIGN_W / 2, SIG_Y + 26, { align: "center" });

  /* ══════════════════════════════════════════════════════════
     ⑦  TERMS & CONDITIONS — invoice uses terms.selling
  ══════════════════════════════════════════════════════════ */
  let termsY = SIG_Y;
  const selling = invoice?.terms?.selling;
  const termW = SIGN_X - M;
  const termTW = termW - 14;
  const tLines: string[] = [];

  if (selling) {
    if (selling.general)      tLines.push(`General: ${selling.general}`);
    if (selling.delivery)     tLines.push(`Delivery: ${selling.delivery}`);
    if (selling.cancellation) tLines.push(`Cancellation: ${selling.cancellation}`);
    if (selling.warranty)     tLines.push(`Warranty: ${selling.warranty}`);
    if (selling.liability)    tLines.push(`Liability: ${selling.liability}`);
    if (selling.payment) {
      const p = selling.payment;
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
     ⑧  FOOTER — simple text (same as PO)
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
    ? doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
    : doc.output("bloburl");
};