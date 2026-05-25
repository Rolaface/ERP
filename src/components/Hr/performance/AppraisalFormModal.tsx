import React, { useState, useEffect, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import ModalFooter from "../../common/ModalFooter";
import { ModalInput } from "../../ui/modal/modalComponent";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { showApiError } from "../../../utils/alert";
import SearchSelect2 from "../../ui/modal/SearchSelect2";
import { getEmployees } from "../../../api/utils/frappeUtilsApi";
import { getCycleList } from "../../../api/Appraisalapi/performanceCycleApi";
import { getTemplateList } from "../../../api/Appraisalapi/templeteApi";
import { getKRAList } from "../../../api/Appraisalapi/kraApi";
import RichTextEditor from "../../common/TextEditor";
import type { ModalSubmitHandler } from "../../../types/modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler;
  initialData?: any;
  mode?: "create" | "edit";
  modalId?: string;
}

type TabId = "overview" | "kras" | "feedback" | "selfAppraisal";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview",      label: "Overview"       },
  { id: "kras",          label: "KRAs"           },
  { id: "feedback",      label: "Feedback"       },
  { id: "selfAppraisal", label: "Self Appraisal" },
];

const KRA_PAGE_SIZE = 5;

// ─── KRA row type ─────────────────────────────────────────────────────────────

interface KRARow {
  kra: string;           // selected KRA name/id
  kraLabel: string;      // display label
  weightage: number;
  goal_completion: number;
  goal_score: number;
}

// ─── Criteria row type ────────────────────────────────────────────────────────

interface CriteriaRow {
  criteria: string;      // selected criteria value
  criteriaLabel: string; // display label
  weightage: number;
}

// ─── Default form state ───────────────────────────────────────────────────────

interface AppraisalForm {
  company: string;
  employee: string;
  appraisal_cycle: string;
  appraisal_template: string;
  rate_goals_manually: number;
  kra_vs_goals: KRARow[];
  self_appraisal: string;
  self_goals: string;
  strengths: string;
  areas_of_improvement: string;
  overall_feedback: string;
  criteria_ratings: CriteriaRow[];
}

const emptyKRARow = (): KRARow => ({
  kra: "",
  kraLabel: "",
  weightage: 0,
  goal_completion: 0,
  goal_score: 0,
});

const emptyCriteriaRow = (): CriteriaRow => ({
  criteria: "",
  criteriaLabel: "",
  weightage: 0,
});

const defaultForm = (): AppraisalForm => ({
  company:              "",
  employee:             "",
  appraisal_cycle:      "",
  appraisal_template:   "",
  rate_goals_manually:  0,
  kra_vs_goals:         [emptyKRARow()],  // one pre-added empty row
  self_appraisal:       "",
  self_goals:           "",
  strengths:            "",
  areas_of_improvement: "",
  overall_feedback:     "",
  criteria_ratings:     [emptyCriteriaRow()], // one pre-added empty row
});

// ─── Component ────────────────────────────────────────────────────────────────

