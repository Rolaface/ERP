import { useCallback, useEffect, useState } from "react";
import { sendEmail, uploadFile, removeAttachment, makeEmailTemplate } from "../api/Email/EmailApi";
import type { UploadedAttachment, MakeEmailTemplateParams } from "../api/Email/EmailApi";
import { showApiError, showSuccess } from "../utils/alert";
import { fireManagedSwal } from "../utils/swalManager";

// Represents an attachment that is ready to send (already uploaded or pre-loaded)
export interface ReadyAttachment {
    name: string;
    file_name: string;
    uploading?: false;
}

// Represents a file currently being uploaded
export interface UploadingAttachment {
    uid: string;
    file_name: string;
    uploading: true;
    error?: string;
}

export type AttachmentItem = ReadyAttachment | UploadingAttachment;

export interface InvoiceAttachment {
    name: string;
    file_name: string;
}

interface UseSendEmailOptions {
    open: boolean;
    docType: "Sales Invoice" | "Purchase Order" | "Payment Entry";
    invoiceNumber?: string;
    contactEmail?: string | null;
    customerName?: string | null;
    supplierName?: string | null;
    invoiceAttachments?: InvoiceAttachment[];
    onClose: () => void;
}

interface UseSendEmailReturn {
    to: string[];
    setTo: (emails: string[]) => void;
    subject: string;
    setSubject: (v: string) => void;
    message: string;
    setMessage: (v: string) => void;
    sendMeCopy: boolean;
    setSendMeCopy: (v: boolean) => void;
    cc: string[];
    setCC: (emails: string[]) => void;
    bcc: string[];
    setBCC: (emails: string[]) => void;
    attachments: AttachmentItem[];
    handleAddFiles: (files: File[]) => void;
    handleRemoveAttachment: (item: AttachmentItem) => Promise<void>;
    sending: boolean;
    templateLoading: boolean;
    error: string | null;
    handleSend: () => Promise<void>;
}

const PLACEHOLDER_MESSAGE =
    "<p>Please configure an email template in <strong>Settings → Email Templates</strong> before sending.</p>";

export function useSendEmail({
    open,
    docType,
    invoiceNumber,
    contactEmail,
    invoiceAttachments,
    onClose,
    customerName,
    supplierName,
}: UseSendEmailOptions): UseSendEmailReturn {
    const [to, setTo] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sendMeCopy, setSendMeCopy] = useState(false);
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [sending, setSending] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cc, setCC] = useState<string[]>([]);
    const [bcc, setBCC] = useState<string[]>([]);

    /* ── Reset form + fetch template on open ── */
    useEffect(() => {
        if (!open) return;

        const isEmail = (v?: string | null) =>
            !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

        setTo(isEmail(contactEmail) ? [contactEmail!.trim()] : []);
        setCC([]);
        setBCC([]);
        setSubject("");
        setMessage("");
        setSendMeCopy(false);
        setError(null);

        // Pre-load attachments from invoice/PO
        const preLoaded: ReadyAttachment[] = (invoiceAttachments ?? []).map(
            (a) => ({ name: a.name, file_name: a.file_name }),
        );
        setAttachments(preLoaded);

        // Fetch email template — requires invoiceNumber (doc_type_name)
        if (!invoiceNumber) {
            setSubject("");
            setMessage(PLACEHOLDER_MESSAGE);
            return;
        }

        setTemplateLoading(true);
        makeEmailTemplate({
            id: docType,           
            doc_type: docType,     
            doc_type_name: invoiceNumber, 
        })
            .then((result) => {
                setSubject(result.subject ?? "");
                setMessage(result.message ?? PLACEHOLDER_MESSAGE);
            })
            .catch(() => {
                // Non-critical: fall back to placeholder
                setSubject("");
                setMessage(PLACEHOLDER_MESSAGE);
            })
            .finally(() => {
                setTemplateLoading(false);
            });

    }, [open, invoiceNumber, contactEmail, invoiceAttachments, docType]);

    /* ── Add files ── */
    const handleAddFiles = useCallback(
        (files: File[]) => {
            if (!invoiceNumber) return;

            files.forEach((file) => {
                const uid = `${Date.now()}-${Math.random()}`;

                const placeholder: UploadingAttachment = {
                    uid,
                    file_name: file.name,
                    uploading: true,
                };
                setAttachments((prev) => [...prev, placeholder]);

                uploadFile(file, invoiceNumber , docType)
                    .then((uploaded: UploadedAttachment) => {
                        setAttachments((prev) =>
                            prev.map((a) =>
                                "uid" in a && a.uid === uid
                                    ? ({ name: uploaded.name, file_name: uploaded.file_name } as ReadyAttachment)
                                    : a,
                            ),
                        );
                    })
                    .catch(() => {
                        setAttachments((prev) =>
                            prev.map((a) =>
                                "uid" in a && a.uid === uid
                                    ? ({ ...a, error: "Upload failed" } as UploadingAttachment)
                                    : a,
                            ),
                        );
                    });
            });
        },
        [invoiceNumber],
    );

    /* ── Remove attachment ── */
    const handleRemoveAttachment = useCallback(
        async (item: AttachmentItem) => {
            if (!invoiceNumber) return;

            const result = await fireManagedSwal({
                icon: "warning",
                title: "Remove Attachment?",
                text: `Remove "${item.file_name}" from this invoice?`,
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Yes, remove",
                cancelButtonText: "Cancel",
                reverseButtons: true,
            });

            if (!result.isConfirmed) return;

            if (item.uploading) {
                setAttachments((prev) =>
                    prev.filter(
                        (a) =>
                            !("uid" in a) ||
                            (a as UploadingAttachment).uid !== item.uid,
                    ),
                );
                return;
            }

            const ready = item as ReadyAttachment;
            try {
                await removeAttachment(ready.name, invoiceNumber,docType);
                setAttachments((prev) =>
                    prev.filter((a) => {
                        if (a.uploading) return true;
                        return (a as ReadyAttachment).name !== ready.name;
                    }),
                );
            } catch (err) {
                showApiError(err);
            }
        },
        [invoiceNumber],
    );

    /* ── Send ── */
    const handleSend = useCallback(async () => {
        setError(null);

        if (to.length === 0) {
            setError("Please add at least one recipient.");
            return;
        }
        if (!subject.trim()) {
            setError("Subject is required.");
            return;
        }
        if (!invoiceNumber) {
            setError("Document number is missing.");
            return;
        }

        const attachmentNames = attachments
            .filter((a): a is ReadyAttachment => !a.uploading)
            .map((a) => a.name);

        setSending(true);
        try {
            await sendEmail({
                recipients: to.join(","),
                name: invoiceNumber,
                content: message,
                subject,
                send_me_a_copy: sendMeCopy ? "1" : "0",
                cc: cc.length > 0 ? cc.join(",") : undefined,
                bcc: bcc.length > 0 ? bcc.join(",") : undefined,
                attachmentNames,
                 doctype: docType,   
            });

            showSuccess("Email sent successfully!");
            onClose();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ??
                err?.message ??
                "Failed to send email. Please try again.";
            setError(msg);
            showApiError(err);
        } finally {
            setSending(false);
        }
    }, [to, subject, invoiceNumber, message, sendMeCopy, cc, bcc, attachments, onClose]);

    return {
        to, setTo,
        subject, setSubject,
        message, setMessage,
        sendMeCopy, setSendMeCopy,
        cc, setCC,
        bcc, setBCC,
        attachments,
        handleAddFiles,
        handleRemoveAttachment,
        sending,
        templateLoading,
        error,
        handleSend,
    };
}