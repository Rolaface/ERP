import type { Worksheet, Workbook, Border, Fill, Alignment } from "exceljs";
import type { TimesheetDetail } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";

type Log = NonNullable<TimesheetDetail["time_logs"]>[number];
type Cell = string | number;

/* ============================== theme ============================== */
const C = {
  navy: "FF12427A",
  title: "FF0F2340",
  text: "FF1A1F2B",
  muted: "FF6B7280",
  labelBg: "FFF1F3F7",
  labelText: "FF4B5A73",
  headBg: "FFDCE6F3",
  totalBg: "FFCFE4FB",
  zebra: "FFF8FAFC",
  boxBg: "FFF1F2F5",
  border: "FFD5DBE5",
  white: "FFFFFFFF",
  green: "FF15803D",
  blue: "FF1D4ED8",
  red: "FFB91C1C",
};

const FONT = "Calibri";
const SIZE = 10;
const thin: Partial<Border> = { style: "thin", color: { argb: C.border } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };
const fill = (argb: string): Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ============================== helpers ============================== */
const parseYmd = (s?: string | null) => {
  if (!s) return null;
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return y && m && d ? { y, m, d } : null;
};

const fmtDate = (s?: string | null) => {
  const p = parseYmd(s);
  return p ? `${String(p.d).padStart(2, "0")} ${MONTHS[p.m - 1]} ${p.y}` : "";
};

const dayName = (s?: string | null) => {
  const p = parseYmd(s);
  return p ? DAYS[new Date(p.y, p.m - 1, p.d).getDay()] : "";
};

const timePart = (s?: string | null) =>
  s && s.includes(" ") ? s.split(" ")[1].slice(0, 5) : "";

