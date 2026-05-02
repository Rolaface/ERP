// ─── DocumentsTab.tsx ────────────────────────────────────────────────────────
import React, { useState } from "react";
import { Upload, Trash2, FileText, Plus, Eye, CheckCircle2 } from "lucide-react";
import DocumentUploadModal from "../employeedirectorymodal/DocumentModal";

type DocumentEntry = {
  uploaded: boolean;
  fileName?: string;
  fileUrl?: string;
};

type Props = {
  documents: Record<string, DocumentEntry>;
  setUploadingDoc: (doc: string | null) => void;
  removeDocument: (doc: string) => void;
};

export default function DocumentsTab({ documents, setUploadingDoc, removeDocument }: Props) {
  const [activeUpload, setActiveUpload] = useState<string | null>(null);

  const uploadedCount = Object.values(documents).filter((d) => d.uploaded).length;
  const totalCount    = Object.keys(documents).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-card rounded-lg border border-theme p-5">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-xs font-semibold text-main uppercase tracking-wide">Employee Documents</h4>
          <button
            onClick={() => { setActiveUpload("CUSTOM"); setUploadingDoc("CUSTOM"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Document
          </button>
        </div>
        <p className="text-xs text-muted">
          {uploadedCount} of {totalCount} required documents uploaded
        </p>
        {/* progress bar */}
        <div className="mt-3 h-1.5 bg-app rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(uploadedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(documents).map(([key, doc]) => (
          <div
            key={key}
            className="bg-card border border-theme rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                doc.uploaded ? "bg-emerald-50 border border-emerald-200" : "bg-app border border-theme"
              }`}>
                {doc.uploaded
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : <FileText className="w-4 h-4 text-muted" />
                }
              </div>
              <div>
                <p className="text-xs font-medium text-main">{key}</p>
                {doc.uploaded ? (
                  <p className="text-[10px] text-emerald-600 mt-0.5">{doc.fileName}</p>
                ) : (
                  <p className="text-[10px] text-muted mt-0.5">Not uploaded</p>
                )}
              </div>
            </div>

            <div className="flex gap-1">
              {doc.uploaded ? (
                <>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-muted hover:text-primary rounded-lg hover:bg-app transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => removeDocument(key)}
                    className="p-2 text-muted hover:text-danger rounded-lg hover:bg-app transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setActiveUpload(key); setUploadingDoc(key); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] border border-theme rounded-lg text-main hover:bg-app hover:border-primary hover:text-primary transition"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload modal */}
      {activeUpload && (
        <DocumentUploadModal
          onClose={() => { setActiveUpload(null); setUploadingDoc(null); }}
          onUpload={async ({ description, file }) => {
            // parent would handle actual upload; here we just mark as done
            setUploadingDoc(null);
            setActiveUpload(null);
          }}
        />
      )}
    </div>
  );
}