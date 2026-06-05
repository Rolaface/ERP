import React, { useCallback, useEffect, useState } from "react";
import { Layers, Save, X,  } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useAccountSearch } from "../../../api/apiHooks";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { useUnsavedChangesGuard } from "../../../hooks/useUnsavedChangesGuard";
import {
  createSalaryComponent,
  updateSalaryComponent,
  getSalaryComponent,
  type SalaryComponent,
  type SalaryComponentType,
} from "../../../api/payrollConfigApi";
import {
  ModalInput,
  ModalSelect,
  
} from "../../../components/ui/modal/modalComponent";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import { NumericInput } from "../../../components/ui/modal/modalComponent";

const STYLES = `
@keyframes sc-fadein {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sc-fadein { animation: sc-fadein 0.15s ease forwards; }

/* ── Scrollable body ── */
.sc-body { overflow-y: auto; overflow-x: hidden; }
.sc-body::-webkit-scrollbar { width: 4px; }
.sc-body::-webkit-scrollbar-track { background: transparent; }
.sc-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

/* ── Middle two-column grid: [7fr 3fr] ── */
.sc-mid {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 20px;
  align-items: stretch;
}

/* LEFT column stacks Amount + Ledger vertically */
.sc-left { display: flex; flex-direction: column; gap: 20px; }

/* ── Amount Configuration section — gray bg ── */
.sc-amount-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
}
.sc-amount-section h3 {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111827;
  margin: 0 0 14px 0;
}

/* ── Toggle row inside amount section ── */
.sc-toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.sc-toggle-pill {
  display: flex;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 4px;
  gap: 0;
  flex-shrink: 0;
}
.sc-toggle-pill button {
  padding: 4px 11px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #6b7280;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  line-height: 1.4;
  white-space: nowrap;
}
.sc-toggle-pill button.active {
  background: #1e3a8a;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.sc-toggle-input {
  flex: 1; min-width: 120px;
  font-size: 13px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  outline: none;
  color: #111827;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  height: 38px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
.sc-toggle-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.sc-toggle-input::placeholder { color: #9ca3af; }

/* ── Ledger section — white bg ── */
.sc-ledger-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  flex: 1;
  display: flex;
  flex-direction: column;
}
.sc-ledger-section .sc-sec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}
.sc-ledger-section h3 {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111827;
  margin: 0;
}
.sc-ledger-row { display: flex; align-items: flex-end; gap: 8px; }
.sc-ledger-row + .sc-ledger-row {
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

/* ── RIGHT column — Attributes section (blue-tinted, h-full) ── */
.sc-right { display: flex; flex-direction: column; }
.sc-attrs-section {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  flex: 1;
  display: flex;
  flex-direction: column;
}
.sc-attrs-section h3 {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1e3a8a;
  margin: 0 0 14px 0;
}

/* ── Attribute checkbox rows ── */
.sc-attr-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 28px;
  padding: 4px 0;
}
.sc-attr-spacer { min-height: 28px; padding: 4px 0; }

.sc-attr-row input[type="checkbox"] {
  width: 16px; height: 16px;
  flex-shrink: 0; margin-top: 1px;
  border-radius: 3px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  appearance: none; -webkit-appearance: none;
  cursor: pointer; position: relative;
  transition: border-color 0.1s, background 0.1s;
}
.sc-attr-row input[type="checkbox"]:checked {
  background: #2563eb;
  border-color: #2563eb;
}
.sc-attr-row input[type="checkbox"]:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.25);
}
.sc-attr-row input[type="checkbox"]:checked::after {
  content: '';
  position: absolute; left: 3px; top: 0px;
  width: 5px; height: 9px;
  border: 2px solid #fff; border-top: none; border-left: none;
  transform: rotate(45deg);
}
.sc-attr-row label {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.4;
}

/* ── Benefit config section ── */
.sc-benefit-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.sc-benefit-section h3 {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111827;
  margin: 0 0 14px 0;
}
.sc-benefit-check-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #f3f4f6;
}
.sc-benefit-check-row:last-child { border-bottom: none; }
.sc-benefit-check-row input[type="checkbox"] {
  width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px;
  border-radius: 3px; border: 1.5px solid #d1d5db; background: #fff;
  appearance: none; -webkit-appearance: none;
  cursor: pointer; position: relative;
  transition: border-color 0.1s, background 0.1s;
}
.sc-benefit-check-row input[type="checkbox"]:checked {
  background: #2563eb; border-color: #2563eb;
}
.sc-benefit-check-row input[type="checkbox"]:checked::after {
  content: ''; position: absolute; left: 3px; top: 0px;
  width: 5px; height: 9px;
  border: 2px solid #fff; border-top: none; border-left: none;
  transform: rotate(45deg);
}
.sc-benefit-check-row label {
  font-size: 13px; font-weight: 500; color: #1f2937;
  cursor: pointer; line-height: 1.4;
}
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

/* ── Attribute checkbox (right blue panel) ── */
const Attr: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
  <div className="sc-attr-row">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <label htmlFor={id}>{label}</label>
  </div>
);

/* ── Benefit checkbox (white benefit panel) ── */
const BenefitCb: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
  <div className="sc-benefit-check-row">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <label htmlFor={id}>{label}</label>
  </div>
);

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
const { markDirty, resetDirty, handleCloseWithConfirm, containerRef, activate, deactivate } =
  useUnsavedChangesGuard();
  /* inject styles once */
  useEffect(() => {
    const id = "sc-styles-v9";
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
  return activate();
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
 const tog = (key: keyof Omit<SalaryComponent, "name">) => (val: boolean) => {
  markDirty();
  setForm((prev) => ({ ...prev, [key]: val ? 1 : 0 }));
};

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

  const isEarning = form.type === "Earning";
  const isDeduction = form.type === "Deduction";
  const isFlexible = Boolean(form.is_flexible_benefit);
  const isFormulaBased = Boolean(form.amount_based_on_formula);
  const payoutMethod = form.payout_method ?? "";
  const showPayoutUnclaimed =
    payoutMethod === "Accrue per cycle, pay only on claim";

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

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
     onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEdit ? "Edit Salary Component" : "New Salary Component"}
      subtitle="Define earnings or deductions for payroll"
      icon={Layers}
      customWidth="55vw"
      height="70vh"
      footer={footer}
      formContainerRef={containerRef}
    >
      <div
        className="sc-body space-y-5 pb-2 px-1"
        style={{ maxHeight: "calc(80vh - 160px)" }}
      >
        {/* ══ ROW 1: Type | Component Name | Abbreviation | Description ══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 4fr 1.8fr 4fr",
            gap: 16,
            alignItems: "end",
          }}
        >
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

        {/* ══ MIDDLE: Left col [7fr] + Right col [3fr] ══ */}
        <div className="sc-mid">
          {/* ── LEFT column: Amount Config + Ledger stacked ── */}
          <div className="sc-left">
            {/* Amount Configuration — gray section */}
            <div className="sc-amount-section">
              <h3>Amount Configuration</h3>
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
                  <input
                    type="text"
                    className="sc-toggle-input"
                    placeholder="e.g. base * 0.4 + DA"
                    value={form.formula ?? ""}
                    onChange={(e) => set("formula", e.target.value)}
                    spellCheck={false}
                  />
                )}
              </div>
            </div>

            {/* Ledger Accounts — white section */}
            <div className="sc-ledger-section">
              <div className="sc-sec-header">
                <h3>Ledger Account</h3>
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
          </div>
          {/* /sc-left */}

          {/* ── RIGHT column: Attributes (blue-tinted, full height) ── */}
          <div className="sc-right">
            <div className="sc-attrs-section">
              <h3>Attributes</h3>

              <Attr
                id="attr-pay-days"
                label="Depends on Payment Days"
                checked={Boolean(form.depends_on_payment_days)}
                onChange={tog("depends_on_payment_days")}
              />
              <Attr
                id="attr-variable-amt"
                label="Remove If Zero Valued"
                checked={Boolean(form.remove_if_zero_valued)}
                onChange={tog("remove_if_zero_valued")}
              />

              {isEarning ? (
                <Attr
                  id="attr-tax"
                  label="Tax Applicable"
                  checked={Boolean(form.is_tax_applicable)}
                  onChange={tog("is_tax_applicable")}
                />
              ) : (
                <Attr
                  id="attr-variable"
                  label="Variable Based on Taxable Salary"
                  checked={Boolean(form.variable_based_on_taxable_salary)}
                  onChange={tog("variable_based_on_taxable_salary")}
                />
              )}

              {isDeduction ? (
                <Attr
                  id="attr-income-tax"
                  label="Income Tax Component"
                  checked={Boolean(form.is_income_tax_component)}
                  onChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      is_income_tax_component: checked ? 1 : 0,
                      variable_based_on_taxable_salary: checked
                        ? 1
                        : prev.variable_based_on_taxable_salary,
                    }))
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
        {/* /sc-mid */}

        {/* ══ Flexible Benefit Configuration (Earning + flexible enabled) ══ */}
        {isEarning && isFlexible && (
          <div className="sc-fadein sc-benefit-section">
            <h3>Benefit Configuration</h3>
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
    </MinimizableModal>
  );
};