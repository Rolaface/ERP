import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ERP_BASE } from "../../../config/api";


const ERP_BLUE: [number, number, number] = [46, 109, 197];
const RULE:     [number, number, number] = [200, 220, 240];
const WHITE:    [number, number, number] = [255, 255, 255];
const INK:      [number, number, number] = [25,  45,  75];
const INK_SOFT: [number, number, number] = [70,  95,  130];
const INK_PALE: [number, number, number] = [130, 150, 180];


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


export const generateInvoicePDF = async (
  invoice: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W   = doc.internal.pageSize.width;   
  const H   = doc.internal.pageSize.height;  
  const cur = invoice.currencyCode ?? "INR";
  const M   = 14;
  const MR  = W - M;


  const COL_WIDTHS = [6,16,26, 16, 14, 14, 14, 14, 14, 12, 12, 24];
  const TOTAL_W    = 24;
  const AMOUNT_COL_X = W - M - TOTAL_W;


 

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
    doc.text((company?.companyName ?? "Rx").slice(0, 2).toUpperCase(),
      LOGO_X + LOGO_SZ / 2, LOGO_Y + LOGO_SZ / 2 + 3, { align: "center" });
  }

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
  if (company?.tpin)                       infoLines.push(`TPIN / TAX ID: ${company.tpin}`);
  if (company?.contactInfo?.companyPhone)  infoLines.push(`Phone: ${company.contactInfo.companyPhone}`);
  if (company?.contactInfo?.companyEmail)  infoLines.push(`Email: ${company.contactInfo.companyEmail}`);
  infoLines.forEach((l, i) => doc.text(l, TX, infoY + i * 5));


  const badgeLabel = "INVOICE";

  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  const badgeTextW = doc.getTextWidth(badgeLabel);
  const badgePadX  = 2;
  const badgeH     = 8;
  const badgeW     = badgeTextW + badgePadX * 2;
  const badgeX     = MR - badgeW;
  const badgeY     = 8;

  doc.setFillColor(...ERP_BLUE);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");
  doc.setTextColor(...WHITE);
  doc.text(badgeLabel, badgeX + badgeW - badgePadX, badgeY + badgeH / 2 + 1.5, { align: "right" });

 
  doc.setTextColor(...INK);
  doc.text(`Invoice No.: ${invoice.invoiceNumber ?? "-"}`, MR, 20, { align: "right" });


  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...INK_SOFT);
  [
    `Invoice Date: ${fmtDate(invoice.dateOfInvoice)}`,
  ].forEach((l, i) => doc.text(l, MR, 26 + i * 4, { align: "right" }));

  const AY    = 40;
  const BH    = 7;
  const LH    = 4.5;
  const PAD   = 3;
  const gap   = 3;
  const bColW = (W - M * 2 - gap * 2) / 3;

  const billL = addrBlock(invoice?.billingAddress);
  const shipL = addrBlock(invoice?.shippingAddress);
  if (invoice?.billingAddress?.email) billL.push(`Email: ${invoice.billingAddress.email}`);
  if (invoice?.billingAddress?.phone) billL.push(`Phone: ${invoice.billingAddress.phone}`);

