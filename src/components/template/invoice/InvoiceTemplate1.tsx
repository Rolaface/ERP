import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPaymentMethodLabel } from "../../../constants/invoice.constants";
import { ERP_BASE } from "../../../config/api";

const loadImageFromUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, {
      mode: "cors",
      credentials: "include",
    });

    if (!res.ok) return null;

    const blob = await res.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const generateInvoicePDF = async (
  invoice: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const getFullImageUrl = (path: string): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${ERP_BASE}${path}`;
  };

  const doc = new jsPDF("p", "mm", "a4");
  const currency = invoice.currencyCode ;


  doc.setTextColor(0, 0, 0);

  /*  HEADER  */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(company.companyName, 15, 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`TPIN: ${company.tpin}`, 15, 20);
  doc.text(`Phone: ${company.contactInfo.companyPhone}`, 15, 24);
  doc.text(`Email: ${company.contactInfo.companyEmail}`, 15, 28);

  /*  LOGO  */

  if (company.documents?.companyLogoUrl) {
    const fullLogoUrl = getFullImageUrl(company.documents.companyLogoUrl);

    try {
      doc.addImage(fullLogoUrl, "PNG", 150, 10, 30, 15);
    } catch {
      // ignore logo error
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 42, { align: "center" });

  /*  BILL TO  */
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 15, 52);

  doc.setFont("helvetica", "normal");
  doc.text(
    [
      invoice.customerName,
      `TPIN: 2484778086`,
      invoice.billingAddress?.line1,
      invoice.billingAddress?.line2,
    ].filter(Boolean) as string[],
    15,
    56,
  );

  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 150, 52);
  doc.text(`Date: ${invoice.dateOfInvoice}`, 150, 56);
  doc.text(`Due Date: ${invoice.dueDate}`, 150, 60);

  /*  ITEMS TABLE  */
  autoTable(doc, {
    startY: 80,
    head: [[
      "#",
      "Item Code",
      "Batch",
      "Box Range",
      "Packing",
      "MFG",
      "EXP",
      "Qty",
      "Rate",
      "Tax",
      `Total (${currency})`,
    ]],
    body: invoice.items.map((i: any, idx: number) => {
      const qty = Number(i.quantity || 0);
      const rate = Number(i.price || 0);
      const discount = Number(i.discount || 0);
      const discountAmount = qty * rate * (discount / 100);
      const total = qty * rate - discountAmount;

      const packing =
        i.packingUnit && i.packingSize
          ? `${i.packingUnit} × ${i.packingSize}`
          : "-";

      const boxRange =
        i.boxStart && i.boxEnd
          ? `${i.boxStart}-${i.boxEnd}`
          : "-";

      return [
        idx + 1,
        i.itemCode || "-",
        i.batchNo || "-",
        boxRange,
        packing,
        i.mfgDate || "-",
        i.expDate || "-",
        qty.toFixed(2),
        rate.toFixed(2),
        i.vatCode || "-",
        total.toFixed(2),
      ];
    }),
    styles: {
      fontSize: 8,
      halign: "center",
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "left" },   // Item Code
      2: { halign: "center" }, // Batch
      3: { halign: "center" }, // Box
      4: { halign: "center" }, // Packing
      5: { halign: "center" }, // MFG
      6: { halign: "center" }, // EXP
      7: { halign: "right" },  // Qty
      8: { halign: "right" },  // Rate
      9: { halign: "center" }, // Tax
      10: { halign: "right" },  // Total
    },
    margin: { left: 15, right: 15 },
  });

  const y = (doc as any).lastAutoTable.finalY + 6;


  doc.setTextColor(0, 0, 0);

  /*  TAX SUMMARY  */
  const parentDiscount = Number(invoice.discountPercentage || 0);
  const vatRate = 16; // change if dynamic later

  let grossTotal = 0;
  let itemDiscountTotal = 0;

  invoice.items.forEach((i: any) => {
    const qty = Number(i.quantity || 0);
    const price = Number(i.price || 0);
    const itemDiscount = Number(i.discount || 0);

    const lineGross = qty * price;
    const itemDiscountAmount = lineGross * (itemDiscount / 100);

    grossTotal += lineGross;
    itemDiscountTotal += itemDiscountAmount;
  });

  const afterItemDiscount = grossTotal - itemDiscountTotal;

  const parentDiscountAmount =
    parentDiscount > 0
      ? afterItemDiscount * (parentDiscount / 100)
      : 0;

  const finalNet = afterItemDiscount - parentDiscountAmount;

  const taxable = finalNet / (1 + vatRate / 100);
  const vat = finalNet - taxable;

  const summary = {
    grossTotal,
    itemDiscountTotal,
    parentDiscountAmount,
    totalDiscount: itemDiscountTotal + parentDiscountAmount,
    taxable,
    vat,
    total: finalNet,
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text("Gross Total", 110, y);
  doc.text(`${summary.grossTotal.toFixed(2)} ${currency}`, 195, y, { align: "right" });

  doc.text("Item Discount", 110, y + 6);
  doc.text(`${summary.itemDiscountTotal.toFixed(2)} ${currency}`, 195, y + 6, { align: "right" });

  doc.text("Parent Discount", 110, y + 12);
  doc.text(`${summary.parentDiscountAmount.toFixed(2)} ${currency}`, 195, y + 12, { align: "right" });

  doc.text("Total Discount", 110, y + 18);
  doc.text(`${summary.totalDiscount.toFixed(2)} ${currency}`, 195, y + 18, { align: "right" });

  doc.text("Taxable", 110, y + 24);
  doc.text(`${summary.taxable.toFixed(2)} ${currency}`, 195, y + 24, { align: "right" });

  doc.text("VAT Total", 110, y + 30);
  doc.text(`${summary.vat.toFixed(2)} ${currency}`, 195, y + 30, { align: "right" });

  doc.setFontSize(10);
  doc.text("Total Amount", 110, y + 38);
  const summaryBottomY = y + 45;
  doc.text(`${summary.total.toFixed(2)} ${currency}`, 195, y + 38, { align: "right" });

  /*  SDC INFO  */

  /*  SDC INFO  */

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SDC Information", 15, summaryBottomY);

  doc.setFont("helvetica", "normal");
  doc.text(
    [
      `Invoice Date: ${invoice.dateOfInvoice}`,
      `SDC ID: SDC0010002709`,
      `Invoice Number: ${invoice.invoiceNumber}`,
      `Invoice Type: ${invoice.invoiceType}`,
      `Payment Type: ${getPaymentMethodLabel(
        invoice.paymentInformation.paymentMethod,
      )}`,
    ],
    15,
    summaryBottomY + 6,
  );

  /*  BANK DETAILS  */

  doc.setFont("helvetica", "bold");
  doc.text("Banking Details", 110, summaryBottomY);

  doc.setFont("helvetica", "normal");
  doc.text(
    [
      `${company.financialConfig.baseCurrency}`,
      `ACC NO ${invoice.paymentInformation.accountNumber}`,
      `BANK ${invoice.paymentInformation.bankName}`,
      `BRANCH CROSSROADS`,
      `SWIFTCODE ${invoice.paymentInformation.swiftCode}`,
    ],
    110,
    summaryBottomY + 6,
  );

  /*  FOOTER  */
  doc.setFontSize(7);

  doc.setTextColor(120, 120, 120);
  doc.text("Powered by LoremIpsum Smart Invoice!", 105, 287, {
    align: "center",
  });
  doc.text("Created By: Lorem Ipsum", 105, 292, { align: "center" });


  doc.setTextColor(0, 0, 0);

  return resultType === "save"
    ? doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
    : doc.output("bloburl");
};