const periodText = (data: TimesheetDetail) => {
  const start = data.custom_timesheet_start_date ?? data.start_date;
  const end = data.custom_timesheet_end_date ?? data.end_date;
  const a = parseYmd(start);
  const b = parseYmd(end);
  if (!a) return "";
  let text = fmtDate(start);
  if (b && end !== start) {
    const days =
      Math.round(
        (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000,
      ) + 1;
    text += ` - ${fmtDate(end)} (${days} Days)`;
  }
  return text;
};

const isFilled = (v: Cell | null | undefined) =>
  v !== "" && v !== null && v !== undefined;
const textLen = (v: Cell) =>
  typeof v === "number" ? v.toFixed(2).length : String(v ?? "").length;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
const safeName = (s: string) => s.replace(/[\\/:*?"<>|]/g, "_");
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

async function newWorkbook(): Promise<Workbook> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Timesheet Export";
  wb.created = new Date();
  return wb;
}

async function download(wb: Workbook, fileName: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/* ======================= auto column layout ======================= */
interface ColDef<T> {
  key: string;
  header: string;
  align: "left" | "center" | "right";
  min: number;
  max: number;
  wrap?: boolean;
  numFmt?: string;
  optional?: boolean;
  get: (item: T, i: number) => Cell;
}
interface Col {
  key: string;
  header: string;
  width: number;
  align: "left" | "center" | "right";
  wrap?: boolean;
  numFmt?: string;
}

function layout<T>(defs: ColDef<T>[], items: T[]) {
  const all = items.map((it, i) => defs.map((d) => d.get(it, i)));
  const keep = defs.map(
    (d, ci) => !d.optional || all.some((r) => isFilled(r[ci])),
  );
  const cols: Col[] = [];
  defs.forEach((d, ci) => {
    if (!keep[ci]) return;
    const maxLen = Math.max(0, ...all.map((r) => textLen(r[ci])));
    cols.push({
      key: d.key,
      header: d.header,
      align: d.align,
      wrap: d.wrap,
      numFmt: d.numFmt,
      width: clamp(Math.max(d.header.length + 4, maxLen + 3), d.min, d.max),
    });
  });
  const matrix = all.map((r) => r.filter((_, ci) => keep[ci]));
  return { cols, matrix };
}

function writeTable(
  ws: Worksheet,
  headRow: number,
  cols: Col[],
  matrix: Cell[][],
  headStyle: "light" | "dark",
) {
  cols.forEach((c, i) => (ws.getColumn(i + 1).width = c.width));

  const hr = ws.getRow(headRow);
  hr.height = 24;
  cols.forEach((c, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = c.header;
    cell.font = {
      name: FONT,
      size: SIZE + 0.5,
      bold: true,
      color: { argb: headStyle === "dark" ? C.white : C.title },
    };
    cell.fill = fill(headStyle === "dark" ? C.navy : C.headBg);
    cell.border = BORDER;
    cell.alignment = {
      vertical: "middle",
      horizontal: c.align,
      indent: c.align === "center" ? 0 : 1,
    };
  });

  matrix.forEach((vals, ri) => {
    const row = ws.getRow(headRow + 1 + ri);
    let needsWrap = false;
    vals.forEach((v, ci) => {
      const c = cols[ci];
      const cell = row.getCell(ci + 1);
      cell.value = v;
      const isYes = c.key === "billable" && v === "Yes";
      const isNo = c.key === "billable" && v === "No";
      cell.font = {
        name: FONT,
        size: SIZE,
        color: { argb: isYes ? C.green : isNo ? C.muted : C.text },
        bold: isYes,
      };
      cell.border = BORDER;
      if (ri % 2 === 1) cell.fill = fill(C.zebra);
      cell.alignment = {
        vertical: "middle",
        horizontal: c.align,
        indent: c.align === "center" ? 0 : 1,
        wrapText: !!c.wrap,
      } as Partial<Alignment>;
      if (c.numFmt && typeof v === "number") cell.numFmt = c.numFmt;
      if (c.wrap && textLen(v) > c.width - 3) needsWrap = true;
    });
    if (!needsWrap) row.height = 19; // wrap chahiye to Excel khud auto-fit karega
  });

  return { first: headRow + 1, last: headRow + Math.max(matrix.length, 1) };
}

/* ======================= info grid helpers ======================= */
function infoCell(
  ws: Worksheet,
  row: number,
  s: number,
  e: number,
  value: Cell,
  isLabel: boolean,
  color?: string,
) {
  if (e > s) ws.mergeCells(row, s, row, e);
  const c = ws.getCell(row, s);
  c.value = value;
  c.font = {
    name: FONT,
    size: SIZE + 0.5,
    bold: isLabel || !!color,
    color: { argb: color ?? (isLabel ? C.labelText : C.text) },
  };
  c.fill = fill(isLabel ? C.labelBg : C.white);
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  for (let col = s; col <= e; col++) ws.getCell(row, col).border = BORDER;
}

function labelEndFor(widths: number[], s: number, e: number, target: number) {
  let acc = 0;
  let k = s;
  for (; k < e; k++) {
    acc += widths[k - 1];
    if (acc >= target) break;
  }
  return Math.min(k, e - 1);
}

function sectionBar(ws: Worksheet, row: number, text: string, lastCol: number) {
  ws.mergeCells(row, 1, row, lastCol);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.font = { name: FONT, size: 12, bold: true, color: { argb: C.white } };
  cell.fill = fill(C.navy);
  cell.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(row).height = 25;
}

export async function exportTimesheetToExcel(
  data: TimesheetDetail,
  showFinancials = false,
) {
  const wb = await newWorkbook();
  const ws = wb.addWorksheet("Timesheet", {
    views: [{ showGridLines: false }],
  });
  ws.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.4,
      right: 0.4,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3,
    },
  };

  const logs = data.time_logs ?? [];
  const parentProject = data.parent_project ?? "";
  const hasClock = logs.some((l) => {
    const t = timePart(l.from_time);
    return t !== "" && t !== "00:00";
  });

  const defs: ColDef<Log>[] = [
    {
      key: "no",
      header: "#",
      align: "center",
      min: 5,
      max: 7,
      get: (_, i) => i + 1,
    },
    {
      key: "date",
      header: "Date",
      align: "left",
      min: 13,
      max: 16,
      get: (l) => fmtDate(l.from_time),
    },
    {
      key: "time",
      header: "Time",
      align: "left",
      min: 13,
      max: 15,
      optional: true,
      get: (l) =>
        hasClock && timePart(l.from_time)
          ? `${timePart(l.from_time)} - ${timePart(l.to_time)}`
          : "",
    },
    {
      key: "day",
      header: "Day",
      align: "left",
      min: 7,
      max: 8,
      get: (l) => dayName(l.from_time),
    },
    {
      key: "project",
      header: "Project",
      align: "left",
      min: 14,
      max: 30,
      optional: true,
      get: (l) => {
        const p = l.project_name || l.project || "";
        return p === parentProject ? "" : p;
      },
    },

    {
      key: "activity",
      header: "Activity Type",
      align: "left",
      min: 16,
      max: 38,
      get: (l) => l.activity_type ?? "",
    },

    {
      key: "desc",
      header: "Description",
      align: "left",
      min: 25,
      max: 60,
      wrap: true,
      optional: false,
      get: (l) => l.description ?? "",
    },
    {
      key: "hours",
      header: "Hours",
      align: "right",
      min: 9,
      max: 10,
      numFmt: "0.00",
      get: (l) => l.hours ?? 0,
    },
    ...(showFinancials
      ? [
          {
            key: "billable",
            header: "Billable",
            align: "center" as const,
            min: 10,
            max: 11,
            get: (l: Log) => (l.is_billable ? "Yes" : "No"),
          },
        ]
      : []),
    ...(showFinancials
      ? [
          {
            key: "amount",
            header: "Amount",
            align: "right" as const,
            min: 13,
            max: 18,
            numFmt: '#,##0.00;-#,##0.00;"-"',
            get: (l: Log) => (l.is_billable ? (l.billing_amount ?? 0) : 0),
          },
        ]
      : []),
  ];

  const { cols, matrix } = layout(defs, logs);
  const n = cols.length;
  const widths = cols.map((c) => c.width);
  const total = sum(widths);
  cols.forEach((c, i) => (ws.getColumn(i + 1).width = c.width));

  /* ---------- title ---------- */
  const period = periodText(data);
  const titleEnd = Math.min(3, n - 1);
  ws.mergeCells(1, 1, 1, titleEnd);
  const t = ws.getCell(1, 1);
  t.value = "Timesheet";
  t.font = { name: FONT, size: 24, bold: true, color: { argb: C.title } };
  t.alignment = { vertical: "middle" };
  ws.getRow(1).height = 38;

  ws.mergeCells(1, titleEnd + 1, 1, n);
  const pc = ws.getCell(1, titleEnd + 1);
  pc.value = period ? `Period: ${period}` : "";
  pc.font = { name: FONT, size: 11, bold: true, color: { argb: C.text } };
  pc.alignment = { horizontal: "right", vertical: "middle" };

  /* ---------- 1. information ---------- */
  sectionBar(ws, 3, "1. Timesheet Information", n);

  const empText = [
    data.employee_name,
    data.employee ? `(${data.employee})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const items: { label: string; value: Cell; color?: string }[] = [
    { label: "Timesheet No.", value: data.name },
    { label: "Employee", value: empText || "-" },
    { label: "Period", value: period || "-" },
    { label: "Department", value: data.department || "-" },
    { label: "Customer", value: data.customer || "-" },
    { label: "Project", value: parentProject || "-" },
    { label: "Company", value: data.company || "-" },
    ...(showFinancials
      ? [{ label: "Currency", value: data.currency || "-" }]
      : []),
  ];

  let acc = 0;
  let splitIdx = 0;
  for (let i = 0; i < n; i++) {
    acc += widths[i];
    if (acc >= total / 2) {
      splitIdx = i;
      break;
    }
  }
  const twoUp =
    acc >= 62 && total - acc >= 62 && splitIdx >= 1 && n - (splitIdx + 1) >= 2;

  let row = 4;
  if (twoUp) {
    const lS = 1,
      lE = splitIdx + 1,
      rS = splitIdx + 2,
      rE = n;
    const lLab = labelEndFor(widths, lS, lE, 15);
    const rLab = labelEndFor(widths, rS, rE, 13);
    for (let i = 0; i < items.length; i += 2) {
      const a = items[i];
      const b = items[i + 1];
      infoCell(ws, row, lS, lLab, a.label, true);
      infoCell(ws, row, lLab + 1, lE, a.value, false, a.color);
      if (b) {
        infoCell(ws, row, rS, rLab, b.label, true);
        infoCell(ws, row, rLab + 1, rE, b.value, false, b.color);
      } else {
        infoCell(ws, row, rS, rE, "", false);
      }
      ws.getRow(row).height = 22;
      row++;
    }
  } else {
    const lab = labelEndFor(widths, 1, n, 18);
    items.forEach((it) => {
      infoCell(ws, row, 1, lab, it.label, true);
      infoCell(ws, row, lab + 1, n, it.value, false, it.color);
      ws.getRow(row).height = 22;
      row++;
    });
  }

  /* ---------- 2. logs ---------- */
  const logsBar = row + 1;
  sectionBar(ws, logsBar, "2. Timesheet Logs", n);
  const headRow = logsBar + 1;
  const { first, last } = writeTable(ws, headRow, cols, matrix, "light");

  if (!logs.length) {
    ws.mergeCells(first, 1, first, n);
    const c = ws.getCell(first, 1);
    c.value = "No time logs";
    c.font = { name: FONT, size: SIZE, italic: true, color: { argb: C.muted } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = BORDER;
    ws.getRow(first).height = 24;
  }

  /* ---------- total row ---------- */
  const hIdx = cols.findIndex((c) => c.key === "hours"); // 0-based
  const aIdx = cols.findIndex((c) => c.key === "amount");
  const bIdx = cols.findIndex((c) => c.key === "billable");
  const totalRow = last + 1;
  const totalHours = sum(logs.map((l) => l.hours ?? 0));
  const billableHours = sum(
    logs.filter((l) => l.is_billable).map((l) => l.hours ?? 0),
  );
  const totalAmount = sum(
    logs.map((l) => (l.is_billable ? (l.billing_amount ?? 0) : 0)),
  );
  const colLetter = (i: number) => String.fromCharCode(65 + i);

  ws.mergeCells(totalRow, 1, totalRow, hIdx);
  ws.getCell(totalRow, 1).value = "Total Working Hours";
  ws.getCell(totalRow, hIdx + 1).value = logs.length
    ? {
        formula: `SUM(${colLetter(hIdx)}${first}:${colLetter(hIdx)}${last})`,
        result: totalHours,
      }
    : 0;
  ws.getCell(totalRow, hIdx + 1).numFmt = "0.00";
  if (bIdx >= 0) ws.getCell(totalRow, bIdx + 1).value = "-";
  if (aIdx >= 0) {
    ws.getCell(totalRow, aIdx + 1).value = logs.length
      ? {
          formula: `SUM(${colLetter(aIdx)}${first}:${colLetter(aIdx)}${last})`,
          result: totalAmount,
        }
      : 0;
    ws.getCell(totalRow, aIdx + 1).numFmt = "#,##0.00";
  }
  for (let col = 1; col <= n; col++) {
    const c = ws.getCell(totalRow, col);
    c.font = { name: FONT, size: 12, bold: true, color: { argb: C.title } };
    c.fill = fill(C.totalBg);
    c.border = BORDER;
    c.alignment = {
      vertical: "middle",
      horizontal: col === 1 ? "left" : col === bIdx + 1 ? "center" : "right",
      indent: col === 1 ? 1 : 0,
    };
  }
  ws.getRow(totalRow).height = 28;

  /* ---------- summary box ---------- */
  const lines: [string, string][] = [
    ["Period: ", period || "-"],
    ["Total Working Hours: ", totalHours.toFixed(2)],
    ...(showFinancials
      ? ([["Billable Hours: ", billableHours.toFixed(2)]] as [string, string][])
      : []),
    ...(showFinancials
      ? ([
          [
            "Total Amount: ",
            `${data.currency ?? ""} ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim(),
          ],
        ] as [string, string][])
      : []),
  ];
  lines.forEach(([k, v], i) => {
    const r = totalRow + 2 + i;
    ws.mergeCells(r, 1, r, n);
    const c = ws.getCell(r, 1);
    c.value = {
      richText: [
        {
          text: k,
          font: { name: FONT, size: 11, bold: true, color: { argb: C.text } },
        },
        { text: v, font: { name: FONT, size: 11, color: { argb: C.text } } },
      ],
    };
    c.fill = fill(C.boxBg);
    c.alignment = { vertical: "middle", indent: 1 };
    ws.getRow(r).height = 21;
  });

  ws.pageSetup.printTitlesRow = `${headRow}:${headRow}`;
  await download(wb, `${safeName(data.name)}.xlsx`);
}

