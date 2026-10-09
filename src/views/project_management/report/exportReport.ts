export type ExportFormat = "csv" | "excel" | "pdf";

export interface ExportPayload {
  fileName: string; 
  title?: string;
  headers: string[];
  rows: unknown[][];
}

const clean = (v: unknown) => (v === null || v === undefined ? "" : v);

const csvCell = (v: unknown) => {
  const s = String(clean(v));
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const exportCsv = ({ fileName, headers, rows }: ExportPayload) => {
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((r) => r.map(csvCell).join(",")),
  ].join("\r\n");
  saveBlob(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    `${fileName}.csv`,
  );
};

const exportExcel = async ({
  fileName,
  title,
  headers,
  rows,
}: ExportPayload) => {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    ...rows.map((r) => r.map(clean)),
  ]);

  // column width = sabse lambi value ke hisaab se
  ws["!cols"] = headers.map((h, i) => ({
    wch: Math.min(
      40,
      Math.max(h.length, ...rows.map((r) => String(clean(r[i])).length)) + 2,
    ),
  }));

  const wb = XLSX.utils.book_new();
  const sheetName = (title || "Report")
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const exportPdf = async ({ fileName, title, headers, rows }: ExportPayload) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const margin = 28;

  if (title) {
    doc.setFontSize(13);
    doc.text(title, margin, 30);
  }
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    margin,
    title ? 44 : 30,
  );

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((v) => String(clean(v)))),
    startY: title ? 54 : 40,
    margin: { left: margin, right: margin, bottom: 28 },
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: () => {
      const { width, height } = doc.internal.pageSize;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber}`,
        width - margin,
        height - 12,
        { align: "right" },
      );
    },
  });

  doc.save(`${fileName}.pdf`);
};

export const exportReport = async (
  format: ExportFormat,
  payload: ExportPayload,
) => {
  if (format === "csv") return exportCsv(payload);
  if (format === "excel") return exportExcel(payload);
  return exportPdf(payload);
};
