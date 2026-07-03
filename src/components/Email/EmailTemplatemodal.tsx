import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { Button } from "../ui/modal/formComponent";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import RichTextEditor from "../common/TextEditor";
import { useEditor } from "@tiptap/react";
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

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const INVOICE_TABLE_VARIABLE = "{{ invoice_table }}";

const DOC_TYPE_OPTIONS = [
    { label: "Sales Invoice", value: "Sales Invoice" },
    { label: "Purchase Order", value: "Purchase Order" },
    { label: "Payment Entry", value: "Payment Entry" },
    { label: "Expense Claim", value: "Expense Claim" },
    { label: "Proforma Invoice", value: "Proforma Invoice" },
    { label: "Quotation", value: "Quotation" },
    { label: "Customer Statement", value: "Customer Statement" },
    { label: "Payment Reminder", value: "Payment Reminder" },
] as const;

type DocType = (typeof DOC_TYPE_OPTIONS)[number]["value"];

// ─────────────────────────────────────────────
// Variable chips per doc type
// ─────────────────────────────────────────────

function getVariableChips(docType: string): {
    label: string;
    value: string;
    payloadValue?: string;
    /** If true, this chip cannot be inserted into the subject field */
    bodyOnly?: boolean;
}[] {
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
                {
                    label: "{{ expense_category }}",
                    value: " {{ expense_category }} ",
                    payloadValue: ' {{ expenses[0]["expense_type"] }} ',
                },
            ];
        case "Quotation":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ quotation_to }}", value: " {{ quotation_to }} " },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ transaction_date }}", value: " {{ transaction_date }} " },
                { label: "{{ company }}", value: " {{ company }} " },
            ];
        case "Proforma Invoice":
            return [
                { label: "{{ name }}", value: " {{ name }} " },
                { label: "{{ proforma_to }}", value: " {{ proforma_to }} ", payloadValue: ' {{ quotation_to }} ' },
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ transaction_date }}", value: " {{ transaction_date }} " },
                { label: "{{ company }}", value: " {{ company }} " },
            ];
        case "Customer Statement":
            return [
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ PERIOD }}", value: " {{ PERIOD }} " },
            ];
        case "Payment Reminder":
            return [
                { label: "{{ customer_name }}", value: " {{ customer_name }} " },
                { label: "{{ total_outstanding }}", value: " {{ total_outstanding }} " },
                {
                    label: "{{ invoice_table }}",
                    value: ` ${INVOICE_TABLE_VARIABLE} `,
                    // bodyOnly — cannot be inserted into the subject input
                    bodyOnly: true,
                },
            ];
        default:
            return [];
    }
}

