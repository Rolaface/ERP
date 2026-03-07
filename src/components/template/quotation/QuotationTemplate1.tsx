import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const loadImageFromUrl = async (url: string): Promise<string> => {
  console.warn("Url: ", url);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Image fetch failed");

  const blob = await res.blob();

  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

export const generateQuotationPDF = async (
  quotation: any,
  company: any,
  resultType: "save" | "bloburl" = "save",
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const currency = quotation.currency || "ZMW";

  doc.setTextColor(0, 0, 0);

  /* ================= HEADER ================= */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(company.companyName, 15, 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`TPIN: ${company.tpin}`, 15, 20);
  doc.text(`Phone: ${company.contactInfo.companyPhone}`, 15, 24);
  doc.text(`Email: ${company.contactInfo.companyEmail}`, 15, 28);

  /* ================= LOGO ================= */
  if (company.documents.companyLogoUrl) {
    try {
      console.warn(
        "company.documents.companyLogoUrl",
        company.documents.companyLogoUrl,
      );
      const logoBase64 = await loadImageFromUrl(
        company.documents.companyLogoUrl,
      );
      doc.addImage(logoBase64, "JPEG", 150, 10, 30, 10);
    } catch (e) {
      console.warn("Logo load failed", e);
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", 105, 42, { align: "center" });

  /* ================= BILL TO ================= */
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 15, 52);

  doc.setFont("helvetica", "normal");
  doc.text(
    [
      quotation.customerName,
      `TPIN: ${quotation.customerTpin || "N/A"}`,
      quotation.billingAddress?.line1,
      quotation.billingAddress?.line2,
    ].filter(Boolean),
    15,
    56,
  );

  doc.setFont("helvetica", "bold");
  doc.text(
    `Quotation No: ${quotation.quotationNumber || quotation.id}`,
    150,
    52,
  );
  doc.text(
    `Date: ${quotation.transactionDate || quotation.quotationDate}`,
    150,
    56,
  );
  doc.text(
    `Valid Until: ${quotation.validTill || quotation.validUntil}`,
    150,
    60,
  );

  /* ================= ITEMS TABLE ================= */
  autoTable(doc, {
    startY: 80,
    head: [["#", "Description", "Qty", "Unit Price", `Amount (${currency})`]],
    body: quotation.items.map((i: any, idx: number) => {
      const qty = Number(i.quantity || i.qty || 0);
      const price = Number(i.listPrice || i.price || i.unitPrice || 0);
      const discount = Number(i.discount || 0);
      const discountAmount = qty * price * (discount / 100);
      const totalInclusive = qty * price - discountAmount;

      return [
        idx + 1,
        i.description || i.productName || "",
        qty.toFixed(1),
        price.toFixed(2),
        totalInclusive.toFixed(2),
      ];
    }),
    styles: {
      fontSize: 8,
      halign: "center",
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      1: { halign: "left" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  const y = (doc as any).lastAutoTable.finalY + 6;

  doc.setTextColor(0, 0, 0);

  /* ================= TOTALS ================= */
  const summary = quotation.items.reduce(
    (acc: any, i: any) => {
      const qty = Number(i.quantity || i.qty || 0);
      const price = Number(i.listPrice || i.price || i.unitPrice || 0);
      const discount = Number(i.discount || 0);
      const vatRate = Number(i.vatRate || 0);

      const discountAmount = qty * price * (discount / 100);
      const inclusive = qty * price - discountAmount;
      const exclusive = inclusive / (1 + vatRate / 100);
      const vat = inclusive - exclusive;

      acc.taxable += exclusive;
      acc.vat += vat;
      acc.total += inclusive;
      return acc;
    },
    { taxable: 0, vat: 0, total: 0 },
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text(`Taxable Standard Rated`, 120, y);
  doc.text(`${summary.taxable.toFixed(2)} ${currency}`, 195, y, {
    align: "right",
  });

  doc.text("Sub-total", 120, y + 6);
  doc.text(`${summary.taxable.toFixed(2)} ${currency}`, 195, y + 6, {
    align: "right",
  });

  doc.text("VAT Total", 120, y + 12);
  doc.text(`${summary.vat.toFixed(2)} ${currency}`, 195, y + 12, {
    align: "right",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount", 120, y + 20);
  doc.text(`${summary.total.toFixed(2)} ${currency}`, 195, y + 20, {
    align: "right",
  });

  /* ================= QUOTATION INFO ================= */
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Quotation Information", 15, y + 32);

  doc.setFont("helvetica", "normal");
  doc.text(
    [
      `Date: ${quotation.transactionDate || quotation.quotationDate}`,
      `Quotation No: ${quotation.quotationNumber || quotation.id}`,
      `Valid Until: ${quotation.validTill || quotation.validUntil}`,
      `Currency: ${currency}`,
      `Industry: ${quotation.industryBases || "N/A"}`,
    ],
    15,
    y + 38,
  );

  /* ================= PAYMENT TERMS ================= */
  doc.setFont("helvetica", "bold");
  doc.text("Payment Terms", 110, y + 32);

  const bankAccount = company.bankAccounts?.[0] || {};

  doc.setFont("helvetica", "normal");
  doc.text(
    [
      `${company.financialConfig?.baseCurrency || currency}`,
      `ACC NO ${bankAccount.accountNo || "N/A"}`,
      `BANK ${bankAccount.bankName || "N/A"}`,
      `BRANCH ${bankAccount.branchAddress || "N/A"}`,
      `SWIFTCODE ${bankAccount.swiftCode || "N/A"}`,
    ],
    110,
    y + 38,
  );

  /* ================= TERMS & CONDITIONS ================= */
  if (quotation.termsAndConditions) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Terms & Conditions", 15, y + 68);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const terms = doc.splitTextToSize(quotation.termsAndConditions, 180);
    doc.text(terms, 15, y + 73);
  }

  /* ================= FOOTER ================= */
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("Powered by LoremIpsum Smart Invoice!", 105, 287, {
    align: "center",
  });
  doc.text("Created By: Lorem Ipsum", 105, 292, { align: "center" });
  doc.setTextColor(0, 0, 0);

  return resultType === "save"
    ? doc.save(`Quotation_${quotation.quotationNumber || quotation.id}.pdf`)
    : doc.output("bloburl");
};
