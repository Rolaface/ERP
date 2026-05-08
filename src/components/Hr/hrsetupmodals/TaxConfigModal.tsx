import React, { useEffect, useState } from "react";
import { Percent, Plus, Save, Trash2, X } from "lucide-react";

import { MinimizableModal } from "../../common/MinimizableModal";
import {
  ModalInput,
  ModalSelect,
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

const DEFAULT_SLABS: TaxSlabRow[] = [
  { from_amount: 0, to_amount: 0, percent_deduction: 0 },
  { from_amount: 0, to_amount: 0, percent_deduction: 0 },
  { from_amount: 0, to_amount: 0, percent_deduction: 0 },
  { from_amount: 0, to_amount: 0, percent_deduction: 0 },

];

const DEFAULT_CHARGES: TaxChargeRow[] = [
  {
    description: "",
    percent: 0,
    min_taxable_income: 0,
    max_taxable_income: 0,
  },
];

const EMPTY: TaxConfig = {
  name: "",
  effective_from: "",
  standard_tax_exemption_amount: 0,
  allow_tax_exemption: 0,
  tax_relief_limit: 0,
  disabled: 0,
  slabs: DEFAULT_SLABS,
  other_taxes_and_charges: DEFAULT_CHARGES,
};

export const TaxConfigModal: React.FC<Props> = ({
  modalId,
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const isEdit = Boolean(initialData?.name);
  const [form, setForm] = useState<TaxConfig>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
            name: initialData.name ?? "",
            effective_from: initialData.effective_from ?? "",
            standard_tax_exemption_amount:
              initialData.standard_tax_exemption_amount ?? 0,
            allow_tax_exemption: initialData.allow_tax_exemption ?? 0,
            tax_relief_limit: initialData.tax_relief_limit ?? 0,
            disabled: initialData.disabled ?? 0,
            slabs: initialData.slabs?.length
              ? [...initialData.slabs]
              : DEFAULT_SLABS,
            other_taxes_and_charges:
              initialData.other_taxes_and_charges?.length
                ? [...initialData.other_taxes_and_charges]
                : DEFAULT_CHARGES,
          }
          : {
            ...EMPTY,
            slabs: DEFAULT_SLABS.map((row) => ({ ...row })),
            other_taxes_and_charges: DEFAULT_CHARGES.map((row) => ({
              ...row,
            })),
          },
      );
    }
  }, [isOpen, initialData]);

  const set = <K extends keyof TaxConfig>(key: K, value: TaxConfig[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addSlab = () =>
    setForm((prev) => ({
      ...prev,
      slabs: [
        ...(prev.slabs ?? []),
        { from_amount: 0, to_amount: 0, percent_deduction: 0 },
      ],
    }));

  const updateSlab = <K extends keyof TaxSlabRow>(
    idx: number,
    key: K,
    value: TaxSlabRow[K],
  ) =>
    setForm((prev) => {
      const slabs = [...(prev.slabs ?? [])];
      slabs[idx] = { ...slabs[idx], [key]: value };
      return { ...prev, slabs };
    });

  const removeSlab = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      slabs: (prev.slabs ?? []).filter((_, i) => i !== idx),
    }));

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
      from_amount: Number(row.from_amount) || 0,
      to_amount: Number(row.to_amount) || 0,
      percent_deduction: Number(row.percent_deduction) || 0,
    }));

    const other_taxes_and_charges = (form.other_taxes_and_charges ?? []).map((row) => ({
      description: row.description,
      percent: Number(row.percent) || 0,
      min_taxable_income: Number(row.min_taxable_income) || 0,
      max_taxable_income: Number(row.max_taxable_income) || 0,
    }));

    if (isEdit && initialData?.name) {
      // UPDATE — name excluded, matches PUT spec
      await updateTaxConfig(initialData.name, {
        standard_tax_exemption_amount: Number(form.standard_tax_exemption_amount) || 0,
        allow_tax_exemption: form.allow_tax_exemption ? 1 : 0,
        tax_relief_limit: Number(form.tax_relief_limit) || 0,
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
        standard_tax_exemption_amount: Number(form.standard_tax_exemption_amount) || 0,
        allow_tax_exemption: form.allow_tax_exemption ? 1 : 0,
        tax_relief_limit: Number(form.tax_relief_limit) || 0,
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
        {saving ? "Saving..." : isEdit ? "Update Tax" : "Create Tax"}
      </button>
    </div>
  );

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

          <div className="w-[140px]">
            <ModalInput
              label="Effective From"
              type="date"
              name="effective_from"
              value={form.effective_from}
              onChange={(e) => set("effective_from", e.target.value)}
              required
            />
          </div>

          <div className="w-[120px] ">
            <ModalInput
              label="Exemption Amount"
              type="number"
              value={form.standard_tax_exemption_amount}
              className="no-spinner"
              onChange={(e) =>
                set("standard_tax_exemption_amount", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="w-[120px]">
            <ModalInput
              label="Tax Relief Limit"
              type="number"
              value={form.tax_relief_limit}
              className="no-spinner"
              onChange={(e) =>
                set("tax_relief_limit", Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="w-[80px] ">
            <YesNoCheckbox
              name="active"
              label="Active"
              value={form.disabled ? "N" : "Y"}
              onChange={(_, value) => set("disabled", value === "Y" ? 0 : 1)}
            />
          </div>

          <div className="w-[100px]">
            <YesNoCheckbox
              name="allow_tax_exemption"
              label="Allow Tax Exemption"
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
            <button
              type="button"
              onClick={addSlab}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="h-3 w-3" />
              Add Slab
            </button>
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
            {(form.slabs ?? []).map((row, idx) => (
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
                  value={row.from_amount}
                  onChange={(e) =>
                    updateSlab(idx, "from_amount", Number(e.target.value) || 0)
                  }
                />
                <ModalInput
                  label=""
                  type="number"
                  value={row.to_amount}
                  onChange={(e) =>
                    updateSlab(idx, "to_amount", Number(e.target.value) || 0)
                  }
                />
                <ModalInput
                  label=""
                  type="number"
                  value={row.percent_deduction}
                  onChange={(e) =>
                    updateSlab(
                      idx,
                      "percent_deduction",
                      Number(e.target.value) || 0,
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => removeSlab(idx)}
                  className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* ── Other Taxes and Charges ─────────────────────────────────── */}
<div className="rounded-xl border border-[var(--border)] overflow-hidden mt-6">
  <div className="flex items-center justify-between border-b border-[var(--border)] bg-app px-4 py-2.5">
    <span className="text-xs font-semibold text-main">Other Taxes and Charges</span>
    <button
      type="button"
      onClick={() =>
        setForm((prev) => ({
          ...prev,
          other_taxes_and_charges: [
            ...(prev.other_taxes_and_charges ?? []),
            { description: "", percent: 0, min_taxable_income: 0, max_taxable_income: 0 },
          ],
        }))
      }
      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
    >
      <Plus className="h-3 w-3" />
      Add Row
    </button>
  </div>

  {/* Column headers */}
  <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2.5rem] border-b border-[var(--border)] bg-[var(--border)]/30 px-4 py-2">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">No.</span>
    <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">Description <span className="text-red-400">*</span></span>
    <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">Percent <span className="text-red-400">*</span></span>
    <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">Min Taxable Income</span>
    <span className="text-[10px] font-semibold uppercase tracking-wide text-sub">Max Taxable Income</span>
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
          <span className="text-center text-xs font-mono text-sub">{idx + 1}</span>

          <ModalInput
            label=""
            value={row.description}
            placeholder="e.g. NHIMA"
            onChange={(e) =>
              setForm((prev) => {
                const rows = [...(prev.other_taxes_and_charges ?? [])];
                rows[idx] = { ...rows[idx], description: e.target.value };
                return { ...prev, other_taxes_and_charges: rows };
              })
            }
          />

          <ModalInput
            label=""
            type="number"
            value={row.percent}
            onChange={(e) =>
              setForm((prev) => {
                const rows = [...(prev.other_taxes_and_charges ?? [])];
                rows[idx] = { ...rows[idx], percent: Number(e.target.value) || 0 };
                return { ...prev, other_taxes_and_charges: rows };
              })
            }
          />

          <ModalInput
            label=""
            type="number"
            value={row.min_taxable_income}
            onChange={(e) =>
              setForm((prev) => {
                const rows = [...(prev.other_taxes_and_charges ?? [])];
                rows[idx] = { ...rows[idx], min_taxable_income: Number(e.target.value) || 0 };
                return { ...prev, other_taxes_and_charges: rows };
              })
            }
          />

          <ModalInput
            label=""
            type="number"
            value={row.max_taxable_income}
            onChange={(e) =>
              setForm((prev) => {
                const rows = [...(prev.other_taxes_and_charges ?? [])];
                rows[idx] = { ...rows[idx], max_taxable_income: Number(e.target.value) || 0 };
                return { ...prev, other_taxes_and_charges: rows };
              })
            }
          />

          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                other_taxes_and_charges: (prev.other_taxes_and_charges ?? []).filter(
                  (_, i) => i !== idx,
                ),
              }))
            }
            className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))
    )}
  </div>
</div>
      </div>
    </MinimizableModal >
  );
};
