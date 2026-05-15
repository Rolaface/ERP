import React, { useCallback, useEffect, useState } from "react";
import { Layers, Save, X, Plus, Trash2 } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useAccountSearch } from "../../../api/apiHooks";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
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
  ModalTextarea,
} from "../../../components/ui/modal/modalComponent";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";

const STYLES = `
@keyframes sc-fadein {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sc-fadein { animation: sc-fadein 0.15s ease forwards; }

/* ── Compact checkbox ── */
.sc-cb {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  user-select: none;
  width: fit-content;
}
.sc-cb input[type="checkbox"] {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  border-radius: 2px;
  border: 1.5px solid var(--border, #d1d5db);
  background: var(--bg-card, #fff);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  position: relative;
  transition: border-color 0.1s, background 0.1s;
  margin: 0;
}
.sc-cb input[type="checkbox"]:checked {
  background: var(--primary, #1e40af);
  border-color: var(--primary, #1e40af);
}
.sc-cb input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 1.5px; top: -0.5px;
  width: 4px; height: 7px;
  border: 1.5px solid #fff;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}
.sc-cb-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-main, #111827);
  line-height: 1;
}

/* ── Settings group ── */
.sc-settings-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ── Divider label ── */
.sc-divider-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-sub, #9ca3af);
  margin-bottom: 2px;
}

/* ── Subtle section (no heavy border, just bg + tiny radius) ── */
.sc-pane {
  background: var(--bg-app, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  padding: 8px 10px;
}
/* ── Formula block ── */
.sc-formula-area {
  background: var(--bg-muted, #f8fafc);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  padding: 7px 9px;
}
.sc-mono {
  width: 100%;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 11.5px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-main);
  resize: none;
  line-height: 1.5;
}
.sc-mono::placeholder { color: var(--text-sub); opacity: 0.4; }
.sc-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 5px;
  height: 16px;
  border-radius: 3px;
  font-size: 9.5px;
  font-family: ui-monospace, monospace;
  font-weight: 600;
  background: var(--primary-subtle, #eff6ff);
  color: var(--primary, #1e40af);
  border: 1px solid var(--primary-border, #bfdbfe);
  cursor: pointer;
  user-select: none;
  transition: opacity 0.1s;
}
.sc-chip:hover { opacity: 0.65; }

/* ── Pill (flexible benefit master only) ── */
.sc-pill {
  width: 26px; height: 15px;
  border-radius: 999px;
  background: var(--border, #d1d5db);
  position: relative;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.sc-pill.on { background: var(--primary, #1e40af); }
.sc-pill-dot {
  position: absolute;
  top: 2px; left: 2px;
  width: 11px; height: 11px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  transition: transform 0.15s;
}
.sc-pill.on .sc-pill-dot { transform: translateX(11px); }

/* ── Ledger row ── */
.sc-ledger-row { display: flex; align-items: flex-end; gap: 6px; }
.sc-ledger-row + .sc-ledger-row {
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid var(--border-subtle, rgba(0,0,0,0.05));
}

/* ── Scroll body ── */
.sc-body {
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}
.sc-body::-webkit-scrollbar { width: 3px; }
.sc-body::-webkit-scrollbar-track { background: transparent; }
.sc-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
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
const FORMULA_VARS = ["base", "BS", "HRA", "DA", "LTA", "PF"];

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
  amount_based_on_formula: 0,
  formula: "",
  amount: "" as any,
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

// ─── Checkbox ─────────────────────────────────────────────────────────────────
const Cb: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="sc-cb">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="sc-cb-label">{label}</span>
  </label>
);

// ─── Pill Toggle ──────────────────────────────────────────────────────────────
const Pill: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({
  checked,
  onChange,
}) => (
  <div
    className={`sc-pill${checked ? " on" : ""}`}
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
    tabIndex={0}
    onKeyDown={(e) =>
      (e.key === " " || e.key === "Enter") && onChange(!checked)
    }
  >
    <div className="sc-pill-dot" />
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────
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
  const [loadingData, setLoadingData] = useState(false);
  const { fetchAccounts } = useAccountSearch();

  useEffect(() => {
    const id = "sc-styles-v3";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && initialData?.name) loadSalaryComponent(initialData.name);
    else setForm({ ...EMPTY, accounts: [{ account: "" }] });
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
        formula: data.formula ?? "",
        amount: data.amount ?? 0,
        description: data.description ?? "",
        accounts:
          data.accounts && data.accounts.length > 0
            ? [...data.accounts]
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
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );
  const tog = (key: keyof Omit<SalaryComponent, "name">) => (val: boolean) =>
    setForm((prev) => ({ ...prev, [key]: val ? 1 : 0 }));

  const handleTypeChange = (newType: SalaryComponentType) =>
    setForm((prev) => ({
      ...prev,
      depends_on_payment_days: 1,
      is_tax_applicable: newType === "Earning" ? 1 : 0,
      type: newType,

      is_flexible_benefit: 0,
      pay_against_benefit_claim: 0,
      max_benefit_amount: 0,
      only_tax_impact: 0,
      create_separate_payment_entry_against_benefit_claim: 0,
      payout_method: "",
      variable_based_on_taxable_salary: 0,
      is_income_tax_component: 0,
    }));

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

  const insertVar = (v: string) => {
    const cur = form.formula ?? "";
    set("formula", cur ? `${cur} ${v}` : v);
  };

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
    if (!(form.accounts ?? []).some((a) => a.account?.trim())) {
      showValidationError(
        "Ledger Account is required for Journal Entry creation.",
      );
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
      height="75vh"
      footer={footer}
    >
      <div
        className="sc-body space-y-3 pb-2"
        style={{ maxHeight: "calc(75vh - 160px)" }}
      >
        {/* ── Row 1: Type + Name + Abbreviation ── */}
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-3 items-end">
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
          <div>
            <ModalInput
              label="Abbreviation"
              className="uppercase"
              placeholder="e.g. BS"
              maxLength={5}
              value={form.salary_component_abbr}
              onChange={(e) =>
                set("salary_component_abbr", e.target.value.toUpperCase())
              }
              required
            />
          </div>
        </div>

        {/* ── Row 2: Amount Config + Settings ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: "12px",
            alignItems: "start",
            overflow: "hidden",
          }}
        >
          {/* LEFT — Amount Configuration */}
          <div
            className="sc-pane space-y-2.5"
            style={{
              alignSelf: "start",
            }}
          >
            <p className="sc-divider-label">Amount Configuration</p>

            <Cb
              label="Amount based on formula"
              checked={isFormulaBased}
              onChange={tog("amount_based_on_formula")}
            />

            {isFormulaBased ? (
              <div className="sc-fadein">
                <div className="sc-formula-area">
                  <textarea
                    className="sc-mono"
                    rows={2}
                    value={form.formula}
                    onChange={(e) => set("formula", e.target.value)}
                    placeholder="e.g. base * 0.4 + DA"
                    spellCheck={false}
                  />
                  <div
                    className="flex flex-wrap items-center gap-1 mt-1.5 pt-1.5"
                    style={{
                      borderTop:
                        "1px solid var(--border-subtle, rgba(0,0,0,0.06))",
                    }}
                  >
                    {/* <span className="text-[9.5px] text-sub">Insert:</span>
                    {FORMULA_VARS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="sc-chip"
                        onClick={() => insertVar(v)}
                      >
                        {v}
                      </button>
                    ))} */}
                    {form.salary_component_abbr?.trim() &&
                      !FORMULA_VARS.includes(form.salary_component_abbr) && (
                        <button
                          type="button"
                          className="sc-chip"
                          onClick={() => insertVar(form.salary_component_abbr)}
                        >
                          {form.salary_component_abbr}
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="sc-fadein">
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

          {/* RIGHT — Component Settings (compact, no heavy card) */}
          {/* RIGHT — Component Settings (no card) */}
          <div
            style={{
              height: "fit-content",
              alignSelf: "start",
              paddingTop: "2px",
            }}
          >
            <div
              className="sc-settings-group"
              style={{
                gap: "2px",
              }}
            >
              <Cb
                label="Depends on Payment Days"
                checked={Boolean(form.depends_on_payment_days)}
                onChange={tog("depends_on_payment_days")}
              />

              {isEarning && (
                <div
                  className="sc-fadein sc-settings-group"
                  style={{
                    gap: "2px",
                    marginTop: "2px",
                  }}
                >
                  <Cb
                    label="Tax Applicable"
                    checked={Boolean(form.is_tax_applicable)}
                    onChange={tog("is_tax_applicable")}
                  />
                  {/* Flexible benefit as inline checkbox + sub-options on enable */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Cb
                        label="Flexible Benefit"
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
                </div>
              )}

              {isDeduction && (
                <div
                  className="sc-fadein sc-settings-group"
                  style={{
                    gap: "2px",
                    marginTop: "2px",
                  }}
                >
                  <Cb
                    label="Variable Based on Taxable Salary"
                    checked={Boolean(form.variable_based_on_taxable_salary)}
                    onChange={tog("variable_based_on_taxable_salary")}
                  />
                  <Cb
                    label="Income Tax Component"
                    checked={Boolean(form.is_income_tax_component)}
                    onChange={tog("is_income_tax_component")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Flexible Benefit Configuration (Earning + enabled only) ── */}
        {isEarning && isFlexible && (
          <div className="sc-fadein sc-pane space-y-2.5">
            <p className="sc-divider-label">Benefit Configuration</p>

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
                  set("max_benefit_amount", parseFloat(e.target.value))
                }
                placeholder="0"
              />
            </div>

            <div
              className="sc-settings-group"
              style={{
                gap: "2px",
              }}
            >
              {showPayoutUnclaimed && (
                <div className="sc-fadein">
                  <Cb
                    label="Payout Unclaimed Amount in Final Payroll Cycle"
                    checked={Boolean(form.pay_against_benefit_claim)}
                    onChange={tog("pay_against_benefit_claim")}
                  />
                </div>
              )}
              <Cb
                label="Only Tax Impact"
                checked={Boolean(form.only_tax_impact)}
                onChange={tog("only_tax_impact")}
              />
              <Cb
                label="Separate Payment Entry Against Benefit Claim"
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

        {/* ── Ledger Accounts ── */}
        <div
          className="sc-pane"
          style={{
            padding: "8px 10px",
            height: "fit-content",
            alignSelf: "start",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="sc-divider-label" style={{ marginBottom: 0 }}>
              Ledger Accounts
            </p>
            <button
              type="button"
              onClick={addAccount}
              className="flex items-center gap-1 text-[10.5px] font-semibold text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add Account
            </button>
          </div>

          {(form.accounts ?? []).map((acc, idx) => (
            <div key={idx} className="sc-ledger-row">
              <div className="flex-1">
                <SearchSelect2
                  label="Ledger Account"
                  value={acc.account}
                  placeholder="Search ledger account..."
                  fetchOptions={fetchAccounts}
                  onChange={(value) => updateAccount(idx, value)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => removeAccount(idx)}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition mb-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
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
