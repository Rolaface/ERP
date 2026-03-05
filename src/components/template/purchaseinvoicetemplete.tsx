import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ERP_BASE } from "../../config/api";

// ── Palette (matches invoice exactly) ────────────────────────────────────────
const HDR_DARK: [number, number, number] = [28, 60, 110];
const HDR_MED: [number, number, number] = [44, 88, 152];
const BADGE_BG: [number, number, number] = [60, 110, 180];
const STRIP_BG: [number, number, number] = [44, 80, 140];
const BOX_TITLE: [number, number, number] = [44, 80, 140];
const TINT: [number, number, number] = [240, 245, 252];
const RULE: [number, number, number] = [200, 215, 235];
const WHITE: [number, number, number] = [255, 255, 255];
const INK: [number, number, number] = [22, 34, 50];
const INK_SOFT: [number, number, number] = [60, 82, 110];
const INK_PALE: [number, number, number] = [140, 160, 190];
const GRAND_BG: [number, number, number] = [28, 60, 110];
const AMT_BLUE: [number, number, number] = [28, 72, 200];
const TAX_BG: [number, number, number] = [232, 241, 252];
const TAX_TEXT: [number, number, number] = [30, 70, 130];

// ── Helpers ───────────────────────────────────────────────────────────────────
const px = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ERP_BASE}${path}`;
};

const fmt2 = (n: any) => Number(n ?? 0).toFixed(2);

const addrBlock = (a: any): string[] => {
  if (!a) return [];
  return [
    [a.addressLine1, a.addressLine2].filter(Boolean).join(", "),
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country ? a.country.toUpperCase() : "",
  ].filter(Boolean);
};

// ─────────────────────────────────────────────────────────────────────────────
export const generatePurchaseInvoicePDF = async (
  pi: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.width; // 210
  const H = doc.internal.pageSize.height; // 297
  const cur = pi.currency ?? "INR";
  const M = 14;
  const MR = W - M;

  /* ══════════════════════════════════════════════════════════
     WATERMARK — faint company name + logo behind content
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
      } catch {
        /* ignore */
      }
    }

    const name = (company?.companyName ?? "").toUpperCase();

    // Auto-shrink font so full name always fits within page width
    let fontSize = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSize);
    while (doc.getTextWidth(name) > W - 20 && fontSize > 8) {
      fontSize -= 1;
      doc.setFontSize(fontSize);
    }

    doc.setTextColor(...HDR_DARK);
    doc.setGState(doc.GState({ opacity: 0.07 }));
    // Draw centered — no charSpace so long names don't overflow
    doc.text(name, W / 2, H - 48, { align: "center" });
    doc.setGState(doc.GState({ opacity: 1 }));
  };
  drawWatermark();

  /* ══════════════════════════════════════════════════════════
     ①  HEADER  — same as invoice:
        navy bg | logo left | company name+details | badge+docno right
  ══════════════════════════════════════════════════════════ */
  const HDR_H = 45;
  doc.setFillColor(...HDR_DARK);
  doc.rect(0, 0, W, HDR_H, "F");

  // Logo
  const LOGO_X = M,
    LOGO_Y = 5,
    LOGO_SZ = 38;
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
    } catch {
      /* ignore */
    }
  } else {
    doc.setFillColor(...HDR_MED);
    doc.circle(LOGO_X + LOGO_SZ / 2, LOGO_Y + LOGO_SZ / 2, LOGO_SZ / 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...WHITE);
    doc.text(
      (company?.companyName ?? "??").slice(0, 2).toUpperCase(),
      LOGO_X + LOGO_SZ / 2,
      LOGO_Y + LOGO_SZ / 2 + 3,
      { align: "center" },
    );
  }

  // Company name + tagline + details
  const TX = LOGO_X + LOGO_SZ + 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...WHITE);
  doc.text((company?.companyName ?? "").toUpperCase(), TX, 14);

  if (company?.tagline) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 210, 255);
    doc.text(company.tagline.toUpperCase(), TX, 26);
  }

  const infoY = company?.tagline ? 26 : 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(200, 220, 255);
  const infoLines: string[] = [];

  if (company?.tpin) infoLines.push(`TPIN / TAX ID: ${company.tpin}`);

  if (company?.contactInfo?.companyPhone)
    infoLines.push(`Phone: ${company.contactInfo.companyPhone}`);

  if (company?.contactInfo?.companyEmail)
    infoLines.push(`Email: ${company.contactInfo.companyEmail}`);
  infoLines.forEach((l, i) => doc.text(l, TX, infoY + i * 5.5));

  // Badge — top right
  const BW = 40,
    BH = 8;
  const BX = MR - BW,
    BY = 5;
  doc.setFillColor(...BADGE_BG);
  doc.roundedRect(BX, BY, BW, BH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text("PURCHASE INVOICE", BX + BW / 2, BY + 6.8, { align: "center" });

  // Document number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text(pi.pId ?? "-", MR, 32, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(160, 200, 255);

  /* ══════════════════════════════════════════════════════════
     ②  META STRIP  — 5 cols with pipe dividers (like invoice)
  ══════════════════════════════════════════════════════════ */
  const SY = HDR_H,
    SH = 16;
  doc.setFillColor(...STRIP_BG);
  doc.rect(0, SY, W, SH, "F");

  const stripCols: [string, string][] = [
    ["INVOICE DATE", pi.pDate ?? "-"],

    ["PAYMENT METHOD", pi.paymentMethod ?? "-"],
    ["STATUS", pi.status ?? "-"],
    ["CURRENCY", cur],
  ];
  const scw = W / stripCols.length;
  stripCols.forEach(([label, val], i) => {
    const sx = i * scw + 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(180, 210, 255);
    doc.text(label, sx, SY + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(val, sx, SY + 13);
    if (i > 0) {
      doc.setDrawColor(100, 140, 200);
      doc.setLineWidth(0.3);
      doc.line(i * scw, SY + 3, i * scw, SY + SH - 3);
    }
  });

  /* ══════════════════════════════════════════════════════════
     ③  ADDRESS BOXES — Supplier | Dispatch | Ship To
  ══════════════════════════════════════════════════════════ */
  const AY = SY + SH + 5;
  const BOX_HDR = 7;
  const LH = 4.5;
  const PAD = 3;
  const gap = 3;
  const colW = (W - M * 2 - gap * 2) / 3;

  const supplierL = addrBlock(pi?.addresses?.supplierAddress);
  const dispatchL = addrBlock(pi?.addresses?.dispatchAddress);
  const shippingL = addrBlock(pi?.addresses?.shippingAddress);

  // append email/phone from supplier address
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

  const drawBox = (
    bx: number,
    title: string,
    lines: string[],
    boldTop?: string,
  ) => {
    doc.setFillColor(...BOX_TITLE);
    doc.rect(bx, AY, colW, BOX_HDR, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text(title, bx + colW / 2, AY + 5.2, { align: "center" });

    doc.setFillColor(...WHITE);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.rect(bx, AY + BOX_HDR, colW, boxH - BOX_HDR, "FD");

    let cy = AY + BOX_HDR + PAD + LH;
    if (boldTop) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      doc.text(boldTop, bx + colW / 2, cy, { align: "center" });
      cy += LH + 1;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_SOFT);
    lines.forEach((l) => {
      const wr = doc.splitTextToSize(l, colW - 6);
      doc.text(wr, bx + colW / 2, cy, { align: "center" });
      cy += wr.length * LH;
    });
  };

  drawBox(M, "Supplier", supplierL, pi?.supplierName ?? "-");
  drawBox(M + colW + gap, "Dispatch Address", dispatchL);
  drawBox(M + (colW + gap) * 2, "Ship To", shippingL);

  /* ══════════════════════════════════════════════════════════
     ④  META LINE  — LPO / Project / CostCenter / Tax / Incoterm
  ══════════════════════════════════════════════════════════ */
  const afterBoxY = AY + boxH + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);

  const metaL = [pi?.lpoNumber ? `LPO No: ${pi.lpoNumber}` : null]
    .filter(Boolean)
    .join("   ");

  const metaR = [
    pi?.incoterm ? `Incoterm: ${pi.incoterm}` : null,
    pi?.taxCategory ? `Tax Category: ${pi.taxCategory}` : null,
    pi?.spplrInvcNo ? `Supplier Inv#: ${pi.spplrInvcNo}` : null,
  ]
    .filter(Boolean)
    .join("   ");

  if (metaL) doc.text(metaL, M, afterBoxY);
  if (metaR) doc.text(metaR, MR, afterBoxY, { align: "right" });

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.line(M, afterBoxY + 3, MR, afterBoxY + 3);

  /* ══════════════════════════════════════════════════════════
     ⑤  ITEMS TABLE  — same columns as invoice style
  ══════════════════════════════════════════════════════════ */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...INK_PALE);
  doc.text("PURCHASE INVOICE ITEMS", M, afterBoxY + 9);

  autoTable(doc, {
    startY: afterBoxY + 11,
    head: [
      [
        "#",
        "Item Code",
        "Item Name",
        "Packing",
        "UOM",
        "Required By",
        "Qty",
        "Rate",
        "Tax",
        `Amount\n(${cur})`,
      ],
    ],
    body: pi.items.map((item: any, idx: number) => [
      idx + 1,
      item.item_code ?? "-",
      item.item_name ?? "-",
      item.packing ?? "-",
      item.uom ?? "-",
      item.requiredBy ?? "-",
      fmt2(item.qty),

      fmt2(item.rate),
      item.VatCd ?? "-",
      fmt2(item.amount),
    ]),
    styles: {
      fontSize: 7.5,
      textColor: INK_SOFT,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      lineColor: RULE,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: HDR_DARK,
      textColor: WHITE,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7,
      cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
    },
    alternateRowStyles: { fillColor: TINT },
    columnStyles: {
      0: { cellWidth: 7, halign: "center" },
      1: { cellWidth: 26, halign: "left", fontStyle: "bold", textColor: INK },
      2: { cellWidth: 32, halign: "left" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 12, halign: "right" },
      7: { cellWidth: 16, halign: "right" },
      8: { cellWidth: 12, halign: "center" },
      9: { halign: "right", fontStyle: "bold", textColor: AMT_BLUE },
    },
    margin: { left: M, right: M },
    tableWidth: W - M * 2,
  });

  const tblY = (doc as any).lastAutoTable.finalY;

  /* ══════════════════════════════════════════════════════════
     ⑥  SIGNATURE (left)  +  TOTALS (right)
  ══════════════════════════════════════════════════════════ */
  const SEC_Y = tblY + 5;
  const SIG_W = 78;
  const SUM_X = M + SIG_W + 5;
  const SUM_W = MR - SUM_X;

  // Signature box
  doc.setFillColor(...BOX_TITLE);
  doc.rect(M, SEC_Y, SIG_W, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text("Authorised Signatory", M + SIG_W / 2, SEC_Y + 5, {
    align: "center",
  });

  doc.setFillColor(...WHITE);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.rect(M, SEC_Y + 7, SIG_W, 28, "FD");

  if (company?.documents?.authorizedSignatureUrl) {
    try {
      doc.addImage(
        px(company.documents.authorizedSignatureUrl),
        "PNG",
        M + (SIG_W - 50) / 2,
        SEC_Y + 10,
        50,
        18,
      );
    } catch {
      /* ignore */
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_PALE);
    doc.text("Signature", M + SIG_W / 2, SEC_Y + 24, { align: "center" });
  }
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(M + 6, SEC_Y + 30, M + SIG_W - 6, SEC_Y + 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...INK_PALE);
  doc.text("Signature of Authorised Person", M + SIG_W / 2, SEC_Y + 34, {
    align: "center",
  });

  // Totals — from summary block
  const subTotal = Number(pi?.summary?.subTotal ?? 0);
  const taxTotal = Number(pi?.summary?.taxTotal ?? 0);
  const grandTotal = Number(pi?.summary?.grandTotal ?? 0);
  const rounding = Number(pi?.summary?.roundingAdjustment ?? 0);
  const taxRate = pi?.tax?.taxRate ?? "-";

  type TRK = "normal" | "tax" | "rounding" | "grand";
  const totRows: [string, string, TRK][] = [
    ["Sub Total", `${fmt2(subTotal)} ${cur}`, "normal"],
    [`Tax (${taxRate})`, `${fmt2(taxTotal)} ${cur}`, "tax"],
    ["Rounding ", `${fmt2(rounding)} ${cur}`, "rounding"],
    ["Grand Total", `${fmt2(grandTotal)} ${cur}`, "grand"],
  ];

  autoTable(doc, {
    startY: SEC_Y,
    head: [],
    body: totRows.map((r) => [r[0], r[1]]),
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 5, right: 5 },
      lineColor: RULE,
      lineWidth: 0.15,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        fillColor: TINT,
        cellWidth: SUM_W * 0.52,
        textColor: INK_SOFT,
      },
      1: {
        halign: "right",
        fillColor: WHITE,
        cellWidth: SUM_W * 0.48,
        textColor: INK_SOFT,
      },
    },
    didParseCell: (d) => {
      const k = totRows[d.row.index]?.[2];
      if (k === "tax") {
        d.cell.styles.fillColor = TAX_BG;
        d.cell.styles.textColor = TAX_TEXT;
      }
      if (k === "rounding") {
        d.cell.styles.textColor = INK_PALE;
        d.cell.styles.fontSize = 7.5;
      }
      if (k === "grand") {
        d.cell.styles.fillColor = GRAND_BG;
        d.cell.styles.textColor = WHITE;
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.fontSize = 9.5;
      }
    },
    margin: { left: SUM_X, right: M },
    tableWidth: SUM_W,
  });

  const sumEndY = (doc as any).lastAutoTable.finalY;

  /* ══════════════════════════════════════════════════════════
     ⑦  TERMS & CONDITIONS — uses terms.terms.buying
  ══════════════════════════════════════════════════════════ */
  let termsY = Math.max(SEC_Y + 40, sumEndY) + 6;
  const buying = pi?.terms?.terms?.buying;
  const termW = W - M * 2,
    termTW = termW - 14;
  const tLines: string[] = [];

  if (buying) {
    if (buying.general) tLines.push(`General: ${buying.general}`);
    if (buying.delivery) tLines.push(`Delivery: ${buying.delivery}`);
    if (buying.cancellation)
      tLines.push(`Cancellation: ${buying.cancellation}`);
    if (buying.warranty) tLines.push(`Warranty: ${buying.warranty}`);
    if (buying.liability) tLines.push(`Liability: ${buying.liability}`);
    if (buying.payment) {
      const p = buying.payment;
      if (p.dueDates) tLines.push(`Payment Due: ${p.dueDates}`);
      if (p.lateCharges) tLines.push(`Late Charges: ${p.lateCharges}`);
      if (p.notes) tLines.push(`Notes: ${p.notes}`);
      p.phases?.forEach((ph: any, i: number) =>
        tLines.push(`  ${i + 1}. ${ph.percentage}% — ${ph.condition}`),
      );
    }
  }
  if (!tLines.length) tLines.push("No terms and conditions specified.");

  let tH = 12;
  tLines.forEach((l) => {
    tH += doc.splitTextToSize(l, termTW).length * 4.5;
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
  doc.rect(M, termsY, termW, tBH, "FD");
  doc.setFillColor(...BOX_TITLE);
  doc.rect(M, termsY, 3.5, tBH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...INK_PALE);
  doc.text("TERMS & CONDITIONS", M + 7, termsY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK_SOFT);
  let tcy = termsY + 10.5;
  tLines.forEach((l) => {
    const wr = doc.splitTextToSize(l, termTW);
    doc.text(wr, M + 7, tcy);
    tcy += wr.length * 4.5;
  });

  /* ══════════════════════════════════════════════════════════
     ⑧  FOOTER  — same as invoice (simple text, no navy band)
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