export async function exportTimesheetsToExcel(
  list: TimesheetDetail[],
  fileName = "timesheets.xlsx",
  showFinancials = false,
) {
  const wb = await newWorkbook();

  const sorted = [...list].sort(
    (a, b) =>
      (a.employee_name ?? a.employee ?? "").localeCompare(
        b.employee_name ?? b.employee ?? "",
      ) ||
      (a.custom_timesheet_start_date ?? "").localeCompare(
        b.custom_timesheet_start_date ?? "",
      ),
  );

  type Item = { t: TimesheetDetail; l: Log };
  const items: Item[] = sorted.flatMap((t) =>
    (t.time_logs ?? []).map((l) => ({ t, l })),
  );

  const defs: ColDef<Item>[] = [
    {
      key: "empId",
      header: "Employee ID",
      align: "left",
      min: 14,
      max: 20,
      get: ({ t }) => t.employee,
    },
    {
      key: "empName",
      header: "Employee Name",
      align: "left",
      min: 16,
      max: 28,
      get: ({ t }) => t.employee_name ?? "",
    },
    {
      key: "dept",
      header: "Department",
      align: "left",
      min: 14,
      max: 24,
      optional: true,
      get: ({ t }) => t.department ?? "",
    },
    {
      key: "ts",
      header: "Timesheet",
      align: "left",
      min: 16,
      max: 22,
      get: ({ t }) => t.name,
    },
    {
      key: "project",
      header: "Project",
      align: "left",
      min: 14,
      max: 28,
      optional: true,
      get: ({ t, l }) => l.project_name || l.project || t.parent_project || "",
    },
    {
      key: "customer",
      header: "Customer",
      align: "left",
      min: 14,
      max: 26,
      optional: true,
      get: ({ t }) => t.customer ?? "",
    },
    {
      key: "date",
      header: "Date",
      align: "left",
      min: 13,
      max: 16,
      get: ({ l }) => fmtDate(l.from_time),
    },
    {
      key: "day",
      header: "Day",
      align: "left",
      min: 7,
      max: 8,
      get: ({ l }) => dayName(l.from_time),
    },
    {
      key: "activity",
      header: "Activity Type",
      align: "left",
      min: 16,
      max: 38,
      get: ({ l }) => l.activity_type ?? "",
    },
    {
      key: "desc",
      header: "Description",
      align: "left",
      min: 20,
      max: 60,
      wrap: true,
      optional: true,
      get: ({ l }) => l.description ?? "",
    },
    {
      key: "hours",
      header: "Hours",
      align: "right",
      min: 9,
      max: 10,
      numFmt: "0.00",
      get: ({ l }) => l.hours ?? 0,
    },
    ...(showFinancials
      ? [
          {
            key: "billable",
            header: "Billable",
            align: "center" as const,
            min: 10,
            max: 11,
            get: ({ l }: Item) => (l.is_billable ? "Yes" : "No"),
          },
        ]
      : []),
  ];

  /* ---- Sheet 1: detail ---- */
  const ws = wb.addWorksheet("Timesheets", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  });
  const { cols, matrix } = layout(defs, items);
  writeTable(ws, 1, cols, matrix, "dark");
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: cols.length },
  };
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
  ws.pageSetup.printTitlesRow = "1:1";

  /* ---- Sheet 2: employee summary ---- */
  const byEmp = new Map<
    string,
    { name: string; count: number; hours: number; billable: number }
  >();
  sorted.forEach((t) => {
    const e = byEmp.get(t.employee) ?? {
      name: t.employee_name ?? "",
      count: 0,
      hours: 0,
      billable: 0,
    };
    e.count += 1;
    (t.time_logs ?? []).forEach((l) => {
      e.hours += l.hours ?? 0;
      if (l.is_billable) e.billable += l.hours ?? 0;
    });
    byEmp.set(t.employee, e);
  });

  const sumDefs: ColDef<
    [string, { name: string; count: number; hours: number; billable: number }]
  >[] = [
    {
      key: "id",
      header: "Employee ID",
      align: "left",
      min: 14,
      max: 20,
      get: ([id]) => id,
    },
    {
      key: "name",
      header: "Employee Name",
      align: "left",
      min: 18,
      max: 30,
      get: ([, e]) => e.name,
    },
    {
      key: "count",
      header: "Timesheets",
      align: "right",
      min: 12,
      max: 12,
      get: ([, e]) => e.count,
    },
    ...(showFinancials
      ? [
          {
            key: "billable",
            header: "Billable Hours",
            align: "right" as const,
            min: 15,
            max: 15,
            numFmt: "0.00",
            get: ([, e]: [
              string,
              { name: string; count: number; hours: number; billable: number },
            ]) => e.billable,
          },
        ]
      : []),
    {
      key: "hours",
      header: "Total Hours",
      align: "right",
      min: 13,
      max: 13,
      numFmt: "0.00",
      get: ([, e]) => e.hours,
    },
  ];
  const sum2 = wb.addWorksheet("Employee Summary", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
  });
  const s = layout(sumDefs, [...byEmp.entries()]);
  const { last } = writeTable(sum2, 1, s.cols, s.matrix, "dark");

  if (s.matrix.length) {
    const tr = last + 1;
    const nCols = s.cols.length;
    const L = (i: number) => String.fromCharCode(65 + i);
    sum2.getCell(tr, 2).value = "Total";
    s.cols.forEach((c, i) => {
      if (c.key === "count" || c.key === "billable" || c.key === "hours") {
        sum2.getCell(tr, i + 1).value = {
          formula: `SUM(${L(i)}2:${L(i)}${last})`,
          result: s.matrix.reduce((a, r) => a + Number(r[i]), 0),
        };
        if (c.numFmt) sum2.getCell(tr, i + 1).numFmt = c.numFmt;
      }
    });
    for (let col = 1; col <= nCols; col++) {
      const c = sum2.getCell(tr, col);
      c.font = { name: FONT, size: 11, bold: true, color: { argb: C.title } };
      c.fill = fill(C.totalBg);
      c.border = BORDER;
      c.alignment = {
        vertical: "middle",
        horizontal: s.cols[col - 1].align,
        indent: s.cols[col - 1].align === "center" ? 0 : 1,
      };
    }
    sum2.getRow(tr).height = 24;
  }

  await download(wb, fileName);
}
