import ExcelJS from "exceljs";
import type { PayrollVerificationData } from "../../api/payroll/payrollEntryApi";
import type { MappedEmployee } from "./mapPayrollVerificationData";

const GREEN = "FF6AA84F";
const RED = "FFCC0000";
const HEADER_FILL = "FFF3F3F3";
const THIN = { style: "thin" as const, color: { argb: "FFB7B7B7" } };
const BORDER_ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };

function collectComponents(employees: MappedEmployee[], key: "earnings" | "deductions") {
  const map = new Map<string, string>();
  for (const emp of employees) {
    for (const c of emp[key]) {
      if (c.abbr) map.set(c.abbr, c.salary_component || c.abbr);
    }
  }
  return [...map.entries()]; // [abbr, label][]
}

export async function exportPayrollExcel(
  rawData: PayrollVerificationData,
  employees: MappedEmployee[],
) {
  const earningCols = collectComponents(employees, "earnings");
  const deductionCols = collectComponents(employees, "deductions");

  const monthLabel = new Date(rawData.start_date).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(monthLabel.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  const BASE = ["Emp ID", "Name", "Department", "Work Days", "Paid Days", "Leave Without Pay", "Leave Days"];
  const headerRow3 = [
    ...BASE,
    ...earningCols.map(([, label]) => label),
    "Gross Pay",
    ...deductionCols.map(([, label]) => label),
    "Total Deductions",
    "Net Pay",
    "Total Earning Till Date",
    "Tax Till Date",
  ];

  const baseLen = BASE.length;
  const earnStart = baseLen + 1;
  const grossCol = earnStart + earningCols.length;
  const dedStart = grossCol + 1;
  const totalDedCol = dedStart + deductionCols.length;
  const netPayCol = totalDedCol + 1;
  const lastCol = netPayCol + 2;

  ws.addRow([]); // row1 group titles
  ws.addRow([]); // row2 spacer
  ws.addRow(headerRow3); // row3 actual headers

  ws.mergeCells(1, earnStart, 1, grossCol);
  ws.mergeCells(1, dedStart, 1, totalDedCol);
  ws.mergeCells(1, netPayCol, 2, lastCol);
  ws.mergeCells(1, 1, 2, baseLen); // blank block over base cols so borders/height match

  ws.getCell(1, earnStart).value = "Earning";
  ws.getCell(1, dedStart).value = "Deductions";
  ws.getCell(1, netPayCol).value = "Summary";

  [earnStart, dedStart, netPayCol].forEach((col) => {
    const cell = ws.getCell(1, col);
    cell.font = { bold: true, size: 16 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Row 3 header styling
  const headerRowRef = ws.getRow(3);
  headerRowRef.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.border = BORDER_ALL;
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    if (colNumber >= earnStart && colNumber <= grossCol) {
      cell.font = { bold: true, size: 10, color: { argb: GREEN } };
    }
    if (colNumber === totalDedCol) {
      cell.font = { bold: true, size: 10, color: { argb: RED } };
    }
  });
  headerRowRef.height = 32;

  // Data rows
  employees.forEach((emp, i) => {
    const row = ws.addRow([
      i + 1,
      emp.name,
      emp.department,
      emp.totalWorkingDays,
      emp.paymentDays,
      emp.leaveWithoutPay,
      emp.leavesTakenThisMonth ?? 0,
      ...earningCols.map(([abbr]) => emp.components[abbr] ?? 0),
      emp.gross,
      ...deductionCols.map(([abbr]) => emp.components[abbr] ?? 0),
      emp.totalDeductions,
      emp.netPay,
      emp.yearToDate ?? 0,
      emp.incomeTaxDeductedTillDate ?? 0,
    ]);
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_ALL;
      if (colNumber >= earnStart) cell.numFmt = "#,##0.00";
      if (colNumber === grossCol || colNumber === netPayCol) cell.font = { bold: true };
    });
  });

  // Totals row
  const sumComponent = (abbr: string) => employees.reduce((s, e) => s + (e.components[abbr] ?? 0), 0);
  const totalsRow = ws.addRow([
    "", "TOTALS", "", "", "", "", "",
    ...earningCols.map(([abbr]) => sumComponent(abbr)),
    rawData.financial_summary?.total_gross_payable ?? 0,
    ...deductionCols.map(([abbr]) => sumComponent(abbr)),
    rawData.financial_summary?.total_deduction ?? 0,
    rawData.financial_summary?.total_net_payable ?? 0,
    "",
    "",
  ]);
  totalsRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.border = { top: { style: "double" }, bottom: { style: "double" } };
    if (colNumber >= earnStart) cell.numFmt = "#,##0.00";
  });

  // Column widths
  const widths = [6, 20, 12, 10, 10, 12, 10];
  earningCols.forEach(() => widths.push(13));
  widths.push(13); // gross
  deductionCols.forEach(() => widths.push(13));
  widths.push(14, 13, 16, 12); // total ded, net pay, YTD, tax till date
  widths.forEach((w, idx) => (ws.getColumn(idx + 1).width = w));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payroll_${monthLabel}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}