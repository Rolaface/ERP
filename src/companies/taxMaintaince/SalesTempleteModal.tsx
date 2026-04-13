import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Receipt, Plus, Trash2 } from "lucide-react";

import { useModalStore } from "../../store/modalStore";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput } from "../../components/ui/modal/modalComponent";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import TaxCategorySelect from "../../components/selects/TaxCategorySelect";

import type {
  SalesTaxTemplateFormData,
  SalesTaxRow,
} from "../../types/tax/salesTemplate";
import {
  defaultSalesTaxForm,
  defaultSalesTaxRow,
  CHARGE_TYPE_OPTIONS,
} from "../../types/tax/salesTemplate";
import { getGlAccounts } from "../../api/salesTaxTemplateApi";

// ─── Constants ───────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 5;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SalesTaxTemplateModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: SalesTaxTemplateFormData) => void;
  initialData?: SalesTaxTemplateFormData | null;
  isEditMode?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SalesTaxTemplateModal: React.FC<SalesTaxTemplateModalProps> = ({
  modalId,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
}) => {
  const modals = useModalStore((state) => state.modals);
  const modal = useMemo(
    () => modals.find((m) => m.id === modalId),
    [modals, modalId],
  );

  const modalData = modal?.initialData as SalesTaxTemplateFormData | undefined;

  const [form, setForm] = useState<SalesTaxTemplateFormData>(
    modalData ?? defaultSalesTaxForm,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  // ── Sync when modal opens / data changes ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setForm(modalData ?? defaultSalesTaxForm);
    }
  }, [isOpen, modalData]);

  const reset = () => {
    setForm(initialData ?? defaultSalesTaxForm);
    setErrors({});
    setPage(0);
  };

  // ── Field handlers ────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 0 : 1) : value,
    }));
  };

  const handleRowChange = (
    actualIdx: number,
    field: keyof SalesTaxRow,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      taxes: prev.taxes.map((row, i) =>
        i === actualIdx ? { ...row, [field]: value } : row,
      ),
    }));
  };

  // ── GL Account fetch ──────────────────────────────────────────────────────
  const fetchGlOptions = useCallback(async (search: string) => {
    try {
      const res = await getGlAccounts(search || undefined);
      const data: { name: string; description: string }[] = res?.data ?? [];
      return data.map((opt) => ({
        value: opt.name,
        label: opt.description ? `${opt.name} — ${opt.description}` : opt.name,
      }));
    } catch {
      return [];
    }
  }, []);

  // ── Row management ────────────────────────────────────────────────────────
  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      taxes: [...prev.taxes, { ...defaultSalesTaxRow }],
    }));
    const newTotal = form.taxes.length + 1;
    setPage(Math.floor((newTotal - 1) / ROWS_PER_PAGE));
  };

  const removeRow = (index: number) => {
    if (form.taxes.length === 1) return;
    setForm((prev) => ({
      ...prev,
      taxes: prev.taxes.filter((_, i) => i !== index),
    }));
    const newTotal = form.taxes.length - 1;
    const maxPage = Math.max(0, Math.ceil(newTotal / ROWS_PER_PAGE) - 1);
    setPage((p) => Math.min(p, maxPage));
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalRows = form.taxes.length;
  const paginatedRows = form.taxes.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE,
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    form.taxes.forEach((row, i) => {
      if (!row.account_head.trim())
        newErrors[`account_head_${i}`] = "Account head is required";
      if (!row.charge_type.trim())
        newErrors[`charge_type_${i}`] = "Charge type is required";
      if (row.rate < 0) newErrors[`rate_${i}`] = "Rate cannot be negative";
      if (row.tax_amount < 0)
        newErrors[`tax_amount_${i}`] = "Amount cannot be negative";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmitInternal = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: SalesTaxTemplateFormData = {
        ...form,
        disabled: form.disabled,
        taxes: form.taxes.map((row) => ({
          name: row.name,
          charge_type: row.charge_type,
          account_head: row.account_head.trim(),
          rate: Number(row.rate),
          tax_amount: Number(row.tax_amount),
          description: row.description.trim(),
        })),
      };
      console.log("FORM TAXES", form.taxes);

      if (modal?.context?.callback) {
        await modal.context.callback(payload);
      }

      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
        <Button
          variant="primary"
          loading={loading}
          onClick={handleSubmitInternal}
        >
          {isEditMode ? "Update" : "Submit"}
        </Button>
      </div>
    </>
  );

  if (!modal) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Sales Tax Template" : "Add Sales Tax Template"}
      subtitle="Configure charges and tax rates"
      icon={Receipt}
      footer={footer}
      customWidth="56vw"
      height="72vh"
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="h-full flex flex-col"
      >
        <div className="p-4 flex flex-col gap-4">
          {/* ── Header fields ─────────────────────────────────────────── */}
          <div className="grid grid-cols-12 gap-4 items-end">
            {/* Title */}
            <div className="col-span-6">
              <ModalInput
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                error={errors.title}
                required
                placeholder="e.g. Standard Sales Tax"
              />
            </div>

            {/* Tax Category */}
            <div className="col-span-4">
              <TaxCategorySelect
               label="Tax Category"
                value={form.tax_category}
                onChange={(value) =>
                  handleChange({
                    target: { name: "Tax_Category", value },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
                error={errors.taxcategory}
                required
              />
            </div>

            {/* Enabled toggle */}
            <div className="col-span-3 flex items-center gap-2 pb-1">
              <input
                type="checkbox"
                name="disabled"
                id="sttemplate-enabled"
                checked={form.disabled === 0}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label
                htmlFor="sttemplate-enabled"
                className="text-sm text-main cursor-pointer select-none"
              >
                Enabled
              </label>
            </div>
          </div>

          {/* ── Tax rows header ───────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-main">
              Tax / Charge Rows
            </span>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>

          {/* ── Table ─────────────────────────────────────────────────── */}
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--border)]/20">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted w-[18%]">
                    Charge Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted w-[22%]">
                    Account Head
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted w-[10%]">
                    Rate (%)
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted w-[12%]">
                    Tax Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                    Description
                  </th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, idx) => {
                  const actualIdx = page * ROWS_PER_PAGE + idx;
                  return (
                    <tr
                      key={actualIdx}
                      className="border-t border-[var(--border)]/20"
                    >
                      {/* Charge Type */}
                      <td className="px-3 py-2">
                        <select
                          value={row.charge_type}
                          onChange={(e) =>
                            handleRowChange(
                              actualIdx,
                              "charge_type",
                              e.target.value,
                            )
                          }
                          className="w-full text-xs bg-transparent border border-[var(--border)] rounded px-2 py-1.5 text-main focus:outline-none focus:border-primary"
                        >
                          {CHARGE_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {errors[`charge_type_${actualIdx}`] && (
                          <p className="text-xs text-danger mt-1">
                            {errors[`charge_type_${actualIdx}`]}
                          </p>
                        )}
                      </td>

                      {/* Account Head */}
                      <td className="px-3 py-2">
                        <SearchSelect2
                          label=""
                          value={row.account_head}
                          onChange={(val) =>
                            handleRowChange(
                              actualIdx,
                              "account_head",
                              val || "",
                            )
                          }
                          fetchOptions={fetchGlOptions}
                          placeholder="Select account"
                        />
                        {errors[`account_head_${actualIdx}`] && (
                          <p className="text-xs text-danger mt-1">
                            {errors[`account_head_${actualIdx}`]}
                          </p>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-3 py-2">
                        <ModalInput
                          label=""
                          type="number"
                          name="rate"
                          value={row.rate}
                          onChange={(e) =>
                            handleRowChange(
                              actualIdx,
                              "rate",
                              Number(e.target.value),
                            )
                          }
                          error={errors[`rate_${actualIdx}`]}
                          className="w-full no-spinner"
                          placeholder="0.00"
                        />
                      </td>

                      {/* Tax Amount */}
                      <td className="px-3 py-2">
                        <ModalInput
                          label=""
                          type="number"
                          name="tax_amount"
                          value={row.tax_amount}
                          onChange={(e) =>
                            handleRowChange(
                              actualIdx,
                              "tax_amount",
                              Number(e.target.value),
                            )
                          }
                          error={errors[`tax_amount_${actualIdx}`]}
                          className="w-full no-spinner"
                          placeholder="0.00"
                        />
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2">
                        <ModalInput
                          label=""
                          name="description"
                          value={row.description}
                          onChange={(e) =>
                            handleRowChange(
                              actualIdx,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full"
                          placeholder="e.g. Shipping flat ₹200"
                        />
                      </td>

                      {/* Delete */}
                      <td className="px-3 py-2 text-center">
                        {totalRows > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(actualIdx)}
                            className="text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination dots ───────────────────────────────────────── */}
          {totalRows > ROWS_PER_PAGE && (
            <div className="flex justify-center gap-2">
              {Array.from({
                length: Math.ceil(totalRows / ROWS_PER_PAGE),
              }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`w-6 h-6 rounded text-xs transition-colors ${
                    page === i
                      ? "bg-primary text-white"
                      : "bg-[var(--border)] text-muted hover:bg-primary/20"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default SalesTaxTemplateModal;
