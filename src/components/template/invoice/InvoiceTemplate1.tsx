import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPaymentMethodLabel } from "../../../constants/invoice.constants";
import { ERP_BASE } from "../../../config/api";

// ── Palette (matches Purchase Invoice exactly) ────────────────────────────────
const ERP_BLUE: [number, number, number] = [46, 109, 197];
const HDR_DARK: [number, number, number] = ERP_BLUE;
const BOX_TITLE: [number, number, number] = ERP_BLUE;
const RULE: [number, number, number] = [200, 220, 240];
const WHITE: [number, number, number] = [255, 255, 255];
const INK: [number, number, number] = [25, 45, 75];
const INK_SOFT: [number, number, number] = [70, 95, 130];
const INK_PALE: [number, number, number] = [130, 150, 180];
const DISCOUNT: [number, number, number] = [160, 60, 60];
const TAX_BG: [number, number, number] = [225, 238, 255];
const TAX_TEXT: [number, number, number] = [40, 90, 170];

// ── Helpers ───────────────────────────────────────────────────────────────────
const px = (path: string) =>
  !path ? "" :
  path.startsWith("http://") || path.startsWith("https://") ? path :
  `${ERP_BASE}${path}`;

const fmt2 = (n: any) => Number(n ?? 0).toFixed(2);

