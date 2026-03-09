// ─── Stock Correction — Bulk Upload Zone ─────────────────────────────────────

import React, { useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { Button } from "../../../components/ui/modal/formComponent";
import { Sheet, X, CheckCircle2, XCircle, ChevronUp, ChevronDown } from "lucide-react";

import {
  CSV_HEADERS,
  CSV_SAMPLE_ROWS,
  VALID_CORRECTION_TYPES,
} from "../../../types/Stockcorrection.constants";
import type { BulkRow, CorrectionType } from "../../../types/Stockcorrection.types";

// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  rows:         BulkRow[];
  onRowsChange: (rows: BulkRow[]) => void;
  onSubmit:     () => void;
  loading:      boolean;
}

// ─── Excel Spreadsheet Viewer (Portal) ───────────────────────────────────────

const SHEET_COLS = [
  { key: "index",          label: "#",           width: 48,  align: "center" },
  { key: "itemCode",       label: "Item Code",   width: 160, align: "left"   },
  { key: "correctionType", label: "Type",        width: 110, align: "center" },
  { key: "adjustmentQty",  label: "Adj. Qty",    width: 100, align: "right"  },
  { key: "reason",         label: "Reason Code", width: 160, align: "left"   },
  { key: "notes",          label: "Notes",       width: 220, align: "left"   },
  { key: "status",         label: "Status",      width: 100, align: "center" },
] as const;

const TYPE_STYLES: Record<CorrectionType, { bg: string; color: string; label: string }> = {
  add:    { bg: "rgba(22,163,74,0.10)",  color: "#16a34a", label: "+ Add"    },
  remove: { bg: "rgba(220,38,38,0.10)",  color: "#dc2626", label: "− Remove" },
  set:    { bg: "rgba(37,99,235,0.10)",  color: "#2563eb", label: "= Set"    },
};

interface SpreadsheetViewerProps {
  rows:    BulkRow[];
  onClose: () => void;
}

