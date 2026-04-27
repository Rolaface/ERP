import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ERP_BASE } from "../../config/api";
const ERP_BLUE: [number, number, number] = [46, 109, 197];
const BOX_TITLE: [number, number, number] = ERP_BLUE;
const RULE: [number, number, number] = [200, 220, 240];
const WHITE: [number, number, number] = [255, 255, 255];
const INK: [number, number, number] = [25, 45, 75];
const INK_SOFT: [number, number, number] = [70, 95, 130];
const INK_PALE: [number, number, number] = [130, 150, 180];

const px = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ERP_BASE}${path}`;
};

const fmt2 = (n: any) => Number(n ?? 0).toFixed(2);


const parseAddressDisplay = (html: string): string[] => {
  if (!html) return [];
  return html
    .split(/<br\s*\/?>/i)          // split on <br> or <br/>
    .map((l) => l.replace(/\n/g, "").trim())
    .filter(Boolean);
};

const fmtDate = (dateStr: any) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);

  const day = String(d.getDate()).padStart(2, "0");

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

export const generatePurchaseOrderPDF = async (
  po: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  const cur = po.currency ?? "INR";
  const M = 14;
  const MR = W - M;
  const LOGO_Y = 5;
  const LOGO_SZ = 32;
  const LOGO_X = M;

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

  const TX = LOGO_X + LOGO_SZ + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text((company?.companyName ?? "").toUpperCase(), TX, 14);

  if (company?.tagline) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 210, 255);
    doc.text(company.tagline.toUpperCase(), TX, 20);
  }

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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("PURCHASE ORDER", MR, 14, { align: "right" });

  const badgeLabel = "PURCHASE ORDER";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const badgeTextW = doc.getTextWidth(badgeLabel);
  const badgePadX = 2;
  const badgeH = 8;
  const badgeW = badgeTextW + badgePadX * 2;
  const badgeX = MR - badgeW;
  const badgeY = 8;
  doc.setFillColor(...ERP_BLUE);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");
  doc.setTextColor(...WHITE);
  doc.text(badgeLabel, badgeX + badgeW - badgePadX, badgeY + badgeH / 2 + 1.5, {
    align: "right",
  });
  doc.setTextColor(...INK);
  doc.text(po.poId ?? "-", MR, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK_SOFT);

  const metaLines = [
    `PO Date: ${fmtDate(po.poDate)}`,
    `Incoterm: ${po.incoterms ?? "-"}`,            // ✅ was: po.incoterm
    `Currency: ${cur}`,
  ];

  metaLines.forEach((line, i) => {
    doc.text(line, MR, 26 + i * 4, { align: "right" });
  });

  const AY = 40;
  const BOX_HDR = 7;
  const LH = 4.5;
  const PAD = 3;
  const gap = 3;
  const colW = (W - M * 2 - gap * 2) / 3;

  // ✅ NEW: Parse addresses from HTML display strings
  const supplierL = parseAddressDisplay(po.supplierAddressDisplay);
  const dispatchL = parseAddressDisplay(po.dispatchAddressDisplay);
  const shippingL = parseAddressDisplay(po.shippingAddressDisplay);

  // ✅ REMOVED: supplierAddress.email / .phone — not available in new API response

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

  drawBox(M, "Supplier", supplierL, po?.supplierName ?? "-");
drawBox(
  M + colW + gap,
  "Dispatch Address",
  dispatchL,
  po?.supplierName ?? "-"
);

drawBox(
  M + (colW + gap) * 2,
  "Ship To",
  shippingL,
  company?.companyName ?? "-"
);

  const afterBoxY = AY + boxH + 4;

  doc.setFont("helvetica");
  doc.setFontSize(7);
  doc.setTextColor(...INK_PALE);
  doc.text("ITEMS", M, afterBoxY + 9);
  const TOTAL_W = 28;
  autoTable(doc, {
    startY: afterBoxY + 11,
    theme: "grid",
    head: [
      [
        "#",
        "Item",
        "Required By",
        "Shelf Life",
        "Packing",
        "Qty",
        "UOM",
        "Rate",
        "Tax",
        `Amount(${cur})`,
      ],
    ],
    body: po.items.map((item: any, idx: number) => {
      const packing =
        item.packingUnit && item.packingSize
          ? `${item.packingUnit}×${item.packingSize}`
          : "-";

      // ✅ Computed: amount = quantity * rate (not in API response)
      const amount = Number(item.quantity ?? 0) * Number(item.rate ?? 0);

      // ✅ Tax info from taxInfo array
      const taxName = item.taxInfo?.[0]?.taxName ?? "-";
      const taxRate = item.taxInfo?.[0]?.totalTaxRate ?? "0";

      return [
        idx + 1,
        item.itemName ?? "-",                        // ✅ was: item.item_name
        fmtDate(item.requiredBy),  
         item.shelfLife ?? "-",                  // ✅ was: item.schedule_date
        packing,
        Math.round(Number(item.quantity ?? 0)),      // ✅ was: item.qty
        item.uom ?? "-",
        fmt2(item.rate),
        `${taxName} (${taxRate}%)`,                  // ✅ was: item.vatCd / item.vatRate
        fmt2(amount),                                // ✅ was: item.amount (computed)
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

   columnStyles: {
  0: { cellWidth: 7, halign: "center" },   
  1: { cellWidth: 32, halign: "left" },    
  2: { cellWidth: 20, halign: "center" }, 
  3: { cellWidth: 18, halign: "center" },  
  4: { cellWidth: 14, halign: "center" }, 
  5: { cellWidth: 15, halign: "center" },  
  6: { cellWidth: 18, halign: "center" }, 
  7: { cellWidth: 14, halign: "center" },  
  8: { cellWidth: 18, halign: "center" },  
  9: { cellWidth: TOTAL_W, halign: "center" }, 
},

    margin: { left: M, right: M },
    tableWidth: W - M * 2,
  });

  const tblY = (doc as any).lastAutoTable.finalY;

  const SEC_Y = tblY;
  const grandTotal  = Number(po.roundedTotal ?? 0);
  const taxTotal    = Number(po.totalTaxes ?? 0);
  const subTotal    = grandTotal - taxTotal;                       
  const rounding    = Number(po.roundingAdjustment ?? 0);     

  const ROW_H = 6;

  const AMOUNT_COL_X = M + 7 + 36 + 22 + 16 + 17 + 20 + 18 + 20;

  const LABEL_X = AMOUNT_COL_X - 4;

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
    theme: "grid",
    head: [],
    body: [
      [`${fmt2(subTotal)} ${cur}`],
      [`${fmt2(taxTotal)} ${cur}`],
      [`${fmt2(rounding)} ${cur}`],
      [`${fmt2(grandTotal)} ${cur}`],
    ],

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
      if (data.row.index === 0 || data.row.index === 3) {
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: AMOUNT_COL_X, right: M },
    tableWidth: TOTAL_W,
  });
  const sumEndY = (doc as any).lastAutoTable.finalY;
  const SIG_Y = sumEndY;

  const LABEL_W = 28;

  const SIGN_X = AMOUNT_COL_X - LABEL_W;

  const SIGN_W = LABEL_W + TOTAL_W;
  let termsY = SIG_Y;


  const buying = po?.terms?.buying;
  const termW = SIGN_X - M;
  const termTW = termW - 14;
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
      p.phases?.forEach((ph: any, i: number) => {
        const phaseName = ph.name ?? "Phase";
const percent = ph.percentage ?? "0";
const condition = ph.condition ?? "";
const description = ph.description ?? "";

let line = `${i + 1}. ${phaseName} — ${percent}%`;

if (description) line += ` | ${description}`;
if (condition) line += ` (${condition})`;

tLines.push(line);
      });
    }
  }
  if (!tLines.length) tLines.push("No terms and conditions specified.");
  let tH = 12;
  tLines.forEach((l) => {
    tH += doc.splitTextToSize(l, termTW).length * 3.5;
  });
  const tBH = Math.max(24, tH + 4);

   const signatureStartY = sumEndY + 6;

  doc.setFillColor(...ERP_BLUE);
  doc.rect(SIGN_X, signatureStartY, SIGN_W, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("Authorised Signatory", SIGN_X + SIGN_W / 2, signatureStartY + 4, {
    align: "center",
  });

  doc.setFillColor(...WHITE);
  doc.rect(SIGN_X, signatureStartY + 6, SIGN_W, 22, "F");

  doc.setDrawColor(...RULE);

  doc.line(SIGN_X, signatureStartY + 6, SIGN_X + SIGN_W, signatureStartY + 6);

  doc.line(SIGN_X, signatureStartY + 28, SIGN_X + SIGN_W, signatureStartY + 28);

  if (company?.documents?.authorizedSignatureUrl) {
    try {
      doc.addImage(
        px(company.documents.authorizedSignatureUrl),
        "PNG",
        SIGN_X + (SIGN_W - 40) / 2,
        signatureStartY + 9,
        40,
        14,
      );
    } catch {}
  }

  doc.line(
    SIGN_X + 5,
    signatureStartY + 22,
    SIGN_X + SIGN_W - 5,
    signatureStartY + 22,
  );

  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Signature", SIGN_X + SIGN_W / 2, signatureStartY + 26, {
    align: "center",
  });

  const termsBottom = termsY + tBH;
  if (termsY + tBH > H - 16) {
    doc.addPage();
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

  return resultType === "save"
    ? doc.save(`Purchase_Order_${po.poId}.pdf`)
    : doc.output("bloburl");
};