import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ERP_BASE } from "../../../config/api";
import { useCompanyStore } from "../../../store/companyStore";


const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];
const RULE: [number, number, number] = [200, 200, 200];

const px = (path: string) =>
  !path
    ? ""
    : path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${ERP_BASE}${path}`;

const fmt2 = (n: any) => Number(n ?? 0).toFixed(2);

const fmtDate = (s: any) => {
  if (!s) return "-";
  const d = new Date(s);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const stripHtml = (html?: any): string => {
  if (!html) return "";
  const str = typeof html === "string" ? html : String(html);
  return str
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(", ");
};


const parseAddressParts = (html?: any): string[] => {
  if (!html) return [];
  const str = typeof html === "string" ? html : String(html);
  return str
    .replace(/<br\s*\/?>/gi, "|")
    .replace(/<[^>]+>/g, "")
    .split("|")
    .map((l) => l.trim())
    .filter(Boolean);
};

export const generateInvoicePDF = async (
  invoice: any,
  company: any,
  resultType: "save" | "bloburl" = "save"
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.width;   
  const H = doc.internal.pageSize.height;  
  const M = 14;   
  const MR = W - M;

  const cur = invoice.currency;
  let curY = M;


  const hRule = (y: number, lw = 0.3) => {
    doc.setDrawColor(...RULE);
    doc.setLineWidth(lw);
    doc.line(M, y, MR, y);
  };

curY = 8;
doc.setFont("helvetica", "bold");
doc.setFontSize(13);
doc.setTextColor(...BLACK);
doc.text("TAX INVOICE", W / 2, curY, { align: "center" });
curY = 16; 
doc.setFont("helvetica", "bold");
doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("FROM", M, curY);
  curY += 5;

  const compName = company?.companyName ?? "";
  const compGstin = company?.tpin ?? "";
  const compPhone = company?.contactInfo?.companyPhone ?? "";
  const compEmail = company?.contactInfo?.companyEmail ?? "";
 const compAddr =
  useCompanyStore.getState().companyAddress ||
  stripHtml(company?.address ?? "");
   const compCurr =
  useCompanyStore.getState().baseCurrency;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(compName, M, curY);
  curY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (compGstin) { doc.text(`GSTIN: ${compGstin}`, M, curY); curY += 4; }
  if (compAddr) {
    const addrLines = doc.splitTextToSize(compAddr, 90);
    addrLines.forEach((l: string) => { doc.text(l, M, curY); curY += 4; });
  }
  if (compPhone) { doc.text(`+${compPhone.replace(/^\+/, "")}`, M, curY); curY += 4; }
  if (compEmail) { doc.text(compEmail, M, curY); curY += 4; }

  const logoRightX = MR;
  const logoTopY = 11;

  if (company?.documents?.companyLogoUrl) {
    try {
     doc.addImage(px(company.documents.companyLogoUrl), "PNG", logoRightX - 60, logoTopY, 60, 50);
    } catch {}
  } else {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...BLACK);
    doc.text((compName || "COMPANY").toUpperCase(), logoRightX, logoTopY + 10, { align: "right" });
  }

  curY = Math.max(curY, logoTopY + 45);
  curY += 4;



  const billToX = M;
  const metaX = W / 2 + 40; 
  const col2ValX = MR;       


  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("BILL TO", billToX, curY);

  const metaLabelX = metaX;
  const metaRowH = 6;
  let metaY = curY;

  const metaRows = [
    { label: "INVOICE NO :", value: invoice.id ?? "-" },
    { label: "INVOICE DATE :", value: fmtDate(invoice.postingDate) },
    { label: "DUE DATE:", value: fmtDate(invoice.dueDate) },
  ];

  metaRows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...BLACK);
    doc.text(row.label, metaLabelX, metaY);
    doc.setFont("helvetica", "normal");
    doc.text(row.value, col2ValX, metaY, { align: "right" });
    metaY += metaRowH;
  });

  curY += 5;


  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const billingRaw = parseAddressParts(invoice.billingAddress);


  const bAddr = billingRaw[0] ?? "";
  const bCity = billingRaw[1] ?? "";
  const bState = billingRaw[2] ?? "";
  const bPin = billingRaw[3] ?? "";
  const bCountry = billingRaw[4] ?? "";

  const billLines: [string, string][] = [
    ["Name :", invoice.customerName ?? "-"],
    ["Address :", [bAddr, bCity].filter(Boolean).join(", ")],
    ["State :", bState],
    ["Country :", bCountry],
    ["Postal Code :", bPin],
  ];

  billLines.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, billToX, curY);
    doc.setFont("helvetica", "normal");
    doc.text(val, billToX + 20, curY);
    curY += 5;
  });
   curY += 4;
  hRule(curY);

   curY += 4;
  const tableBody = invoice.items.map((item: any, idx: number) => {
    const qty = Number(item.quantity ?? 0);
    const rate = Number(item.rate ?? 0);
    const taxRate = item.taxInfo?.[0]?.totalTaxRate ?? 0;
    const taxableAmt = qty * rate;                       
    const taxAmount = (taxableAmt * taxRate) / 100;
    const total = taxableAmt + taxAmount;

    return [
      item.itemName || item.itemCode || "-",   
      item.hsnCode || "-",                     
      item.uom || "-",                         
      qty,                                   
      fmt2(rate),                              
      fmt2(Math.abs(taxableAmt)),              
      `${taxRate}%`,                           
      fmt2(Math.abs(taxAmount)),                
      fmt2(Math.abs(total)),                   
    ];
  });


  const TABLE_W = W - M * 2;
  const colProportions = [0.15, 0.12, 0.08, 0.07, 0.10, 0.11, 0.10, 0.12, 0.15];
  const colAligns: ("left" | "center" | "right")[] = [
    "left", "center", "center", "center", "center", "center", "center", "center", "right",
  ];
  const colWidths = colProportions.map((p) => parseFloat((p * TABLE_W).toFixed(2)));

  autoTable(doc, {
    startY: curY,
    theme: "plain",
    head: [["Service", "HSN", "Unit", "Qty", "Rate", "Taxable", "Tax Rate", "Tax Amount", "Total"]],
    body: tableBody,
    styles: {
      fontSize: 8,
      textColor: BLACK,
      cellPadding: { top: 2, bottom: 2, },
    },
    headStyles: {
      fillColor: WHITE,
      textColor: BLACK,
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: Object.fromEntries(
      colWidths.map((w, i) => [i, { cellWidth: w, halign: colAligns[i] }])
    ),
     didParseCell(data) {
    if (data.section === "head") {
      data.cell.styles.halign = colAligns[data.column.index];
    }
  },
    margin: { left: M, right: M },
    tableWidth: TABLE_W,
    alternateRowStyles: { fillColor: WHITE },

  });

  curY = (doc as any).lastAutoTable.finalY;
  hRule(curY);
  curY += 5;


  const subTotal = invoice.items.reduce(
    (sum: number, i: any) => sum + Math.abs(Number(i.quantity ?? 0) * Number(i.rate ?? 0)),
    0
  );
  const taxTotal = Math.abs(Number(invoice.total_tax ?? 0));
  const grandTotal = Math.abs(Number(invoice.grand_total ?? 0));

  const taxLabel =
    invoice.charges?.length
      ? invoice.charges.map((c: any) => c.accountName ?? c.accountHead).join(" + ")
      : "GST";


  const inWords =
    invoice.in_words;


  const summaryX = W - M - 70; 
  const summaryValX = MR;
  let sY = curY; 

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  const inWordsText = `Invoice Value (In words): ${inWords}`;
  const inWordsMaxW = summaryX - M - 4;
  const inWordsWrapped = doc.splitTextToSize(inWordsText, inWordsMaxW);
  doc.text(inWordsWrapped, M, curY);
  curY += inWordsWrapped.length * 4.5 + 2;

  const summaryRows: [string, string, boolean][] = [  
    ["Sub Total", fmt2(grandTotal), false],
    [`${taxLabel} ${taxTotal > 0 ? "" : "0"}%`, fmt2(taxTotal), false],
    ["Total", `${cur} ${fmt2(grandTotal)}`, true],
  ];

  summaryRows.forEach(([label, val, bold]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9 : 8);
    doc.text(label, summaryX, sY);
    doc.text(val, summaryValX, sY, { align: "right" });
    if (bold && invoice.exchangeRate) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Exchange Rate: ${cur} 1= ${compCurr} ${fmt2(invoice.exchangeRate)}`,
      M,
      sY
    );
  }
    sY += 6;
  });

  curY = Math.max(curY, sY) + 4;


  const sigBlockX = W / 2;
  let sigY = curY;


  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text(compName, MR, sigY, { align: "right" });
  sigY += 5;


  if (company?.documents?.authorizedSignatureUrl) {
    try {
      doc.addImage(
        px(company.documents.authorizedSignatureUrl),
        "PNG",
        MR - 50,
        sigY,
        50,
        18
      );
    } catch {}
  }
  sigY += 22;

 
  sigY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("(Authorised Signatory)", MR, sigY, { align: "right" });
  sigY += 6;

  curY = Math.max(curY + 10, sigY);

  hRule(curY);
  curY += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text("TERMS & CONDITIONS", M, curY);
  curY += 5;

  const selling = invoice?.terms?.selling;
  const tLines: string[] = [];
