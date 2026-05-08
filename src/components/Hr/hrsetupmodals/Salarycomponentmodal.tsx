import React, { useCallback, useEffect, useState } from "react";
import { Layers, Save, X, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useAccountSearch } from "../../../api/apiHooks";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import {
  createSalaryComponent,
  updateSalaryComponent,
  type SalaryComponent,
  type SalaryComponentType,
} from "../../../api/payrollConfigApi";
import {
  ModalInput,
  ModalSelect,
  ModalTextarea,
} from "../../../components/ui/modal/modalComponent";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";

const STYLES = `
@keyframes scfadeSlide {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sc-fade-slide {
  animation: scfadeSlide 0.2s ease forwards;
}
.sc-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-app, #fff);
  transition: background 0.15s;
}
.sc-toggle-row:hover {
  background: var(--bg-hover, #f5f7fa);
}
.sc-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  user-select: none;
}
.sc-toggle-sub {
  font-size: 11px;
  color: var(--text-sub);
  margin-top: 1px;
}
/* Native checkbox styled as a pill toggle */
.sc-pill input[type="checkbox"] { display: none; }
.sc-pill-track {
  width: 36px; height: 20px;
  border-radius: 999px;
  background: var(--border);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.sc-pill-track.on { background: var(--primary, #1e40af); }
.sc-pill-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.sc-pill-track.on .sc-pill-thumb { transform: translateX(16px); }
`;

const PAYOUT_METHODS = [
  {
    label: "Accrue and payout at end of payroll period",
    value: "Accrue and payout at end of payroll period",
  },
  {
    label: "Accrue per cycle, pay only on claim",
    value: "Accrue per cycle, pay only on claim",
  },
  {
    label: "Allow claim for full benefit amount",
    value: "Allow claim for full benefit amount",
  },
];

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: SalaryComponent | null;
  onSuccess?: () => void;
}

const EMPTY: Omit<SalaryComponent, "name"> = {
  salary_component: "",
  salary_component_abbr: "",
  type: "Earning",
  depends_on_payment_days: 1,
  is_tax_applicable: 0,
  amount_based_on_formula: 0,
  formula: "",
  amount: "" as any,
  description: "",
  accounts: [],
  is_flexible_benefit: 0,
  pay_against_benefit_claim: 0,
  max_benefit_amount: 0,
  only_tax_impact: 0,
  create_separate_payment_entry_against_benefit_claim: 0,
  payout_method: "",
  variable_based_on_taxable_salary: 0,
  is_income_tax_component: 0,
};

// ─── Pill Toggle ─────────────────────────────────────────────────────────────
interface PillToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}
const PillToggle: React.FC<PillToggleProps> = ({ checked, onChange }) => (
  <div
    className={`sc-pill-track${checked ? " on" : ""}`}
    onClick={() => onChange(!checked)}
  >
    <div className="sc-pill-thumb" />
  </div>
);

// ─── Toggle Row ──────────────────────────────────────────────────────────────
interface ToggleRowProps {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}
const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  sub,
  checked,
  onChange,
}) => (
  <div className="sc-toggle-row">
    <div>
      <div className="sc-toggle-label">{label}</div>
      {sub && <div className="sc-toggle-sub">{sub}</div>}
    </div>
    <PillToggle checked={checked} onChange={onChange} />
  </div>
);

// ─── Section heading ─────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-[11px] font-semibold uppercase tracking-wider text-sub mb-2">
    {text}
  </p>
);

