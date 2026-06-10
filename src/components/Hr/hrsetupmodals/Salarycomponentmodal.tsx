import React, { useCallback, useEffect, useState } from "react";
import { Layers, Save, X } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useAccountSearch } from "../../../api/apiHooks";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { useUnsavedChangesGuard } from "../../../hooks/useUnsavedChangesGuard";
import {
  createSalaryComponent,
  updateSalaryComponent,
  getSalaryComponent,
  syncSalaryComponentFormula,
  type SalaryComponent,
  type SalaryComponentType,
} from "../../../api/payrollConfigApi";
import {
  ModalInput,
  ModalSelect,
  NumericInput,
} from "../../../components/ui/modal/modalComponent";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import { STYLES, AttrRow, BenefitCb } from "./Salarycomponentmodal.styles";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
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

const EMPTY: Omit<SalaryComponent, "name"> = {
  salary_component: "",
  salary_component_abbr: "",
  type: "Earning",
  depends_on_payment_days: 1,
  is_tax_applicable: 1,
  remove_if_zero_valued: 1,
  amount_based_on_formula: 0,
  formula: "",
  amount: null as any,
  description: "",
  accounts: [{ account: "" }],
  is_flexible_benefit: 0,
  pay_against_benefit_claim: 0,
  max_benefit_amount: 0,
  only_tax_impact: 0,
  create_separate_payment_entry_against_benefit_claim: 0,
  payout_method: "",
  variable_based_on_taxable_salary: 0,
  is_income_tax_component: 0,
};

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: SalaryComponent | null;
  onSuccess?: () => void;
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
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
  const [, setLoadingData] = useState(false);
  const { fetchAccounts } = useAccountSearch();
  const {
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
    containerRef,
    activate,
    deactivate,
  } = useUnsavedChangesGuard();

  /* inject styles once */
  useEffect(() => {
    const id = "sc-styles-v10";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  /* reset / load on open */
  useEffect(() => {
    if (!isOpen) {
      deactivate();
      resetDirty();
      return;
    }
    if (isEdit && initialData?.name) loadSalaryComponent(initialData.name);
    else setForm({ ...EMPTY, accounts: [{ account: "" }] });
    // activate returns a cleanup (clears the 300ms timer)
    const cleanup = activate();
    return cleanup;
  }, [isOpen, isEdit, initialData?.name]);

  const loadSalaryComponent = async (name: string) => {
    try {
      setLoadingData(true);
      const data = await getSalaryComponent(name);
      setForm({
        salary_component: data.salary_component ?? "",
        salary_component_abbr: data.salary_component_abbr ?? "",
        type: data.type ?? "Earning",
        depends_on_payment_days: data.depends_on_payment_days ?? 1,
        is_tax_applicable: data.is_tax_applicable ?? 0,
        amount_based_on_formula: data.amount_based_on_formula ?? 0,
        remove_if_zero_valued: data.remove_if_zero_valued ?? 0,
        formula: data.formula ?? "",
        amount: data.amount ?? null,
        description: data.description ?? "",
        accounts:
          (data.accounts ?? []).length > 0
            ? [...(data.accounts ?? [])]
            : [{ account: "" }],
        is_flexible_benefit: data.is_flexible_benefit ?? 0,
        pay_against_benefit_claim: data.pay_against_benefit_claim ?? 0,
        max_benefit_amount: data.max_benefit_amount ?? 0,
        only_tax_impact: data.only_tax_impact ?? 0,
        create_separate_payment_entry_against_benefit_claim:
          data.create_separate_payment_entry_against_benefit_claim ?? 0,
        payout_method: data.payout_method ?? "",
        variable_based_on_taxable_salary:
          data.variable_based_on_taxable_salary ?? 0,
        is_income_tax_component: data.is_income_tax_component ?? 0,
      });
    } catch (err) {
      showApiError(err);
      onClose();
    } finally {
      setLoadingData(false);
    }
  };

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      markDirty();
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [markDirty],
  );

  const tog = useCallback(
    (key: keyof Omit<SalaryComponent, "name">) => (val: boolean) => {
      markDirty();
      setForm((prev) => ({ ...prev, [key]: val ? 1 : 0 }));
    },
    [markDirty],
  );

  const handleTypeChange = (newType: SalaryComponentType) => {
    markDirty();
    setForm((prev) => ({
      ...prev,
      type: newType,
      depends_on_payment_days: 1,
      is_tax_applicable: newType === "Earning" ? 1 : 0,
      is_flexible_benefit: 0,
      remove_if_zero_valued: 1,
      pay_against_benefit_claim: 0,
      max_benefit_amount: 0,
      only_tax_impact: 0,
      create_separate_payment_entry_against_benefit_claim: 0,
      payout_method: "",
      variable_based_on_taxable_salary: 0,
      is_income_tax_component: 0,
    }));
  };

  const updateAccount = (idx: number, value: string) => {
    markDirty();
    setForm((prev) => {
      const accounts = [...(prev.accounts ?? [])];
      accounts[idx] = { account: value };
      return { ...prev, accounts };
    });
  };

  const handleSave = async () => {
    if (!form.salary_component.trim())
      return showValidationError("Component name is required");
    if (!form.salary_component_abbr.trim())
      return showValidationError("Abbreviation is required");
    if (form.amount_based_on_formula && !form.formula?.trim())
      return showValidationError(
        "Formula is required when amount is formula-based",
      );
    if (form.is_flexible_benefit && !form.payout_method)
      return showValidationError(
        "Payout method is required for flexible benefits",
      );
    if (!(form.accounts ?? []).some((a) => a.account?.trim()))
      return showValidationError(
        "Ledger Account is required for Journal Entry creation.",
      );

    try {
      setSaving(true);
      const isEarning = form.type === "Earning";
      const isDeduction = form.type === "Deduction";
      const isFlexible = Boolean(form.is_flexible_benefit);

      const payload: Omit<SalaryComponent, "name"> = {
        salary_component: form.salary_component,
        salary_component_abbr: form.salary_component_abbr,
        type: form.type,
        depends_on_payment_days: form.depends_on_payment_days,
        amount_based_on_formula: form.amount_based_on_formula,
        formula: form.amount_based_on_formula ? form.formula : "",
        remove_if_zero_valued: form.remove_if_zero_valued,
        amount: form.amount_based_on_formula ? 0 : (form.amount ?? 0),
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
          is_tax_applicable: 0,
          variable_based_on_taxable_salary:
            form.variable_based_on_taxable_salary,
          is_income_tax_component: form.is_income_tax_component,
        }),
      };

      if (isEdit && initialData?.name) {
        await updateSalaryComponent(initialData.name, payload);
        try {
          await syncSalaryComponentFormula(
            payload.salary_component || form.salary_component,
          );
        } catch (error) {
          console.error("Salary structure sync failed", error);
        }
        showSuccess("Salary component updated");
      } else {
        await createSalaryComponent(payload);
        showSuccess("Salary component created");
      }
      onSuccess?.();
      resetDirty();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── derived state ── */
  const isEarning = form.type === "Earning";
  const isDeduction = form.type === "Deduction";
  const isFlexible = Boolean(form.is_flexible_benefit);
  const isFormulaBased = Boolean(form.amount_based_on_formula);
  const payoutMethod = form.payout_method ?? "";
  const showPayoutUnclaimed =
    payoutMethod === "Accrue per cycle, pay only on claim";

  /* ── footer ── */
  const footer = (
    <div className="flex w-full items-center justify-end gap-3">
      <button
        type="button"
        onClick={() => handleCloseWithConfirm(onClose, modalId)}
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

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEdit ? "Edit Salary Component" : "New Salary Component"}
      subtitle="Define earnings or deductions for payroll"
      icon={Layers}
      height="70vh"
      customWidth="70vw"
      footer={footer}
      formContainerRef={containerRef}
    >
      <div className="sc-body pb-2 px-1.5">
        <div className="sc-layout">
          {/* ══ LEFT: fields + amount + ledger ══ */}
          <div className="sc-left">
            {/* Row 1: Type | Name | Abbr | Description */}
            <div className="sc-row1">
              <ModalSelect
                label="Type"
                value={form.type}
                onChange={(e) => {
                  console.log("SELECT CHANGED:", e.target.value);
                  handleTypeChange(e.target.value as SalaryComponentType);
                }}
                options={[
                  { label: "Earning", value: "Earning" },
                  { label: "Deduction", value: "Deduction" },
                ]}
              />
              <ModalInput
                label="Component Name"
                value={form.salary_component}
                required
                placeholder="e.g. Basic Salary"
                onChange={(e) => set("salary_component", e.target.value)}
              />
              <ModalInput
                label="Abbreviation"
                placeholder="e.g. BS"
                maxLength={8}
                value={form.salary_component_abbr}
                required
                onChange={(e) =>
                  set("salary_component_abbr", e.target.value.toUpperCase())
                }
              />
              <ModalInput
                label="Description"
                placeholder="Optional description…"
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            {/* Amount Configuration */}
            <div className="sc-amount-section">
              <h3 className="sc-section-title">Amount Configuration</h3>
              <div className="sc-toggle-row">
                <div className="sc-toggle-pill">
                  <button
                    type="button"
                    className={!isFormulaBased ? "active" : ""}
                    onClick={() => set("amount_based_on_formula", 0)}
                  >
                    Fixed Amount
                  </button>
                  <button
                    type="button"
                    className={isFormulaBased ? "active" : ""}
                    onClick={() => set("amount_based_on_formula", 1)}
                  >
                    Formula
                  </button>
                </div>
                {!isFormulaBased ? (
                  <NumericInput
                    value={form.amount as number | null}
                    onChange={(value) => set("amount", value as any)}
                    className="sc-toggle-input"
                  />
                ) : (
                  <textarea
                    className="sc-toggle-input sc-formula-input"
                    placeholder={`e.g.base_salary * 0.4`}
                    value={form.formula ?? ""}
                    onChange={(e) => set("formula", e.target.value)}
                    spellCheck={false}
                    rows={4}
                  />
                )}
              </div>
            </div>

            {/* Ledger Account */}
            <div className="sc-ledger-section">
              <div className="sc-sec-header">
                <h3 className="sc-section-title" style={{ margin: 0 }}>
                  Ledger Account
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {(form.accounts ?? []).map((acc, idx) => (
                  <div key={idx} className="sc-ledger-row">
                    <div style={{ flex: 1 }}>
                      <SearchSelect2
                        label="Ledger Account"
                        value={acc.account}
                        required
                        placeholder="Search ledger account..."
                        fetchOptions={fetchAccounts}
                        onChange={(value) => updateAccount(idx, value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flexible Benefit Configuration */}
            {isEarning && isFlexible && (
              <div className="sc-fadein sc-benefit-section">
                <h3 className="sc-section-title">Benefit Configuration</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 14,
                  }}
                >
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
                    className="no-spinner"
                    value={form.max_benefit_amount}
                    placeholder="0"
                    onChange={(e) =>
                      set("max_benefit_amount", parseFloat(e.target.value))
                    }
                  />
                </div>
                {showPayoutUnclaimed && (
                  <BenefitCb
                    id="ben-payout-unclaimed"
                    label="Payout Unclaimed Amount in Final Payroll Cycle"
                    checked={Boolean(form.pay_against_benefit_claim)}
                    onChange={tog("pay_against_benefit_claim")}
                  />
                )}
                <BenefitCb
                  id="ben-tax-impact"
                  label="Only Tax Impact"
                  checked={Boolean(form.only_tax_impact)}
                  onChange={tog("only_tax_impact")}
                />
                <BenefitCb
                  id="ben-separate-entry"
                  label="Separate Payment Entry Against Benefit Claim"
                  checked={Boolean(
                    form.create_separate_payment_entry_against_benefit_claim,
                  )}
                  onChange={tog(
                    "create_separate_payment_entry_against_benefit_claim",
                  )}
                />
              </div>
            )}
          </div>
          {/* /sc-left */}

          {/* ══ RIGHT: Attributes panel (sticky, never scrolls away) ══ */}
          <div className="sc-right">
            <div className="sc-attrs-section">
              <h3 className="sc-attrs-title">Attributes</h3>

              {/* common — always shown */}
              <AttrRow
                id="attr-pay-days"
                label="Depends on Payment Days"
                description="Prorates the amount based on employee attendance. Formula: (Amount / Total Days) * Working Days."
                checked={Boolean(form.depends_on_payment_days)}
                onChange={tog("depends_on_payment_days")}
              />
              <AttrRow
                id="attr-remove-zero"
                label="Remove If Zero Valued"
                description="Hides this component from the salary slip if the calculated value is ₹0."
                checked={Boolean(form.remove_if_zero_valued)}
                onChange={tog("remove_if_zero_valued")}
              />

              {/* Earning-only */}
              {isEarning && (
                <AttrRow
                  id="attr-tax"
                  label="Tax Applicable"
                  description="Includes this earning in the taxable income calculation for income tax."
                  checked={Boolean(form.is_tax_applicable)}
                  onChange={tog("is_tax_applicable")}
                />
              )}

              {/* Deduction-only */}
              {isDeduction && (
                <>
                  <AttrRow
                    id="attr-variable"
                    label="Variable Based on Taxable Salary"
                    description="Calculates the amount as a percentage of the employee's total taxable earnings."
                    checked={Boolean(form.variable_based_on_taxable_salary)}
                    onChange={tog("variable_based_on_taxable_salary")}
                  />
                  <AttrRow
                    id="attr-income-tax"
                    label="Income Tax Component"
                    description="Marks this deduction specifically as the employee's monthly income tax payment."
                    checked={Boolean(form.is_income_tax_component)}
                    onChange={(checked) => {
                      markDirty();
                      setForm((prev) => ({
                        ...prev,
                        is_income_tax_component: checked ? 1 : 0,
                        variable_based_on_taxable_salary: checked
                          ? 1
                          : prev.variable_based_on_taxable_salary,
                      }));
                    }}
                  />
                </>
              )}
            </div>
          </div>
          {/* /sc-right */}
        </div>
      </div>
    </MinimizableModal>
  );
};
