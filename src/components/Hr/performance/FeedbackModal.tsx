import React, { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import ModalFooter from "../../common/ModalFooter";
import { ModalInput } from "../../ui/modal/modalComponent";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { useDataRefreshStore, REFRESH_KEYS } from "../../../store/dataRefreshStore";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../../utils/alert";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getEmployees } from "../../../api/utils/frappeUtilsApi";
import RichTextEditor from "../../common/TextEditor";
import type { ModalSubmitHandler } from "../../../types/modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedbackFormData {
    for_employee: string;
    reviewer: string;
    company: string;
    feedback: string;
    feedback_ratings: any[];
}

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: ModalSubmitHandler;
    initialData?: any;
    mode?: "create" | "edit";
    modalId?: string;
}

type TabId = "employeeDetails" | "feedback";

const TABS: { id: TabId; label: string }[] = [
    { id: "employeeDetails", label: "Employee Details" },
    { id: "feedback", label: "Feedback" },
];

// ─── Default state ────────────────────────────────────────────────────────────

const defaultForm = (): FeedbackFormData => ({
    for_employee: "",
    reviewer: "",
    company: "",
    feedback: "",
    feedback_ratings: [],
});

// ─── Component ────────────────────────────────────────────────────────────────

const FeedbackModal: React.FC<FeedbackModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode = "create",
    modalId,
}) => {
    const resolvedModalId =
        modalId ||
        (mode === "edit" && initialData?.name
            ? `feedback-edit-${initialData.name}-${Date.now()}`
            : `feedback-create-${Date.now()}`);

    const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

    const [activeTab, setActiveTab] = useState<TabId>("employeeDetails");
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] =
        useState<FeedbackFormData>(defaultForm());

    // ── Auto-set added_on display ─────────────────────────────────────────────
    const addedOn = new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
    });

    // ── Reset on open ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setActiveTab("employeeDetails");
            if (mode === "edit" && initialData) {
                setFormData({
                    for_employee: initialData.for_employee ?? "",
                    reviewer: initialData.reviewer ?? "",
                    company: initialData.company ?? "",
                    feedback: initialData.feedback ?? "",
                    feedback_ratings: initialData.feedback_ratings ?? [],
                });
            } else {
                setFormData(defaultForm());
            }
            resetDirty();
        }
    }, [isOpen, mode, initialData]);

    const set = (field: keyof FeedbackFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        markDirty();
    };

    // ── Employee fetch ────────────────────────────────────────────────────────
    const fetchEmployees = async (q: string) => {
        const data = await getEmployees(q);
        return data.map((e: any) => ({
            label: `${e.name} — ${e.employee_name ?? ""}`,
            value: e.name,
            meta: e,
        }));
    };

    // ── Validate ──────────────────────────────────────────────────────────────
    const validate = (): string | null => {
        if (!formData.for_employee) return "For Employee is required";
        if (!formData.reviewer) return "Reviewer is required";
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmitForm = async () => {
        if (submitting) return;
        const err = validate();
        if (err) { showApiError(err); return; }

        setSubmitting(true);
        try {
            showLoading("Saving feedback...");

            if (onSubmit) {
                await onSubmit(formData);
            }

            closeSwal();
            showSuccess("Feedback saved successfully");
            resetDirty();
            onClose();
            useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.FEEDBACK_LIST);
        } catch (err: any) {
            closeSwal();
            // Show friendly message while API is not wired
            showApiError(
                err?.message?.includes("not yet wired")
                    ? "Feedback API is not yet available. Please wire the endpoint."
                    : err,
            );
        } finally {
            setSubmitting(false);
        }
    };

    const tabIndex = TABS.findIndex((t) => t.id === activeTab);
    const handleNext = () => {
        if (tabIndex < TABS.length - 1) setActiveTab(TABS[tabIndex + 1].id);
    };

    const footerContent = (
        <ModalFooter
            onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
            onReset={() => { resetDirty(); setFormData(defaultForm()); }}
            onSubmit={handleSubmitForm}
            onNext={handleNext}
            currentTab={tabIndex}
            totalTabs={TABS.length}
            saving={submitting}
        />
    );

    return (
        <MinimizableModal
            modalId={resolvedModalId}
            isOpen={isOpen}
            onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
            title={mode === "edit" ? "Edit Feedback" : "New Employee Performance Feedback"}
            subtitle="Record employee performance feedback"
            icon={MessageSquare}
            footer={footerContent}
            customWidth="50vw"
            height="72vh"
        >
            <form
                id="feedbackForm"
                className="h-full flex flex-col"
                autoComplete="off"
                onChange={() => markDirty()}
            >
                {/* ── Tabs ── */}
                <div className="bg-app border-b border-theme px-8 shrink-0">
                    <div className="flex gap-8">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all
                  ${activeTab === tab.id
                                        ? "text-primary border-b-[3px] border-primary"
                                        : "text-muted border-b-[3px] border-transparent hover:text-main"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <div className="overflow-y-auto px-6 py-4 flex-1">

                    {/* ── EMPLOYEE DETAILS ── */}
                    {activeTab === "employeeDetails" && (
                        <div className="flex flex-col gap-4 max-w-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                {/* For Employee */}
                                <SearchSelect2
                                    label="For Employee *"
                                    value={formData.for_employee}
                                    onChange={(_, option) =>
                                        set("for_employee", option?.value ?? "")
                                    }
                                    fetchOptions={fetchEmployees}
                                    placeholder="Search employee..."
                                />

                                {/* Reviewer */}
                                <SearchSelect2
                                    label="Reviewer *"
                                    value={formData.reviewer}
                                    onChange={(_, option) =>
                                        set("reviewer", option?.value ?? "")
                                    }
                                    fetchOptions={fetchEmployees}
                                    placeholder="Search reviewer..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Added On — read only, auto */}
                                <ModalInput
                                    label="Added On"
                                    name="added_on"
                                    value={addedOn}
                                    onChange={() => { }}
                                    disabled
                                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                                />

                              
                            </div>
                        </div>
                    )}

                    {/* ── FEEDBACK ── */}
                    {activeTab === "feedback" && (
                        <div className="flex flex-col gap-4 max-w-3xl">
                            <div>
                                <p className="text-xs font-semibold text-main mb-1">Feedback</p>
                                <RichTextEditor
                                    value={formData.feedback}
                                    onChange={(value) => set("feedback", value)}
                                    placeholder="Enter feedback..."
                                    minHeight={220}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </MinimizableModal>
    );
};

export default FeedbackModal;