import React, { useState } from "react";
import { Upload, FileText, Eye, Download, X } from "lucide-react";
import { getFileUrl } from "../detailtab/Employeehelpers";
import { ModalInput } from "../../../../components/ui/modal/modalComponent";

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onUpload: (payload: { description: string; file: File }) => Promise<void>;
}

export const DocumentUploadModal: React.FC<UploadModalProps> = ({
  onClose,
  onUpload,
}) => {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description || !file) return;
    try {
      setLoading(true);
      await onUpload({ description, file });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-theme">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-theme">
          <h3 className="text-sm font-semibold text-main">Upload Document</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-main transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <ModalInput
            label="Document Name"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. NRC Copy, Offer Letter"
            required
          />

          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-theme rounded-lg p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition">
              <Upload className="w-5 h-5 mx-auto text-primary mb-1.5" />
              <p className="text-xs text-muted">Click to select file</p>
              <p className="text-[10px] text-muted/60 mt-0.5">
                PDF, JPG, PNG — max 5MB
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center gap-2 text-xs bg-app border border-theme rounded-lg px-3 py-2">
              <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="truncate flex-1 text-main font-medium">
                {file.name}
              </span>
              <span className="text-muted text-[10px]">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-theme bg-app rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs border border-theme rounded-lg hover:bg-app text-main transition"
          >
            Cancel
          </button>
          <button
            disabled={!description || !file || loading}
            onClick={handleSubmit}
            className="px-5 py-1.5 text-xs bg-primary text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition font-semibold"
          >
            {loading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Documents Tab ────────────────────────────────────────────────────────────

interface DocumentsTabProps {
  documents: any[];
  onOpenUploadModal: () => void;
  erpBase?: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onOpenUploadModal,
  erpBase = "",
}) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[11px] font-bold text-main uppercase tracking-wider">
        Documents
      </h3>
      <button
        onClick={onOpenUploadModal}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
      >
        <Upload className="w-3 h-3" />
        Upload
      </button>
    </div>

    {documents && documents.length > 0 ? (
      <div className="space-y-2">
        {documents.map((doc: any) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border border-theme rounded-lg hover:bg-app transition"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-main truncate">
                  {doc.document_name}
                </p>
                <p className="text-[10px] text-muted">
                  {doc.file_type || "Document"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3">
              {doc.file_url ? (
                <>
                  <button
                    onClick={() =>
                      window.open(getFileUrl(doc.file_url, erpBase)!, "_blank")
                    }
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={getFileUrl(doc.file_url, erpBase)!}
                    download
                    className="p-1.5 text-muted hover:text-main hover:bg-app rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </>
              ) : (
                <span className="text-[10px] text-muted italic">No file</span>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-14">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/5 flex items-center justify-center">
          <FileText className="w-7 h-7 text-muted/30" />
        </div>
        <p className="text-xs font-semibold text-muted mb-1">
          No documents yet
        </p>
        <p className="text-[10px] text-muted/60">
          Click Upload to attach files
        </p>
      </div>
    )}
  </div>
);
