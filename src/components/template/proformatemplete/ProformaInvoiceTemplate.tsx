import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPaymentMethodLabel } from "../../../constants/invoice.constants";
import { ERP_BASE } from "../../../config/api";

// ── Palette — IDENTICAL to Invoice ───────────────────────────────────────────
const ERP_BLUE: [number, number, number] = [46, 109, 197];
const RULE:     [number, number, number] = [200, 220, 240];
const WHITE:    [number, number, number] = [255, 255, 255];
const INK:      [number, number, number] = [25,  45,  75];
const INK_SOFT: [number, number, number] = [70,  95,  130];
const INK_PALE: [number, number, number] = [130, 150, 180];
const NAVY:     [number, number, number] = [13,  38,  64];

// ── Helpers ───────────────────────────────────────────────────────────────────
const px = (path: string) =>
  !path ? "" :
  path.startsWith("http://") || path.startsWith("https://") ? path :
  `${ERP_BASE}${path}`;

const fmt2 = (n: any) => Number(n ?? 0).toFixed(2);

const addrBlock = (a: any): string[] => {
  if (!a) return [];
  return [
    [a.line1, a.line2].filter(Boolean).join(", "),
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country ? a.country.toUpperCase() : "",
  ].filter(Boolean);
};

const fmtDate = (s: any) => {
  if (!s) return "-";
  const d = new Date(s);
  const mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${String(d.getDate()).padStart(2,"0")}-${mon[d.getMonth()]}-${d.getFullYear()}`;
};

// ─────────────────────────────────────────────────────────────────────────────
export const generateProformaInvoicePDF = async (
  proformaInvoice: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W  = doc.internal.pageSize.width;   // 210
  const H  = doc.internal.pageSize.height;  // 297
  const cur = proformaInvoice.currencyCode ?? "USD";
  const M   = 14;
  const MR  = W - M;

  // Column widths — must sum to W - M*2 = 182
  // # (6) + ItemCode (20) + ItemName (22) + Desc (40) + Packing (12) +
  // Qty (14) + Rate (14) + Disc% (10) + Tax (10) + TaxCode (10) + Amount (24)
  // = 6+20+22+40+12+14+14+10+10+10+24 = 182 ✓
  const COL_WIDTHS = [6, 20, 22, 40, 12, 14, 14, 10, 10, 10, 24];
  const TOTAL_W    = 24; // last column
  // AMOUNT_COL_X = M + sum of first 10 columns = M + (182 - 24) = M + 158
  const AMOUNT_COL_X = M + COL_WIDTHS.slice(0, -1).reduce((a, b) => a + b, 0);

  /* ══════════════════════════════════════════════════════════
     WATERMARK  (same as Invoice)
  ══════════════════════════════════════════════════════════ */
  const drawWatermark = () => {
    if (company?.documents?.companyLogoUrl) {
      try {
        doc.setGState(doc.GState({ opacity: 0.06 }));
        doc.addImage(px(company.documents.companyLogoUrl), "PNG",
          (W - 80) / 2, H / 2 - 40, 80, 80);
        doc.setGState(doc.GState({ opacity: 1 }));
      } catch {}
    }
    const name = (company?.companyName ?? "").toUpperCase();
    doc.setFont("helvetica", "bold");
    let fs = 20; doc.setFontSize(fs);
    while (doc.getTextWidth(name) > W - 20 && fs > 8) { fs--; doc.setFontSize(fs); }
    doc.setTextColor(...ERP_BLUE);
    doc.setGState(doc.GState({ opacity: 0.07 }));
    doc.text(name, W / 2, H - 48, { align: "center" });
    doc.setGState(doc.GState({ opacity: 1 }));
  };
  drawWatermark();

  /* ══════════════════════════════════════════════════════════
     ①  LOGO  (same position as Invoice)
  ══════════════════════════════════════════════════════════ */
  const LOGO_SZ = 32;
  const LOGO_X  = M;
  const LOGO_Y  = 5;

  if (company?.documents?.companyLogoUrl) {
    try {
      doc.addImage(px(company.documents.companyLogoUrl), "PNG",
        LOGO_X, LOGO_Y, LOGO_SZ, LOGO_SZ);
    } catch {}
  } else {
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...INK);
    doc.text(
      (company?.companyName ?? "PI").slice(0, 2).toUpperCase(),
      LOGO_X + LOGO_SZ / 2, LOGO_Y + LOGO_SZ / 2 + 3, { align: "center" },
    );
  }

  /* ══════════════════════════════════════════════════════════
     ②  HEADER — company left | doc type + number right
         Identical structure to Invoice, badge text differs
  ══════════════════════════════════════════════════════════ */
  const TX = LOGO_X + LOGO_SZ + 6;

  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(...INK);
  doc.text((company?.companyName ?? "").toUpperCase(), TX, 14);

  if (company?.tagline) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(180, 210, 255);
    doc.text(company.tagline.toUpperCase(), TX, 20);
  }

  const infoY = company?.tagline ? 26 : 22;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(28, 60, 110);
  const infoLines: string[] = [];
  if (company?.tpin)                      infoLines.push(`TPIN / TAX ID: ${company.tpin}`);
  if (company?.contactInfo?.companyPhone) infoLines.push(`Phone: ${company.contactInfo.companyPhone}`);
  if (company?.contactInfo?.companyEmail) infoLines.push(`Email: ${company.contactInfo.companyEmail}`);
  infoLines.forEach((l, i) => doc.text(l, TX, infoY + i * 5));

  // Right: doc type badge
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...INK);
  doc.text("PROFORMA INVOICE", MR, 14, { align: "right" });

  // Proforma number
  doc.setFontSize(10);
  doc.text(proformaInvoice.proformaId ?? "-", MR, 20, { align: "right" });

  // Meta lines right
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...INK_SOFT);
  [
    `Invoice Date: ${fmtDate(proformaInvoice.dateofinvoice)}`,
    `Payment Method: ${getPaymentMethodLabel(proformaInvoice?.paymentInformation?.paymentMethod) ?? "-"}`,
    `Status: ${proformaInvoice.invoiceStatus ?? "-"}`,
  ].forEach((l, i) => doc.text(l, MR, 26 + i * 4, { align: "right" }));

  /* ══════════════════════════════════════════════════════════
     ③  ADDRESS BOXES — Bill To | Ship To | Payment Info
  ══════════════════════════════════════════════════════════ */
  const AY    = 40;
  const BH    = 7;
  const LH    = 4.5;
  const PAD   = 3;
  const gap   = 3;
  const bColW = (W - M * 2 - gap * 2) / 3;

  const billL = addrBlock(proformaInvoice?.billingAddress);
  const shipL = addrBlock(proformaInvoice?.shippingAddress);
  if (proformaInvoice?.billingAddress?.email) billL.push(`Email: ${proformaInvoice.billingAddress.email}`);
  if (proformaInvoice?.billingAddress?.phone) billL.push(`Phone: ${proformaInvoice.billingAddress.phone}`);

  const payL: string[] = ([
    `Method: ${getPaymentMethodLabel(proformaInvoice?.paymentInformation?.paymentMethod) ?? "-"}`,
    `Terms: ${proformaInvoice?.paymentInformation?.paymentTerms ?? "-"}`,
    `Bank: ${proformaInvoice?.paymentInformation?.bankName ?? "-"}`,
    proformaInvoice?.paymentInformation?.accountNumber
      ? `A/C: ${proformaInvoice.paymentInformation.accountNumber}` : null,
    proformaInvoice?.paymentInformation?.swiftCode
      ? `SWIFT: ${proformaInvoice.paymentInformation.swiftCode}` : null,
  ] as (string | null)[]).filter(Boolean) as string[];

  const calcBH = (lines: string[], hasBold = false) => {
    let h = BH + PAD * 2 + LH;
    if (hasBold) h += LH + 0.5;
    lines.forEach(l => { h += doc.splitTextToSize(l, bColW - 6).length * LH; });
    return h;
  };
  const boxH = Math.max(calcBH(billL, true), calcBH(shipL), calcBH(payL)) + 2;

  const drawBox = (bx: number, title: string, lines: string[], boldTop?: string) => {
    doc.setFillColor(...ERP_BLUE);
    doc.rect(bx, AY, bColW, BH, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...WHITE);
    doc.text(title, bx + 3, AY + 5.2);

    doc.setFillColor(...WHITE); doc.setDrawColor(...RULE); doc.setLineWidth(0.25);
    doc.rect(bx, AY + BH, bColW, boxH - BH, "FD");

    let cy = AY + BH + PAD + LH;
    if (boldTop) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...INK);
      doc.text(boldTop, bx + 3, cy);
      cy += LH + 1;
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
    lines.forEach(l => {
      const wr = doc.splitTextToSize(l, bColW - 6);
      doc.text(wr, bx + 3, cy);
      cy += wr.length * LH;
    });
  };

  drawBox(M,                     "Bill To",      billL, proformaInvoice?.customerName ?? "-");
  drawBox(M + bColW + gap,       "Ship To",      shipL);
  drawBox(M + (bColW + gap) * 2, "Payment Info", payL);

  /* ══════════════════════════════════════════════════════════
     ④  META INFO ROW  (same blue double-row cells as Invoice)
         Proforma No | Customer TPIN | Exchange Rate | Currency | Due Date
  ══════════════════════════════════════════════════════════ */
  const afterBoxY  = AY + boxH + 4;
  const metaColW   = (W - M * 2) / 5;
  const META_HDR_H = 6.5;
  const META_VAL_H = 7;

  const metaCols = [
    { label: "Proforma No",   value: proformaInvoice?.proformaId       || "-" },
    { label: "Customer TPIN", value: proformaInvoice?.customerTpin     || "-" },
    { label: "Exchange Rate", value: proformaInvoice?.exchangeRt       || "-" },
    { label: "Currency",      value: cur },
    { label: "Due Date",      value: fmtDate(proformaInvoice?.dueDate) },
  ];

  metaCols.forEach((col, i) => {
    const bx = M + i * metaColW;
    doc.setFillColor(...ERP_BLUE);
    doc.rect(bx, afterBoxY, metaColW, META_HDR_H, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...WHITE);
    doc.text(col.label, bx + 3, afterBoxY + 4.5);

    doc.setFillColor(...WHITE); doc.setDrawColor(...RULE); doc.setLineWidth(0.2);
    doc.rect(bx, afterBoxY + META_HDR_H, metaColW, META_VAL_H, "FD");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
    doc.text(col.value, bx + 3, afterBoxY + META_HDR_H + 4.8);
  });

  const afterMetaY = afterBoxY + META_HDR_H + META_VAL_H + 5;

  /* ══════════════════════════════════════════════════════════
     ⑤  ITEMS TABLE  — blue header, same cell style as Invoice
  ══════════════════════════════════════════════════════════ */
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...INK_PALE);
  doc.text("ITEMS", M, afterMetaY + 7);

  autoTable(doc, {
    startY: afterMetaY + 8,
    head: [[
      "#", "Item Code", "Item Name", "Description",
      "Packing", "Qty", "Rate", "Disc%", "Tax", "Tax Code", `Amount(${cur})`,
    ]],
    body: proformaInvoice.items.map((item: any, idx: number) => {
      const qty  = Number(item.quantity ?? 0);
      const rate = Number(item.price    ?? 0);
      const disc = Number(item.discount ?? 0);
      const net  = qty * rate * (1 - disc / 100);
      const packing = item.packingUnit && item.packingSize
        ? `${item.packingUnit}×${item.packingSize}` : "-";
      return [
        idx + 1,
        item.itemCode    ?? "-",
        item.itemName    ?? "-",
        item.description ?? "-",
        packing,
        Number.isInteger(qty) ? qty.toLocaleString() : fmt2(qty),
        fmt2(rate),
        disc > 0 ? `${disc}%` : "0%",
        item.vatRate != null && String(item.vatRate) !== "0" ? item.vatRate : "0",
        item.vatCode ?? "-",
        fmt2(net),
      ];
    }),
    styles: {
      fontSize: 7.5,
      textColor: [0, 0, 0],
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      lineColor: RULE,
      lineWidth: 0.15,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: ERP_BLUE,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
    },
    columnStyles: {
      0:  { cellWidth: COL_WIDTHS[0],  halign: "center" },
      1:  { cellWidth: COL_WIDTHS[1],  halign: "left",   fontStyle: "bold" },
      2:  { cellWidth: COL_WIDTHS[2],  halign: "left" },
      3:  { cellWidth: COL_WIDTHS[3],  halign: "left",   fontSize: 6.5 },
      4:  { cellWidth: COL_WIDTHS[4],  halign: "center" },
      5:  { cellWidth: COL_WIDTHS[5],  halign: "center" },
      6:  { cellWidth: COL_WIDTHS[6],  halign: "center" },
      7:  { cellWidth: COL_WIDTHS[7],  halign: "center" },
      8:  { cellWidth: COL_WIDTHS[8],  halign: "center" },
      9:  { cellWidth: COL_WIDTHS[9],  halign: "center" },
      10: { cellWidth: COL_WIDTHS[10], halign: "center", textColor: [0, 0, 0], fontSize: 7.5 },
    },
    margin:     { left: M, right: M },
    tableWidth: W - M * 2,
  });

  const tblEndY = (doc as any).lastAutoTable.finalY;

  /* ══════════════════════════════════════════════════════════
     ⑥  TOTALS — right-aligned text labels + amount column cells
         Rows: Gross Total | Discount (red) | Grand Total (navy)
  ══════════════════════════════════════════════════════════ */
  const SEC_Y   = tblEndY;
  const LABEL_X = AMOUNT_COL_X - 4;
  const ROW_H   = 6;

  let gross = 0, discTotal = 0;
  proformaInvoice.items.forEach((i: any) => {
    const q = Number(i.quantity ?? 0);
    const p = Number(i.price    ?? 0);
    const d = Number(i.discount ?? 0);
    gross     += q * p;
    discTotal += q * p * (d / 100);
  });
  const grandTotal = proformaInvoice.totalAmount != null
    ? Number(proformaInvoice.totalAmount)
    : gross - discTotal;

  doc.setFontSize(8); doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Gross Total",  LABEL_X, SEC_Y + ROW_H * 0.7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Discount",     LABEL_X, SEC_Y + ROW_H * 1.7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total",  LABEL_X, SEC_Y + ROW_H * 2.7, { align: "right" });

  autoTable(doc, {
    startY: SEC_Y,
    head:   [],
    body: [
      [`${fmt2(gross)} ${cur}`],
      [`-${fmt2(discTotal)} ${cur}`],
      [`${fmt2(grandTotal)} ${cur}`],
    ],
    styles: {
      fontSize: 8,
      halign: "center",
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      lineColor: RULE,
      lineWidth: 0.15,
    },
    columnStyles: { 0: { cellWidth: TOTAL_W } },
    didParseCell: (data) => {
      if (data.row.index === 0) { data.cell.styles.fontStyle = "bold"; }
      if (data.row.index === 1) {
        data.cell.styles.textColor = [160, 60, 60] as any;
        data.cell.styles.fillColor = [252, 245, 245] as any;
      }
      if (data.row.index === 2) {
        data.cell.styles.fillColor = NAVY as any;
        data.cell.styles.textColor = WHITE as any;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize  = 8;
      }
    },
    margin:     { left: AMOUNT_COL_X, right: M },
    tableWidth: TOTAL_W,
  });

  const sumEndY = (doc as any).lastAutoTable.finalY;

  /* ══════════════════════════════════════════════════════════
     ⑦  TERMS (left)  +  AUTHORISED SIGNATORY (right)
  ══════════════════════════════════════════════════════════ */
  const SIG_Y      = sumEndY;
  const LABEL_W    = 28;
  const SIGN_X     = AMOUNT_COL_X - LABEL_W;
  const SIGN_W     = LABEL_W + TOTAL_W;
  const SIGN_HDR_H = 6;
  const SIGN_BOX_H = 22;

  // Header bar
  doc.setFillColor(...ERP_BLUE);
  doc.rect(SIGN_X, SIG_Y, SIGN_W, SIGN_HDR_H, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...WHITE);
  doc.text("Authorised Signatory", SIGN_X + SIGN_W / 2, SIG_Y + 4, { align: "center" });

  // Body
  doc.setFillColor(...WHITE); doc.setDrawColor(...RULE); doc.setLineWidth(0.25);
  doc.rect(SIGN_X, SIG_Y + SIGN_HDR_H, SIGN_W, SIGN_BOX_H, "F");
  doc.line(SIGN_X, SIG_Y + SIGN_HDR_H,               SIGN_X + SIGN_W, SIG_Y + SIGN_HDR_H);
  doc.line(SIGN_X, SIG_Y + SIGN_HDR_H + SIGN_BOX_H,  SIGN_X + SIGN_W, SIG_Y + SIGN_HDR_H + SIGN_BOX_H);

  if (company?.documents?.authorizedSignatureUrl) {
    try {
      doc.addImage(
        px(company.documents.authorizedSignatureUrl), "PNG",
        SIGN_X + (SIGN_W - 40) / 2, SIG_Y + SIGN_HDR_H + 3, 40, 13,
      );
    } catch {}
  }

  const sigLineY = SIG_Y + SIGN_HDR_H + SIGN_BOX_H - 5;
  doc.line(SIGN_X + 5, sigLineY, SIGN_X + SIGN_W - 5, sigLineY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(120, 120, 120);
  doc.text("Signature", SIGN_X + SIGN_W / 2, sigLineY + 4, { align: "center" });

  // Terms & Conditions
  const termW  = SIGN_X - M;
  const termTW = termW - 14;
  const tLines: string[] = [];
  const selling = proformaInvoice?.terms?.selling;

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
  tLines.forEach(l => { tH += doc.splitTextToSize(l, termTW).length * 3.5; });
  const tBH = Math.max(SIGN_HDR_H + SIGN_BOX_H + 2, tH + 6);

  let termsY = SIG_Y;
  if (termsY + tBH > H - 16) {
    doc.addPage(); drawWatermark(); termsY = 16;
  }

  doc.setFillColor(...WHITE); doc.setDrawColor(...RULE); doc.setLineWidth(0.25);
  doc.rect(M, termsY, termW, tBH, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(0, 0, 0);
  doc.text("TERMS & CONDITIONS", M + 7, termsY + 5.5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(0, 0, 0);
  let tcy = termsY + 10.5;
  tLines.forEach(l => {
    const wr = doc.splitTextToSize(l, termTW);
    doc.text(wr, M + 7, tcy);
    tcy += wr.length * 3.5;
  });

  /* ══════════════════════════════════════════════════════════
     ⑧  FOOTER — identical to Invoice
  ══════════════════════════════════════════════════════════ */
  const totalPg = (doc as any).internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPg; pg++) {
    doc.setPage(pg);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...INK_PALE);
    doc.text("This is a computer-generated document.", M, H - 6);
    doc.text("Powered by ERP SYSTEM", W / 2, H - 6, { align: "center" });
    doc.text(`Page ${pg} / ${totalPg}`, MR, H - 6, { align: "right" });
  }

  /* ══════════════════════════════════════════════════════════
     ⑨  OUTPUT
  ══════════════════════════════════════════════════════════ */
  return resultType === "save"
    ? doc.save(`Proforma_Invoice_${proformaInvoice.proformaId}.pdf`)
    : doc.output("bloburl");
};