// ─────────────────────────────────────────────
// Form types
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface EmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: EmailTemplate) => void;
    /** If provided — edit mode; if omitted — create mode */
    templateId?: string;
    modalId?: string;
    isViewMode?: boolean;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

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

    /**
     * We now hold a ref to the Tiptap editor instance so we can call
     * insertVariableIntoEditor() from the chip click handler directly —
     * instead of the old execCommand fallback.
     */
    const editorInstanceRef = useRef<ReturnType<typeof useEditor> | null>(null);

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
        const id = requestAnimationFrame(() => setEditorReady(true));
        return () => cancelAnimationFrame(id);
    }, [isOpen]);

    // ── Chip click handler ──

    const handleChipClick = useCallback(
        (chipValue: string, bodyOnly?: boolean) => {
            const isInvoiceTable = chipValue.trim() === INVOICE_TABLE_VARIABLE;

            // Guard: invoice_table (and any bodyOnly chip) cannot go into subject
            if ((bodyOnly || isInvoiceTable) && focusedField.current === "subject") {
                // Silently redirect to editor instead of inserting into subject
                focusedField.current = "message";
            }

            if (focusedField.current === "subject" && !bodyOnly && !isInvoiceTable) {
                // Insert at cursor position in the subject <input>
                const input = subjectRef.current;
                if (!input) return;

                const start = input.selectionStart ?? input.value.length;
                const end = input.selectionEnd ?? input.value.length;
                const newValue =
                    input.value.slice(0, start) + chipValue + input.value.slice(end);

                setForm((prev) => ({ ...prev, subject: newValue }));
                markDirty();

                requestAnimationFrame(() => {
                    input.focus();
                    const cursorPos = start + chipValue.length;
                    input.setSelectionRange(cursorPos, cursorPos);
                });
            } else {
                // Insert as an atomic Tiptap node in the editor
                const editorInstance = editorInstanceRef.current;
                if (!editorInstance) return;

                if (isInvoiceTable) {
                    editorInstance.chain().focus().insertContent({ type: "invoiceTable" }).run();
                } else {
                    editorInstance
                        .chain()
                        .focus()
                        .insertContent({
                            type: "variable",
                            attrs: { label: chipValue.trim() },
                        })
                        .run();
                }
                markDirty();
            }
        },
        [markDirty],
    );

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
                (msg, [display, payload]) => msg.replaceAll(display, payload),
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
                useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.EMAIL_TEMP_LIST);
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
        () =>
            isViewMode ? (
                <Button variant="secondary" onClick={onClose}>
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
                            {saving ? "Saving..." : templateId ? "Update" : "Submit"}
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
            title={
                isViewMode
                    ? "View Email Template"
                    : templateId
                        ? "Edit Email Template"
                        : "Add Email Template"
            }
            subtitle={
                isViewMode
                    ? "View email template details"
                    : templateId
                        ? "Edit email template details"
                        : "Create a new email template"
            }
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
                                    onFocus={() => {
                                        focusedField.current = "subject";
                                    }}
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
                            <div
                                onFocus={() => {
                                    focusedField.current = "message";
                                }}
                            >
                                {editorReady && (
                                    <RichTextEditorWithInsert
                                        value={form.message}
                                        onChange={(html) => handleFieldChange("message", html)}
                                        onEditorReady={(editorInstance) => {
                                            editorInstanceRef.current = editorInstance;
                                        }}
                                        minHeight={240}
                                        editable={!isViewMode}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: variable chips ── */}
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
                            <p
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "var(--muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    margin: 0,
                                }}
                            >
                                Variables
                            </p>

                            {form.name ? (
                                <>
                                    <p
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--muted)",
                                            margin: 0,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        Click to insert at cursor
                                    </p>
                                    <div className="flex flex-col gap-2 mt-1">
                                        {getVariableChips(form.name).map((chip) => {
                                            const isBodyOnly = chip.bodyOnly ?? false;
                                            return (
                                                <div key={chip.value} style={{ position: "relative" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleChipClick(chip.value, chip.bodyOnly)
                                                        }
                                                        title={
                                                            isBodyOnly
                                                                ? "Can only be inserted into the message body"
                                                                : undefined
                                                        }
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            padding: "5px 8px",
                                                            borderRadius: "6px",
                                                            border: "1px solid var(--primary, #3b82f6)",
                                                            background:
                                                                "color-mix(in srgb, var(--primary) 8%, transparent)",
                                                            color: "var(--primary)",
                                                            fontSize: "12px",
                                                            fontFamily: "monospace",
                                                            cursor: "pointer",
                                                            whiteSpace: "nowrap",
                                                            transition: "background 0.15s",
                                                            width: "100%",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            (
                                                                e.currentTarget as HTMLButtonElement
                                                            ).style.background =
                                                                "color-mix(in srgb, var(--primary) 18%, transparent)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            (
                                                                e.currentTarget as HTMLButtonElement
                                                            ).style.background =
                                                                "color-mix(in srgb, var(--primary) 8%, transparent)";
                                                        }}
                                                    >
                                                        {chip.label}
                                                    </button>

                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <p
                                    style={{
                                        fontSize: "11px",
                                        color: "var(--muted)",
                                        margin: 0,
                                        lineHeight: 1.4,
                                    }}
                                >
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

// ─────────────────────────────────────────────
// RichTextEditorWithInsert
// Now exposes the Tiptap editor instance via onEditorReady instead of
// the old execCommand-based insert ref.
// ─────────────────────────────────────────────

interface RichTextEditorWithInsertProps {
    value: string;
    onChange: (html: string) => void;
    /** Called once the Tiptap editor instance is available */
    onEditorReady: (editor: ReturnType<typeof useEditor>) => void;
    minHeight?: number;
    editable?: boolean;
}

const RichTextEditorWithInsert: React.FC<RichTextEditorWithInsertProps> = ({
    value,
    onChange,
    onEditorReady,
    minHeight,
    editable = true,
}) => {
    /**
     * RichTextEditor exposes its internal editor instance via an
     * onEditorReady callback prop that we added to TextEditor.tsx.
     *
     * If you cannot add onEditorReady to RichTextEditor directly,
     * an alternative is to query the DOM for the ProseMirror instance:
     *   const pmView = document.querySelector(".rte-send-email .ProseMirror")?.__vue_app__ ...
     * — but the onEditorReady prop approach is cleaner and production-safe.
     */
    return (
        <RichTextEditor
            value={value}
            onChange={onChange}
            minHeight={minHeight}
            placeholder=""
            editable={editable}
            onEditorReady={onEditorReady}
        />
    );
};

export default EmailTemplateModal;