import type { TimesheetActivityEntry } from "../../../api/project/report/report.api";

const TITLE = "Monthly Summary - Employee-wise";

const HEADERS = [
  "Sr",
  "Employee Name",
  "Role / Designation",
  "Project",
  "Work\nDays",
  "Hours",
  "Month",
  "Billing Cycle",
  "Pricing per\nCycle",
  "Price",
];

const COLUMN_WIDTHS = [6, 26, 24, 26, 14, 12, 12, 14, 14, 14];
const NAVY = "FF1F3864";
const TOTAL_FILL = "FFD9E1F2";
const BORDER_COLOR = "FFBFBFBF";
const HOURS_FORMAT = "0.00";
const AMOUNT_FORMAT = "#,##0.00";
const HEADER_ROW = 5;
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface EmployeeSummary {
  employeeName: string;
  designation: string;
  projectName: string;
  workingDays: number;
  totalHours: number;
}

interface ProjectSummary {
  projectName: string;
  employees: EmployeeSummary[];
  totalHours: number;
}

interface EmployeeAccumulator {
  employeeName: string;
  designation: string;
  projectName: string;
  dates: Set<string>;
  totalHours: number;
}

const toNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const buildSummary = (rows: TimesheetActivityEntry[]): ProjectSummary[] => {
  const projects = new Map<
    string,
    { projectName: string; employees: Map<string, EmployeeAccumulator> }
  >();

  for (const row of rows) {
    const projectKey = row.project || "Unassigned";
    const employeeKey = row.employee || "Unassigned";
    const projectName = row.project_name || projectKey;

    let project = projects.get(projectKey);
    if (!project) {
      project = {
        projectName,
        employees: new Map<string, EmployeeAccumulator>(),
      };
      projects.set(projectKey, project);
    }

    let employee = project.employees.get(employeeKey);
    if (!employee) {
      employee = {
        employeeName: row.employee_name || employeeKey,
        designation: row.designation || "",
        projectName: project.projectName,
        dates: new Set<string>(),
        totalHours: 0,
      };
      project.employees.set(employeeKey, employee);
    }

    employee.totalHours += toNumber(row.hours);
    if (row.date) employee.dates.add(row.date);
  }

  return Array.from(projects.values())
    .map((project): ProjectSummary => {
      const employees = Array.from(project.employees.values())
        .map((employee): EmployeeSummary => ({
          employeeName: employee.employeeName,
          designation: employee.designation,
          projectName: employee.projectName,
          workingDays: employee.dates.size,
          totalHours: employee.totalHours,
        }))
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

      return {
        projectName: project.projectName,
        employees,
        totalHours: employees.reduce((total, employee) => total + employee.totalHours, 0),
      };
    })
    .sort((a, b) => a.projectName.localeCompare(b.projectName));
};

const toDate = (value: string): Date => new Date(`${value}T00:00:00`);

const periodLabel = (from: string, to: string): string => {
  const start = toDate(from);
  const end = toDate(to);

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  const format = (date: Date): string =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return `${format(start)} - ${format(end)}`;
};

const buildSubtitle = (
  rows: TimesheetActivityEntry[],
  from: string,
  to: string,
): string => {
  const clients = [
    ...new Set(
      rows
        .map((row) => row.customer_name)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();

  const period = periodLabel(from, to);
  return clients.length
    ? `Client: ${clients.join(", ")}  |  Month: ${period}`
    : `Month: ${period}`;
};

export async function downloadTimesheetSummaryExcel(
  rows: TimesheetActivityEntry[],
  from: string,
  to: string,
  fileName: string,
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const projects = buildSummary(rows);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Monthly Summary");

  const side = {
    style: "thin" as const,
    color: { argb: BORDER_COLOR },
  };
  const border = { left: side, right: side, top: side, bottom: side };

  sheet.getCell("A1").value = TITLE;
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: NAVY } };
  sheet.getCell("A2").value = buildSubtitle(rows, from, to);
  sheet.getCell("A2").font = { bold: true, size: 11 };
  const writeHeaders = (rowNumber: number): void => {
    HEADERS.forEach((header, index) => {
      const cell = sheet.getCell(rowNumber, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: NAVY },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = border;
    });
    sheet.getRow(rowNumber).height = 32;
  };

  const writeDataRow = (
    rowNumber: number,
    values: (string | number)[],
  ): void => {
    values.forEach((value, index) => {
      const cell = sheet.getCell(rowNumber, index + 1);
      cell.value = value;
      cell.border = border;
      if (index === 0 || index === 4 || index === 6) {
        cell.numFmt = "0.00";
      } else if (index === 5) {
        cell.numFmt = HOURS_FORMAT;
      } else if (index === 8 || index === 9) {
        cell.numFmt = AMOUNT_FORMAT;
      }
      if (index >= 7) {
        cell.value = null;
      }
    });
  };

  const writeTotalRow = (rowNumber: number, label: string, totalHours: number): void => {
    HEADERS.forEach((_, index) => {
      const cell = sheet.getCell(rowNumber, index + 1);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: TOTAL_FILL },
      };
      cell.font = { bold: true };
      cell.border = border;
    });
    sheet.getCell(rowNumber, 4).value = label;
    sheet.getCell(rowNumber, 6).value = totalHours;
    sheet.getCell(rowNumber, 6).numFmt = HOURS_FORMAT;
  };

  let currentRow = HEADER_ROW;
  let serialNumber = 1;
  let grandTotalHours = 0;

  if (projects.length === 0) {
    writeHeaders(currentRow);
    currentRow++;
    const emptyCell = sheet.getCell(currentRow, 1);
    emptyCell.value = "No timesheet records found";
    emptyCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.mergeCells(currentRow, 1, currentRow, HEADERS.length);
    for (let column = 1; column <= HEADERS.length; column++) {
      sheet.getCell(currentRow, column).border = border;
    }
  } else {
    projects.forEach((project, projectIndex) => {
      if (projectIndex > 0) currentRow++;

      sheet.mergeCells(currentRow, 1, currentRow, HEADERS.length);
      const projectHeading = sheet.getCell(currentRow, 1);
      projectHeading.value = `Project: ${project.projectName}`;
      projectHeading.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      projectHeading.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: NAVY },
      };
      projectHeading.alignment = { horizontal: "left", vertical: "middle" };
      projectHeading.border = border;
      sheet.getRow(currentRow).height = 24;

      currentRow++;
      writeHeaders(currentRow);
      currentRow++;

      project.employees.forEach((employee) => {
        writeDataRow(currentRow, [
          serialNumber,
          employee.employeeName,
          employee.designation,
          employee.projectName,
          employee.workingDays,
          employee.totalHours,
          1,
          "",
          "",
          "",
        ]);
        serialNumber++;
        currentRow++;
      });

      writeTotalRow(currentRow, `${project.projectName} Total`, project.totalHours);
      grandTotalHours += project.totalHours;
      currentRow++;
    });

    currentRow++;
    writeTotalRow(currentRow, "Grand Total", grandTotalHours);
  }

  COLUMN_WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  sheet.views = [{ state: "frozen", ySplit: HEADER_ROW }];
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        ...cell.alignment,
        vertical: "middle",
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
