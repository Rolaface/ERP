import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutList, Save, X, Trash2, ChevronDown, ChevronRight, Loader2, Plus,
} from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import {
  getSalaryComponent,
  createSalaryStructure,
  updateSalaryStructure,
  type SalaryStructure,
  type SalaryComponent,
  type StructureComponentRow,
} from "../../../api/payrollConfigApi";
import { ModalInput, ModalSelect } from "../../../components/ui/modal/modalComponent";
import { showApiError, showSuccess } from "../../../utils/alert";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { searchSalaryComponents } from "../../../api/resolversapifun";

// ─── Pill toggle ─────────────────────────────────────────────────────────────

const PillToggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({
  checked, onChange,
}) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: 36, height: 20, borderRadius: 999,
      background: checked ? "var(--primary, #1e40af)" : "var(--border)",
      position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s",
    }}
  >
    <div style={{
      position: "absolute", top: 3, left: 3, width: 14, height: 14,
      borderRadius: "50%", background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      transform: checked ? "translateX(16px)" : "translateX(0)",
      transition: "transform .2s",
    }} />
  </div>
);

const ToggleRow: React.FC<{
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
}> = ({ label, sub, checked, onChange }) => (
  <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-app px-3 py-2">
    <div>
      <p className="text-[12px] font-medium text-main">{label}</p>
      {sub && <p className="text-[10px] text-sub">{sub}</p>}
    </div>
    <PillToggle checked={checked} onChange={onChange} />
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnifiedRow {
  salary_component: string;
  type: "Earning" | "Deduction" | "Flexible";
  // user overrides — undefined means "use component default"
  amount_based_on_formula?: 0 | 1;
  formula?: string;
  amount?: string;
  depends_on_payment_days?: 0 | 1;
  is_tax_applicable?: 0 | 1;
  // internal
  _details?: SalaryComponent | null;
  _loading?: boolean;
  _expanded?: boolean;
}

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: SalaryStructure | null;
  onSuccess?: () => void;
}

// ─── Payload builder — the key correctness rule ───────────────────────────────
// formula mode → send formula, amount = 0
// fixed mode   → send amount, formula = ""
// User edits always win over component defaults.

function buildPayloadRow(r: UnifiedRow) {
  const d = r._details;
  const formulaMode =
    r.amount_based_on_formula !== undefined
      ? r.amount_based_on_formula === 1
      : d?.amount_based_on_formula === 1;

  return {
    salary_component: r.salary_component,
    amount_based_on_formula: formulaMode ? 1 : 0,
    formula:  formulaMode  ? (r.formula  ?? d?.formula ?? "")  : "",
    amount:   formulaMode  ? 0 : Number(r.amount ?? d?.amount ?? 0),
    depends_on_payment_days:
      r.depends_on_payment_days ?? d?.depends_on_payment_days ?? 0,
    is_tax_applicable:
      r.is_tax_applicable ?? d?.is_tax_applicable ?? 0,
    abbr: d?.salary_component_abbr,
  };
}

function toUnified(
  earnings: StructureComponentRow[],
  deductions: StructureComponentRow[],
): UnifiedRow[] {
  return [
    ...(earnings  ?? []).map((r) => ({ ...r, type: "Earning"   as const })),
    ...(deductions ?? []).map((r) => ({ ...r, type: "Deduction" as const })),
  ];
}

function fromUnified(rows: UnifiedRow[]) {
  const valid = rows.filter((r) => r.salary_component.trim());
  return {
    earnings:   valid.filter((r) => r.type !== "Deduction").map(buildPayloadRow),
    deductions: valid.filter((r) => r.type === "Deduction").map(buildPayloadRow),
  };
}

// ─── Expanded panel ───────────────────────────────────────────────────────────

