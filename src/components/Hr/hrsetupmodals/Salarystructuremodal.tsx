import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutList,
  Save,
  X,
  Trash2,
  Loader2,
  Plus,
  Check,
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
import { useUnsavedChangesGuard } from "../../../hooks/useUnsavedChangesGuard";
import {
  ModalInput,
  ModalSelect,
} from "../../../components/ui/modal/modalComponent";
import { showApiError, showSuccess } from "../../../utils/alert";
import SearchSelect2 from "../../../components/ui/modal/SearchSelect2";
import { searchSalaryComponents } from "../../../api/resolversapifun";

// ─── Styles ───────────────────────────────────────────────────────────────────
const SS_STYLES = `
.ss-table-wrap {
  overflow-y: auto;
  overflow-x: hidden;
}
.ss-table-wrap::-webkit-scrollbar { width: 3px; }
.ss-table-wrap::-webkit-scrollbar-track { background: transparent; }
.ss-table-wrap::-webkit-scrollbar-thumb { background: var(--border, #e5e7eb); border-radius: 4px; }

.ss-row {
  display: grid;
  grid-template-columns: 100px 1.5fr 260px 36px 36px 36px 36px 30px;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.05));
  min-height: 36px;
  transition: background 0.1s;
}
.ss-row:hover { background: var(--bg-hover, rgba(0,0,0,0.015)); }

.ss-cell {
  padding: 0 8px;
  display: flex;
  align-items: center;
  height: 100%;
  min-height: 36px;
}
.ss-cell-border { border-right: 1px solid var(--border-subtle, rgba(0,0,0,0.06)); }


.ss-amt-input::placeholder { color: var(--text-sub, #9ca3af); }
.ss-amt-input::-webkit-inner-spin-button,
.ss-amt-input::-webkit-outer-spin-button { -webkit-appearance: none; }

.ss-formula-input::placeholder { color: var(--text-sub, #9ca3af); opacity: 0.6; }

.ss-flag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: default;
  user-select: none;
  transition: background 0.1s;
}
.ss-flag:hover { background: var(--bg-hover, rgba(0,0,0,0.04)); }

.ss-check-on {
  width: 14px; height: 14px;
  border-radius: 3px;
  background: var(--primary, #1e40af);
  border: 1.5px solid var(--primary, #1e40af);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ss-check-off {
  width: 14px; height: 14px;
  border-radius: 3px;
  background: transparent;
  border: 1.5px solid var(--border, #d1d5db);
  flex-shrink: 0;
  transition: border-color 0.1s;
}
.ss-flag:hover .ss-check-off { border-color: var(--primary, #1e40af); }

.ss-col-header {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-sub, #9ca3af);
  white-space: nowrap;
}

@keyframes ss-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.ss-spin { animation: ss-spin 0.8s linear infinite; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface UnifiedRow {
  salary_component: string;
  type: "Earning" | "Deduction" | "Flexible";
  amount_based_on_formula?: 0 | 1;
  formula?: string;
  amount?: string | number;
  depends_on_payment_days?: 0 | 1;
  is_tax_applicable?: 0 | 1;
  is_income_tax_component?: 0 | 1;
  variable_based_on_taxable_salary?: 0 | 1;
  _details?: SalaryComponent | null;
  _loading?: boolean;
}

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: SalaryStructure | null;
  onSuccess?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildPayloadRow(r: UnifiedRow) {
  const d = r._details;
  const formulaMode =
    r.amount_based_on_formula !== undefined
      ? r.amount_based_on_formula === 1
      : d?.amount_based_on_formula === 1;
  return {
    salary_component: r.salary_component,
    amount_based_on_formula: (formulaMode ? 1 : 0) as 0 | 1,
    formula: formulaMode ? (r.formula ?? d?.formula ?? "") : "",
    amount: formulaMode ? 0 : Number(r.amount ?? d?.amount ?? 0),
    depends_on_payment_days: (r.depends_on_payment_days ??
      d?.depends_on_payment_days ??
      0) as 0 | 1,
    is_tax_applicable: (r.is_tax_applicable ?? d?.is_tax_applicable ?? 0) as
      | 0
      | 1,
    abbr: d?.salary_component_abbr ?? r.salary_component,
    is_income_tax_component: (r.is_income_tax_component ??
      d?.is_income_tax_component ??
      0) as 0 | 1,

    variable_based_on_taxable_salary: (r.variable_based_on_taxable_salary ??
      d?.variable_based_on_taxable_salary ??
      0) as 0 | 1,
  };
}

function toUnified(
  e: StructureComponentRow[],
  d: StructureComponentRow[],
): UnifiedRow[] {
  return [
    ...(e ?? []).map((r) => ({ ...r, type: "Earning" as const })),
    ...(d ?? []).map((r) => ({ ...r, type: "Deduction" as const })),
  ];
}

function fromUnified(rows: UnifiedRow[]) {
  const valid = rows.filter((r) => r.salary_component.trim());
  return {
    earnings: valid.filter((r) => r.type !== "Deduction").map(buildPayloadRow),
    deductions: valid
      .filter((r) => r.type === "Deduction")
      .map(buildPayloadRow),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const FlagCell: React.FC<{
  checked: boolean;
  onChange?: (v: boolean) => void;
  title: string;
}> = ({ checked, onChange, title }) => (
  <div
    className="ss-flag ss-cell ss-cell-border"
    title={title}
    onClick={() => onChange?.(!checked)}
    style={{ justifyContent: "center" }}
  >
    <div className={checked ? "ss-check-on" : "ss-check-off"}>
      {checked && (
        <Check style={{ width: 9, height: 9, color: "#fff", strokeWidth: 3 }} />
      )}
    </div>
  </div>
);

const TypeCell: React.FC<{
  value: UnifiedRow["type"];
  onChange: (v: UnifiedRow["type"]) => void;
}> = ({ value, onChange }) => (
  <div className="ss-cell ss-cell-border" style={{ padding: "0 6px" }}>
    <ModalSelect
      label=""
      value={value}
      onChange={(e) => onChange(e.target.value as UnifiedRow["type"])}
      options={[
        { label: "Earning", value: "Earning" },
        { label: "Deduction", value: "Deduction" },
       
      ]}
    />
  </div>
);

const AmountCell: React.FC<{
  row: UnifiedRow;
  onChange: (p: Partial<UnifiedRow>) => void;
}> = ({ row, onChange }) => {
  const d = row._details;
  const formulaMode =
    row.amount_based_on_formula !== undefined
      ? row.amount_based_on_formula === 1
      : d?.amount_based_on_formula === 1;

  if (row._loading)
    return (
      <div
        className="ss-cell ss-cell-border"
        style={{ justifyContent: "center" }}
      >
        <Loader2
          style={{ width: 12, height: 12, color: "var(--text-sub)" }}
          className="ss-spin"
        />
      </div>
    );

  if (!d && !row.salary_component)
    return (
      <div className="ss-cell ss-cell-border">
        <span style={{ fontSize: 11, color: "var(--text-sub)", opacity: 0.4 }}>
          Select component
        </span>
      </div>
    );

  return (
    <div
      className="ss-cell ss-cell-border"
      style={{
        gap: 8,
        overflow: "hidden",
        alignItems: "center",
        width: "100%",
      }}
    >
      {/* fx /  toggle pill */}

      {formulaMode ? (
        <ModalInput
          label=""
          type="text"
          value={row.formula ?? d?.formula ?? ""}
          onChange={(e) =>
            onChange({
              formula: e.target.value,
            })
          }
          placeholder={d?.formula || "e.g. base * 0.4 + da"}
          className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent no-spinner"
        />
      ) : (
        <>
          <ModalInput
            label=""
            type="number"
            value={
              row.amount ?? (d?.amount !== undefined ? String(d.amount) : "")
            }
            onChange={(e) =>
              onChange({
                amount: e.target.value,
              })
            }
            placeholder={d?.amount !== undefined ? String(d.amount) : "0"}
            className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent no-spinner"
          />
        </>
      )}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-sub)",
          cursor: "pointer",
          lineHeight: 1,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <input
          type="checkbox"
          checked={formulaMode}
          onChange={(e) =>
            onChange({
              amount_based_on_formula: e.target.checked ? 1 : 0,
            })
          }
          style={{
            width: 12,
            height: 12,
            cursor: "pointer",
            margin: 0,
          }}
        />
        Formula
      </label>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const INITIAL_ROWS: UnifiedRow[] = [{ salary_component: "", type: "Earning" }];

export const SalaryStructureModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [structureName, setStructureName] = useState("");
  const [isActive, setIsActive] = useState<"Yes" | "No">("Yes");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<UnifiedRow[]>(INITIAL_ROWS);
  const [saving, setSaving] = useState(false);
  const [payroll_frequency, setPayrollFrequency] = useState("Monthly");
  const { markDirty, resetDirty, handleCloseWithConfirm, containerRef, activate, deactivate } =
  useUnsavedChangesGuard();
  // const handleFrequencyChange = (
  //   e: React.ChangeEvent<HTMLSelectElement>,
  // ) => {
  //   setPayrollFrequency(e.target.value);
  // };
  useEffect(() => {
    const id = "ss-styles-v2";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = SS_STYLES;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
  if (!isOpen) {
    deactivate();
    resetDirty();
    return;
  }
  setStructureName(initialData?.name ?? "");
  setIsActive(initialData?.is_active ?? "Yes");
  setDescription(initialData?.description ?? "");
  setPayrollFrequency(initialData?.payroll_frequency ?? "Monthly");
  const unified = toUnified(initialData?.earnings ?? [], initialData?.deductions ?? []);
  const initial = unified.length > 0 ? unified : [...INITIAL_ROWS];
  setRows(initial);
  unified.forEach((row, idx) => {
    if (!row.salary_component) return;
    getSalaryComponent(row.salary_component)
      .then((d) =>
        setRows((prev) => {
          const next = [...prev];
          if (!next[idx]) return prev;
          next[idx] = { ...next[idx], _details: d, _loading: false };
          return next;
        }),
      )
      .catch(() => {});
  });
  return activate();
}, [isOpen, initialData]);

  const fetchDetails = useCallback(async (idx: number, name: string) => {
    if (!name) return;
    setRows((prev) => {
      const n = [...prev];
      n[idx] = { ...n[idx], _loading: true, _details: null };
      return n;
    });
    try {
      const d = await getSalaryComponent(name);
      setRows((prev) => {
        const n = [...prev];
        n[idx] = {
          ...n[idx],
          _details: d,
          _loading: false,

          amount_based_on_formula: d.amount_based_on_formula ?? 0,
          formula: d.formula ?? "",
          amount: d.amount ? String(d.amount) : "",
          is_income_tax_component: d.is_income_tax_component ?? 0,
          variable_based_on_taxable_salary:
            d.variable_based_on_taxable_salary ?? 0,

          depends_on_payment_days: d.depends_on_payment_days ?? 0,
          is_tax_applicable: d.is_tax_applicable ?? 0,
        };
        return n;
      });
    } catch {
      setRows((prev) => {
        const n = [...prev];
        n[idx] = { ...n[idx], _loading: false };
        return n;
      });
    }
  }, []);

  const updateRow = (idx: number, patch: Partial<UnifiedRow>) => {
  markDirty();
  setRows((prev) => {
    const n = [...prev];
    n[idx] = { ...n[idx], ...patch };
    return n;
  });
};

const changeComponent = (idx: number, value: string) => {
  markDirty();
  setRows((prev) => {
    const n = [...prev];
    n[idx] = {
      ...n[idx],
      salary_component: value,
      _details: null,
      formula: undefined,
      amount: undefined,
      amount_based_on_formula: undefined,
      depends_on_payment_days: undefined,
      is_income_tax_component: undefined,
      variable_based_on_taxable_salary: undefined,
      is_tax_applicable: undefined,
    };
    return n;
  });
  if (value) setTimeout(() => fetchDetails(idx, value), 0);
};


  const changeType = (idx: number, type: UnifiedRow["type"]) =>
    setRows((prev) => {
      const n = [...prev];
      n[idx] = { salary_component: "", type, _details: null };
      return n;
    });

 const addRow = (type: UnifiedRow["type"] = "Earning") => {
  markDirty();
  setRows((prev) => [...prev, { salary_component: "", type }]);
};

const removeRow = (idx: number) => {
  markDirty();
  setRows((prev) => prev.filter((_, i) => i !== idx));
}

  const handleSave = async () => {
    if (!structureName.trim()) {
      showApiError("Structure name is required");
      return;
    }
    const { earnings, deductions } = fromUnified(rows);
    if (earnings.length === 0) {
      showApiError("At least one earning component is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        is_active: isActive,
        docstatus: 1 as const,
        description,
        payroll_frequency,
        earnings,
        deductions,
      };
      if (isEdit && initialData?.name) {
        await updateSalaryStructure(initialData.name, payload);
        showSuccess("Salary structure updated");
      } else {
        await createSalaryStructure({ name: structureName, ...payload });
        showSuccess("Salary structure created");
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

  const earningCount = rows.filter(
    (r) => r.type !== "Deduction" && r.salary_component.trim(),
  ).length;
  const deductionCount = rows.filter(
    (r) => r.type === "Deduction" && r.salary_component.trim(),
  ).length;
  const filledCount = rows.filter((r) => r.salary_component.trim()).length;

  const footer = (
    <div className="flex w-full items-center justify-between">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 11,
          color: "var(--text-sub)",
        }}
      >
        <span>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>
            {earningCount}
          </span>{" "}
          earnings
        </span>
        <span
          style={{
            width: 1,
            height: 12,
            background: "var(--border)",
            display: "inline-block",
          }}
        />
        <span>
          <span style={{ fontWeight: 600, color: "#dc2626" }}>
            {deductionCount}
          </span>{" "}
          deductions
        </span>
        <span
          style={{
            width: 1,
            height: 12,
            background: "var(--border)",
            display: "inline-block",
          }}
        />
        <span>
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
            {filledCount}
          </span>{" "}
          / {rows.length} configured
        </span>
      </div>
      <div className="flex items-center gap-3">
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
          {saving
            ? "Saving…"
            : isEdit
              ? "Update "
              : "Submit"}
        </button>
      </div>
    </div>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      title={isEdit ? "Edit Salary Structure" : "Add New Salary Structure"}
      subtitle="Build your payroll structure component by component"
      icon={LayoutList}
      customWidth="70vw"
      height="78vh"
      footer={footer}
      formContainerRef={containerRef}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "calc(78vh - 155px)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px 120px",
            gap: 10,
            alignItems: "end",
          }}
        >
          <ModalInput
            label="Structure Name"
            value={structureName}
            disabled={isEdit}
            onChange={(e) => setStructureName(e.target.value)}
            placeholder="e.g. Fixed CTC Structure"
            required
          />

          {/* <ModalSelect
                      label="Payroll Frequency"
                      value={payroll_frequency}
                      onChange={handleFrequencyChange}
                    >
                      <option value="">Select frequency</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Fortnightly">Fortnightly</option>
                      <option value="Bimonthly">Bimonthly</option>
                      <option value="Monthly">Monthly</option>
                    </ModalSelect> */}
          <ModalSelect
            label="Status"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value as "Yes" | "No")}
            options={[
              { label: "Active", value: "Yes" },
              { label: "Inactive", value: "No" },
            ]}
          />
        </div>

        {/* ── Table ── */}
        <div
          style={{
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 8,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Column headers */}
          <div
            className="ss-row"
            style={{
              background: "rgba(0,0,0,0.02)",
              borderBottom: "1px solid var(--border, #e5e7eb)",
              minHeight: 28,
            }}
          >
            <div className="ss-cell ss-cell-border ss-col-header">Type</div>
            <div className="ss-cell ss-cell-border ss-col-header">
              Component
            </div>
            <div className="ss-cell ss-cell-border ss-col-header">
              Amount / Formula
            </div>
            <div
              className="ss-cell ss-cell-border ss-col-header"
              style={{ justifyContent: "center" }}
              title="Depends on Payment Days"
            >
              Days
            </div>
            <div
              className="ss-cell ss-cell-border ss-col-header"
              style={{ justifyContent: "center" }}
              title="Tax Applicable"
            >
              Tax
            </div>
            <div
              className="ss-cell ss-cell-border ss-col-header"
              style={{ justifyContent: "center" }}
              title="Income Tax Component"
            >
              IT
            </div>
            <div
              className="ss-cell ss-cell-border ss-col-header"
              style={{ justifyContent: "center" }}
              title="Variable Based on Taxable Salary"
            >
              VTS
            </div>
            <div className="ss-cell" />
          </div>

          {/* Rows */}
          <div
            className="ss-table-wrap"
            style={{ flex: 1, maxHeight: "calc(78vh - 295px)" }}
          >
            {rows.map((row, idx) => {
              const d = row._details;
              const depPayDays = row.depends_on_payment_days === 1;
              const taxApplicable = row.is_tax_applicable === 1;
              const incomeTax =
                (row.is_income_tax_component ?? d?.is_income_tax_component) ===
                1;

              const variableTaxable =
                (row.variable_based_on_taxable_salary ??
                  d?.variable_based_on_taxable_salary) === 1;
              return (
                <div key={idx} className="ss-row">
                  <TypeCell
                    value={row.type}
                    onChange={(t) => changeType(idx, t)}
                  />

                  <div
                    className="ss-cell ss-cell-border"
                    style={{ padding: "2px 6px" }}
                  >
                    <SearchSelect2
                      label=""
                      value={row.salary_component}
                      placeholder="Search component…"
                      fetchOptions={(q) =>
                        searchSalaryComponents(row.type, q).then((data) => {
                          const selectedComponents = new Set(
                            rows
                              .filter(
                                (r, i) =>
                                  i !== idx &&
                                  r.type === row.type &&
                                  r.salary_component?.trim(),
                              )
                              .map((r) => r.salary_component),
                          );

                          return data
                            .filter(
                              (c: { name: string }) =>
                                !selectedComponents.has(c.name),
                            )
                            .map((c: { name: string }) => ({
                              label: c.name,
                              value: c.name,
                            }));
                        })
                      }
                      onChange={(value) => changeComponent(idx, value)}
                    />
                  </div>

                  <AmountCell row={row} onChange={(p) => updateRow(idx, p)} />

                  <FlagCell
                    checked={depPayDays}
                    title={depPayDays ? "Depends on payment days" : ""}
                  />

                  <FlagCell
                    checked={taxApplicable}
                    title={taxApplicable ? "Tax applicable" : ""}
                  />
                  <FlagCell
                    checked={incomeTax}
                    title={incomeTax ? "Income tax component" : ""}
                  />
                  <FlagCell
                    checked={variableTaxable}
                    title={
                      variableTaxable ? "Variable based on taxable salary" : ""
                    }
                  />
                  <div
                    className="ss-cell"
                    style={{ justifyContent: "center", padding: "0 4px" }}
                  >
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--text-sub)",
                        padding: 0,
                        transition: "color 0.1s, background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "#ef4444";
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--text-sub)";
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                      }}
                    >
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--text-sub)",
                }}
              >
                No components yet — click Add below to start.
              </div>
            )}
          </div>

          {/* Table footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderTop: "1px solid var(--border, #e5e7eb)",
              background: "var(--bg-app, #fff)",
            }}
          >
            <button
              type="button"
              onClick={() => addRow()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: 6,
                background: "var(--bg-app, #fff)",
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-main)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Plus style={{ width: 11, height: 11 }} />
              Add Row
            </button>
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};