if (selling?.payment?.dueDates)  tLines.push(selling.payment.dueDates);
if (selling?.general)            tLines.push(`General: ${selling.general}`);
if (selling?.delivery)           tLines.push(`Delivery: ${selling.delivery}`);
if (selling?.cancellation)       tLines.push(`Cancellation: ${selling.cancellation}`);
if (selling?.warranty)           tLines.push(`Warranty: ${selling.warranty}`);
if (selling?.liability)          tLines.push(`Liability: ${selling.liability}`);
if (selling?.payment?.phases?.length) {
  selling.payment.phases.forEach((phase: any) => {
    tLines.push(`${phase.name}: ${phase.percentage}% within ${phase.credit_days} days${phase.condition ? ` (${phase.condition})` : ""}`);
  });
}

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  tLines.forEach((l) => {
    const wrapped = doc.splitTextToSize(l, W - M * 2);
    doc.text(wrapped, M, curY);
    curY += wrapped.length * 4.5;
  });

  curY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text("BANK DETAILS", M, curY);
  curY += 5;


  const pay = invoice?.paymentInformation;
  const bankLines: [string, string][] = [
    ["Account Name :", company?.companyName ?? "-"],
    ["Account Number :", pay?.accountNumber ?? "-"],
    ["Bank Name :", pay?.bankName ?? "-"],
    ["Branch :", pay?.branchName ?? "-"],
    ["Branch Code :", pay?.branchCode ?? "-"],
    ["IFSC Code :", pay?.ifscCode ?? "-"],
    ["SWIFT Code :", pay?.swiftCode ?? "-"],
  ];

  bankLines.forEach(([label, val]) => {
    if (val && val !== "-") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BLACK);
      doc.text(`${label} ${val}`, M, curY);
      curY += 4.5;
    }
  });

  curY += 6;

  const totalPg = (doc as any).internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPg; pg++) {
    doc.setPage(pg);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated document.", M, H - 6);
    doc.text(`Page ${pg} / ${totalPg}`, MR, H - 6, { align: "right" });
  }

  return resultType === "save"
    ? doc.save(`Invoice_${invoice.id ?? "draft"}.pdf`)
    : doc.output("bloburl");
};