const AppraisalModal: React.FC<AppraisalModalProps> = ({
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
      ? `appraisal-edit-${initialData.name}-${Date.now()}`
      : `appraisal-create-${Date.now()}`);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData]     = useState<AppraisalForm>(defaultForm());

  // KRA pagination (frontend slice)
  const [kraPage, setKraPage] = useState(0);

  // ── Reset form when modal opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setKraPage(0);
      if (mode === "edit" && initialData) {
        setFormData({
          company:              initialData.company              ?? "",
          employee:             initialData.employee             ?? "",
          appraisal_cycle:      initialData.appraisal_cycle      ?? "",
          appraisal_template:   initialData.appraisal_template   ?? "",
          rate_goals_manually:  initialData.rate_goals_manually  ?? 0,
          kra_vs_goals:         initialData.kra_vs_goals?.length
            ? initialData.kra_vs_goals.map((r: any) => ({
                kra: r.kra ?? "",
                kraLabel: r.kraLabel ?? r.kra ?? "",
                weightage: r.weightage ?? 0,
                goal_completion: r.goal_completion ?? 0,
                goal_score: r.goal_score ?? 0,
              }))
            : [emptyKRARow()],
          self_appraisal:       initialData.self_appraisal       ?? "",
          self_goals:           initialData.self_goals           ?? "",
          strengths:            initialData.strengths            ?? "",
          areas_of_improvement: initialData.areas_of_improvement ?? "",
          overall_feedback:     initialData.overall_feedback     ?? "",
          criteria_ratings:     initialData.criteria_ratings?.length
            ? initialData.criteria_ratings.map((r: any) => ({
                criteria: r.criteria ?? "",
                criteriaLabel: r.criteriaLabel ?? r.criteria ?? "",
                weightage: r.weightage ?? 0,
              }))
            : [emptyCriteriaRow()],
        });
      } else {
        setFormData(defaultForm());
      }
      resetDirty();
    }
  }, [isOpen, mode, initialData]);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set = (field: keyof AppraisalForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  // ── KRA helpers ───────────────────────────────────────────────────────────
  const addKRARow = () => {
    setFormData((prev) => ({
      ...prev,
      kra_vs_goals: [...prev.kra_vs_goals, emptyKRARow()],
    }));
    // Jump to last page after add
    setKraPage(
      Math.floor(formData.kra_vs_goals.length / KRA_PAGE_SIZE),
    );
    markDirty();
  };

  const updateKRARow = (
    absoluteIdx: number,
    field: keyof KRARow,
    value: any,
  ) => {
    setFormData((prev) => {
      const rows = [...prev.kra_vs_goals];
      rows[absoluteIdx] = { ...rows[absoluteIdx], [field]: value };
      // Auto-compute goal_score
      const w = field === "weightage" ? Number(value) : Number(rows[absoluteIdx].weightage);
      const gc = field === "goal_completion" ? Number(value) : Number(rows[absoluteIdx].goal_completion);
      rows[absoluteIdx].goal_score = (w * gc) / 100;
      return { ...prev, kra_vs_goals: rows };
    });
    markDirty();
  };

  const removeKRARow = (absoluteIdx: number) => {
    setFormData((prev) => {
      const rows = prev.kra_vs_goals.filter((_, i) => i !== absoluteIdx);
      // Keep at least one empty row
      const finalRows = rows.length === 0 ? [emptyKRARow()] : rows;
      return { ...prev, kra_vs_goals: finalRows };
    });
    // Adjust page if needed
    setKraPage((p) => {
      const newTotal = Math.max(1, formData.kra_vs_goals.length - 1);
      const maxPage = Math.max(0, Math.ceil(newTotal / KRA_PAGE_SIZE) - 1);
      return Math.min(p, maxPage);
    });
    markDirty();
  };

  // ── Criteria helpers ──────────────────────────────────────────────────────
  const addCriteriaRow = () => {
    setFormData((prev) => ({
      ...prev,
      criteria_ratings: [...prev.criteria_ratings, emptyCriteriaRow()],
    }));
    markDirty();
  };

  const updateCriteriaRow = (
    idx: number,
    field: keyof CriteriaRow,
    value: any,
  ) => {
    setFormData((prev) => {
      const rows = [...prev.criteria_ratings];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, criteria_ratings: rows };
    });
    markDirty();
  };

  const removeCriteriaRow = (idx: number) => {
    setFormData((prev) => {
      const rows = prev.criteria_ratings.filter((_, i) => i !== idx);
      return { ...prev, criteria_ratings: rows.length === 0 ? [emptyCriteriaRow()] : rows };
    });
    markDirty();
  };

  // ── Fetch helpers for SearchSelect2 ───────────────────────────────────────
  const fetchEmployees = async (q: string) => {
    const data = await getEmployees(q);
    return data.map((e: any) => ({
      label: `${e.name} — ${e.employee_name ?? ""}`,
      value: e.name,
      meta:  e,
    }));
  };

  const fetchCycles = async (q: string) => {
    const res = await getCycleList({ search: q, pageSize: 20 });
    return res.data.map((c) => ({
      label: c.cycle_name,
      value: c.name,
      meta:  c,
    }));
  };

  const fetchTemplates = async (q: string) => {
    const res = await getTemplateList({ search: q, pageSize: 20 });
    return res.data.map((t) => ({
      label: t.template_title,
      value: t.name,
      meta:  t,
    }));
  };

  const fetchKRAs = useCallback(async (q: string) => {
    const res = await getKRAList({ search: q, pageSize: 20 });
    return res.data.map((k) => ({
      label: k.title,
      value: k.name,
      meta:  k,
    }));
  }, []);

  const fetchCriteria = useCallback(async (q: string) => {
    const res = await getFeedbackList({ search: q, pageSize: 20 });
    return res.data.map((c) => ({
      label: c.criteria,
      value: c.criteria,
      meta:  c,
    }));
  }, []);

  // ── Submit — no API, just close ───────────────────────────────────────────
  const handleSubmitForm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      resetDirty();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // ── Tab navigation ────────────────────────────────────────────────────────
  const tabIndex   = TABS.findIndex((t) => t.id === activeTab);
  const handleNext = () => {
    if (tabIndex < TABS.length - 1) setActiveTab(TABS[tabIndex + 1].id);
  };

  // ── KRA pagination derived values ─────────────────────────────────────────
  const kraTotal     = formData.kra_vs_goals.length;
  const kraMaxPage   = Math.max(0, Math.ceil(kraTotal / KRA_PAGE_SIZE) - 1);
  const kraPageSafe  = Math.min(kraPage, kraMaxPage);
  const kraPagedRows = formData.kra_vs_goals.slice(
    kraPageSafe * KRA_PAGE_SIZE,
    (kraPageSafe + 1) * KRA_PAGE_SIZE,
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerContent = (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={() => { resetDirty(); setFormData(defaultForm()); setKraPage(0); }}
      onSubmit={handleSubmitForm}
      onNext={handleNext}
      currentTab={tabIndex}
      totalTabs={TABS.length}
      saving={submitting}
    />
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={mode === "edit" ? "Edit Appraisal" : "New Appraisal"}
      subtitle="Manage employee performance appraisal"
      icon={ClipboardList}
      footer={footerContent}
      maxWidth="4xl"
      height="78vh"
    >
      <form
        id="appraisalForm"
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

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <SearchSelect2
                  label="Employee *"
                  value={formData.employee}
                  onChange={(_, option) => set("employee", option?.value ?? "")}
                  fetchOptions={fetchEmployees}
                  placeholder="Search employee..."
                />
                <SearchSelect2
                  label="Appraisal Cycle *"
                  value={formData.appraisal_cycle}
                  onChange={(_, option) => set("appraisal_cycle", option?.value ?? "")}
                  fetchOptions={fetchCycles}
                  placeholder="Search cycle..."
                />
              </div>
            </div>
          )}

          {/* ── KRAs ── */}
          {activeTab === "kras" && (
            <div className="flex flex-col gap-4 max-w-4xl">
              {/* Appraisal Template */}
              <div className="max-w-xs">
                <SearchSelect2
                  label="Appraisal Template"
                  value={formData.appraisal_template ?? ""}
                  onChange={(_, option) =>
                    set("appraisal_template", option?.value ?? "")
                  }
                  fetchOptions={fetchTemplates}
                  placeholder="Search template..."
                />
              </div>

              {/* Rate Goals Manually */}
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={!!formData.rate_goals_manually}
                  onChange={(e) =>
                    set("rate_goals_manually", e.target.checked ? 1 : 0)
                  }
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs text-main">Rate Goals Manually</span>
              </label>

              {/* KRA vs Goals table */}
              <div>
                <p className="text-xs font-semibold text-main mb-2">KRA vs Goals</p>
                <div className="border border-theme rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--border)]/10 border-b border-theme">
                        <th className="px-3 py-2 text-left font-bold text-muted uppercase tracking-wide w-8">No.</th>
                        <th className="px-3 py-2 text-left font-bold text-muted uppercase tracking-wide">KRA *</th>
                        <th className="px-3 py-2 text-center font-bold text-muted uppercase tracking-wide w-32">Weightage (%)</th>
                        <th className="px-3 py-2 text-center font-bold text-muted uppercase tracking-wide w-36">Goal Completion (%)</th>
                        <th className="px-3 py-2 text-center font-bold text-muted uppercase tracking-wide w-32">Goal Score (weighted)</th>
                        <th className="px-3 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {kraPagedRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-muted">
                            No KRA rows added. Click "+ Add row" to begin.
                          </td>
                        </tr>
                      ) : (
                        kraPagedRows.map((row, pageIdx) => {
                          const absoluteIdx = kraPageSafe * KRA_PAGE_SIZE + pageIdx;
                          return (
                            <tr
                              key={absoluteIdx}
                              className="border-b border-theme/30 hover:bg-row-hover transition-colors"
                            >
                              <td className="px-3 py-2 text-muted">
                                {absoluteIdx + 1}
                              </td>
                              <td className="px-3 py-2 min-w-[200px]">
                                <SearchSelect2
                                  label=""
                                  value={row.kraLabel}
                                  onChange={(_, option) => {
                                    updateKRARow(absoluteIdx, "kra", option?.value ?? "");
                                    updateKRARow(absoluteIdx, "kraLabel", option?.label ?? "");
                                  }}
                                  fetchOptions={fetchKRAs}
                                  placeholder="Search KRA..."
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={row.weightage}
                                  onChange={(e) =>
                                    updateKRARow(absoluteIdx, "weightage", Number(e.target.value))
                                  }
                                  className="w-full bg-transparent border-b border-theme text-[11px] text-main outline-none focus:border-primary py-0.5 text-right"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={row.goal_completion}
                                  onChange={(e) =>
                                    updateKRARow(absoluteIdx, "goal_completion", Number(e.target.value))
                                  }
                                  className="w-full bg-transparent border-b border-theme text-[11px] text-main outline-none focus:border-primary py-0.5 text-right"
                                />
                              </td>
                              <td className="px-3 py-2 text-center text-main font-medium">
                                {((row.weightage * row.goal_completion) / 100).toFixed(2)}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeKRARow(absoluteIdx)}
                                  className="text-danger hover:text-danger/80 text-xs font-bold"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Add row + Pagination */}
                  <div className="px-3 py-2 border-t border-theme/30 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={addKRARow}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      + Add row
                    </button>

                    {kraTotal > KRA_PAGE_SIZE && (
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span>
                          {kraPageSafe * KRA_PAGE_SIZE + 1}–
                          {Math.min((kraPageSafe + 1) * KRA_PAGE_SIZE, kraTotal)} of {kraTotal}
                        </span>
                        <button
                          type="button"
                          disabled={kraPageSafe === 0}
                          onClick={() => setKraPage((p) => Math.max(0, p - 1))}
                          className="px-2 py-0.5 border border-theme rounded text-xs disabled:opacity-40 hover:bg-row-hover transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={kraPageSafe >= kraMaxPage}
                          onClick={() => setKraPage((p) => Math.min(kraMaxPage, p + 1))}
                          className="px-2 py-0.5 border border-theme rounded text-xs disabled:opacity-40 hover:bg-row-hover transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goal Score summary */}
                {kraTotal > 0 && (
                  <div className="mt-3 flex flex-col gap-1 max-w-xs ml-auto">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Total Goal Score</span>
                      <span className="font-semibold text-main">
                        {formData.kra_vs_goals
                          .reduce(
                            (sum, r) => sum + (r.weightage * r.goal_completion) / 100,
                            0,
                          )
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FEEDBACK ── */}
          {activeTab === "feedback" && (
            <div className="flex flex-col gap-6 max-w-3xl">
              {/* Strengths */}
              <div>
                <RichTextEditor
                  value={formData.strengths ?? ""}
                  onChange={(val) => set("strengths", val)}
                  placeholder="Enter strengths..."
                  minHeight={160}
                />
              </div>
            </div>
          )}

          {/* ── SELF APPRAISAL ── */}
          {activeTab === "selfAppraisal" && (
            <div className="flex flex-col gap-6 max-w-4xl">

              {/* Criteria / Ratings table */}
              <div>
                <p className="text-xs font-semibold text-main mb-2">Ratings</p>
                <div className="border border-theme rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--border)]/10 border-b border-theme">
                        <th className="px-3 py-2 text-left font-bold text-muted uppercase tracking-wide w-8">No.</th>
                        <th className="px-3 py-2 text-left font-bold text-muted uppercase tracking-wide">Criteria *</th>
                        <th className="px-3 py-2 text-center font-bold text-muted uppercase tracking-wide w-32">Weightage (%)</th>
                        <th className="px-3 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {formData.criteria_ratings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-muted">
                            No rows added. Click "+ Add row" to begin.
                          </td>
                        </tr>
                      ) : (
                        formData.criteria_ratings.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-theme/30 hover:bg-row-hover transition-colors"
                          >
                            <td className="px-3 py-2 text-muted">{idx + 1}</td>
                            <td className="px-3 py-2 min-w-[200px]">
                              <SearchSelect2
                                label=""
                                value={row.criteriaLabel}
                                onChange={(_, option) => {
                                  updateCriteriaRow(idx, "criteria", option?.value ?? "");
                                  updateCriteriaRow(idx, "criteriaLabel", option?.label ?? "");
                                }}
                                fetchOptions={fetchCriteria}
                                placeholder="Search criteria..."
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={row.weightage}
                                onChange={(e) =>
                                  updateCriteriaRow(idx, "weightage", Number(e.target.value))
                                }
                                className="w-full bg-transparent border-b border-theme text-[11px] text-main outline-none focus:border-primary py-0.5 text-right"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeCriteriaRow(idx)}
                                className="text-danger hover:text-danger/80 text-xs font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="px-3 py-2 border-t border-theme/30">
                    <button
                      type="button"
                      onClick={addCriteriaRow}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      + Add row
                    </button>
                  </div>
                </div>
              </div>

              {/* Self Appraisal rich text */}
              <div>
                <p className="text-xs font-semibold text-main mb-2">Self Appraisal</p>
                <RichTextEditor
                  value={formData.self_appraisal ?? ""}
                  onChange={(val) => set("self_appraisal", val)}
                  placeholder="Enter self appraisal..."
                  minHeight={200}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default AppraisalModal;