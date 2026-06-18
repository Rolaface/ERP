import React, { useEffect, useMemo, useRef } from "react";
import { FileText, X } from "lucide-react";
import type { PurchaseInvoiceFormData } from "../../../types/Supply/purchaseInvoice";
import { ERP_BASE } from "../../../config/api";
// const ERP_BASE ="https://api.erp.uat.rolaface.com"

interface AttachmentsTabProps {
  form: PurchaseInvoiceFormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRemoveAttachment: (idx: number) => void;
}

const resolveUrl = (rawUrl?: string) => {
  if (!rawUrl) return undefined;
  return rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
    ? rawUrl
    : `${ERP_BASE}${rawUrl}`;
};

export const AttachmentsTab = ({ form, onFormChange, onRemoveAttachment }: AttachmentsTabProps) => {
  const attachments = form.attachments ?? [];
  const objectUrlsRef = useRef<string[]>([]);

  // For newly-added File objects (not yet uploaded) create a temporary
  // blob URL so they're viewable too, same as already-uploaded files.
  const urls = useMemo(() => {
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];

    return attachments.map((f) => {
      if (f instanceof File) {
        const objUrl = URL.createObjectURL(f);
        objectUrlsRef.current.push(objUrl);
        return objUrl;
      }
      return resolveUrl((f as any).file_url ?? (f as any).url);
    });
  }, [attachments]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const getDisplayName = (f: any) =>
    f instanceof File ? f.name : f.file_name ?? f.name ?? "Attachment";

  const handleFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (!newFiles.length) return;

    const merged = [
      ...attachments,
      ...newFiles.filter((nf) => !attachments.some((ef) => getDisplayName(ef) === nf.name)),
    ];

    onFormChange({ target: { name: "attachments", value: merged } } as any);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3 h-full bg-app text-main p-2">
      <h3 className="text-[13px] font-semibold text-main">Attachments</h3>

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

      {attachments.length > 0 ? (
        <div className="w-full max-w-[300px] bg-card border border-theme rounded shadow-lg p-1 max-h-64 overflow-y-auto">
          {attachments.map((f, i) => {
            const url = urls[i];
            const displayName = getDisplayName(f);

            return (
              <div key={i} className="flex items-center gap-1 px-2 py-[3px] border-b border-theme text-[10px]">
                <FileText size={10} className="text-primary shrink-0" />
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 text-main hover:underline">
                    {displayName}
                  </a>
                ) : (
                  <span className="truncate flex-1 text-main">{displayName}</span>
                )}
               <button type="button" onClick={() => onRemoveAttachment(i)} className="text-muted hover:text-danger shrink-0">
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-muted">No attachments added yet.</p>
      )}
    </div>
  );
};