const ExpandedPanel: React.FC<{
  row: UnifiedRow;
  onChange: (patch: Partial<UnifiedRow>) => void;
}> = ({ row, onChange }) => {
  const d = row._details;

  const formulaMode =
    row.amount_based_on_formula !== undefined
      ? row.amount_based_on_formula === 1
      : d?.amount_based_on_formula === 1;

  const depPayDays =
    (row.depends_on_payment_days ?? d?.depends_on_payment_days ?? 0) === 1;

  const taxApplicable =
    (row.is_tax_applicable ?? d?.is_tax_applicable ?? 0) === 1;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--card)]/50 px-4 py-3 pl-8">
      <div className="grid grid-cols-2 gap-3">

        {/* LEFT — Amount config */}
        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-app p-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-sub">
            Amount Configuration
          </p>

          <ToggleRow
            label="Amount based on formula"
            checked={formulaMode}
            onChange={(v) => onChange({ amount_based_on_formula: v ? 1 : 0 })}
          />

          {formulaMode ? (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-sub">
                Formula
              </label>
              <input
                type="text"
                value={row.formula ?? d?.formula ?? ""}
                onChange={(e) => onChange({ formula: e.target.value })}
                placeholder="e.g. base_amount * 0.12"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 font-mono text-[12px] text-main placeholder:font-sans placeholder:text-sub focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-sub">
                Fixed Amount (₹)
              </label>
              <input
                type="number"
                value={row.amount ?? d?.amount ?? ""}
                onChange={(e) => onChange({ amount: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[12px] text-main placeholder:text-sub focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 no-spinner"
              />
            </div>
          )}
        </div>

        {/* RIGHT — Component options */}
        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-app p-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-sub">
            Component Options
          </p>

          <ToggleRow
            label="Depends on Payment Days"
            sub="Pro-rate based on working days"
            checked={depPayDays}
            onChange={(v) => onChange({ depends_on_payment_days: v ? 1 : 0 })}
          />

          {row.type !== "Deduction" && (
            <ToggleRow
              label="Is Tax Applicable"
              sub="Include in taxable income"
              checked={taxApplicable}
              onChange={(v) => onChange({ is_tax_applicable: v ? 1 : 0 })}
            />
          )}

          {d?.salary_component_abbr && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] text-sub">Abbr:</span>
              <span className="rounded bg-[var(--border)]/60 px-2 py-0.5 font-mono text-[10px] text-main">
                {d.salary_component_abbr}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────

const INITIAL_ROWS: UnifiedRow[] = [
  { salary_component: "", type: "Earning" },
];

export const SalaryStructureModal: React.FC<Props> = ({
  modalId, isOpen, onClose, initialData, onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);

  const [structureName, setStructureName] = useState("");
  const [isActive, setIsActive]           = useState<"Yes" | "No">("Yes");
  const [description, setDescription]     = useState("");
  const [rows, setRows]                   = useState<UnifiedRow[]>(INITIAL_ROWS);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStructureName(initialData?.name ?? "");
    setIsActive(initialData?.is_active ?? "Yes");
    setDescription(initialData?.description ?? "");
    const unified = toUnified(initialData?.earnings ?? [], initialData?.deductions ?? []);
    const initial = unified.length > 0 ? unified : [...INITIAL_ROWS];
    setRows(initial);

    // On edit: auto-fetch component details for every filled row.
    // We keep the structure-level overrides (formula/amount/flags) already in the row —
    // _details just powers the expanded panel UI.
    if (unified.length > 0) {
      unified.forEach((row, idx) => {
        if (!row.salary_component) return;
        getSalaryComponent(row.salary_component)
          .then((d) => {
            setRows((prev) => {
              const next = [...prev];
              if (!next[idx]) return prev;
              // merge _details but do NOT overwrite saved overrides
              next[idx] = { ...next[idx], _details: d, _loading: false };
              return next;
            });
          })
          .catch(() => {/* ignore — row works without _details */});
      });
    }
  }, [isOpen, initialData]);

  // Called when user picks a NEW component from search — resets overrides so fresh defaults show.
  const fetchDetails = useCallback(async (idx: number, name: string) => {
    if (!name) return;
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], _loading: true, _details: null };
      return next;
    });
    try {
      const d = await getSalaryComponent(name);
      setRows((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          _details: d,
          _loading: false,
          _expanded: true,
          // fresh pick — clear overrides so component defaults show
          amount_based_on_formula: undefined,
          formula: undefined,
          amount: undefined,
          depends_on_payment_days: undefined,
          is_tax_applicable: undefined,
        };
        return next;
      });
    } catch {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], _loading: false };
        return next;
      });
    }
  }, []);

  const updateRow = (idx: number, patch: Partial<UnifiedRow>) =>
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });

  const changeComponent = (idx: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        salary_component: value,
        _details: null, _expanded: false,
        formula: undefined, amount: undefined,
        amount_based_on_formula: undefined,
        depends_on_payment_days: undefined,
        is_tax_applicable: undefined,
      };
      return next;
    });
    if (value) setTimeout(() => fetchDetails(idx, value), 0);
  };

  const changeType = (idx: number, type: UnifiedRow["type"]) =>
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { salary_component: "", type, _details: null, _expanded: false };
      return next;
    });

  const toggleExpand = (idx: number) =>
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], _expanded: !next[idx]._expanded };
      return next;
    });

  const addRow = () =>
    setRows((prev) => [...prev, { salary_component: "", type: "Earning" }]);

  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!structureName.trim()) { showApiError("Structure name is required"); return; }
    const { earnings, deductions } = fromUnified(rows);
    if (earnings.length === 0) { showApiError("At least one earning component is required"); return; }
    try {
      setSaving(true);
      const payload = { is_active: isActive, docstatus: 1 as const, description, earnings, deductions };
      if (isEdit && initialData?.name) {
        await updateSalaryStructure(initialData.name, payload);
        showSuccess("Salary structure updated");
      } else {
        await createSalaryStructure({ name: structureName, ...payload });
        showSuccess("Salary structure created");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const filledCount    = rows.filter((r) => r.salary_component.trim()).length;
  const earningCount   = rows.filter((r) => r.type !== "Deduction" && r.salary_component.trim()).length;
  const deductionCount = rows.filter((r) => r.type === "Deduction" && r.salary_component.trim()).length;

  const footer = (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3 text-[11px] text-sub">
        <span><span className="font-semibold text-emerald-600">{earningCount}</span> earnings</span>
        <span className="h-3 w-px bg-[var(--border)]" />
        <span><span className="font-semibold text-red-500">{deductionCount}</span> deductions</span>
        <span className="h-3 w-px bg-[var(--border)]" />
        <span><span className="font-semibold text-main">{filledCount}</span> / {rows.length} configured</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving…" : isEdit ? "Update Structure" : "Create Structure"}
        </button>
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Salary Structure" : "New Salary Structure"}
      subtitle="Add components and configure each one inline"
      icon={LayoutList}
      customWidth="58vw"
      height="88vh"
      footer={footer}
    >
      <div className="space-y-4 pb-2">

        {/* Header */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <ModalInput
              label="Structure Name"
              value={structureName}
              disabled={isEdit}
              onChange={(e) => setStructureName(e.target.value)}
              placeholder="e.g. Fixed CTC Structure"
              required
            />
          </div>
          <ModalSelect
            label="Status"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value as "Yes" | "No")}
            options={[{ label: "Active", value: "Yes" }, { label: "Inactive", value: "No" }]}
          />
        </div>

        <ModalInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes…"
        />

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">

          {/* Column headers */}
          <div className="grid grid-cols-[1.25rem_5.5rem_1fr_1.25rem] items-center gap-3 border-b border-[var(--border)] bg-[var(--border)]/20 px-4 py-1.5">
            <span />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-sub">Type</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-sub">Component</span>
            <span />
          </div>

          {/* Rows — scrollable, ~5 rows visible */}
          <div
            className="divide-y divide-[var(--border)] overflow-y-auto"
            style={{ maxHeight: "calc(88vh - 360px)" }}
          >
            {rows.map((row, idx) => {
              const canExpand = Boolean(row._details);
              const isExpanded = canExpand && row._expanded;

              // collapsed summary pill
              const formulaMode =
                row.amount_based_on_formula !== undefined
                  ? row.amount_based_on_formula === 1
                  : row._details?.amount_based_on_formula === 1;

              const summary = row._details
                ? formulaMode
                  ? `Formula`
                  : `₹ ${Number(row.amount ?? row._details.amount ?? 0).toLocaleString("en-IN")}`
                : null;

              return (
                <div key={idx}>
                  <div className="grid grid-cols-[1.25rem_5.5rem_1fr_1.25rem] items-center gap-3 px-4 py-1.5 hover:bg-app transition">

                    {/* Chevron */}
                    <button
                      type="button"
                      onClick={() => canExpand && toggleExpand(idx)}
                      className={[
                        "flex h-4 w-4 items-center justify-center rounded transition",
                        canExpand ? "text-sub hover:text-primary" : "pointer-events-none opacity-0",
                      ].join(" ")}
                    >
                      {isExpanded
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronRight className="h-3 w-3" />
                      }
                    </button>

                    {/* Type */}
                    <ModalSelect
                      label=""
                      value={row.type}
                      onChange={(e) => changeType(idx, e.target.value as UnifiedRow["type"])}
                      options={[
                        { label: "Earning",   value: "Earning"   },
                        { label: "Deduction", value: "Deduction" },
                        { label: "Flexible",  value: "Flexible"  },
                      ]}
                    />

                    {/* Component + summary */}
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <SearchSelect2
                          label=""
                          value={row.salary_component}
                          placeholder="Search component…"
                          fetchOptions={(q) =>
                            searchSalaryComponents(row.type, q).then((data) =>
                              data.map((c: { name: string }) => ({ label: c.name, value: c.name }))
                            )
                          }
                          onChange={(value) => changeComponent(idx, value)}
                        />
                      </div>
                      {row._loading && (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sub" />
                      )}
                      {!row._loading && summary && !isExpanded && (
                        <span className={[
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
                          formulaMode
                            ? "border-blue-200 bg-blue-50 text-blue-600"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700",
                        ].join(" ")}>
                          {summary}
                        </span>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="flex h-5 w-5 items-center justify-center rounded text-sub transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {isExpanded && (
                    <ExpandedPanel row={row} onChange={(patch) => updateRow(idx, patch)} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Add row */}
          <div className="flex items-center gap-3 border-t border-[var(--border)] bg-app px-4 py-2">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-semibold text-main transition hover:bg-[var(--border)]"
            >
              <Plus className="h-3 w-3" /> Add Row
            </button>
            <span className="text-[10px] text-sub">{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};