// PO-style address block
const addrBlock = (a: any): string[] => {
  if (!a) return [];
  return [
    [a.line1 ?? a.addressLine1, a.line2 ?? a.addressLine2]
      .filter(Boolean)
      .join(", "),
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
  company:  any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.width;   // 210
  const H = doc.internal.pageSize.height;  // 297
  const cur = invoice.currencyCode ?? "INR";
  const M   = 14;
  const MR  = W - M;

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
  const badgeLabel =
    invoice.invoiceType === "Export" ? "EXPORT INVOICE" : "TAX INVOICE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(badgeLabel, MR, 14, { align: "right" });

  // Invoice number
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber ?? "-", MR, 20, { align: "right" });

  // Meta info — right aligned (matches PO meta block)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);
  const metaLines = [
    `Invoice Date: ${fmtDate(invoice.dateOfInvoice)}`,
    `Due Date: ${fmtDate(invoice.dueDate)}`,
    `Status: ${invoice.invoiceStatus ?? "-"}`,
  ];
  metaLines.forEach((line, i) => {
    doc.text(line, MR, 26 + i * 4, { align: "right" });
  });

  /* ══════════════════════════════════════════════════════════
     ③  ADDRESS BOXES — Bill To | Ship To | Payment Info
         Left-aligned title text & content (matches PO drawBox)
  ══════════════════════════════════════════════════════════ */
  const AY = 40;
  const BOX_HDR = 7;
  const LH = 4.5;
  const PAD = 3;
  const gap = 3;
  const colW = (W - M * 2 - gap * 2) / 3;

 const billL = [
  invoice?.customerTpin ? `TPIN: ${invoice.customerTpin}` : null,
  ...addrBlock(invoice?.billingAddress),
].filter(Boolean) as string[];
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
  const boxH = Math.max(calcBH(billL, true), calcBH(shipL), calcBH(payL)) + 2;

  const boxH = Math.max(
    calcBoxH(billL, true),
    calcBoxH(shipL),
    calcBoxH(payL),
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

  drawBox(M,                     "Bill To",      billL, invoice?.customerName ?? "-");
  drawBox(M + bColW + gap,       "Ship To",      shipL);
  drawBox(M + (bColW + gap) * 2, "Payment Info", payL);

  /* ══════════════════════════════════════════════════════════
     ④  META ROW — Customer TPIN / LPO / Payment Terms / Status / Currency
  ══════════════════════════════════════════════════════════ */
  const afterBoxY = AY + boxH + 4;
  autoTable(doc, {
    startY: afterBoxY,
    head: [
      ["Customer TPIN", "LPO No", "Payment Terms", "Status", "Currency"],
    ],
    body: [
      [
        invoice?.customerTpin ?? "-",
        invoice?.lpoNumber ?? "-",
        invoice?.paymentInformation?.paymentTerms ?? "-",
        invoice?.invoiceStatus ?? "-",
        cur,
      ],
    ],
    styles: {
      fontSize: 7.5,
      textColor: [0, 0, 0],
      halign: "left",
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      lineColor: RULE,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: ERP_BLUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: (W - M * 2) / 5 },
      1: { cellWidth: (W - M * 2) / 5 },
      2: { cellWidth: (W - M * 2) / 5 },
      3: { cellWidth: (W - M * 2) / 5 },
      4: { cellWidth: (W - M * 2) / 5 },
    },
    margin:     { left: M, right: M },
    tableWidth: W - M * 2,
  });

  /* ══════════════════════════════════════════════════════════
     ⑤  ITEMS TABLE — ERP_BLUE header, white rows, black text
         (matches PO table style)
  ══════════════════════════════════════════════════════════ */
  const metaEndY = (doc as any).lastAutoTable.finalY;

  doc.setFont("helvetica");
  doc.setFontSize(7);
  doc.setTextColor(...INK_PALE);
  doc.text("ITEMS", M, metaEndY + 6);

  const TOTAL_W = 22;

autoTable(doc, {
  startY: metaEndY + 8,
  head: [
    [
      "#",
      "Description",
      "Batch",
      "Box Range",
      "Packing",
      "MFG",
      "EXP",
      "Qty",
      "Rate",
      "Disc%",
      "Tax",
      `Amount(${cur})`,
    ],
  ],
  body: invoice.items.map((item: any, idx: number) => {
    const qty = Number(item.quantity ?? 0);
    const rate = Number(item.price ?? 0);
    const disc = Number(item.discount ?? 0);
    const net = qty * rate * (1 - disc / 100);

    return [
      idx + 1,
      item.description ?? "-",
      item.batchNo ?? "-",
      item.boxStart && item.boxEnd ? `${item.boxStart}–${item.boxEnd}` : "-",
      item.packingUnit && item.packingSize
        ? `${item.packingUnit}×${item.packingSize}`
        : "-",
      item.mfgDate ?? "-",
      item.expDate ?? "-",
      qty,
      fmt2(rate),
      disc > 0 ? `${disc}%` : "-",
      item.vatCode ?? "-",
      net.toFixed(2),
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
  0: { cellWidth: 7, halign: "center" },

  // ↓ Description reduced
  1: { cellWidth: 35, halign: "left" },

  2: { cellWidth: 13, halign: "center" },

  // ↑ Box Range increased
  3: { cellWidth: 17, halign: "center" },

  4: { cellWidth: 14, halign: "center" },   // ↓ Packing reduced
5: { cellWidth: 15, halign: "center" },
6: { cellWidth: 15, halign: "center" },

7: { cellWidth: 9, halign: "right" },
8: { cellWidth: 14, halign: "right" },   // ↑ Rate increased
  9: { cellWidth: 11, halign: "center" },
  10: { cellWidth: 10, halign: "center" },

  11: {
    cellWidth: TOTAL_W,
    halign: "right",
    textColor: [0, 0, 0],
    fontSize: 7.5,
  },
},

  margin: { left: M, right: M },
  tableWidth: W - M * 2,
});

  const tblY = (doc as any).lastAutoTable.finalY;
  const SEC_Y = tblY;
  const ROW_H = 6;

  // AMOUNT_COL_X = M + sum of all column widths except last
const AMOUNT_COL_X =
  M +
  7 +   // #
  35 +  // description
  13 +  // batch
  17 +  // box range
  14 +  // packing
  15 +  // mfg
  15 +  // exp
  9 +   // qty
  14 +  // rate
  11 +   // disc
  10;   // tax
  const LABEL_X = AMOUNT_COL_X - 4;

  // Totals calculation
  let gross = 0, itemDisc = 0;
  invoice.items.forEach((i: any) => {
    const q = Number(i.quantity ?? 0),
      p = Number(i.price ?? 0),
      d = Number(i.discount ?? 0);
    gross += q * p;
    itemDisc += q * p * (d / 100);
  });
  const afterItem  = gross - itemDisc;
  const taxableRaw = invoice.items.reduce(
    (a: number, i: any) => a + Number(i.vatTaxableAmount ?? 0), 0,
  );
  const taxable   = taxableRaw > 0 ? taxableRaw : afterItem;
  const vat       = afterItem - taxable;
  const grandTotal = afterItem;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.text("Gross Total",    LABEL_X, SEC_Y + ROW_H * 0.7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Item Discount",  LABEL_X, SEC_Y + ROW_H * 1.7, { align: "right" });
  doc.text("Taxable Amount", LABEL_X, SEC_Y + ROW_H * 2.7, { align: "right" });
  doc.text("Tax Total",      LABEL_X, SEC_Y + ROW_H * 3.7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total",    LABEL_X, SEC_Y + ROW_H * 4.7, { align: "right" });

  autoTable(doc, {
    startY: SEC_Y,
    head: [],
    body: [
      [`${fmt2(gross)} ${cur}`],
      [`${fmt2(itemDisc)} ${cur}`],
      [`${fmt2(taxable)} ${cur}`],
      [`${fmt2(vat)} ${cur}`],
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
      if (data.row.index === 0 || data.row.index === 4) {
        data.cell.styles.fontStyle = "bold";
      }
      if (data.row.index === 1) {
        // discount row
        data.cell.styles.textColor = DISCOUNT;
      }
      if (data.row.index === 3) {
        // tax row
        data.cell.styles.fillColor = TAX_BG as any;
        data.cell.styles.textColor = TAX_TEXT;
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
  const SIGN_X  = AMOUNT_COL_X - LABEL_W;
  const SIGN_W  = LABEL_W + TOTAL_W;

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
  const selling = invoice?.terms?.selling;
  const termW   = SIGN_X - M;
  const termTW  = termW - 14;
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
        tLines.push(`  ${i + 1}. ${ph.percentage}% — ${ph.condition}`));
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
    ? doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
    : doc.output("bloburl");
};