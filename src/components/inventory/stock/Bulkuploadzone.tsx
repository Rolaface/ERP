// ─── Stock Correction — Bulk Upload Zone ─────────────────────────────────────
// Handles drag-and-drop / file-picker CSV/Excel upload,
// parses rows, shows a preview table, and triggers bulk submit.

import React, { useState, useRef, useCallback } from "react";
import { Button } from "../../../components/ui/modal/formComponent";

import {
  CSV_HEADERS,
  CSV_SAMPLE_ROWS,
  VALID_CORRECTION_TYPES,
} from "../../../types/Stockcorrection.constants";
import type { BulkRow, CorrectionType } from "../../../types/Stockcorrection.types";


// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  rows:          BulkRow[];
  onRowsChange:  (rows: BulkRow[]) => void;
  onSubmit:      () => void;
  loading:       boolean;
}

export const BulkUploadZone: React.FC<Props> = ({
  rows, onRowsChange, onSubmit, loading,
}) => {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Template download ─────────────────────────────────────────────────────
  const downloadTemplate = useCallback(() => {
    const csv  = [CSV_HEADERS.join(","), ...CSV_SAMPLE_ROWS].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "stock_correction_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── CSV parser ────────────────────────────────────────────────────────────
  const parseCSV = useCallback(
    (text: string) => {
      const lines = text.trim().split("\n").filter(Boolean);
      if (lines.length < 2) return; // header only — nothing to parse

      const dataRows: BulkRow[] = lines.slice(1).map((line, i) => {
        const cols = line
          .split(",")
          .map((c) => c.trim().replace(/^"|"$/g, ""));
        const [itemCode, correctionType, adjustmentQty, reason, notes] = cols;

        const ct = VALID_CORRECTION_TYPES.includes(correctionType as CorrectionType)
          ? (correctionType as CorrectionType)
          : "add";

        const qty      = parseFloat(adjustmentQty);
        const hasError =
          !itemCode ||
          !VALID_CORRECTION_TYPES.includes(correctionType as CorrectionType) ||
          !adjustmentQty ||
          isNaN(qty) ||
          qty <= 0;

        return {
          id:             `row-${Date.now()}-${i}`,
          itemCode:       itemCode || "",
          itemName:       itemCode || "", // resolve via API if needed
          correctionType: ct,
          adjustmentQty:  adjustmentQty || "",
          reason:         reason || "",
          notes:          notes || "",
          status:         hasError ? "error" : "valid",
          error:          hasError
            ? "Invalid row — check item code, type, and qty"
            : undefined,
        };
      });

      onRowsChange(dataRows);
    },
    [onRowsChange]
  );

  // ── File handler ──────────────────────────────────────────────────────────
  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(csv|xlsx?)$/i)) {
        alert("Please upload a .csv or .xlsx file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => parseCSV(e.target?.result as string);
      reader.readAsText(file);
    },
    [parseCSV]
  );

  // ── Counts ────────────────────────────────────────────────────────────────
  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Step progress ───────────────────────────────────────────────────── */}
      <UploadSteps />

      {/* ── Template card ───────────────────────────────────────────────────── */}
      <TemplateCard onDownload={downloadTemplate} />

      {/* ── Drop zone ───────────────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer",
          "transition-all duration-200 py-8",
          dragging
            ? "border-primary bg-primary/5 scale-[1.005]"
            : "border-theme hover:border-primary/50 hover:bg-app/60",
        ].join(" ")}
      >
        <div className={[
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-200",
          dragging ? "bg-primary text-white" : "bg-app border border-theme text-muted",
        ].join(" ")}>
          <UploadIcon />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-main">
            {dragging ? "Drop file here" : "Drag & drop your CSV or Excel file"}
          </p>
          <p className="text-xs text-muted mt-1">
            Accepts .csv · .xlsx · .xls — max 5 MB
          </p>
        </div>
        <span className="text-xs font-medium text-primary underline underline-offset-2">
          or click to browse
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* ── Preview table ───────────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div className="flex-1 flex flex-col gap-2 min-h-0">

          {/* Stats bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">
                <span className="font-semibold text-main">{rows.length}</span> rows loaded
              </span>
              {validCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                  ✓ {validCount} valid
                </span>
              )}
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full ring-1 ring-red-200">
                  ✗ {errorCount} errors
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRowsChange([])}
              className="text-xs text-muted hover:text-red-500 transition"
            >
              Clear all
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto rounded-xl border border-theme bg-card min-h-0">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="sticky top-0 bg-app border-b border-theme z-10">
                <tr>
                  {["#", "Item Code", "Type", "Adj. Qty", "Reason", "Notes", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <BulkPreviewRow key={row.id} row={row} index={i} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit */}
          {validCount > 0 && (
            <div className="flex justify-end pt-1">
              <Button variant="primary" loading={loading} type="button" onClick={onSubmit}>
                Submit {validCount} Correction{validCount !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────
const STEPS = [
  { n: "1", label: "Download Template"   },
  { n: "2", label: "Fill in Corrections" },
  { n: "3", label: "Upload & Review"     },
  { n: "4", label: "Submit"              },
];

const UploadSteps = () => (
  <div className="flex items-center gap-4">
    {STEPS.map((step, i) => (
      <React.Fragment key={step.n}>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {step.n}
          </span>
          <span className="text-xs font-medium text-muted whitespace-nowrap">{step.label}</span>
        </div>
        {i < STEPS.length - 1 && <div className="flex-1 h-px bg-theme min-w-[12px]" />}
      </React.Fragment>
    ))}
  </div>
);

const TemplateCard: React.FC<{ onDownload: () => void }> = ({ onDownload }) => (
  <div className="flex items-center justify-between rounded-xl border border-theme bg-card px-4 py-3">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <polyline points="9 14 12 17 15 14"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-main">stock_correction_template.csv</p>
        <p className="text-xs text-muted mt-0.5">
          Columns: item_code · correction_type · adjustment_qty · reason_code · notes
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onDownload}
      className="flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5
        rounded-lg border border-primary/30 hover:bg-primary/5 hover:underline transition"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Download Template
    </button>
  </div>
);

const TYPE_STYLES: Record<CorrectionType, string> = {
  add:    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  remove: "bg-red-50 text-red-700 ring-red-200",
  set:    "bg-blue-50 text-blue-700 ring-blue-200",
};

const TYPE_LABELS: Record<CorrectionType, string> = {
  add:    "+ Add",
  remove: "− Remove",
  set:    "= Set",
};

const BulkPreviewRow: React.FC<{ row: BulkRow; index: number }> = ({ row, index }) => (
  <tr className={[
    "border-b border-theme transition-colors",
    row.status === "error" ? "bg-red-50/40" : "hover:bg-row-hover",
  ].join(" ")}>
    <td className="px-3 py-2.5 text-xs text-muted">{index + 1}</td>
    <td className="px-3 py-2.5 font-medium text-main">{row.itemCode || "—"}</td>
    <td className="px-3 py-2.5">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${TYPE_STYLES[row.correctionType]}`}>
        {TYPE_LABELS[row.correctionType]}
      </span>
    </td>
    <td className="px-3 py-2.5 tabular-nums font-medium text-main">{row.adjustmentQty}</td>
    <td className="px-3 py-2.5 text-xs text-muted">{row.reason || "—"}</td>
    <td className="px-3 py-2.5 text-xs text-muted max-w-[160px] truncate">{row.notes || "—"}</td>
    <td className="px-3 py-2.5">
      {row.status === "valid"
        ? <span className="text-xs font-semibold text-emerald-600">✓ Valid</span>
        : <span className="text-xs font-semibold text-red-600" title={row.error}>✗ Error</span>
      }
    </td>
  </tr>
);

const UploadIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);