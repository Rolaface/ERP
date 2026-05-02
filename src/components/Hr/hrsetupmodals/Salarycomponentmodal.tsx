// ─── SalaryComponentModal.tsx ────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from "react";
import { Layers, Save, X, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useAccountSearch } from "../../../api/apiHooks";

import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import {
  createSalaryComponent,
  updateSalaryComponent,
  type SalaryComponent,
  type SalaryComponentAccount,
  type SalaryComponentType,
} from "../../../api/payrollConfigApi";
import {
  ModalInput,
  ModalSelect,
} from "../../../components/ui/modal/modalComponent";
import { YesNoCheckbox } from "../../../components/ui/modal/modalComponent";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";

const PAYOUT_METHODS = [
  { label: "Accrue and payout at end of payroll period", value: "Accrue and payout at end of payroll period" },
  { label: "Accrue per cycle, pay only on claim", value: "Accrue per cycle, pay only on claim" },
  { label: "Allow claim for full benefit amount", value: "Allow claim for full benefit amount" },
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
  amount: 0,
  description: "",
  accounts: [],
  // flexible benefit fields
  is_flexible_benefit: 0,
  pay_against_benefit_claim: 0,
  max_benefit_amount: 0,
  only_tax_impact: 0,
  create_separate_payment_entry_against_benefit_claim: 0,
  payout_method: "",
};

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
              is_flexible_benefit: (initialData as any).is_flexible_benefit ?? 0,
              pay_against_benefit_claim: (initialData as any).pay_against_benefit_claim ?? 0,
              max_benefit_amount: (initialData as any).max_benefit_amount ?? 0,
              only_tax_impact: (initialData as any).only_tax_impact ?? 0,
              create_separate_payment_entry_against_benefit_claim:
                (initialData as any).create_separate_payment_entry_against_benefit_claim ?? 0,
              payout_method: (initialData as any).payout_method ?? "",
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
    if ((form as any).is_flexible_benefit && !(form as any).payout_method) {
      showValidationError("Payout method is required for flexible benefits");
      return;
    }

    try {
      setSaving(true);
      const payload = {
  ...form,
  accounts: form.accounts?.filter((a) => a.account.trim()) ?? [],
  ...(isFlexible && { accrual_component: 1 }),
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
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to save salary component");
    } finally {
      setSaving(false);
    }
  };

  const isFlexible = Boolean((form as any).is_flexible_benefit);
  const payoutMethod = (form as any).payout_method ?? "";
  const showPayoutUnclaimed =
    payoutMethod === "Accrue per cycle, pay only on claim";

  const footer = (
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-app px-4 py-2 text-sm font-medium text-main transition hover:bg-[var(--border)]"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
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
      maxWidth="2xl"
      height="auto"
      footer={footer}
    >
      <div className="space-y-5 pb-2">

        {/* ── Row 1: Abbreviation + Component Name + Type — all in one line ── */}
        <div className="grid grid-cols-[7rem_1fr_9rem] gap-4 items-end">
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
          <ModalInput
            label="Component Name"
            value={form.salary_component}
            onChange={(e) => set("salary_component", e.target.value)}
            required
          />
          <ModalSelect
            label="Type"
            value={form.type}
            onChange={(e) => set("type", e.target.value as SalaryComponentType)}
            options={[
              { label: "Earning", value: "Earning" },
              { label: "Deduction", value: "Deduction" },
            ]}
          />
        </div>

        {/* ── Amount Configuration ──────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-app p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sub">
            Amount Configuration
          </p>

          <div className="flex items-center gap-8">
            <YesNoCheckbox
              name="amount_based_on_formula"
              label="Amount based on formula"
              value={form.amount_based_on_formula ? "Y" : "N"}
              onChange={(name, value) =>
                set("amount_based_on_formula", value === "Y" ? 1 : 0)
              }
            />
            <YesNoCheckbox
              name="depends_on_payment_days"
              label="Depends on payment days"
              value={form.depends_on_payment_days ? "Y" : "N"}
              onChange={(name, value) =>
                set("depends_on_payment_days", value === "Y" ? 1 : 0)
              }
            />
            <YesNoCheckbox
              name="is_tax_applicable"
              label="Is Tax Applicable"
              value={form.is_tax_applicable ? "Y" : "N"}
              onChange={(name, value) =>
                set("is_tax_applicable", value === "Y" ? 1 : 0)
              }
            />
          </div>

          {form.amount_based_on_formula ? (
            <div>
              <ModalInput
                label="Formula"
                value={form.formula}
                onChange={(e) => set("formula", e.target.value)}
                placeholder="e.g. base * 0.4"
              />
              <p className="mt-1 text-xs text-sub">
                Variables: <code className="font-mono">base</code>,{" "}
                <code className="font-mono">BS</code>,{" "}
                <code className="font-mono">HRA</code> …
              </p>
            </div>
          ) : (
            <ModalInput
              label="Fixed Amount"
              type="number"
              value={form.amount ?? 0}
              onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
            />
          )}
        </div>

        {/* ── Flexible Benefits ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-app p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-sub">
              Flexible Benefits
            </p>
            {/* Is Flexible Benefit toggle */}
            <YesNoCheckbox
              name="is_flexible_benefit"
              label="Is Flexible Benefit"
              value={isFlexible ? "Y" : "N"}
              onChange={(name, value) => {
                set("is_flexible_benefit" as any, value === "Y" ? 1 : 0);
                if (value === "N") {
                  // reset all flexible fields when unchecked
                  setForm((prev) => ({
                    ...prev,
                    is_flexible_benefit: 0,
                    pay_against_benefit_claim: 0,
                    max_benefit_amount: 0,
                    only_tax_impact: 0,
                    create_separate_payment_entry_against_benefit_claim: 0,
                    payout_method: "",
                  }));
                }
              }}
            />
          </div>

          {isFlexible && (
            <div className="space-y-4">
              {/* Payout Method + Max Benefit Amount side by side */}
              <div className="grid grid-cols-2 gap-4">
                <ModalSelect
                  label="Payout Method *"
                  value={payoutMethod}
                  onChange={(e) => set("payout_method" as any, e.target.value)}
                  options={[
                    { label: "Select method…", value: "" },
                    ...PAYOUT_METHODS,
                  ]}
                />
                <ModalInput
                  label="Max Benefit Amount (Yearly)"
                  type="number"
                  value={(form as any).max_benefit_amount ?? 0}
                  onChange={(e) =>
                    set(
                      "max_benefit_amount" as any,
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="0"
                />
              </div>

              {/* helper text */}
              <p className="text-xs text-sub -mt-2">
                If greater than zero, this sets the maximum benefit amount
                assignable to any employee.
              </p>

              {/* Conditional: Payout Unclaimed Amount — only for "Accrue per cycle" */}
              {showPayoutUnclaimed && (
                <YesNoCheckbox
                  name="pay_against_benefit_claim"
                  label="Payout Unclaimed Amount in Final Payroll Cycle"
                  value={(form as any).pay_against_benefit_claim ? "Y" : "N"}
                  onChange={(name, value) =>
                    set(
                      "pay_against_benefit_claim" as any,
                      value === "Y" ? 1 : 0,
                    )
                  }
                />
              )}

              {/* Extra toggles */}
              <div className="flex flex-wrap gap-6">
                <YesNoCheckbox
                  name="only_tax_impact"
                  label="Only Tax Impact"
                  value={(form as any).only_tax_impact ? "Y" : "N"}
                  onChange={(name, value) =>
                    set("only_tax_impact" as any, value === "Y" ? 1 : 0)
                  }
                />
                <YesNoCheckbox
                  name="create_separate_payment_entry_against_benefit_claim"
                  label="Create Separate Payment Entry Against Benefit Claim"
                  value={
                    (form as any)
                      .create_separate_payment_entry_against_benefit_claim
                      ? "Y"
                      : "N"
                  }
                  onChange={(name, value) =>
                    set(
                      "create_separate_payment_entry_against_benefit_claim" as any,
                      value === "Y" ? 1 : 0,
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Ledger Accounts child table ────────────────────────────────── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label text="Ledger Accounts" />
            <button
              type="button"
              onClick={addAccount}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              Add Account
            </button>
          </div>
          {(form.accounts ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] py-4 text-center text-xs text-sub">
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

        {/* ── Description ───────────────────────────────────────────────── */}
        <div>
          <textarea
            rows={2}
            className="app-input w-full resize-none"
            placeholder="Optional notes…"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>
    </MinimizableModal>
  );
};

// ── small shared atoms ────────────────────────────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-semibold text-main">
      {text}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}