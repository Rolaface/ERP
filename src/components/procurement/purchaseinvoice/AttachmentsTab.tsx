import React from "react";
import { FileText, X } from "lucide-react";
import type { PurchaseInvoiceFormData } from "../../../types/Supply/purchaseInvoice";

interface AttachmentsTabProps {
  form: PurchaseInvoiceFormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const AttachmentsTab = ({ form, onFormChange }: AttachmentsTabProps) => {
  const handleFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (!newFiles.length) return;

    const existing = form.attachments ?? [];

    const merged = [
      ...existing,
      ...newFiles.filter(
        (nf) => !existing.some((ef) => ef.name === nf.name)
      ),
    ];

    onFormChange({
      target: { name: "attachments", value: merged },
    } as any);

    e.target.value = "";
  };

  const handleRemoveFile = (idx: number) => {
    const updated = (form.attachments ?? []).filter((_, i) => i !== idx);
    onFormChange({
      target: { name: "attachments", value: updated },
    } as any);
  };

  return (
    <div className="flex flex-col gap-3 h-full bg-app text-main p-2">
      <h3 className="text-[13px] font-semibold text-main">Attachments</h3>

      {/* Upload button */}
      <div className="w-[160px]">
        <label className="flex items-center gap-1 px-2 py-[5px] border border-theme rounded cursor-pointer text-[10px] bg-card hover:border-primary/40 transition">
          <FileText size={12} className="text-primary" />
          Add Attachment

          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFilesAdd}
          />
        </label>
      </div>

      {/* File list */}
      {form.attachments?.length > 0 && (
        <div className="w-full max-w-[300px] bg-card border border-theme rounded shadow-lg p-1 max-h-64 overflow-y-auto">
          {form.attachments.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2 py-[3px] border-b border-theme text-[10px]"
            >
              <FileText size={10} className="text-primary shrink-0" />

              <span className="truncate flex-1 text-main">{f.name}</span>

              <button
                type="button"
                onClick={() => handleRemoveFile(i)}
                className="text-muted hover:text-danger shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

{form.attachments?.map((f, i) => {
  const isFile = f instanceof File;
  const name = isFile ? f.name : f.name;
  const url = isFile ? undefined : f.url;

  return (
    <div key={i} className="flex items-center gap-1 px-2 py-[3px] border-b border-theme text-[10px]">
      <FileText size={10} className="text-primary shrink-0" />
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 text-main hover:underline">
          {name}
        </a>
      ) : (
        <span className="truncate flex-1 text-main">{name}</span>
      )}
      <button type="button" onClick={() => handleRemoveFile(i)} className="text-muted hover:text-danger shrink-0">
        <X size={10} />
      </button>
    </div>
  );
})}
      {form.attachments?.length === 0 && (
        <p className="text-[11px] text-muted">No attachments added yet.</p>
      )}
    </div>
  );
};