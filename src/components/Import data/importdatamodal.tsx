import React, { useCallback, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { MinimizableModal } from "../../components/common/MinimizableModal";

export interface ImportModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accept?: string;
  onImport: (file: File) => Promise<void> | void;
  uploading?: boolean;
  onDownloadTemplate?: () => void;
  downloadingTemplate?: boolean;

  // New: template file info shown in the "template card"
  templateFileName?: string;
  templateColumns?: string[];

  // New: banner text at the top (defaults to a sensible message)
  bannerText?: string;
}

interface PreviewData {
  headers: string[];
  rows: (string | number)[][];
  totalRows: number;
}

const MAX_PREVIEW_ROWS = 50;

const STEPS = [
  { label: "Download Template" },
  { label: "Fill in Item Data" },
  { label: "Upload & Review" },
  { label: "Submit" },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  modalId,
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  accept = ".xlsx,.xls,.csv",
  onImport,
  uploading = false,
  onDownloadTemplate,
  downloadingTemplate = false,
  templateFileName = "import_template.csv",
  templateColumns = [],
  bannerText = "All imports are logged with timestamp & user",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derive current step from state: 1 (download) is always "done" once
  // a file exists; 3 (upload & review) is active once a file is picked.
  const currentStep = file ? 3 : 1;

  const resetState = useCallback(() => {
    setFile(null);
    setPreview(null);
    setShowPreview(false);
    setParseError(null);
    setIsDragging(false);
    setParsing(false);
  }, []);

  const handleClose = () => {
    if (uploading) return;
    resetState();
    onClose();
  };

  const parseFile = async (selected: File) => {
    setParsing(true);
    setParseError(null);
    try {
      const buffer = await selected.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
        header: 1,
        blankrows: false,
      });

      if (!json.length) {
        setParseError("This file appears to be empty.");
        setPreview(null);
        return;
      }

      const [headerRow, ...dataRows] = json;
      setPreview({
        headers: (headerRow as (string | number)[]).map((h) => String(h ?? "")),
        rows: dataRows.slice(0, MAX_PREVIEW_ROWS),
        totalRows: dataRows.length,
      });
    } catch {
      setParseError("Couldn't read this file. Please check the format and try again.");
      setPreview(null);
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setShowPreview(false);
    parseFile(selected);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelected(e.dataTransfer.files?.[0] ?? null);
  };

  const handleRemoveFile = () => {
    if (uploading) return;
    resetState();
  };

  const handleImportClick = async () => {
    if (!file || uploading) return;
    await onImport(file);
  };

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      maxWidth="4xl"
      height={showPreview ? "720px" : "600px"}
      footer={
        <>
          <div>
           
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="btn btn-outline !py-1.5 !text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportClick}
              disabled={!file || uploading || parsing}
              className="btn btn-primary !py-1.5 !text-xs"
            >
              {uploading ? (
                <Loader2 size={13} className="mr-1.5 animate-spin" />
              ) : (
                <UploadCloud size={13} className="mr-1.5" />
              )}
              {uploading ? "Importing..." : "Import"}
            </button>
          </div>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Compliance banner */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldCheck size={14} className="shrink-0" />
            {bannerText}
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-1">
          {STEPS.map((step, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < currentStep;
            const isActive = stepNum === currentStep;
            return (
              <div key={step.label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isDone
                      ? "bg-primary text-white"
                      : isActive
                        ? "bg-primary text-white"
                        : "bg-[var(--border)] text-muted"
                  }`}
                >
                  {isDone ? <Check size={12} /> : stepNum}
                </div>
                <span
                  className={`whitespace-nowrap text-xs ${
                    isActive ? "font-medium text-main" : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
                {stepNum < STEPS.length && (
                  <div className="mx-2 h-px flex-1 bg-[var(--border)]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Template file card */}
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-card px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <FileSpreadsheet size={18} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-main">{templateFileName}</p>
              {templateColumns.length > 0 && (
                <p className="truncate text-xs text-muted">
                  Columns: {templateColumns.join(" · ")}
                </p>
              )}
            </div>
          </div>
          {onDownloadTemplate && (
            <button
              type="button"
              onClick={onDownloadTemplate}
              disabled={downloadingTemplate}
              className="btn btn-outline shrink-0 !py-1.5 !text-xs"
            >
              {downloadingTemplate ? (
                <Loader2 size={13} className="mr-1.5 animate-spin" />
              ) : (
                <Download size={13} className="mr-1.5" />
              )}
              Download Template
            </button>
          )}
        </div>

        {/* Dropzone / file preview */}
        {!file ? (
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-[var(--border)] bg-app hover:border-primary/40 hover:bg-row-hover"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-card shadow-sm">
              <UploadCloud size={22} className="text-muted" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-main">
                Drag & drop your CSV or Excel file
              </p>
              <p className="text-xs text-muted">
                Accepts .csv · .xlsx · .xls — max 5 MB
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              or click to browse
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-app px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
                >
                  <FileSpreadsheet size={18} style={{ color: "var(--primary)" }} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-main">{file.name}</p>
                  <p className="text-xs text-muted">
                    {formatFileSize(file.size)}
                    {parsing && " · Reading file..."}
                    {preview && !parsing && ` · ${preview.totalRows} rows`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={uploading}
                aria-label="Remove file"
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-row-hover hover:text-main disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {parseError && <p className="text-xs text-red-500">{parseError}</p>}

            {preview && !parseError && (
              <button
                type="button"
                onClick={() => setShowPreview((s) => !s)}
                className="flex items-center gap-1 self-start text-xs font-medium text-primary"
              >
                {showPreview ? "Hide preview" : "View more"}
                {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            {showPreview && preview && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)]">
                <div className="flex-1 overflow-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr>
                        {preview.headers.map((h, i) => (
                          <th
                            key={i}
                            className="whitespace-nowrap border-b border-[var(--border)] px-3 py-2 text-left font-semibold text-main"
                          >
                            {h || `Column ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-row-hover">
                          {preview.headers.map((_, cIdx) => (
                            <td
                              key={cIdx}
                              className="whitespace-nowrap border-b border-[var(--border)] px-3 py-1.5 text-muted"
                            >
                              {row[cIdx] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.totalRows > MAX_PREVIEW_ROWS && (
                  <div className="border-t border-[var(--border)] bg-app px-3 py-1.5 text-center text-[11px] text-muted">
                    Showing first {MAX_PREVIEW_ROWS} of {preview.totalRows} rows
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MinimizableModal>
  );
};

export default ImportModal;