import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { Button } from "../ui/modal/formComponent";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import RichTextEditor from "../common/TextEditor";
import {
    createEmailTemplate,
    updateEmailTemplate,
    getEmailTemplateById,
} from "../../api/Email/EmailTemplateApi";
import type {
    EmailTemplate,
} from "../../api/Email/EmailTemplateApi";
import { ModalSelect, ModalInput } from "../ui/modal/modalComponent";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";

const DOC_TYPE_OPTIONS = [
    { label: "Sales Invoice", value: "Sales Invoice" },
    { label: "Purchase Order", value: "Purchase Order" },
    { label: "Payment Entry", value: "Payment Entry" },
    { label: "Expense Claim", value: "Expense Claim" },
    // { label: "Proforma Invoice", value: "Proforma Invoice" },
    { label: "Quotation", value: "Quotation" },
    { label: "Customer Statement", value: "Customer Statement" },
] as const;

type DocType = (typeof DOC_TYPE_OPTIONS)[number]["value"];


function getVariableChips(docType: string): { label: string; value: string; payloadValue?: string }[] {
    switch (docType) {
        case "Sales Invoice":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
            ];
        case "Purchase Order":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ supplier_name }}", value: " {{ supplier_name }} " },
            ];
        case "Payment Entry":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ party_name }}", value: " {{ party_name }} " },
            ];
        case "Expense Claim":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ employee_name }}", value: " {{ employee_name }} " },
                { label: "{{ company }}", value: " {{ company }} " },
                { label: "{{ grand_total }}", value: " {{ grand_total }} " },
                { label: "{{ expense_category }}", value: " {{ expense_category }} ", payloadValue: ' {{ expenses[0]["expense_type"] }} ' },
            ]
        case "Quotation":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ quotation_to }}", value: " {{ quotation_to }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ transaction_date }}", value: " {{ transaction_date }} " },
                { label: "{{ company }}", value: " {{ company }} " },
            ]
        case "Customer Statement":
            return [
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ PERIOD }}", value: " {{ PERIOD }} " },  
            ];
        default:
            return [];
    }
}

interface EmailTemplateForm {
    name: string;
    subject: string;
    message: string;
}

const DEFAULT_FORM: EmailTemplateForm = {
    name: "",
    subject: "",
    message: "",
};


interface EmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: EmailTemplate) => void;
    /** If provided — edit mode; if omitted — create mode */
    templateId?: string;
    modalId?: string;
    isViewMode?: boolean;
}


