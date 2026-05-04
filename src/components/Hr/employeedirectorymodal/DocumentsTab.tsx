import React, { useState } from "react";
import {
  FaUpload,
  FaTrash,
  FaFile,
  FaPlus,
  FaEye,
  FaCheckCircle,
} from "react-icons/fa";
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
  const progress      = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-3">

      {/* Header */}
      <div className="bg-card rounded-lg border border-theme p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-[10px] font-semibold text-main uppercase tracking-wider">
              Employee Documents
            </h4>
            <p className="text-[10px] text-muted mt-0.5">
              {uploadedCount} of {totalCount} required documents uploaded
            </p>
          </div>
          <button
            onClick={() => { setActiveUpload("CUSTOM"); setUploadingDoc("CUSTOM"); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white text-[10px] rounded-lg hover:opacity-90 transition"
          >
            <FaPlus className="w-2.5 h-2.5" />
            Add Document
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-app rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(documents).map(([key, doc]) => (
          <div
            key={key}
            className={`bg-card border rounded-lg px-3 py-2.5 flex items-center justify-between transition ${
              doc.uploaded ? "border-emerald-200" : "border-theme"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                  doc.uploaded
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-app border border-theme"
                }`}
              >
                {doc.uploaded
                  ? <FaCheckCircle className="w-4 h-4 text-emerald-600" />
                  : <FaFile className="w-4 h-4 text-muted" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-main truncate">{key}</p>
                {doc.uploaded ? (
                  <p className="text-[10px] text-emerald-600 truncate">{doc.fileName}</p>
                ) : (
                  <p className="text-[10px] text-muted">Not uploaded</p>
                )}
              </div>
            </div>

            <div className="flex gap-1 flex-shrink-0 ml-2">
              {doc.uploaded ? (
                <>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-muted hover:text-primary rounded hover:bg-app transition"
                      title="View"
                    >
                      <FaEye className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => removeDocument(key)}
                    className="p-1.5 text-muted hover:text-danger rounded hover:bg-app transition"
                    title="Remove"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setActiveUpload(key); setUploadingDoc(key); }}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] border border-theme rounded text-main hover:border-primary hover:text-primary hover:bg-primary/5 transition"
                >
                  <FaUpload className="w-2.5 h-2.5" />
                  Upload
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {activeUpload && (
        <DocumentUploadModal
          isOpen={activeUpload !== null}
          onClose={() => { setActiveUpload(null); setUploadingDoc(null); }}
          onUpload={async () => {
            setUploadingDoc(null);
            setActiveUpload(null);
          }}
        />
      )}
    </div>
  );
}