import React, { useEffect, useState } from "react";
import { Percent, Save, Trash2, X } from "lucide-react";

import { MinimizableModal } from "../../common/MinimizableModal";
import DatePickerInput from "../../calendar/DatePickerInput";
import {
  ModalInput,
  YesNoCheckbox,
} from "../../../components/ui/modal/modalComponent";
import {
  createTaxConfig,
  updateTaxConfig,
  type TaxChargeRow,
  type TaxConfig,
  type TaxSlabRow,
} from "../../../api/payrollConfigApi";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";

interface Props {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: TaxConfig | null;
  onSuccess?: () => void;
}
const ITEMS_PER_PAGE = 5;

type NumericDraft = number | string;

type TaxSlabDraftRow = Omit<
  TaxSlabRow,
  "from_amount" | "to_amount" | "percent_deduction"
> & {
  from_amount: NumericDraft;
  to_amount: NumericDraft;
  percent_deduction: NumericDraft;
};

type TaxChargeDraftRow = Omit<
  TaxChargeRow,
  "percent" | "min_taxable_income" | "max_taxable_income"
> & {
  percent: NumericDraft;
  min_taxable_income: NumericDraft;
  max_taxable_income: NumericDraft;
};

type TaxConfigDraft = Omit<
  TaxConfig,
  | "standard_tax_exemption_amount"
  | "tax_relief_limit"
  | "slabs"
  | "other_taxes_and_charges"
> & {
  standard_tax_exemption_amount: NumericDraft;
  tax_relief_limit: NumericDraft;
  slabs: TaxSlabDraftRow[];
  other_taxes_and_charges: TaxChargeDraftRow[];
};

const normalizeNumericDraft = (value: unknown): NumericDraft =>
  value === null || value === undefined ? "" : (value as NumericDraft);

const numberForPayload = (value: NumericDraft): number =>
  value === "" ? 0 : Number(value) || 0;

const makeEmptySlab = (): TaxSlabDraftRow => ({
  from_amount: "",
  to_amount: "",
  percent_deduction: "",
});

const makeEmptyCharge = (): TaxChargeDraftRow => ({
  description: "",
  percent: "",
  min_taxable_income: "",
  max_taxable_income: "",
});

const DEFAULT_SLABS: TaxSlabDraftRow[] = [
  // makeEmptySlab(),
  { ...makeEmptySlab(), from_amount: 1 }, 
  makeEmptySlab(),
  makeEmptySlab(),
  makeEmptySlab(),
];

const DEFAULT_CHARGES: TaxChargeDraftRow[] = [makeEmptyCharge()];

const EMPTY: TaxConfigDraft = {
  name: "",
  effective_from: "",
  standard_tax_exemption_amount: "",
  allow_tax_exemption: 0,
  tax_relief_limit: "",
  disabled: 0,
  slabs: DEFAULT_SLABS,
  other_taxes_and_charges: DEFAULT_CHARGES,
};

const toSlabDraft = (row: TaxSlabRow): TaxSlabDraftRow => ({
  ...row,
  from_amount: normalizeNumericDraft(row.from_amount),
  to_amount: normalizeNumericDraft(row.to_amount),
  percent_deduction: normalizeNumericDraft(row.percent_deduction),
});

const toChargeDraft = (row: TaxChargeRow): TaxChargeDraftRow => ({
  ...row,
  description: row.description ?? "",
  percent: normalizeNumericDraft(row.percent),
  min_taxable_income: normalizeNumericDraft(row.min_taxable_income),
  max_taxable_income: normalizeNumericDraft(row.max_taxable_income),
});