const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({ rows, onClose }) => {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter,  setFilter]  = useState<"all" | "valid" | "error">("all");
  const [search,  setSearch]  = useState("");

  const handleSort = (key: string) => {
    if (sortCol === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(key); setSortDir("asc"); }
  };

  const filtered = rows
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) =>
      search === "" ||
      r.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.notes.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortCol) return 0;
      const va = (a as any)[sortCol] ?? "";
      const vb = (b as any)[sortCol] ?? "";
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb), undefined, { numeric: true })
        : String(vb).localeCompare(String(va), undefined, { numeric: true });
    });

  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  // ✅ Correct portal syntax — function call, not JSX tag
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "92vw", height: "88vh",
          background: "var(--bg-card,#fff)",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sheet header bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border,#e8e0d5)",
          background: "var(--bg-card,#fff)",
          flexShrink: 0,
        }}>
          {/* Left: title + filter pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(34,197,94,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sheet size={16} color="#16a34a" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--main,#2d2d2d)", margin: 0 }}>
                  stock_correction_data
                </p>
                <p style={{ fontSize: 11, color: "var(--muted,#999)", margin: 0 }}>
                  {rows.length} rows · {SHEET_COLS.length} columns
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              {(["all", "valid", "error"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    background: filter === f
                      ? f === "error" ? "rgba(220,38,38,0.1)" : f === "valid" ? "rgba(22,163,74,0.1)" : "rgba(201,125,46,0.1)"
                      : "transparent",
                    color: filter === f
                      ? f === "error" ? "#dc2626" : f === "valid" ? "#16a34a" : "var(--primary,#c97d2e)"
                      : "var(--muted,#999)",
                    border: "1px solid " + (filter === f
                      ? f === "error" ? "rgba(220,38,38,0.3)" : f === "valid" ? "rgba(22,163,74,0.3)" : "rgba(201,125,46,0.3)"
                      : "transparent"),
                  }}
                >
                  {f === "all" ? `All (${rows.length})` : f === "valid" ? `✓ Valid (${validCount})` : `✗ Errors (${errorCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Right: search + close */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rows…"
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12,
                border: "1px solid var(--border,#e8e0d5)",
                background: "var(--bg-app,#f9f6f1)",
                color: "var(--main,#2d2d2d)", outline: "none", width: 180,
              }}
            />
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.05)", border: "none",
                color: "var(--muted,#999)",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Spreadsheet grid ── */}
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr>
                {SHEET_COLS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== "index" && col.key !== "status" && handleSort(col.key)}
                    style={{
                      minWidth: col.width, padding: "9px 12px",
                      fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                      letterSpacing: "0.08em", textAlign: col.align as any,
                      background: "var(--bg-app,#f5f0e8)",
                      color: sortCol === col.key ? "var(--primary,#c97d2e)" : "var(--muted,#999)",
                      borderBottom: "2px solid var(--border,#e8e0d5)",
                      borderRight: "1px solid var(--border,#e8e0d5)",
                      cursor: col.key !== "index" && col.key !== "status" ? "pointer" : "default",
                      userSelect: "none", whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {sortCol === col.key && (
                        sortDir === "asc"
                          ? <ChevronUp   size={10} color="var(--primary,#c97d2e)" />
                          : <ChevronDown size={10} color="var(--primary,#c97d2e)" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={SHEET_COLS.length}
                    style={{ textAlign: "center", padding: "48px 0", color: "var(--muted,#999)", fontSize: 12 }}
                  >
                    No rows match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const isErr = row.status === "error";
                  return (
                    <tr
                      key={row.id}
                      style={{ background: isErr ? "rgba(220,38,38,0.03)" : i % 2 === 0 ? "var(--bg-card,#fff)" : "var(--bg-app,#fafafa)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isErr ? "rgba(220,38,38,0.07)" : "rgba(201,125,46,0.04)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isErr ? "rgba(220,38,38,0.03)" : i % 2 === 0 ? "var(--bg-card,#fff)" : "var(--bg-app,#fafafa)"; }}
                    >
                      <td style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, color: "var(--muted,#bbb)", fontWeight: 600, borderBottom: "1px solid var(--border,#f0ece4)", borderRight: "1px solid var(--border,#f0ece4)" }}>
                        {rows.indexOf(row) + 1}
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border,#f0ece4)", borderRight: "1px solid var(--border,#f0ece4)" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--main,#2d2d2d)", background: "rgba(0,0,0,0.04)", padding: "2px 6px", borderRadius: 4 }}>
                          {row.itemCode || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid var(--border,#f0ece4)", borderRight: "1px solid var(--border,#f0ece4)" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: TYPE_STYLES[row.correctionType].bg,
                          color: TYPE_STYLES[row.correctionType].color,
                        }}>
                          {TYPE_STYLES[row.correctionType].label}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--main,#2d2d2d)", fontVariantNumeric: "tabular-nums", borderBottom: "1px solid var(--border,#f0ece4)", borderRight: "1px solid var(--border,#f0ece4)" }}>
                        {row.adjustmentQty}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted,#888)", borderBottom: "1px solid var(--border,#f0ece4)", borderRight: "1px solid var(--border,#f0ece4)" }}>
                        {row.reason || <span style={{ color: "rgba(0,0,0,0.2)" }}>—</span>}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted,#888)", maxWidth: 220, borderBottom: "1px solid var(--border,#f0ece4)", borderRight: "1px solid var(--border,#f0ece4)" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.notes || <span style={{ color: "rgba(0,0,0,0.2)" }}>—</span>}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid var(--border,#f0ece4)" }}>
                        {isErr ? (
                          <span title={row.error} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
                            <XCircle size={13} color="#dc2626" /> Error
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                            <CheckCircle2 size={13} color="#16a34a" /> Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Sheet footer ── */}
        <div style={{
          flexShrink: 0, padding: "8px 20px",
          borderTop: "1px solid var(--border,#e8e0d5)",
          background: "var(--bg-app,#f9f6f1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: "var(--muted,#999)" }}>
            Showing <strong style={{ color: "var(--main,#2d2d2d)" }}>{filtered.length}</strong> of{" "}
            <strong style={{ color: "var(--main,#2d2d2d)" }}>{rows.length}</strong> rows
          </span>
          <span style={{ fontSize: 11, color: "var(--muted,#999)" }}>
            {validCount > 0 && <span style={{ color: "#16a34a", marginRight: 12 }}>✓ {validCount} valid</span>}
            {errorCount > 0 && <span style={{ color: "#dc2626" }}>✗ {errorCount} errors</span>}
          </span>
        </div>
      </div>
    </div>,               // ← closes the outer <div> passed to createPortal
    document.body         // ← second arg: where to mount
  );                      // ← closes createPortal(  )
};

// ─── Main BulkUploadZone ──────────────────────────────────────────────────────

export const BulkUploadZone: React.FC<Props> = ({
  rows, onRowsChange, onSubmit, loading,
}) => {
  const [dragging,   setDragging]   = useState(false);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return;

    const dataRows: BulkRow[] = lines.slice(1).map((line, i) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
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
        itemName:       itemCode || "",
        correctionType: ct,
        adjustmentQty:  adjustmentQty || "",
        reason:         reason || "",
        notes:          notes || "",
        status:         hasError ? "error" : "valid",
        error:          hasError ? "Invalid row — check item code, type, and qty" : undefined,
      };
    });

    onRowsChange(dataRows);
  }, [onRowsChange]);

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|xlsx?)$/i)) {
      alert("Please upload a .csv or .xlsx file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => parseCSV(e.target?.result as string);
    reader.readAsText(file);
  }, [parseCSV]);

  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="flex flex-col gap-4 h-full">

      <UploadSteps />
      <TemplateCard onDownload={downloadTemplate} />

      {/* ── Drop zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
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
          <p className="text-xs text-muted mt-1">Accepts .csv · .xlsx · .xls — max 5 MB</p>
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

      {/* ── Preview table ── */}
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: "rgba(34,197,94,0.08)",
                  color: "#16a34a",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,0.14)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,197,94,0.08)"; }}
              >
                <Sheet size={13} />
                View in Spreadsheet
              </button>

              <button
                type="button"
                onClick={() => onRowsChange([])}
                className="text-xs text-muted hover:text-red-500 transition"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Compact preview table */}
          <div className="flex-1 overflow-auto rounded-xl border border-theme bg-card min-h-0">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="sticky top-0 bg-app border-b border-theme z-10">
                <tr>
                  {["#", "Item Code", "Type", "Adj. Qty", "Reason", "Notes", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted whitespace-nowrap">
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

          {validCount > 0 && (
            <div className="flex justify-end pt-1">
              <Button variant="primary" loading={loading} type="button" onClick={onSubmit}>
                Submit {validCount} Correction{validCount !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Spreadsheet viewer portal ── */}
      {sheetOpen && (
        <SpreadsheetViewer rows={rows} onClose={() => setSheetOpen(false)} />
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
      className="flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5 hover:underline transition"
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

const BulkPreviewRow: React.FC<{ row: BulkRow; index: number }> = ({ row, index }) => (
  <tr className={["border-b border-theme transition-colors", row.status === "error" ? "bg-red-50/40" : "hover:bg-row-hover"].join(" ")}>
    <td className="px-3 py-2.5 text-xs text-muted">{index + 1}</td>
    <td className="px-3 py-2.5 font-medium text-main">{row.itemCode || "—"}</td>
    <td className="px-3 py-2.5">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
        row.correctionType === "add"    ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
        row.correctionType === "remove" ? "bg-red-50 text-red-700 ring-red-200" :
                                          "bg-blue-50 text-blue-700 ring-blue-200"
      }`}>
        {row.correctionType === "add" ? "+ Add" : row.correctionType === "remove" ? "− Remove" : "= Set"}
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