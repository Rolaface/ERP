import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPaymentMethodLabel } from "../../../constants/invoice.constants";
import { ERP_BASE } from "../../../config/api";

// ── Palette ───────────────────────────────────────────────────────────────────
const HDR_BASE   : [number,number,number] = [28,  72, 128];
const HDR_MID    : [number,number,number] = [42,  96, 160];
const HDR_LIGHT  : [number,number,number] = [60, 120, 190];
const NAVY       : [number,number,number] = [13,  38,  64];
const NAVY_MID   : [number,number,number] = [26,  63, 107];
const NAVY_LIGHT : [number,number,number] = [60, 110, 170];
const INK        : [number,number,number] = [22,  34,  50];
const INK_SOFT   : [number,number,number] = [60,  82, 110];
const INK_PALE   : [number,number,number] = [130, 155, 185];
const TINT       : [number,number,number] = [240, 245, 252];
const RULE       : [number,number,number] = [196, 214, 232];
const WHITE      : [number,number,number] = [255, 255, 255];
const DISCOUNT   : [number,number,number] = [160, 60,  60];

// ── Helpers ───────────────────────────────────────────────────────────────────
const px = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ERP_BASE}${path}`;
};

const addrLines = (a: any): string[] => {
  if (!a) return [];
  return [
    [a.line1, a.line2].filter(Boolean).join(", "),
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country ? a.country.toUpperCase() : "",
  ].filter(Boolean);
};

const money = (n: number, cur: string) => `${Number(n).toFixed(2)} ${cur}`;

const rule = (doc: jsPDF, y: number, x1 = 15, x2?: number) => {
  const W = doc.internal.pageSize.width;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(x1, y, x2 ?? W - 15, y);
};

const secLabel = (doc: jsPDF, text: string, x: number, y: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...INK_PALE);
  doc.text(text.toUpperCase(), x, y);
};

const hdrFill = (doc: jsPDF, x: number, y: number, w: number, h: number) => {
  doc.setFillColor(...HDR_BASE);
  doc.rect(x, y, w, h, "F");
};

const navyFill = (doc: jsPDF, x: number, y: number, w: number, h: number) => {
  doc.setFillColor(...NAVY);
  doc.rect(x, y, w, h, "F");
};

// ─────────────────────────────────────────────────────────────────────────────
export const generateQuotationPDF = async (
  quotation: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc  = new jsPDF("p", "mm", "a4");
  const W    = doc.internal.pageSize.width;   // 210
  const H    = doc.internal.pageSize.height;  // 297
  const cur  = quotation.currencyCode ?? "USD";
  const M    = 14;
  const MR   = W - M;

  /* ════════════════════════════════════════════════════════════
     ①  GHOST WATERMARK
  ════════════════════════════════════════════════════════════ */
  const drawWatermark = () => {
    const wmW = 120, wmH = 120;
    const wmX = (W - wmW) / 2;
    const wmY = (H - wmH) / 2 - 25;

    if (company?.documents?.companyLogoUrl) {
      try {
        doc.setGState(doc.GState({ opacity: 0.13 }));
        doc.addImage(px(company.documents.companyLogoUrl), "PNG", wmX, wmY, wmW, wmH);
        doc.setGState(doc.GState({ opacity: 1 }));

        const nameText = (company?.companyName ?? "").toUpperCase();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...HDR_BASE);
        doc.setGState(doc.GState({ opacity: 0.10 }));
        doc.text(nameText, W / 2, wmY + wmH + 14, {
          align: "center",
          charSpace: 3,
          maxWidth: W - M * 2,
        });
        doc.setGState(doc.GState({ opacity: 1 }));
      } catch {
        drawFallbackWatermark();
      }
    } else {
      drawFallbackWatermark();
    }
  };

  const drawFallbackWatermark = () => {
    const name     = (company?.companyName ?? "QUOTATION").toUpperCase();
    const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(160);
    doc.setTextColor(...HDR_BASE);
    doc.setGState(doc.GState({ opacity: 0.08 }));
    doc.text(initials, W / 2, H / 2 + 35, { align: "center" });
    doc.setFontSize(17);
    doc.setGState(doc.GState({ opacity: 0.09 }));
    doc.text(name, W / 2, H / 2 + 60, { align: "center", charSpace: 3, maxWidth: W - M * 2 });
    doc.setGState(doc.GState({ opacity: 1 }));
  };

  drawWatermark();

  /* ════════════════════════════════════════════════════════════
     ②  HEADER BAND
  ════════════════════════════════════════════════════════════ */
  const HDR_H   = 40;
  const STRIP_H = 10;

  hdrFill(doc, 0, 0, W, HDR_H + STRIP_H);

  doc.setFillColor(...HDR_MID);
  doc.setGState(doc.GState({ opacity: 0.5 }));
  doc.rect(W * 0.4, 0, W * 0.6, HDR_H + STRIP_H, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFillColor(...HDR_LIGHT);
  doc.setGState(doc.GState({ opacity: 0.3 }));
  doc.rect(W * 0.75, 0, W * 0.25, HDR_H + STRIP_H, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  /* ── COMPANY LOGO ── */
  const LOGO_Y  = 5;
  const LOGO_SZ = 32;
  const LOGO_X  = M;

  if (company?.documents?.companyLogoUrl) {
    try {
      doc.addImage(
        px(company.documents.companyLogoUrl),
        "PNG",
        LOGO_X, LOGO_Y, LOGO_SZ, LOGO_SZ,
      );
    } catch { /* ignore */ }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...WHITE);
    doc.text(
      (company?.companyName ?? "QT").slice(0, 2).toUpperCase(),
      LOGO_X + LOGO_SZ / 2,
      LOGO_Y + LOGO_SZ / 2 + 3,
      { align: "center" },
    );
  }

  /* ── COMPANY NAME + DETAILS ── */
  const NAME_X = LOGO_X + LOGO_SZ + 6;
  const NAME_Y = LOGO_Y + 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text(company?.companyName ?? "Company Name", NAME_X, NAME_Y);

  const detailLines: string[] = ([
    [
      company?.tpin ? `TPIN: ${company.tpin}` : null,
      company?.contactInfo?.companyPhone ? `  Phone: ${company.contactInfo.companyPhone}` : null,
    ].filter(Boolean).join(""),
    company?.contactInfo?.companyEmail ? `Email: ${company.contactInfo.companyEmail}` : null,
  ] as (string | null)[]).filter(Boolean) as string[];

  doc.setFontSize(7.5);
  doc.setTextColor(220, 235, 255);
  doc.setGState(doc.GState({ opacity: 0.85 }));
  detailLines.forEach((l, i) => doc.text(l, NAME_X, NAME_Y + 12 + i * 5));
  doc.setGState(doc.GState({ opacity: 1 }));

  /* ── BADGE + DOC NUMBER (right) ── */
  const BADGE_W = 46, BADGE_H = 8;
  const BADGE_X = MR - BADGE_W;
  const BADGE_Y = LOGO_Y + 1;

  doc.setFillColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.18 }));
  doc.roundedRect(BADGE_X, BADGE_Y, BADGE_W, BADGE_H, 2, 2, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  // Badge label — Export Quotation or Quotation
  const badgeLabel = quotation.invoiceType === "Export" ? "EXPORT QUOTATION" : "QUOTATION";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(badgeLabel, BADGE_X + BADGE_W / 2, BADGE_Y + 5.3, { align: "center" });

  // Large document number — quotation.id
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text(quotation.id ?? "-", MR, LOGO_Y + 24, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(180, 215, 255);
  doc.text("DOCUMENT NO.", MR, LOGO_Y + 30, { align: "right" });

  /* ── DATE / META STRIP ── */
  const SY = HDR_H;
  doc.setFillColor(0, 0, 0);
  doc.setGState(doc.GState({ opacity: 0.18 }));
  doc.rect(0, SY, W, STRIP_H, "F");
  doc.setGState(doc.GState({ opacity: 1 }));

  const stripCols: [string, string][] = [
    ["Issue Date",    quotation.transactionDate ?? "-"],
    ["Valid Until",   quotation.validUntil      ?? "-"],
    ["Payment Terms", quotation.paymentInformation?.paymentTerms ?? "-"],
    ["Status",        quotation.invoiceStatus   ?? "-"],
    ["Currency",      cur],
  ];
  const scw = W / stripCols.length;
  stripCols.forEach(([label, val], i) => {
    const sx = i * scw + M * 0.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(180, 215, 255);
    doc.text(label.toUpperCase(), sx, SY + 3.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text(val, sx, SY + 8.8);
    if (i > 0) {
      doc.setDrawColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.15 }));
      doc.setLineWidth(0.2);
      doc.line(i * scw, SY + 1.5, i * scw, SY + STRIP_H - 1.5);
      doc.setGState(doc.GState({ opacity: 1 }));
    }
  });

  /* ════════════════════════════════════════════════════════════
     ③  ADDRESS BOXES
  ════════════════════════════════════════════════════════════ */
  const AFTER_HDR = HDR_H + STRIP_H + 7;
  const BOX_HDR   = 6.5;
  const BOX_PAD   = 3;
  const LH        = 4.2;
  const gap       = 4;
  const colW      = (W - M * 2 - gap * 2) / 3;
  const boxY      = AFTER_HDR;

  const billL = addrLines(quotation?.billingAddress);
  const shipL = addrLines(quotation?.shippingAddress);
  const payL  = ([
    `Method:  ${getPaymentMethodLabel(quotation?.paymentInformation?.paymentMethod) ?? "-"}`,
    `Terms:   ${quotation?.paymentInformation?.paymentTerms ?? "-"}`,
    `Bank:    ${quotation?.paymentInformation?.bankName     ?? "-"}`,
    quotation?.paymentInformation?.accountNumber
      ? `A/C:     ${quotation.paymentInformation.accountNumber}` : null,
    quotation?.paymentInformation?.swiftCode
      ? `SWIFT:   ${quotation.paymentInformation.swiftCode}` : null,
  ] as (string | null)[]).filter(Boolean) as string[];

  const calcH = (lines: string[], hasBold = false) => {
    let h = BOX_HDR + BOX_PAD * 2 + LH;
    if (hasBold) h += LH + 0.5;
    lines.forEach(l => { h += doc.splitTextToSize(l, colW - 8).length * LH; });
    return h;
  };

  const boxH = Math.max(calcH(billL, true), calcH(shipL), calcH(payL)) + 2;

  const drawBox = (bx: number, title: string, lines: string[], boldTop?: string) => {
    doc.setFillColor(...HDR_BASE);
    doc.rect(bx, boxY, colW, BOX_HDR, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text(title, bx + colW / 2, boxY + BOX_HDR - 1.5, { align: "center" });

    doc.setFillColor(...TINT);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.rect(bx, boxY + BOX_HDR, colW, boxH - BOX_HDR, "FD");
    doc.setDrawColor(...NAVY_LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(bx, boxY, colW, boxH, "D");

    let cy = boxY + BOX_HDR + BOX_PAD + LH;
    if (boldTop) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...INK);
      doc.text(boldTop, bx + colW / 2, cy, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...INK_SOFT);
      cy += LH + 0.5;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_SOFT);
    lines.forEach(l => {
      const wrapped = doc.splitTextToSize(l, colW - 8);
      doc.text(wrapped, bx + colW / 2, cy, { align: "center" });
      cy += wrapped.length * LH;
    });
  };

  drawBox(M,                    "Bill To",      billL, quotation?.customerId ?? "-");
  drawBox(M + colW + gap,       "Ship To",      shipL);
  drawBox(M + (colW + gap) * 2, "Payment Info", payL);

  /* ════════════════════════════════════════════════════════════
     ④  TPIN / LPO / EXCHANGE RATE
  ════════════════════════════════════════════════════════════ */
  const afterBoxY = boxY + boxH + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  doc.text(`Customer TPIN:  ${quotation?.customerTpin ?? "N/A"}`, M, afterBoxY);
  if (quotation?.lpoNumber)
    doc.text(`LPO No:  ${quotation.lpoNumber}`, W / 2, afterBoxY);
  else if (quotation?.exchangeRt)
    doc.text(`Exchange Rate:  ${quotation.exchangeRt}`, W / 2, afterBoxY);
  rule(doc, afterBoxY + 3);

  /* ════════════════════════════════════════════════════════════
     ⑤  LINE ITEMS TABLE
  ════════════════════════════════════════════════════════════ */
  secLabel(doc, "Product Line Items", M, afterBoxY + 9);

  autoTable(doc, {
    startY: afterBoxY + 11,
    head: [[
      "#", "Item Code", "Item Name", "Description",
      "Packing", "Qty", "Unit Price", "Disc%", "Tax Cat", `Amount\n(${cur})`,
    ]],
    body: quotation.items.map((item: any, idx: number) => {
      const qty   = Number(item.quantity ?? 0);
      const price = Number(item.price    ?? 0);
      const disc  = Number(item.discount ?? 0);
      const net   = qty * price * (1 - disc / 100);
      const packing = item.packingUnit && item.packingSize
        ? `${item.packingUnit}×${item.packingSize}` : "-";
      return [
        idx + 1,
        item.itemCode    ?? "-",
        item.itemName    ?? "-",
        item.description ?? "-",
        packing,
        qty.toFixed(2),
        price.toFixed(2),
        disc > 0 ? `${disc}%` : "-",
        item.vatCode     ?? "-",
        net.toFixed(2),
      ];
    }),
    styles: {
      fontSize: 7.5,
      textColor: INK_SOFT,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      lineColor: RULE,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: HDR_BASE,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7,
      cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
    },
    alternateRowStyles: { fillColor: TINT },
    columnStyles: {
      0: { cellWidth: 7,  halign: "center" },
      1: { cellWidth: 22, halign: "left", textColor: INK, fontStyle: "bold" },
      2: { cellWidth: 22, halign: "left" },
      3: { cellWidth: 28, halign: "left" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 10, halign: "right" },
      6: { cellWidth: 14, halign: "right" },
      7: { cellWidth: 10, halign: "center" },
      8: { cellWidth: 10, halign: "center" },
      9: { halign: "right", fontStyle: "bold", textColor: HDR_BASE },
    },
    margin: { left: M, right: M },
    tableWidth: W - M * 2,
  });

  const tableEndY = (doc as any).lastAutoTable.finalY;

  /* ════════════════════════════════════════════════════════════
     ⑥  SIGNATURE + TOTALS
  ════════════════════════════════════════════════════════════ */
  const secY  = tableEndY + 6;
  const SIG_W = 78;
  const SUM_X = M + SIG_W + 5;
  const SUM_W = MR - SUM_X;

  // Signature box
  doc.setFillColor(...HDR_BASE);
  doc.rect(M, secY, SIG_W, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text("Authorised Signatory", M + SIG_W / 2, secY + 5, { align: "center" });

  doc.setFillColor(...TINT);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.rect(M, secY + 7, SIG_W, 28, "FD");
  doc.setDrawColor(...NAVY_LIGHT);
  doc.setLineWidth(0.3);
  doc.rect(M, secY, SIG_W, 35, "D");

  if (company?.documents?.authorizedSignatureUrl) {
    try {
      doc.addImage(
        px(company.documents.authorizedSignatureUrl),
        "PNG",
        M + (SIG_W - 50) / 2, secY + 10, 50, 18,
      );
    } catch { /* ignore */ }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_PALE);
    doc.text("Signature", M + SIG_W / 2, secY + 24, { align: "center" });
  }
  rule(doc, secY + 30, M + 6, M + SIG_W - 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...INK_PALE);
  doc.text("Signature of Authorised Person", M + SIG_W / 2, secY + 34, { align: "center" });

  // Totals calculation
  let gross = 0, itemDisc = 0;
  quotation.items.forEach((i: any) => {
    const q = Number(i.quantity ?? 0);
    const p = Number(i.price    ?? 0);
    const d = Number(i.discount ?? 0);
    gross    += q * p;
    itemDisc += q * p * (d / 100);
  });
  const totalDisc  = itemDisc;
  const finalNet   = gross - itemDisc;

  type TR = [string, string, "normal" | "discount" | "grand"];
  const totRows: TR[] = [
    ["Gross Total",    money(gross,     cur), "normal"  ],
    ["Item Discount",  money(itemDisc,  cur), "discount"],
    ["Total Discount", money(totalDisc, cur), "discount"],
    ["Grand Total",    money(finalNet,  cur), "grand"   ],
  ];

  autoTable(doc, {
    startY:    secY,
    head:      [],
    body:      totRows.map(r => [r[0], r[1]]),
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 6, right: 6 },
      lineColor: RULE, lineWidth: 0.15,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: TINT,  cellWidth: SUM_W * 0.55, textColor: INK_SOFT },
      1: { halign: "right",   fillColor: WHITE, cellWidth: SUM_W * 0.45, textColor: INK_SOFT },
    },
    didParseCell: (d) => {
      const t = totRows[d.row.index]?.[2];
      if (!t) return;
      if (t === "discount") {
        d.cell.styles.textColor = DISCOUNT;
        if (d.column.index === 0) d.cell.styles.fillColor = [252, 245, 245] as any;
      }
      if (t === "grand") {
        d.cell.styles.fillColor = NAVY;
        d.cell.styles.textColor = WHITE;
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.fontSize  = 9;
      }
    },
    margin:     { left: SUM_X, right: M },
    tableWidth: SUM_W,
  });

  const sumEndY = (doc as any).lastAutoTable.finalY;

  /* ════════════════════════════════════════════════════════════
     ⑦  TERMS & CONDITIONS BOX
  ════════════════════════════════════════════════════════════ */
  let termsY = Math.max(secY + 40, sumEndY) + 7;
  const selling = quotation?.terms?.selling;
  const termBW  = W - M * 2, termTW = termBW - 12;
  let tLines: string[] = [];
  if (selling) {
    if (selling.general)      tLines.push(`General: ${selling.general}`);
    if (selling.delivery)     tLines.push(`Delivery: ${selling.delivery}`);
    if (selling.cancellation) tLines.push(`Cancellation: ${selling.cancellation}`);
    if (selling.warranty)     tLines.push(`Warranty: ${selling.warranty}`);
    if (selling.liability)    tLines.push(`Liability: ${selling.liability}`);
    if (selling.payment) {
      const p = selling.payment;
      if (p.dueDates)    tLines.push(`Payment Due Dates: ${p.dueDates}`);
      if (p.lateCharges) tLines.push(`Late Charges: ${p.lateCharges}`);
      if (p.notes)       tLines.push(`Payment Notes: ${p.notes}`);
      p.phases?.forEach((ph: any, i: number) =>
        tLines.push(`  ${i + 1}. ${ph.percentage} — ${ph.condition}`));
    }
  }
  if (!tLines.length) tLines.push("No terms and conditions specified.");

  let tH = 10;
  tLines.forEach(l => { tH += doc.splitTextToSize(l, termTW).length * 4.5; });
  const tBH = Math.max(26, tH + 4);
  if (termsY + tBH > H - 20) { doc.addPage(); drawWatermark(); termsY = 20; }

  doc.setFillColor(...TINT);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.rect(M, termsY, termBW, tBH, "FD");
  doc.setFillColor(...HDR_BASE);
  doc.rect(M, termsY, 3.5, tBH, "F");

  secLabel(doc, "Terms & Conditions", M + 7, termsY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  let tCy = termsY + 10;
  tLines.forEach(l => {
    const wr = doc.splitTextToSize(l, termTW);
    doc.text(wr, M + 7, tCy);
    tCy += wr.length * 4.5;
  });

  /* ════════════════════════════════════════════════════════════
     ⑧  FOOTER BAND
  ════════════════════════════════════════════════════════════ */
  const FTR_H   = 14;
  const totalPg = (doc as any).internal.getNumberOfPages();

  for (let pg = 1; pg <= totalPg; pg++) {
    doc.setPage(pg);

    navyFill(doc, 0, H - FTR_H, W, FTR_H);
    doc.setFillColor(...NAVY_MID);
    doc.setGState(doc.GState({ opacity: 0.4 }));
    doc.rect(W * 0.4, H - FTR_H, W * 0.6, FTR_H, "F");
    doc.setGState(doc.GState({ opacity: 1 }));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...WHITE);
    doc.text(company?.companyName ?? "", M, H - FTR_H + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(180, 215, 255);
    doc.text("This is a computer-generated document. No physical signature required.", M, H - FTR_H + 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...WHITE);
    doc.setGState(doc.GState({ opacity: 0.75 }));
    doc.text(`Page ${pg} / ${totalPg}`, MR, H - FTR_H + 6, { align: "right" });
    doc.setGState(doc.GState({ opacity: 1 }));

    doc.setFontSize(5.8);
    doc.setTextColor(180, 215, 255);
    doc.text("Powered by ERP SYSTEM", W / 2, H - FTR_H + 11, { align: "center" });
  }

  /* ════════════════════════════════════════════════════════════
     ⑨  OUTPUT
  ════════════════════════════════════════════════════════════ */
  return resultType === "save"
    ? doc.save(`Quotation_${quotation.id}.pdf`)
    : doc.output("bloburl");
};