export const TaxConfigModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<TaxConfigDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [slabPage, setSlabPage] = useState(0);
  const [chargePage, setChargePage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              name: initialData.name ?? "",
              effective_from: initialData.effective_from ?? "",
              standard_tax_exemption_amount:
                normalizeNumericDraft(
                  initialData.standard_tax_exemption_amount,
                ),
              allow_tax_exemption: initialData.allow_tax_exemption ?? 0,
              tax_relief_limit: normalizeNumericDraft(
                initialData.tax_relief_limit,
              ),
              disabled: initialData.disabled ?? 0,
              slabs: initialData.slabs?.length
                ? initialData.slabs.map(toSlabDraft)
                : DEFAULT_SLABS.map(() => makeEmptySlab()),
              other_taxes_and_charges: initialData.other_taxes_and_charges
                ?.length
                ? initialData.other_taxes_and_charges.map(toChargeDraft)
                : DEFAULT_CHARGES.map(() => makeEmptyCharge()),
            }
          : {
              ...EMPTY,
              slabs: DEFAULT_SLABS.map(() => makeEmptySlab()),
              other_taxes_and_charges: DEFAULT_CHARGES.map(() =>
                makeEmptyCharge(),
              ),
            },
      );
      setSlabPage(0);
      setChargePage(0);
    }
  }, [isOpen, initialData]);

  const set = <K extends keyof TaxConfigDraft>(
    key: K,
    value: TaxConfigDraft[K],
  ) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addSlab = () => {
    const newTotal = totalSlabs + 1;
    const lastSlab = form.slabs?.[form.slabs.length - 1];
  const lastTo = lastSlab ? numberForPayload(lastSlab.to_amount) : 0;
    setForm((prev) => ({
      ...prev,
      // slabs: [...(prev.slabs ?? []), makeEmptySlab()],
      slabs: [...(prev.slabs ?? []), { ...makeEmptySlab(), from_amount: lastTo + 1 }],

    }));

    setSlabPage(Math.max(0, Math.ceil(newTotal / ITEMS_PER_PAGE) - 1));
  };

 const updateSlab = <K extends keyof TaxSlabDraftRow>(
  idx: number,
  key: K,
  value: TaxSlabDraftRow[K],
) =>
  setForm((prev) => {
    const slabs = [...(prev.slabs ?? [])];
    slabs[idx] = { ...slabs[idx], [key]: value };

    // Auto-update next slab's from_amount when to_amount changes
    if (key === "to_amount" && idx + 1 < slabs.length) {
      const nextFrom = value === "" ? "" : Number(value) + 1;
      slabs[idx + 1] = { ...slabs[idx + 1], from_amount: nextFrom };
    }

    return { ...prev, slabs };
  });

  const removeSlab = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      slabs: (prev.slabs ?? []).filter((_, i) => i !== idx),
    }));
  const totalSlabs = form.slabs?.length || 0;

  const totalSlabPages = Math.max(1, Math.ceil(totalSlabs / ITEMS_PER_PAGE));

  const safeSlabPage = Math.min(slabPage, totalSlabPages - 1);

  const paginatedSlabs = (form.slabs || []).slice(
    safeSlabPage * ITEMS_PER_PAGE,
    (safeSlabPage + 1) * ITEMS_PER_PAGE,
  );
  const totalCharges = form.other_taxes_and_charges?.length || 0;

  const totalChargePages = Math.max(
    1,
    Math.ceil(totalCharges / ITEMS_PER_PAGE),
  );

  const safeChargePage = Math.min(chargePage, totalChargePages - 1);

  useEffect(() => {
    if (slabPage !== safeSlabPage) {
      setSlabPage(safeSlabPage);
    }
  }, [slabPage, safeSlabPage]);

  useEffect(() => {
    if (chargePage !== safeChargePage) {
      setChargePage(safeChargePage);
    }
  }, [chargePage, safeChargePage]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      showValidationError("Tax name is required");
      return;
    }
    if (!form.effective_from) {
      showValidationError("Effective from date is required");
      return;
    }
    if ((form.slabs ?? []).length === 0) {
      showValidationError("At least one tax slab is required");
      return;
    }

    try {
      setSaving(true);

      const slabs = (form.slabs ?? []).map((row) => ({
        from_amount: numberForPayload(row.from_amount),
        to_amount: numberForPayload(row.to_amount),
        percent_deduction: numberForPayload(row.percent_deduction),
      }));

      const other_taxes_and_charges = (form.other_taxes_and_charges ?? []).map(
        (row) => ({
          description: row.description,
          percent: numberForPayload(row.percent),
          min_taxable_income: numberForPayload(row.min_taxable_income),
          max_taxable_income: numberForPayload(row.max_taxable_income),
        }),
      );

      if (isEdit && initialData?.name) {
        // UPDATE — name excluded, matches PUT spec
        await updateTaxConfig(initialData.name, {
          standard_tax_exemption_amount:
            numberForPayload(form.standard_tax_exemption_amount),
          docstatus: 1,
          allow_tax_exemption: form.allow_tax_exemption ? 1 : 0,
          tax_relief_limit: numberForPayload(form.tax_relief_limit),
          disabled: form.disabled ? 1 : 0,
          effective_from: form.effective_from,
          slabs,
          other_taxes_and_charges,
        });
        showSuccess("Tax configuration updated");
      } else {
        // CREATE — full payload, matches POST spec
        await createTaxConfig({
          name: form.name,
          effective_from: form.effective_from,
          docstatus: 1,
          standard_tax_exemption_amount:
            numberForPayload(form.standard_tax_exemption_amount),
          allow_tax_exemption: form.allow_tax_exemption ? 1 : 0,
          tax_relief_limit: numberForPayload(form.tax_relief_limit),
          disabled: form.disabled ? 1 : 0,
          slabs,

          other_taxes_and_charges,
        });
        showSuccess("Tax configuration created");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const updateCharge = <K extends keyof TaxChargeDraftRow>(
    idx: number,
    key: K,
    value: TaxChargeDraftRow[K],
  ) =>
    setForm((prev) => {
      const rows = [...(prev.other_taxes_and_charges ?? [])];
      rows[idx] = { ...rows[idx], [key]: value };
      return { ...prev, other_taxes_and_charges: rows };
    });

  const addCharge = () => {
    const newTotal = totalCharges + 1;

    setForm((prev) => ({
      ...prev,
      other_taxes_and_charges: [
        ...(prev.other_taxes_and_charges ?? []),
        makeEmptyCharge(),
      ],
    }));

    setChargePage(Math.max(0, Math.ceil(newTotal / ITEMS_PER_PAGE) - 1));
  };

  const removeCharge = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      other_taxes_and_charges: (prev.other_taxes_and_charges ?? []).filter(
        (_, i) => i !== idx,
      ),
    }));

  const footer = !isEdit ?(
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
        {saving ? "Saving..." : isEdit ? "Update Tax" : "Create Tax"}
      </button>
    </div>
  ): null;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Tax Configuration" : "New Tax Configuration"}
      subtitle="Configure income tax slabs and exemptions"
      icon={Percent}
      customWidth="60vw"
      height="84vh"
      footer={footer}
    >
      <div className="bg-app">
        <div className="flex items-end gap-3 flex-nowrap overflow-x-auto">
          <div className="w-[150px]">
            <ModalInput
              label="Name"
              value={form.name}
              disabled={isEdit}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

         <div className="w-[160px]">
  <DatePickerInput
    label="Effective From"
    name="effective_from"
    disabled={isEdit}
    value={form.effective_from}
    onChange={(_, value) => set("effective_from", value)}
    required
  />