const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    templateId,
    modalId,
    isViewMode = false,
}) => {
    const resolvedModalId =
        modalId ||
        (templateId
            ? `email-template-edit-${templateId}-${Date.now()}`
            : `email-template-create-${Date.now()}`);

    const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

    const [form, setForm] = useState<EmailTemplateForm>(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editorReady, setEditorReady] = useState(false);

    const focusedField = useRef<"subject" | "message">("message");


    const subjectRef = useRef<HTMLInputElement>(null);

    const editorInsertRef = useRef<((text: string) => void) | null>(null);

    // ── Load template in edit mode ──

    useEffect(() => {
        if (!isOpen) return;

        if (templateId) {
            setLoading(true);
            getEmailTemplateById({ id: templateId })
                .then((data) => {
                    // Reverse map: payloadValue → display value for editor
                    const chips = getVariableChips(data.id ?? "");
                    const reverseMap = chips
                        .filter((chip) => chip.payloadValue)
                        .reduce<Record<string, string>>((acc, chip) => {
                            acc[chip.payloadValue!.trim()] = chip.value.trim();
                            return acc;
                        }, {});

                    const displayMessage = Object.entries(reverseMap).reduce(
                        (msg, [payload, display]) => msg.replaceAll(payload, display),
                        data.message ?? "",
                    );

                    setForm({
                        name: data.id ?? "",
                        subject: data.subject ?? "",
                        message: displayMessage,
                    });
                })

                .catch(showApiError)
                .finally(() => setLoading(false));
        } else {
            setForm(DEFAULT_FORM);
        }
    }, [isOpen, templateId]);

    useEffect(() => {
        if (!isOpen) {
            setEditorReady(false);
            return;
        }
        // Defer editor mount to next tick so the modal DOM is ready
        const id = requestAnimationFrame(() => setEditorReady(true));
        return () => cancelAnimationFrame(id);
    }, [isOpen]);

    // ── Chip click handler ──
    const handleChipClick = useCallback((chipValue: string) => {
        if (focusedField.current === "subject") {
            // Insert at cursor position in the subject <input>
            const input = subjectRef.current;
            if (!input) return;

            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            const newValue =
                input.value.slice(0, start) + chipValue + input.value.slice(end);

            setForm((prev) => ({ ...prev, subject: newValue }));
            markDirty();

            // Restore cursor after React re-render
            requestAnimationFrame(() => {
                input.focus();
                const cursorPos = start + chipValue.length;
                input.setSelectionRange(cursorPos, cursorPos);
            });
        } else {
            // Insert at cursor in the RichTextEditor
            editorInsertRef.current?.(chipValue);
        }
    }, [markDirty]);

    // ── Form change helpers ──
    const handleFieldChange = useCallback(
        (field: keyof EmailTemplateForm, value: string) => {
            setForm((prev) => ({ ...prev, [field]: value }));
            markDirty();
        },
        [markDirty],
    );

    // ── Reset ──
    const handleReset = useCallback(() => {
        setForm(DEFAULT_FORM);
        resetDirty();
    }, [resetDirty]);

    // ── Submit ──
    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!form.subject.trim()) {
                showApiError("Subject is required");
                return;
            }
            if (!form.message.trim() || form.message === "<p></p>") {
                showApiError("Response (message) is required");
                return;
            }

            const variableReplaceMap = getVariableChips(form.name)
                .filter((chip) => chip.payloadValue && chip.payloadValue !== chip.value)
                .reduce<Record<string, string>>((acc, chip) => {
                    acc[chip.value.trim()] = chip.payloadValue!.trim();
                    return acc;
                }, {});

            const resolvedMessage = Object.entries(variableReplaceMap).reduce(
                (msg, [display, payload]) =>
                    msg.replaceAll(display, payload),
                form.message,
            );
            try {
                setSaving(true);
                showLoading(templateId ? "Updating template..." : "Creating template...");

                let result: EmailTemplate;

                if (templateId) {
                    result = await updateEmailTemplate({
                        id: templateId,
                        subject: form.subject,
                        message: resolvedMessage,
                    });
                } else {
                    result = await createEmailTemplate({
                        template_name: form.name,
                        subject: form.subject,
                        message: resolvedMessage,
                    });
                }

                closeSwal();
                resetDirty();
                showSuccess(
                    templateId
                        ? "Email template updated successfully"
                        : "Email template created successfully",
                );
                useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.EMAIL_TEMPLATE_LIST);
                onSubmit?.(result);
                onClose();
            } catch (err) {
                closeSwal();
                showApiError(err);
            } finally {
                setSaving(false);
            }
        },
        [form, templateId, resetDirty, onSubmit, onClose],
    );

    // ── Footer ──
    const footer = useMemo(
        () => isViewMode ? (
            <Button
                variant="secondary"
                onClick={onClose}
            >
                Close
            </Button>
        ) : (
            <>
                <Button
                    variant="secondary"
                    onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
                >
                    Cancel
                </Button>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        form="emailTemplateForm"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : templateId ? "Update Template" : "Save Template"}
                    </Button>
                </div>
            </>
        ),
        [isViewMode, handleCloseWithConfirm, onClose, resolvedModalId, handleReset, saving, templateId],
    );

    return (
        <MinimizableModal
            modalId={resolvedModalId}
            isOpen={isOpen}
            onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
            title={isViewMode ? "View Email Template" : templateId ? "Edit Email Template" : "Add Email Template"}
            subtitle={isViewMode ? "Read-only view of this email template" : "Add email templates"}
            icon={Mail}
            customWidth="65vw"
            height="auto"
            footer={footer}
        >
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <span className="text-muted text-sm">Loading template...</span>
                </div>
            ) : (
                <form
                    id="emailTemplateForm"
                    onSubmit={isViewMode ? (e) => e.preventDefault() : handleSubmit}
                    onChange={() => !isViewMode && markDirty()}
                    className="flex gap-4 p-4"
                >
                    {/* ── Left: form fields ── */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">

                        {/* Name + Subject */}
                        <div className="flex gap-4">
                            <div className="w-48 shrink-0">
                                {templateId || isViewMode ? (
                                    <ModalInput
                                        label="Name"
                                        value={form.name}
                                        disabled
                                    />
                                ) : (
                                    <ModalSelect
                                        label="Name"
                                        required
                                        value={form.name}
                                        placeholder="Select template type..."
                                        onChange={(e) =>
                                            handleFieldChange("name", e.target.value as DocType)
                                        }
                                    >
                                        {DOC_TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </ModalSelect>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <ModalInput
                                    label="Subject"
                                    required
                                    type="text"
                                    ref={subjectRef}
                                    value={form.subject}
                                    onFocus={() => { focusedField.current = "subject"; }}
                                    onChange={(e) => handleFieldChange("subject", e.target.value)}
                                    placeholder="Enter email subject..."
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>

                        {/* Response (rich text) */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-main">
                                Response <span className="text-red-500">*</span>
                            </label>
                            <div onFocus={() => { focusedField.current = "message"; }}>
                                {editorReady && (
                                    <RichTextEditorWithInsert
                                        value={form.message}
                                        onChange={(html) => handleFieldChange("message", html)}
                                        onInsertRef={(fn) => { editorInsertRef.current = fn; }}
                                        minHeight={240}
                                        editable={!isViewMode}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {!isViewMode && (
                        <div
                            style={{
                                width: "140px",
                                flexShrink: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                paddingTop: "4px",
                            }}
                        >
                            <p style={{
                                fontSize: "11px", fontWeight: 600, color: "var(--muted)",
                                textTransform: "uppercase", letterSpacing: "0.05em", margin: 0,
                            }}>
                                Variables
                            </p>

                            {form.name ? (
                                <>
                                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                                        Click to insert at cursor
                                    </p>
                                    <div className="flex flex-col gap-2 mt-1">
                                        {getVariableChips(form.name).map((chip) => (
                                            <button
                                                key={chip.value}
                                                type="button"
                                                onClick={() => handleChipClick(chip.value)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: "5px 8px",
                                                    borderRadius: "6px",
                                                    border: "1px solid var(--primary, #3b82f6)",
                                                    background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                                                    color: "var(--primary)",
                                                    fontSize: "12px",
                                                    fontFamily: "monospace",
                                                    cursor: "pointer",
                                                    whiteSpace: "nowrap",
                                                    transition: "background 0.15s",
                                                    width: "100%",
                                                }}
                                                onMouseEnter={(e) => {
                                                    (e.currentTarget as HTMLButtonElement).style.background =
                                                        "color-mix(in srgb, var(--primary) 18%, transparent)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    (e.currentTarget as HTMLButtonElement).style.background =
                                                        "color-mix(in srgb, var(--primary) 8%, transparent)";
                                                }}
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                                    Select a template type to see available variables
                                </p>
                            )}
                        </div>
                    )}
                </form>
            )}
        </MinimizableModal>
    );
};



interface RichTextEditorWithInsertProps {
    value: string;
    onChange: (html: string) => void;
    onInsertRef: (fn: (text: string) => void) => void;
    minHeight?: number;
    editable?: boolean;
}


const RichTextEditorWithInsert: React.FC<RichTextEditorWithInsertProps> = ({
    value,
    onChange,
    onInsertRef,
    minHeight,
    editable = true,
}) => {
    useEffect(() => {
        const insertFn = (text: string) => {
            const editorEl = document.querySelector(
                ".rte-send-email .tiptap",
            ) as HTMLElement | null;

            if (!editorEl) return;

            editorEl.focus();


            if (document.execCommand) {
                document.execCommand("insertText", false, text);
            }
        };
        onInsertRef(insertFn);
    }, [onInsertRef]);

    return (
        <RichTextEditor
            value={value}
            onChange={onChange}
            minHeight={minHeight}
            placeholder=""
            editable={editable}
        />
    );
};

export default EmailTemplateModal;