// ─── Main Modal ──────────────────────────────────────────────────────────────
export const SalaryComponentModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<Omit<SalaryComponent, "name">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const { fetchAccounts } = useAccountSearch();

  // inject styles once
  useEffect(() => {
    const id = "sc-modal-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              salary_component: initialData.salary_component ?? "",
              salary_component_abbr: initialData.salary_component_abbr ?? "",
              type: initialData.type ?? "Earning",
              depends_on_payment_days: initialData.depends_on_payment_days ?? 1,
              is_tax_applicable: initialData.is_tax_applicable ?? 0,
              amount_based_on_formula: initialData.amount_based_on_formula ?? 0,
              formula: initialData.formula ?? "",
              amount: initialData.amount ?? 0,
              description: initialData.description ?? "",
              accounts: initialData.accounts ? [...initialData.accounts] : [],
              is_flexible_benefit: initialData.is_flexible_benefit ?? 0,
              pay_against_benefit_claim:
                initialData.pay_against_benefit_claim ?? 0,
              max_benefit_amount: initialData.max_benefit_amount ?? 0,
              only_tax_impact: initialData.only_tax_impact ?? 0,
              create_separate_payment_entry_against_benefit_claim:
                initialData.create_separate_payment_entry_against_benefit_claim ??
                0,
              payout_method: initialData.payout_method ?? "",
              variable_based_on_taxable_salary:
                initialData.variable_based_on_taxable_salary ?? 0,
              is_income_tax_component: initialData.is_income_tax_component ?? 0,
            }
          : { ...EMPTY, accounts: [] },
      );
    }
  }, [isOpen, initialData]);

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const tog = (key: keyof Omit<SalaryComponent, "name">) => (val: boolean) =>
    setForm((prev) => ({ ...prev, [key]: val ? 1 : 0 }));

  const handleTypeChange = (newType: SalaryComponentType) => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      is_tax_applicable: 0,
      is_flexible_benefit: 0,
      pay_against_benefit_claim: 0,
      max_benefit_amount: 0,
      only_tax_impact: 0,
      create_separate_payment_entry_against_benefit_claim: 0,
      payout_method: "",
      variable_based_on_taxable_salary: 0,
      is_income_tax_component: 0,
    }));
  };

  const addAccount = () =>
    setForm((prev) => ({
      ...prev,
      accounts: [...(prev.accounts ?? []), { account: "" }],
    }));

  const updateAccount = (idx: number, value: string) =>
    setForm((prev) => {
      const accounts = [...(prev.accounts ?? [])];
      accounts[idx] = { account: value };
      return { ...prev, accounts };
    });

  const removeAccount = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      accounts: (prev.accounts ?? []).filter((_, i) => i !== idx),
    }));

  const handleSave = async () => {
    if (!form.salary_component.trim()) {
      showValidationError("Component name is required");
      return;
    }
    if (!form.salary_component_abbr.trim()) {
      showValidationError("Abbreviation is required");
      return;
    }
    if (form.amount_based_on_formula && !form.formula?.trim()) {
      showValidationError("Formula is required when amount is formula-based");
      return;
    }
    if (form.is_flexible_benefit && !form.payout_method) {
      showValidationError("Payout method is required for flexible benefits");
      return;
    }

    try {
      setSaving(true);
      const payload: Omit<SalaryComponent, "name"> = {
        salary_component: form.salary_component,
        salary_component_abbr: form.salary_component_abbr,
        type: form.type,
        depends_on_payment_days: form.depends_on_payment_days,
        amount_based_on_formula: form.amount_based_on_formula,
        formula: form.amount_based_on_formula ? form.formula : "",
        amount: form.amount_based_on_formula ? 0 : form.amount,
        description: form.description,
        accounts: form.accounts?.filter((a) => a.account.trim()) ?? [],
        ...(isEarning && {
          is_tax_applicable: form.is_tax_applicable,
          is_flexible_benefit: form.is_flexible_benefit,
          ...(isFlexible && {
            payout_method: form.payout_method,
            max_benefit_amount: form.max_benefit_amount,
            pay_against_benefit_claim: form.pay_against_benefit_claim,
            only_tax_impact: form.only_tax_impact,
            create_separate_payment_entry_against_benefit_claim:
              form.create_separate_payment_entry_against_benefit_claim,
          }),
        }),
        ...(isDeduction && {
          variable_based_on_taxable_salary:
            form.variable_based_on_taxable_salary,
          is_income_tax_component: form.is_income_tax_component,
        }),
      };

      if (isEdit && initialData?.name) {
        await updateSalaryComponent(initialData.name, payload);
        showSuccess("Salary component updated");
      } else {
        await createSalaryComponent(payload);
        showSuccess("Salary component created");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const isEarning = form.type === "Earning";
  const isDeduction = form.type === "Deduction";
  const isFlexible = Boolean(form.is_flexible_benefit);
  const payoutMethod = form.payout_method ?? "";
  const showPayoutUnclaimed =
    payoutMethod === "Accrue per cycle, pay only on claim";

  const footer = (
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]"
      >
        <X className="h-3.5 w-3.5" /> Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {saving ? "Saving…" : isEdit ? "Update Component" : "Create Component"}
      </button>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Salary Component" : "New Salary Component"}
      subtitle="Define earnings or deductions for payroll"
      icon={Layers}
      customWidth="50vw"
      height="auto"
      footer={footer}
    >
      {/* Fixed-height scroll container — no modal resize on type switch */}
      <div
        style={{ height: "calc(75vh - 140px)", overflowY: "auto" }}
        className="space-y-4 pb-2 pr-1"
      >
        {/* ── Row 1: Abbr + Name + Type ── */}
        <div className="grid grid-cols-[8rem_10rem_minmax(18rem,24rem)] gap-3 items-end">
          <ModalInput
            label="Abbreviation"
            className="uppercase"
            placeholder="BS"
            maxLength={5}
            value={form.salary_component_abbr}
            onChange={(e) =>
              set("salary_component_abbr", e.target.value.toUpperCase())
            }
            required
          />

          <ModalSelect
            label="Type"
            value={form.type}
            onChange={(e) =>
              handleTypeChange(e.target.value as SalaryComponentType)
            }
            options={[
              { label: "Earning", value: "Earning" },
              { label: "Deduction", value: "Deduction" },
            ]}
          />
          <ModalInput
            label="Component Name"
            value={form.salary_component}
            onChange={(e) => set("salary_component", e.target.value)}
            required
          />
        </div>

        {/* ── Row 2: Amount Config + Component Options ── */}
        <div className="grid grid-cols-2 gap-3 items-start">
          {/* LEFT — Amount Configuration */}
          <div className="rounded-xl border border-[var(--border)] bg-app p-4 space-y-3">
            <SectionLabel text="Amount Configuration" />

            <ToggleRow
              label="Amount based on formula"
              checked={Boolean(form.amount_based_on_formula)}
              onChange={tog("amount_based_on_formula")}
            />

            {form.amount_based_on_formula ? (
              <div className="sc-fade-slide">
                <ModalInput
                  label="Formula"
                  value={form.formula}
                  onChange={(e) => set("formula", e.target.value)}
                  placeholder="e.g. base * 0.4"
                />
                <p className="mt-1 text-xs text-sub">
                  Variables: <code className="font-mono">base</code>,{" "}
                  <code className="font-mono">BS</code>,{" "}
                  <code className="font-mono">HRA</code>…
                </p>
              </div>
            ) : (
              <div className="sc-fade-slide">
                <ModalInput
                  label="Fixed Amount"
                  type="number"
                  className="no-spinner"
                  placeholder="0"
                  value={form.amount ?? 0}
                  onChange={(e) => set("amount", parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* RIGHT — Component Options */}
          <div className="rounded-xl border border-[var(--border)] bg-app p-4 space-y-2">
            <SectionLabel text="Component Options" />

            {/* Always visible */}
            <ToggleRow
              label="Depends on Payment Days"
              sub="Pro-rate based on working days"
              checked={Boolean(form.depends_on_payment_days)}
              onChange={tog("depends_on_payment_days")}
            />

            {/* Earning-specific */}
            {isEarning && (
              <div className="sc-fade-slide space-y-2">
                <ToggleRow
                  label="Is Tax Applicable"
                  sub="Include this component in taxable income"
                  checked={Boolean(form.is_tax_applicable)}
                  onChange={tog("is_tax_applicable")}
                />
              </div>
            )}

            {/* Deduction-specific */}
            {isDeduction && (
              <div className="sc-fade-slide space-y-2">
                <ToggleRow
                  label="Variable Based On Taxable Salary"
                  sub="Auto-calculated per income tax slabs"
                  checked={Boolean(form.variable_based_on_taxable_salary)}
                  onChange={tog("variable_based_on_taxable_salary")}
                />
                <ToggleRow
                  label="Is Income Tax Component"
                  sub="Appears in Income Tax Deductions report"
                  checked={Boolean(form.is_income_tax_component)}
                  onChange={tog("is_income_tax_component")}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Flexible Benefits (Earning only) ── */}
        {isEarning && (
          <div className="sc-fade-slide rounded-xl border border-[var(--border)] bg-app p-4 space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel text="Flexible Benefits" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-sub font-medium">
                  {isFlexible ? "Enabled" : "Disabled"}
                </span>
                <PillToggle
                  checked={isFlexible}
                  onChange={(val) => {
                    if (!val) {
                      setForm((prev) => ({
                        ...prev,
                        is_flexible_benefit: 0,
                        pay_against_benefit_claim: 0,
                        max_benefit_amount: 0,
                        only_tax_impact: 0,
                        create_separate_payment_entry_against_benefit_claim: 0,
                        payout_method: "",
                      }));
                    } else {
                      set("is_flexible_benefit", 1);
                    }
                  }}
                />
              </div>
            </div>

            {isFlexible && (
              <div className="sc-fade-slide space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <ModalSelect
                    label="Payout Method *"
                    value={payoutMethod}
                    onChange={(e) =>
                      set(
                        "payout_method",
                        e.target.value as SalaryComponent["payout_method"],
                      )
                    }
                    options={[
                      { label: "Select method…", value: "" },
                      ...PAYOUT_METHODS,
                    ]}
                  />
                  <ModalInput
                    label="Max Benefit Amount (Yearly)"
                    type="number"
                    value={form.max_benefit_amount}
                    className="no-spinner"
                    
                    onChange={(e) =>
                      set("max_benefit_amount", parseFloat(e.target.value) )
                    }
                    placeholder="0"
                  />
                </div>

                <p className="text-xs text-sub">
                  If greater than zero, sets the maximum benefit amount
                  assignable per employee.
                </p>

                <div className="space-y-2">
                  {showPayoutUnclaimed && (
                    <div className="sc-fade-slide">
                      <ToggleRow
                        label="Payout Unclaimed Amount in Final Payroll Cycle"
                        checked={Boolean(form.pay_against_benefit_claim)}
                        onChange={tog("pay_against_benefit_claim")}
                      />
                    </div>
                  )}
                  <ToggleRow
                    label="Only Tax Impact"
                    sub="Does not affect net pay, only tax calculation"
                    checked={Boolean(form.only_tax_impact)}
                    onChange={tog("only_tax_impact")}
                  />
                  <ToggleRow
                    label="Create Separate Payment Entry Against Benefit Claim"
                    checked={Boolean(
                      form.create_separate_payment_entry_against_benefit_claim,
                    )}
                    onChange={tog(
                      "create_separate_payment_entry_against_benefit_claim",
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Ledger Accounts ── */}
        <div className="rounded-xl border border-[var(--border)] bg-app p-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel text="Ledger Accounts" />
            <button
              type="button"
              onClick={addAccount}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add Account
            </button>
          </div>

          {(form.accounts ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] py-3 text-center text-xs text-sub">
              No ledger accounts linked
            </p>
          ) : (
            <div className="space-y-2">
              {(form.accounts ?? []).map((acc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <SearchSelect2
                    label="Ledger Account"
                    value={acc.account}
                    placeholder="Search ledger account..."
                    fetchOptions={fetchAccounts}
                    onChange={(value) => updateAccount(idx, value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeAccount(idx)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <ModalTextarea
          label="Description"
          rows={2}
          placeholder="Optional description…"
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </MinimizableModal>
  );
};