</div>

          <div className="w-[120px] ">
            <ModalInput
              label="Exemption Amount"
              type="number"
              disabled={isEdit}
              value={form.standard_tax_exemption_amount}
              placeholder="0"
              className="no-spinner"
              onChange={(e) =>
                set("standard_tax_exemption_amount", e.target.value)
              }
            />
          </div>

          <div className="w-[120px]">
            <ModalInput
              label="Tax Relief Limit"
              type="number"
              disabled={isEdit}
              value={form.tax_relief_limit}
              placeholder="0"
              className="no-spinner"
              onChange={(e) => set("tax_relief_limit", e.target.value)}
            />
          </div>

          <div className="w-[80px] ">
            <YesNoCheckbox
              name="active"
              label="Active"
              disabled={isEdit}
              value={form.disabled ? "N" : "Y"}
              onChange={(_, value) => set("disabled", value === "Y" ? 0 : 1)}
            />
          </div>

          <div className="w-[100px]">
            <YesNoCheckbox
              name="allow_tax_exemption"
              label="Allow Tax Exemption"
              disabled={isEdit}
              value={form.allow_tax_exemption ? "Y" : "N"}
              onChange={(_, value) =>
                set("allow_tax_exemption", value === "Y" ? 1 : 0)
              }
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] overflow-hidden mt-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-app px-4 py-2.5">
            <span className="text-xs font-semibold text-main">Slabs</span>
          </div>

          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] border-b border-[var(--border)] bg-[var(--border)]/30 px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              No.
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              From
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              To
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              Percent
            </span>
            <span />
          </div>

          <div className="divide-y divide-[var(--border)]">
            {paginatedSlabs.map((row, pageIdx) => {
              const idx = safeSlabPage * ITEMS_PER_PAGE + pageIdx;

              return (
                <div
                  key={idx}
                  className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] items-center gap-3 px-4 py-2 hover:bg-app transition"
                >
                  <span className="text-center text-xs font-mono text-sub">
                    {idx + 1}
                  </span>

                  <ModalInput
                    label=""
                    type="number"
                    disabled={isEdit}
                    className="no-spinner"
                    value={row.from_amount}
                    placeholder="0"
                    onChange={(e) =>
                      updateSlab(idx, "from_amount", e.target.value)
                    }
                  />

                  <ModalInput
                    label=""
                    type="number"
                    className="no-spinner"
                    disabled={isEdit}
                    value={row.to_amount}
                    placeholder="0"
                    onChange={(e) =>
                      updateSlab(idx, "to_amount", e.target.value)
                    }
                  />

                  <ModalInput
                    label=""
                    type="number"
                    className="no-spinner"
                    disabled={isEdit}
                    value={row.percent_deduction}
                    placeholder="0"
                    onChange={(e) =>
                      updateSlab(idx, "percent_deduction", e.target.value)
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removeSlab(idx)}
                    disabled={isEdit}
                    className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] bg-app px-4 py-2.5">
            {/* Left Side */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={addSlab}
                disabled={isEdit}
                className="btn btn-outline rounded-lg px-4 py-1.5 text-[11px] font-semibold"
              >
                + Add Slab
              </button>

              <span className="text-[10px] text-sub">
                {totalSlabs} slab
                {totalSlabs !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Right Side */}
            {totalSlabs > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-sub">
                  Showing {safeSlabPage * ITEMS_PER_PAGE + 1}–
                  {Math.min((safeSlabPage + 1) * ITEMS_PER_PAGE, totalSlabs)} of{" "}
                  {totalSlabs}
                </span>

                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={safeSlabPage === 0}
                    onClick={() => setSlabPage((p) => Math.max(0, p - 1))}
                    className="rounded border border-[var(--border)] px-2 py-1 text-[10px] disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={safeSlabPage >= totalSlabPages - 1}
                    onClick={() =>
                      setSlabPage((p) => Math.min(totalSlabPages - 1, p + 1))
                    }
                    className="rounded border border-[var(--border)] px-2 py-1 text-[10px] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Other Taxes and Charges ─────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden mt-6">
          <div className="flex items-center border-b border-[var(--border)] bg-app px-4 py-2.5">
            <span className="text-xs font-semibold text-main">
              Other Taxes and Charges
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2.5rem] border-b border-[var(--border)] bg-[var(--border)]/30 px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              No.
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              Description <span className="text-red-400">*</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              Percent <span className="text-red-400">*</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              Min Taxable Income
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">
              Max Taxable Income
            </span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border)]">
            {(form.other_taxes_and_charges ?? []).length === 0 ? (
              <p className="py-6 text-center text-xs text-sub">No rows</p>
            ) : (
              (form.other_taxes_and_charges ?? []).map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2.5rem] items-center gap-3 px-4 py-2 hover:bg-app transition"
                >
                  <span className="text-center text-xs font-mono text-sub">
                    {idx + 1}
                  </span>

                  <ModalInput
                    label=""
                    value={row.description}
                    disabled={isEdit}
                    placeholder="e.g. NHIMA"
                    onChange={(e) =>
                      updateCharge(idx, "description", e.target.value)
                    }
                  />

                  <ModalInput
                    label=""
                    type="number"
                    disabled={isEdit}
                    className="no-spinner"
                    value={row.percent}
                    placeholder="0"
                    onChange={(e) =>
                      updateCharge(idx, "percent", e.target.value)
                    }
                  />

                  <ModalInput
                    label=""
                    type="number"
                    className="no-spinner"
                    disabled={isEdit}
                    value={row.min_taxable_income}
                    placeholder="0"
                    onChange={(e) =>
                      updateCharge(idx, "min_taxable_income", e.target.value)
                    }
                  />

                  <ModalInput
                    label=""
                    type="number"
                    className="no-spinner"
                    disabled={isEdit}
                    value={row.max_taxable_income}
                    placeholder="0"
                    onChange={(e) =>
                      updateCharge(idx, "max_taxable_income", e.target.value)
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removeCharge(idx)}
                    disabled={isEdit}
                    className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

         <div className="flex items-center justify-between border-t border-[var(--border)] bg-app px-4 py-2.5">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={addCharge}
      disabled={isEdit}
      className="btn btn-outline rounded-lg px-4 py-1.5 text-[11px] font-semibold"
    >
      + Add Row
    </button>

    <span className="text-[10px] text-sub">
      {totalCharges} row
      {totalCharges !== 1 ? "s" : ""}
    </span>
  </div>
</div>
        </div>
      </div>
    </MinimizableModal>
  );
};
