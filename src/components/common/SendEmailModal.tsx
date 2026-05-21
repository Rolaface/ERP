import React, { useCallback, useEffect, useRef, useState } from "react";
import RichTextEditor from "./TextEditor";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getContactList } from "../../api/Email/EmailApi";
import { useSendEmail } from "../../hooks/useSendEmail";
import type { AttachmentItem, UploadingAttachment, ReadyAttachment, InvoiceAttachment } from "../../hooks/useSendEmail";
import { ChevronDown, ChevronUp, Loader2, Paperclip, AlertTriangle } from "lucide-react";


interface Props {
  open: boolean;
  docType: "Sales Invoice" | "Purchase Order" | "Payment Entry";
  invoiceNumber?: string;
  contactEmail?: string | null;
  customerName?: string | null;
  supplierName?: string | null;
  invoiceAttachments?: InvoiceAttachment[];
  onClose: () => void;
}

function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

interface ToInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
}

function ToInput({ emails, onChange }: ToInputProps) {
  const [selectValue, setSelectValue] = useState("");
  const [inputKey, setInputKey] = useState(0);

  const addEmail = useCallback(
    (raw: string) => {
      const val = raw.trim();
      if (val && isValidEmail(val) && !emails.includes(val)) {
        onChange([...emails, val]);
      }
      setSelectValue("");
      setInputKey((k) => k + 1);
    },
    [emails, onChange],
  );

  const removeEmail = (idx: number) => {
    const next = [...emails];
    next.splice(idx, 1);
    onChange(next);
  };

  const fetchOptions = useCallback(
    async (q: string) => {
      try {
        const contacts = await getContactList(q);
        return contacts
          .filter((c) => !emails.includes(c.value))
          .map((c) => ({
            value: c.value,
            label: c.description ? `${c.description} <${c.value}>` : c.value,
          }));
      } catch {
        return [];
      }
    },
    [emails],
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        alignItems: "center",
        background: "var(--input-bg, #f8fafc)",
        border: "1px solid var(--input-border, #e2e8f0)",
        borderRadius: "var(--input-radius, 12px)",
        padding: "6px 10px",
        minHeight: "40px",
      }}
    >
      {emails.map((email, idx) => (
        <span
          key={`${email}-${idx}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "color-mix(in srgb, var(--primary) 12%, transparent)",
            color: "var(--text)",
            fontSize: "12px",
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: "999px",
            border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
          }}
        >
          {email}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeEmail(idx); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "var(--muted)", fontSize: "13px" }}
          >
            ×
          </button>
        </span>
      ))}
      <div style={{ flex: 1, minWidth: "160px" }}>
        <SearchSelect2
          key={inputKey}
          label=""
          value={selectValue}
          onChange={(val) => { if (val) addEmail(val); }}
          fetchOptions={fetchOptions}
          placeholder={emails.length === 0 ? "Add recipient email…" : ""}
          allowCustomInput
        />
      </div>
    </div>
  );
}

const SendEmailModal: React.FC<Props> = ({
  open,
  invoiceNumber,
  contactEmail,
  customerName,
  supplierName,
  invoiceAttachments,
  onClose,
  docType,
}) => {
  const {
    to, setTo,
    cc, setCC,
    bcc, setBCC,
    subject, setSubject,
    message, setMessage,
    sendMeCopy, setSendMeCopy,
    attachments,
    handleAddFiles,
    handleRemoveAttachment,
    sending,
    templateLoading,
    handleSend,
  } = useSendEmail({ open, docType, invoiceNumber, contactEmail, customerName, supplierName, invoiceAttachments, onClose });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // CC / BCC visibility toggle — closed by default
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Reset CC/BCC panel when modal closes
  useEffect(() => {
    if (!open) setShowCcBcc(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleAddFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  if (!open) return null;

  const s: Record<string, React.CSSProperties> = {
    backdrop: {
      position: "fixed", inset: 0,
      background: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "16px",
    },
    modal: {
      background: "var(--card, #fff)",
      borderRadius: "16px",
      boxShadow: "0 24px 80px rgba(15,23,42,0.28), 0 4px 16px rgba(15,23,42,0.1)",
      width: "100%", maxWidth: "600px", maxHeight: "90vh",
      display: "flex", flexDirection: "column", overflow: "hidden",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 20px",
      borderBottom: "1px solid var(--border, rgba(0,0,0,0.08))",
    },
    title: { fontSize: "15px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-heading, sans-serif)" },
    iconBtn: {
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "28px", height: "28px", borderRadius: "6px",
      border: "none", cursor: "pointer", background: "transparent",
      color: "var(--muted)", fontSize: "16px",
    },
    body: {
      overflowY: "auto", padding: "16px 20px",
      display: "flex", flexDirection: "column", gap: "12px", flex: 1,
    },
    fieldLabel: {
      fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "4px",
    },
    inputBase: {
      width: "100%", padding: "9px 12px",
      borderRadius: "var(--input-radius, 12px)",
      border: "1px solid var(--input-border, #e2e8f0)",
      background: "var(--input-bg, #f8fafc)",
      color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box",
    },
    checkRow: {
      display: "flex", alignItems: "center", gap: "8px",
      fontSize: "13px", color: "var(--text)", cursor: "pointer", userSelect: "none",
    },
    checkbox: { width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer" },
    attachmentChip: {
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: "color-mix(in srgb, var(--primary) 10%, transparent)",
      border: "1px solid color-mix(in srgb, var(--primary) 22%, transparent)",
      color: "var(--text)", fontSize: "12px", padding: "3px 10px", borderRadius: "999px",
    },
    addAttachBtn: {
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "12px", fontWeight: 500, color: "var(--primary)",
      border: "1px dashed color-mix(in srgb, var(--primary) 50%, transparent)",
      borderRadius: "8px", padding: "5px 12px",
      background: "color-mix(in srgb, var(--primary) 5%, transparent)", cursor: "pointer",
    },
    footer: {
      display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px",
      padding: "14px 20px", borderTop: "1px solid var(--border, rgba(0,0,0,0.08))",
    },
    btnDiscard: {
      padding: "8px 20px", borderRadius: "10px",
      border: "1px solid var(--border, rgba(0,0,0,0.12))",
      background: "transparent", color: "var(--text)", fontSize: "13px", fontWeight: 500, cursor: "pointer",
    },
    btnSend: {
      padding: "8px 24px", borderRadius: "10px", border: "none",
      background: sending ? "color-mix(in srgb, var(--primary) 60%, transparent)" : "var(--primary)",
      color: "#fff", fontSize: "13px", fontWeight: 600,
      cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1,
    },
    ccToggleBtn: {
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const,
      letterSpacing: "0.06em", color: "var(--primary)",
      background: "none", border: "none", cursor: "pointer", padding: "0",
    },
  };

  return (
    <div ref={backdropRef} style={s.backdrop} onClick={handleBackdropClick}>
      <div style={s.modal} role="dialog" aria-modal aria-label="Send Email">

        {/* ── Header ── */}
        <div style={s.header}>
          <span style={s.title}>Sales Invoice: {invoiceNumber ?? "—"}</span>
          <button type="button" style={s.iconBtn} title="Close" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={s.body}>

          {/* To + CC/BCC toggle */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={s.fieldLabel}>To</span>
              <button
                type="button"
                style={s.ccToggleBtn}
                onClick={() => setShowCcBcc((v) => !v)}
              >
                {showCcBcc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                CC/BCC
              </button>
            </div>
            <ToInput emails={to} onChange={setTo} />
          </div>

          {/* CC & BCC — toggled */}
          {showCcBcc && (
            <>
              <div>
                <div style={s.fieldLabel}>CC</div>
                <ToInput emails={cc} onChange={setCC} />
              </div>
              <div>
                <div style={s.fieldLabel}>BCC</div>
                <ToInput emails={bcc} onChange={setBCC} />
              </div>
            </>
          )}

          {/* Subject */}
          {/* Subject */}
          <div>
            <div style={s.fieldLabel}>
              Subject <span style={{ color: "var(--danger)" }}>*</span>
            </div>
            {templateLoading ? (
              <div style={{ ...s.inputBase, display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "12px" }}>
                <Loader2 size={14} className="animate-spin" />
                Loading template...
              </div>
            ) : (
              <input
                style={s.inputBase}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            )}
          </div>

          {/* Message */}
          <div>
            <div style={s.fieldLabel}>Message</div>
            {templateLoading ? (
              <div style={{
                minHeight: "120px", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px",
                border: "1px solid var(--input-border, #e2e8f0)",
                borderRadius: "var(--input-radius, 12px)",
                color: "var(--muted)", fontSize: "12px",
              }}>
                <Loader2 size={14} className="animate-spin" />
                Loading template...
              </div>
            ) : (
              <RichTextEditor
                value={message}
                onChange={setMessage}
                placeholder="Please configure an email template in Settings → Email Templates before sending."
              />
            )}
          </div>

          {/* Bottom section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>

            {/* Attachments */}
            <div>
              <div style={s.fieldLabel}>Attachments</div>
              {/* ── Auto-attached info note ── */}
              {invoiceNumber && (
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "11px",
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {docType}: {invoiceNumber} is automatically attached to this email.
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>

                {attachments.map((item, idx) => {
                  const isUploading = item.uploading === true;
                  const hasError = isUploading && !!(item as UploadingAttachment).error;

                  return (
                    <span
                      key={isUploading ? (item as UploadingAttachment).uid : (item as ReadyAttachment).name}
                      style={{
                        ...s.attachmentChip,
                        opacity: isUploading && !hasError ? 0.6 : 1,
                        border: hasError
                          ? "1px solid color-mix(in srgb, var(--danger) 40%, transparent)"
                          : s.attachmentChip.border,
                      }}
                    >
                      {/* Icon */}
                      {isUploading && !hasError ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : hasError ? (
                        <AlertTriangle size={14} />
                      ) : (
                        <Paperclip size={14} />
                      )}
                      {" "}
                      {item.file_name}
                      {/* Uploading label */}
                      {isUploading && !hasError && (
                        <span style={{ fontSize: "10px", color: "var(--muted)" }}> Uploading…</span>
                      )}
                      {/* Error label */}
                      {hasError && (
                        <span style={{ fontSize: "10px", color: "var(--danger)" }}> Failed</span>
                      )}
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(item)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "13px", padding: 0, lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                <button
                  type="button"
                  style={s.addAttachBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Add Attachment
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={s.footer}>
          <button type="button" style={s.btnDiscard} onClick={onClose} disabled={sending}>Discard</button>
          <button type="button" style={s.btnSend} onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SendEmailModal;