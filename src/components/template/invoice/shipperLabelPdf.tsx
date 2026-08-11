import jsPDF from "jspdf";
import { useCompanyStore } from "../../../store/companyStore";

const BLACK: [number, number, number] = [0, 0, 0];


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

interface LabelEntry {
  consigneeName: string;
  consigneeCity: string;
   companyName: string;
 companyCity: string;
 consigneePhone: string;
  companyPhone: string;
  productName: string;
  boxNumber: number;
  boxTotal: number;
}

const buildLabelEntries = (invoice: any, company: any): LabelEntry[] => {
  const consigneeParts = parseAddressParts(invoice.shippingAddress);
  const companyParts = parseAddressParts(
  useCompanyStore.getState().companyAddress || company?.address
 );
const consigneePhone = invoice.customerContactNo ?? "";
  const consigneeName = invoice.customerName ?? "-";
  const consigneeCity = consigneeParts[1] ?? consigneeParts[0] ?? "";
  const companyName = company?.companyName ?? "";
  const companyCity = companyParts[1] ?? companyParts[0] ?? "";
 const companyPhone = useCompanyStore.getState().companyPhone || company?.contactInfo?.companyPhone || "";


 const entries: LabelEntry[] = [];

  const totalBoxes = (invoice.items ?? []).reduce((sum: number, item: any) => {
    const start = Number(item.boxStart);
    const end = Number(item.boxEnd);
    if (!start || !end || end < start) return sum;
    return sum + (end - start + 1);
  }, 0);

  let runningBoxNumber = 0;

  (invoice.items ?? []).forEach((item: any) => {
    const start = Number(item.boxStart);
    const end = Number(item.boxEnd);
    if (!start || !end || end < start) return;

     const boxCount = end - start + 1;

    for (let itemBoxNumber = 1; itemBoxNumber <= boxCount; itemBoxNumber++) {
      runningBoxNumber++;
      const baseName = item.brand
        ? `${item.brand} (${item.itemName || item.itemCode || "-"})`
        : item.itemName || item.itemCode || "-";
      entries.push({
        consigneeName,
        consigneeCity,
        consigneePhone,
        companyName,
        companyCity,
        companyPhone,
        productName: `${baseName} (${itemBoxNumber}/${boxCount})`,
        boxNumber: runningBoxNumber,
        boxTotal: totalBoxes,
      });
    }
  });

  return entries;
};

const drawLabel = (
  doc: jsPDF,
  entry: LabelEntry,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const PAD = 6;

  // Outer border
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.8);
  doc.rect(x, y, w, h);

  const contentW = w - PAD * 2;
  let ty = y + 10;

  const writeLine = (text: string, size: number, gap: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...BLACK);
    const wrapped = doc.splitTextToSize(text, contentW);
    doc.text(wrapped, x + PAD, ty);
    ty += wrapped.length * (size * 0.42) + gap;
  };

 writeLine(
  `Consignee : ${entry.consigneeName}${
    entry.consigneeCity ? `, ${entry.consigneeCity}` : ""
  }${entry.consigneePhone ? `, ${entry.consigneePhone}` : ""}    `,
  16,
  4
);
  writeLine(
     `SEND By: ${entry.companyName}`,
    16,
    3
  );
  writeLine(`CONTACT NO. ${entry.companyPhone}`, 13, 3);
  writeLine(`PRODUCT NAME:- ${entry.productName}`, 13, 3);

  // Box number — larger, own line, divider above it
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(x, ty, x + w, ty);
  ty += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(
    `BOX NO.        :  ${entry.boxNumber}/${entry.boxTotal}`,
    x + PAD,
    ty
  );
};

export const generateShipperLabelsPDF = (
  invoice: any,
  company: any,
  resultType: "save" | "bloburl" = "save"
) => {
  const doc = new jsPDF("l", "mm", "a4"); // landscape
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;

  const M = 10;
  const GAP_X = 10;
  const GAP_Y = 8;
  const COLS = 2;
  const ROWS = 2;

  const labelW = (W - M * 2 - GAP_X * (COLS - 1)) / COLS;
  const labelH = (H - M * 2 - GAP_Y * (ROWS - 1)) / ROWS;

  const entries = buildLabelEntries(invoice, company);

  if (entries.length === 0) {
    // No box ranges on the invoice — nothing to print
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text(
      "No box details found on this invoice to generate labels.",
      M,
      M + 10
    );
  }

  entries.forEach((entry, i) => {
    const perPage = COLS * ROWS;
    const idxOnPage = i % perPage;

    if (i > 0 && idxOnPage === 0) doc.addPage();

    const col = idxOnPage % COLS;
    const row = Math.floor(idxOnPage / COLS);

    const x = M + col * (labelW + GAP_X);
    const y = M + row * (labelH + GAP_Y);

    drawLabel(doc, entry, x, y, labelW, labelH);
  });

  return resultType === "save"
    ? doc.save(`Shipper_Labels_${invoice.id ?? "draft"}.pdf`)
    : doc.output("bloburl");
};