const payL: string[] = ([
  `Bank: ${invoice?.paymentInformation?.bankName ?? "-"}`,

  invoice?.paymentInformation?.accountNumber
    ? `A/C: ${invoice.paymentInformation.accountNumber}`
    : null,
  invoice?.paymentInformation?.routingNumber
    ? `Sort Code: ${invoice.paymentInformation.routingNumber}`
    : null,
     invoice?.paymentInformation?.swiftCode
    ? `SWIFT: ${invoice.paymentInformation.swiftCode}`
    : null,
  `Payment Terms: ${invoice?.paymentInformation?.paymentTerms ?? "-"}`,
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

  drawBox(M,                      "Bill To",      billL, invoice?.customerName ?? "-");
  drawBox(M + bColW + gap,        "Ship To",      shipL);
  drawBox(M + (bColW + gap) * 2,  "Payment Info", payL);


  const afterBoxY  = AY + boxH + 4;
  const metaColW   = (W - M * 2) /4 ;
  const META_HDR_H = 6.5;
  const META_VAL_H = 7;

  const metaCols = [
    { label: "Customer TPIN", value: invoice?.customerTpin || "-" },
    { label: "Invoice Type",  value: invoice?.invoiceType  || "-" },
    { label: "Currency",      value: cur },
    { label: "Due Date",      value: fmtDate(invoice?.dueDate) },
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

 

  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...INK_PALE);
  doc.text("ITEMS", M, afterMetaY + 7);

  autoTable(doc, {
    startY: afterMetaY + 8,
    theme: "grid",
    alternateRowStyles: { fillColor: WHITE },
    head: [[
      "#", "Box No.","Item", "Batch", "Packing","MFG", "EXP", "Qty", "Rate", "Disc%", "Tax", `Amount(${cur})`,
    ]],
    body: invoice.items.map((item: any, idx: number) => {
      const qty     = Number(item.quantity ?? 0);
      const rate    = Number(item.price    ?? 0);
      //const disc    = Number(item.discount ?? 0);
      //const discAbs = Math.abs(disc);
      const gross   = qty * rate;
      //const discPct = gross > 0 ? (discAbs / gross) * 100 : 0;
      const net     = gross;// - discAbs;
      const packing = item.packingUnit && item.packingSize
        ? `${item.packingUnit}×${item.packingSize}` : "-";
      const batchShort = (item.batchNo || "-").length > 18
        ? (item.batchNo as string).slice(0, 16) + ".." : (item.batchNo || "-");

      return [
        idx + 1,
         `${item.boxStart ?? "-"} - ${item.boxEnd ?? "-"}`,
        item.description || item.itemCode || "-",
        batchShort,
        packing,
        fmtDate(item.mfgDate),
        fmtDate(item.expDate),
        Number.isInteger(qty) ? qty.toLocaleString() : fmt2(qty),
        fmt2(rate),
        // discAbs > 0 ? `${discPct.toFixed(1)}%` : "0%",
        "-",
        item.vatCode
          ? `${item.vatCode}`
          : "-",
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
      1:  { cellWidth: COL_WIDTHS[1],  halign: "center" },
      2:  { cellWidth: COL_WIDTHS[2],  halign: "left" },
      3:  { cellWidth: COL_WIDTHS[3],  halign: "center", fontSize: 6.5 },
      4:  { cellWidth: COL_WIDTHS[4],  halign: "center" },
      
      5:  { cellWidth: COL_WIDTHS[5],  halign: "center" },
      6:  { cellWidth: COL_WIDTHS[6],  halign: "center" },
      7:  { cellWidth: COL_WIDTHS[7],  halign: "center" },
      8:  { cellWidth: COL_WIDTHS[8],  halign: "center" },
      9:  { cellWidth: COL_WIDTHS[9],  halign: "center" },
      10: { cellWidth: COL_WIDTHS[10],  halign: "center"},
      11: { cellWidth: COL_WIDTHS[11], halign: "center", textColor: [0, 0, 0], fontSize: 7.5 },
    },
    margin:     { left: M, right: M },
    tableWidth: W - M * 2,
  });

  const tblEndY = (doc as any).lastAutoTable.finalY;

  const SEC_Y = tblEndY;

  let gross = 0, discTotal = 0;
  invoice.items.forEach((i: any) => {
    const q = Number(i.quantity ?? 0);
    const p = Number(i.price    ?? 0);
    // const d = Math.abs(Number(i.discount ?? 0));
    gross     += q * p;
    // discTotal += d;
  });
  const subTotal    = gross;
//   const taxableRaw  = invoice.items.reduce(
//     (a: number, i: any) => a + Number(i.vatTaxableAmount ?? 0), 0);
//   const taxTotal    = taxableRaw > 0 ? taxableRaw : 0;
//  const grandTotal  = gross - discTotal + taxTotal;
const taxTotal = Number(invoice.taxTotal ?? 0);
  const grandTotal  = gross + taxTotal;

  
  const otherCharges = (invoice?.invoiceCharges || []).reduce(
  (sum: number, ch: any) => sum + Number(ch.amount ?? 0),
  0
);
  const cifValue     = grandTotal;               
  const fobValue     = cifValue - otherCharges;  


  const CIF_LBL_W   = 22;
  const CIF_VAL_W   = 26;
  const CIF_TABLE_W = CIF_LBL_W + CIF_VAL_W;  
  
  const ROW_H_8      = 8 * 0.3528 + 3;  
  const ROW_H_6      = 6 * 0.3528 + 3;   
  const cifRows      = 2 + (invoice?.invoiceCharges?.length ?? 0); 
  const cifH         = cifRows  * ROW_H_8;
  const exH          = 2        * ROW_H_6;  
  const totalsH      = 4        * ROW_H_8;  
  const maxH         = Math.max(cifH, cur !== "INR" ? exH : 0, totalsH);
  const cifStartY    = SEC_Y + (maxH - cifH);
  const exStartY     = SEC_Y + (maxH - exH);
  const totalsStartYEstimate = SEC_Y + (maxH - totalsH);

  autoTable(doc, {
    startY: cifStartY,
    head:   [],
    theme:  "grid",
    alternateRowStyles: { fillColor: WHITE },
    body: [
  
 ["FOB", `${fmt2(fobValue)} ${cur}`],
 
  ...(invoice?.invoiceCharges || []).map((ch: any) => [
    ch.charge_type,
    `${fmt2(ch.amount)} ${cur}`,
  ]),
  ["CIF", `${fmt2(cifValue)} ${cur}`],
 
],
    styles: {
      fontSize: 8,
      cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
      lineColor: RULE,
      lineWidth: 0.15,
      textColor: [0, 0, 0] as any,
    },
    columnStyles: {
      0: { cellWidth: CIF_LBL_W, halign: "left", fontStyle: "normal", fontSize: 8, textColor: [0, 0, 0] as any },
      1: { cellWidth: CIF_VAL_W, halign: "center", fontSize: 8 },
    },
    margin:     { left: M, right: W - M - CIF_TABLE_W },
    tableWidth: CIF_TABLE_W,
  });

    const cifTableEndY = (doc as any).lastAutoTable.finalY;
    const totalsStartY = Math.max(totalsStartYEstimate, cifTableEndY - totalsH);
  


  if (cur !== "INR") {
    const exchangeRate   = Number(invoice?.exchangeRt ?? 0);
    const cifInINR       = cifValue * exchangeRate;

    const EX_GAP     = 4;                         
    const EX_LEFT    = M + CIF_TABLE_W + EX_GAP; 
    const EX_COL_W   = [22, 26, 30] as const;
    const EX_TABLE_W = EX_COL_W.reduce((a, b) => a + b, 0); 

    autoTable(doc, {
       startY: exStartY,                      
      theme:  "grid",
      alternateRowStyles: { fillColor: WHITE },
      head: [[
        `CIF ${cur}`,
        `1 ${cur}=INR`,
        `Total Invoice Value(INR)`,
      ]],
      body: [[
        fmt2(cifValue),
        `${fmt2(exchangeRate)}`,
        fmt2(cifInINR),
      ]],
      styles: {
        fontSize: 6,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
        lineColor: RULE,
        lineWidth: 0.15,
        textColor: [0, 0, 0] as any,
        halign: "center",
      },
      headStyles: {
        fillColor: WHITE,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        fontSize: 6,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      },
      columnStyles: {
        0: { cellWidth: EX_COL_W[0] },
        1: { cellWidth: EX_COL_W[1] },
        2: { cellWidth: EX_COL_W[2] },
      },
      margin:     { left: EX_LEFT, right: W - EX_LEFT - EX_TABLE_W },
      tableWidth: EX_TABLE_W,
    });
  }

  const cifEndY = (doc as any).lastAutoTable.finalY;
   const realCifEndY = Math.max(cifTableEndY, cifEndY);

 
  const LABEL_X = AMOUNT_COL_X - 4;
  const ROW_H   = 6;

  doc.setFontSize(8); doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Sub Total",   LABEL_X, totalsStartY + ROW_H * 0.7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Tax Total",   LABEL_X, totalsStartY + ROW_H * 1.7, { align: "right" });
  doc.text("Discount",    LABEL_X, totalsStartY + ROW_H * 2.7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total", LABEL_X, totalsStartY + ROW_H * 3.7, { align: "right" });

  autoTable(doc, {
    startY: totalsStartY,
    head:   [],
    theme:  "grid",
    alternateRowStyles: { fillColor: WHITE },
    body: [
      [`${fmt2(subTotal)} ${cur}`],
      [`${fmt2(taxTotal)} ${cur}`],
      [`${fmt2(discTotal)} ${cur}`],
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
      if (data.row.index === 0) {
        data.cell.styles.fontStyle = "bold";
      }
      if (data.row.index === 2) {
        data.cell.styles.textColor = [160, 60, 60] as any;
        data.cell.styles.fillColor = [252, 245, 245] as any;
      }
      if (data.row.index === 3) {
        data.cell.styles.textColor = [0, 0, 0] as any;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin:     { left: AMOUNT_COL_X, right: M },
    tableWidth: TOTAL_W,
  });

  const sumEndY = (doc as any).lastAutoTable.finalY;

 
  const LABEL_W    = 28;
  const SIGN_X     = AMOUNT_COL_X - LABEL_W;
  const SIGN_W     = LABEL_W + TOTAL_W;
  const SIGN_HDR_H = 6;
  const SIGN_BOX_H = 22;

  
  const termW  = SIGN_X - M;
  const termTW = termW - 14;
  const tLines: string[] = [];
  const selling = invoice?.terms?.selling;

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
      p.phases?.forEach((ph: any, i: number) => {
        const pct = String(ph.percentage ?? "0").includes("%")
          ? ph.percentage : `${ph.percentage}%`;
        tLines.push(`${i + 1}. ${ph.name ?? "Phase"}—${pct} (${ph.condition ?? ""})`);
      });
    }
  }
  if (!tLines.length) tLines.push("No terms and conditions specified.");

  let tH = 12;
  tLines.forEach(l => { tH += doc.splitTextToSize(l, termTW).length * 3.5; });
  const tBH = Math.max(SIGN_HDR_H + SIGN_BOX_H + 2, tH + 6);

  
   let termsY = Math.max(realCifEndY, sumEndY);
  if (termsY + tBH > H - 16) {
    doc.addPage(); termsY = 16;
  }

  
  const SIG_OFFSET   = 0;
  const ACTUAL_SIG_Y = termsY + tBH - SIGN_HDR_H - SIGN_BOX_H - SIG_OFFSET;

  
  doc.setFillColor(...ERP_BLUE);
  doc.rect(SIGN_X, ACTUAL_SIG_Y, SIGN_W, SIGN_HDR_H, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...WHITE);
  doc.text("Authorised Signatory", SIGN_X + SIGN_W / 2, ACTUAL_SIG_Y + 4, { align: "center" });

  doc.setFillColor(...WHITE); doc.setDrawColor(...RULE); doc.setLineWidth(0.25);
  doc.rect(SIGN_X, ACTUAL_SIG_Y + SIGN_HDR_H, SIGN_W, SIGN_BOX_H, "F");
  doc.line(SIGN_X, ACTUAL_SIG_Y + SIGN_HDR_H, SIGN_X + SIGN_W, ACTUAL_SIG_Y + SIGN_HDR_H);
  doc.line(SIGN_X, ACTUAL_SIG_Y + SIGN_HDR_H + SIGN_BOX_H, SIGN_X + SIGN_W, ACTUAL_SIG_Y + SIGN_HDR_H + SIGN_BOX_H);

  if (company?.documents?.authorizedSignatureUrl) {
    try {
      doc.addImage(
        px(company.documents.authorizedSignatureUrl), "PNG",
        SIGN_X + (SIGN_W - 40) / 2, ACTUAL_SIG_Y + SIGN_HDR_H + 3, 40, 13,
      );
    } catch {}
  }

  const sigLineY = ACTUAL_SIG_Y + SIGN_HDR_H + SIGN_BOX_H - 5;
  doc.line(SIGN_X + 5, sigLineY, SIGN_X + SIGN_W - 5, sigLineY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(120, 120, 120);
  doc.text("Signature", SIGN_X + SIGN_W / 2, sigLineY + 4, { align: "center" });

 
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

  
  const totalPg = (doc as any).internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPg; pg++) {
    doc.setPage(pg);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...INK_PALE);
    doc.text("This is a computer-generated document.", M, H - 6);
    doc.text("Powered by ERP SYSTEM", W / 2, H - 6, { align: "center" });
    doc.text(`Page ${pg} / ${totalPg}`, MR, H - 6, { align: "right" });
  }

  
  return resultType === "save"
    ? doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
    : doc.output("bloburl");
};